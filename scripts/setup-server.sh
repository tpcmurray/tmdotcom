#!/usr/bin/env bash
# One-time server bootstrap for terrymurray.com on the Lightsail box.
#
# Discovery has already confirmed:
#   - App lives at /var/www/terrymurray (owned by ubuntu:ubuntu)
#   - PM2 supervises the process under the name "terrymurray", port 3001
#   - Node 22 is installed
#   - nginx vhost + Let's Encrypt cert already exist
#   - /var/www/terrymurray/.env.local is the prod env file (excluded from rsync)
#
# What's left: a deploy SSH key, and two latent fixes worth doing.
#
# Usage: ssh in, then `bash -c 'source ./setup-server.sh && <function_name>'`.

set -euo pipefail

# ---------------------------------------------------------------------------
# 1. DEPLOY SSH KEY — required. Generates a dedicated keypair for the workflow.
# ---------------------------------------------------------------------------
# Add the printed PRIVATE key to GitHub repo Secrets as LIGHTSAIL_SSH_KEY.
# The PUBLIC key is appended to authorized_keys so the workflow can log in.
create_deploy_key() {
  if [ -f ~/.ssh/tmdotcom_deploy ]; then
    echo "Key already exists at ~/.ssh/tmdotcom_deploy — printing existing private key."
  else
    ssh-keygen -t ed25519 -f ~/.ssh/tmdotcom_deploy -N '' -C 'github-actions-tmdotcom'
    cat ~/.ssh/tmdotcom_deploy.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
  fi
  echo
  echo "=== Copy everything below (including the BEGIN/END lines) into"
  echo "=== GitHub: Settings > Secrets and variables > Actions > LIGHTSAIL_SSH_KEY"
  echo
  cat ~/.ssh/tmdotcom_deploy
  echo
  echo "=== End of private key ==="
}

# ---------------------------------------------------------------------------
# 2. FIX ENV FILE PERMISSIONS — recommended. The current .env.local is
#    world-readable. Lock it to owner-only.
# ---------------------------------------------------------------------------
fix_env_perms() {
  chmod 600 /var/www/terrymurray/.env.local
  ls -la /var/www/terrymurray/.env.local
}

# ---------------------------------------------------------------------------
# 3. PM2 BOOT RESURRECTION — recommended. Without this, a reboot leaves both
#    sites down until you manually run `pm2 resurrect`.
# ---------------------------------------------------------------------------
configure_pm2_startup() {
  # `pm2 startup` prints a `sudo env ...` command to enable a systemd unit
  # that resurrects the current process list on boot. Capture and run it.
  local cmd
  cmd=$(pm2 startup systemd -u ubuntu --hp /home/ubuntu | grep -E '^sudo ' | tail -1)
  if [ -z "$cmd" ]; then
    echo "Could not derive pm2 startup command. Run 'pm2 startup' manually."
    return 1
  fi
  echo "About to run: $cmd"
  read -p "Proceed? [y/N] " ans
  [ "$ans" = "y" ] || return 0
  eval "$cmd"
  pm2 save
  echo "Done. The pm2-ubuntu.service unit is now enabled."
}
