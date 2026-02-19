# terrymurray.com

A personal AI knowledge hub where Terry Murray logs the AI content he consumes (articles, videos, whitepapers) and publishes original essays. Built with a DaVinci Parchment theme.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Google OAuth, single-user whitelist)
- **Editor**: TipTap WYSIWYG (planned)
- **Styling**: Tailwind CSS v4 (CSS-first config)
- **PWA**: next-pwa for Android share target (planned)

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL running locally
- A Google OAuth client (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

Create a PostgreSQL database:

```bash
createdb terrymurray
```

### 3. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables in `.env.local`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/terrymurray
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
ALLOWED_EMAIL=<your Google account email>
UPLOAD_DIR=./uploads/images
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

This creates all tables (`users`, `posts`, `tags`, `post_tags`, `images`) and sets up the full-text search trigger.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Browse database in the browser |
| `npx prisma migrate dev` | Apply pending migrations |
| `npx tsc --noEmit` | Type-check without emitting |

## Project Structure

```
src/
  app/
    page.tsx              # Home page (bio + feed)
    post/[id]/page.tsx    # Full essay view (SSR)
    login/page.tsx        # Google OAuth sign-in
    admin/                # Admin dashboard + editor (planned)
    api/
      auth/               # NextAuth routes
      posts/              # CRUD endpoints
      tags/               # Tag listing + autocomplete
  components/
    layout/               # Header, Footer
    feed/                 # PostFeed, LogEntry, EssayEntry, EssayRenderer, FilterBar
    ui/                   # TagPill, SearchInput, Button
  lib/
    prisma.ts             # Prisma client singleton
    auth.ts               # NextAuth config + session helper
    utils.ts              # extractDomain, stripHtml
prisma/
  schema.prisma           # Database schema
docs/
  terrymurray-tdd.md      # Technical design document
  terrymurray-tasks.md    # Phased task breakdown
  terrymurray-wireframes.html  # Visual wireframes
```

## Deployment

Production target is an AWS Lightsail instance running behind Nginx with PM2. See `docs/terrymurray-tasks.md` Phase 14 for the full deployment checklist.
