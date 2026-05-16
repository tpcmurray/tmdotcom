#!/usr/bin/env bash
# One-time server bootstrap for terrymurray.com on the Lightsail box.
#
# Run section-by-section, not as a whole script. Some pieces (nginx, certbot,
# Node) may already exist on the box because Weatheristic26 is also deployed
# there. Each section is independently idempotent — re-running is safe.
#
# Usage: ssh ubuntu@<lightsail-host>, then copy/paste the commands you need.

set -euo pipefail

# ---------------------------------------------------------------------------
# 0. DISCOVERY — run this first to see what's already on the box
# ---------------------------------------------------------------------------
discover() {
  echo "=== Existing app directories under /home/ubuntu ==="
  ls -la /home/ubuntu/ | grep -v '^total\|^\.'

  echo "=== Existing systemd units mentioning 'terry' or 'tmdotcom' ==="
  systemctl list-unit-files | grep -iE 'terry|tmdot' || echo "(none)"

  echo "=== Nginx vhosts ==="
  ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "nginx not installed"

  echo "=== Node version ==="
  node --version 2>/dev/null || echo "node not installed"

  echo "=== Existing certs ==="
  sudo ls /etc/letsencrypt/live/ 2>/dev/null || echo "(no certbot certs)"

  echo "=== Listening ports ==="
  sudo ss -tlnp | grep -E ':(80|443|3000|3001|3002)\b' || echo "(none on common ports)"
}

# ---------------------------------------------------------------------------
# 1. NODE 22 — skip if `node --version` already shows v22.x
# ---------------------------------------------------------------------------
install_node() {
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
}

# ---------------------------------------------------------------------------
# 2. APP DIRECTORY + UPLOADS — safe to re-run
# ---------------------------------------------------------------------------
create_app_dir() {
  sudo mkdir -p /home/ubuntu/tmdotcom/uploads/images
  sudo chown -R ubuntu:ubuntu /home/ubuntu/tmdotcom
}

# ---------------------------------------------------------------------------
# 3. PROD .env — created once, never overwritten by the deploy
# ---------------------------------------------------------------------------
# IMPORTANT: edit values inline before running. Do not commit this file.
# The deploy excludes /.env from rsync, so this file stays put.
create_env_file() {
  local env_path=/home/ubuntu/tmdotcom/.env
  if [ -f "$env_path" ]; then
    echo "$env_path already exists — not overwriting. Edit by hand if needed."
    return
  fi
  cat > "$env_path" <<'EOF'
DATABASE_URL=postgres://USER:PASS@HOST:PORT/DBNAME
NEXTAUTH_URL=https://terrymurray.com
NEXTAUTH_SECRET=REPLACE_ME_RUN_openssl_rand_base64_32
GOOGLE_CLIENT_ID=REPLACE_ME
GOOGLE_CLIENT_SECRET=REPLACE_ME
ALLOWED_EMAIL=tpcmurray@gmail.com
UPLOAD_DIR=/home/ubuntu/tmdotcom/uploads/images
PORT=3001
EOF
  chmod 600 "$env_path"
  echo "Edit $env_path to fill in real values, then re-run only the systemd step."
}

# ---------------------------------------------------------------------------
# 4. SYSTEMD UNIT — idempotent
# ---------------------------------------------------------------------------
install_systemd_unit() {
  sudo tee /etc/systemd/system/terrymurray.service > /dev/null <<'EOF'
[Unit]
Description=terrymurray.com (Next.js)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/tmdotcom
EnvironmentFile=/home/ubuntu/tmdotcom/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -p 3001
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  sudo systemctl daemon-reload
  sudo systemctl enable terrymurray
  # Don't start yet if the directory is empty — the first deploy will start it.
}

# ---------------------------------------------------------------------------
# 5. SUDO RULE — let the deploy SSH user restart the service without a password
# ---------------------------------------------------------------------------
install_sudo_rule() {
  sudo tee /etc/sudoers.d/terrymurray > /dev/null <<'EOF'
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart terrymurray
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl status terrymurray
ubuntu ALL=(ALL) NOPASSWD: /bin/journalctl -u terrymurray *
EOF
  sudo chmod 440 /etc/sudoers.d/terrymurray
  sudo visudo -c -f /etc/sudoers.d/terrymurray
}

# ---------------------------------------------------------------------------
# 6. NGINX VHOST — skip if /etc/nginx/sites-enabled/terrymurray.com already exists
# ---------------------------------------------------------------------------
install_nginx_vhost() {
  if [ -f /etc/nginx/sites-enabled/terrymurray.com ]; then
    echo "Vhost already exists. Diff against the desired config by hand."
    return
  fi
  sudo tee /etc/nginx/sites-available/terrymurray.com > /dev/null <<'EOF'
server {
    listen 80;
    server_name terrymurray.com www.terrymurray.com;
    client_max_body_size 25M;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
  sudo ln -sf /etc/nginx/sites-available/terrymurray.com /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx
}

# ---------------------------------------------------------------------------
# 7. TLS — issues + auto-renews a Let's Encrypt cert. Idempotent.
# ---------------------------------------------------------------------------
install_tls() {
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx -d terrymurray.com -d www.terrymurray.com --redirect
}

# ---------------------------------------------------------------------------
# 8. DEPLOY SSH KEY — generates a dedicated keypair for GitHub Actions
# ---------------------------------------------------------------------------
# Run this once. Add the printed private key to GitHub repo Secrets as
# LIGHTSAIL_SSH_KEY. The public key gets appended to authorized_keys so the
# deploy can log in as the ubuntu user.
create_deploy_key() {
  if [ -f ~/.ssh/tmdotcom_deploy ]; then
    echo "Key already exists at ~/.ssh/tmdotcom_deploy."
  else
    ssh-keygen -t ed25519 -f ~/.ssh/tmdotcom_deploy -N '' -C 'github-actions-tmdotcom'
    cat ~/.ssh/tmdotcom_deploy.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
  fi
  echo
  echo "=== Copy everything below into GitHub repo Secrets > LIGHTSAIL_SSH_KEY ==="
  cat ~/.ssh/tmdotcom_deploy
  echo "=== End of private key ==="
}

# Uncomment the sections you want to run, or invoke them one at a time:
#   bash setup-server.sh   # does nothing by default — read first
#
# discover
# install_node
# create_app_dir
# create_env_file
# install_systemd_unit
# install_sudo_rule
# install_nginx_vhost
# install_tls
# create_deploy_key
