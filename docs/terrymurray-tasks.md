# terrymurray.com — Phases & Tasks Breakdown

> Vibe-coding reference derived from `terrymurray-tdd.md`.
> Work through phases top-to-bottom. Each task is a focused prompt or coding session.

---

## Phase 1 — Project Scaffolding

**Goal**: Bare Next.js app compiles and runs locally with the correct tooling installed.

- [x] 1.1 Bootstrap Next.js app with TypeScript and App Router
  - `npx create-next-app@latest terrymurray --typescript --app --tailwind --eslint --src-dir`
- [x] 1.2 Install core dependencies
  - `prisma`, `@prisma/client`, `next-auth`, `@auth/prisma-adapter`
  - `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-typography`
  - `next-pwa`
  - `uuid`, `@types/uuid`
- [x] 1.3 Set up `.env.local` with all required environment variables (use placeholder values locally)
  - `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAIL`, `UPLOAD_DIR`
- [x] 1.4 Create `uploads/images/` directory at project root; add to `.gitignore`
- [x] 1.5 Verify `npm run dev` starts cleanly

---

## Phase 2 — Design System & Global Styles

**Goal**: DaVinci Parchment theme applied globally; typography loaded; base layout shell renders.

- [x] 2.1 Add Google Fonts to `app/layout.tsx`
  - `Cormorant Garamond` (weights 400, 600, 700)
  - `Lora` (weights 400, 700)
  - `Source Sans 3` (weights 400, 600)
- [x] 2.2 Write `src/app/globals.css` (Tailwind v4 CSS-first — no tailwind.config.ts)
  - All CSS custom properties (`--bg-primary`, `--text-primary`, `--accent`, etc.)
  - `@theme inline` block maps vars to Tailwind utilities (`bg-parchment`, `text-ink`, `text-brown`, `font-heading`, etc.)
  - Base body styles + paper-grain texture overlay via `body::after` (gracefully absent without PNG)
- [x] 2.3 ~~Configure `tailwind.config.ts`~~ — **N/A**: project uses Tailwind v4 (CSS-based config, no JS file)
- [x] 2.4 Create `src/components/layout/Header.tsx`
  - Site title in `Cormorant Garamond`, minimal nav, placeholder Admin link
- [x] 2.5 Create `src/components/layout/Footer.tsx`
  - Copyright line, themed to match parchment palette
- [x] 2.6 Create `src/app/layout.tsx` root layout
  - Injects all three font CSS vars onto `<html>`, wraps pages with `<Header>` + `<Footer>`

---

## Phase 3 — Database & Prisma

**Goal**: Database schema is migrated; Prisma client is available; full-text search trigger is installed.

- [ ] 3.1 Write `prisma/schema.prisma`
  - Copy the full schema from the TDD: `User`, `Post`, `Tag`, `PostTag`, `Image` models
  - Include enums `PostType` (LOG, ESSAY) and `PostStatus` (PUBLISHED, DRAFT)
  - Add `searchVector` field to `Post` as `Unsupported("tsvector")?`
- [ ] 3.2 Run `npx prisma migrate dev --name init` to create the initial migration
- [ ] 3.3 Add full-text search setup to the migration SQL (edit the generated migration file before applying, or run raw SQL)
  - `ALTER TABLE posts ADD COLUMN search_vector tsvector`
  - Create the `posts_search_update()` trigger function
  - Create `posts_search_trigger` (BEFORE INSERT OR UPDATE)
  - Create `posts_search_idx` GIN index
- [ ] 3.4 Create `src/lib/prisma.ts` — Prisma client singleton (safe for Next.js hot reload)
- [ ] 3.5 Create `src/lib/utils.ts`
  - `extractDomain(url: string): string` — strips protocol/path, returns bare hostname
  - `stripHtml(html: string): string` — used for search indexing

---

## Phase 4 — Authentication

**Goal**: Google OAuth login works; only Terry's email can sign in; admin routes are protected.

- [ ] 4.1 Create `src/app/api/auth/[...nextauth]/route.ts`
  - Configure `GoogleProvider`
  - Add `signIn` callback that checks `user.email === process.env.ALLOWED_EMAIL`
  - Use JWT strategy (no database sessions)
- [ ] 4.2 Create `src/lib/auth.ts`
  - Export `authOptions` (reused across the app)
  - Export `getServerSession` helper
- [ ] 4.3 Create `src/middleware.ts`
  - Protect `/admin/:path*` and all `/api/posts` mutation routes (POST, PUT, DELETE)
  - Protect `/api/upload` and `/api/share`
  - Redirect unauthenticated users to `/login`
- [ ] 4.4 Create `src/app/login/page.tsx`
  - Simple centered card: site title, "Sign in with Google" button
  - Use `signIn('google')` from `next-auth/react`
- [ ] 4.5 Update `Header.tsx` to show "Admin" link when session exists, "Sign In" otherwise

---

## Phase 5 — Core API Routes

**Goal**: All CRUD endpoints work; can be tested with curl or a REST client.

- [ ] 5.1 `GET /api/posts` — `src/app/api/posts/route.ts`
  - Query params: `type` (LOG | ESSAY | all), `tag`, `search`, `page` (default 1), `limit` (default 20)
  - Return only `PUBLISHED` posts
  - Use PostgreSQL full-text search when `search` param is present
  - Include tags in response
- [ ] 5.2 `POST /api/posts` — same file, auth-gated
  - Accept: `type`, `title`, `url`, `content`, `contentMarkdown`, `status`, `tags[]`
  - Auto-extract `domain` from `url` using `extractDomain` util
  - Create or connect tags by name (upsert)
  - Return created post
- [ ] 5.3 `GET /api/posts/[id]` — `src/app/api/posts/[id]/route.ts`
  - Return single post with tags; 404 if not found or DRAFT (unless admin)
- [ ] 5.4 `PUT /api/posts/[id]` — same file, auth-gated
  - Accept partial update fields
  - Re-sync tags (delete removed, add new)
- [ ] 5.5 `DELETE /api/posts/[id]` — same file, auth-gated
  - Hard delete post (PostTag cascade handled by Prisma schema)
- [ ] 5.6 `GET /api/tags` — `src/app/api/tags/route.ts`
  - Return all tags with post count (published posts only)
- [ ] 5.7 `GET /api/tags/autocomplete?q=` — `src/app/api/tags/autocomplete/route.ts`
  - Return tags whose `name` starts with query string, limit 10

---

## Phase 6 — Home Page & Feed

**Goal**: The public home page renders bio + paginated feed with working filters.

- [ ] 6.1 Create `src/components/ui/TagPill.tsx`
  - Small pill: `--tag-bg` background, `--tag-text` text, `Source Sans 3` font
  - Optional `onClick` prop for filter behavior
- [ ] 6.2 Create `src/components/ui/SearchInput.tsx`
  - Text input styled to theme; emits debounced `onChange`
- [ ] 6.3 Create `src/components/ui/Button.tsx`
  - Reusable button with `primary` and `ghost` variants using theme colors
- [ ] 6.4 Create `src/components/feed/LogEntry.tsx`
  - Shows: title (linked to external URL), domain badge, date, notes (if any), tags
  - Domain badge is a small muted pill (e.g. "arxiv.org")
- [ ] 6.5 Create `src/components/feed/EssayEntry.tsx`
  - Shows: title (linked to `/post/[id]`), date, first ~150 chars of content (strip HTML), "Read more →", tags
- [ ] 6.6 Create `src/components/feed/FilterBar.tsx`
  - Type toggle: "All" | "Reading Log" | "Essays" (mutually exclusive button group)
  - Tag filter: chips from available tags, click to toggle
  - Search: `SearchInput` component
- [ ] 6.7 Create `src/components/feed/PostFeed.tsx`
  - Client component; calls `GET /api/posts` with current filter state
  - Renders `LogEntry` or `EssayEntry` based on `post.type`
  - "Load More" button for pagination
- [ ] 6.8 Create `src/app/page.tsx` — Home page
  - Bio section (hardcoded content, styled with `Cormorant Garamond` heading)
  - Renders `<FilterBar>` and `<PostFeed>`

---

## Phase 7 — Essay Detail Page

**Goal**: Full essay renders at `/post/[id]` with SSR for SEO.

- [ ] 7.1 Create `src/app/post/[id]/page.tsx`
  - Server component; fetch post by ID from database directly (not via API)
  - 404 if post not found or status is DRAFT
  - Pass post to `EssayRenderer`
- [ ] 7.2 Create `src/components/feed/EssayRenderer.tsx`
  - Renders `post.content` (HTML from TipTap) safely using `dangerouslySetInnerHTML`
  - Prose styling: `Lora` body font, warm heading colors, correct line height
  - Tags displayed as `TagPill` components below content

---

## Phase 8 — Image Upload API

**Goal**: Images can be uploaded and served at a public URL.

- [ ] 8.1 Create `src/app/api/upload/route.ts`
  - Accept `multipart/form-data` with a `file` field
  - Validate: image MIME types only (`image/jpeg`, `image/png`, `image/gif`, `image/webp`)
  - Save to `process.env.UPLOAD_DIR` (`./uploads/images/`) with a UUID filename
  - Insert record into `images` table via Prisma
  - Return `{ url: '/uploads/images/<filename>' }`
- [ ] 8.2 Configure `next.config.js` to serve `/uploads/` as a static directory (or rely on Nginx in production; use `public/` symlink for local dev)

---

## Phase 9 — Essay Editor

**Goal**: Admin can write, auto-save, preview, and publish essays from the browser.

- [ ] 9.1 Create `src/components/editor/TipTapEditor.tsx`
  - Configure extensions: `StarterKit`, `Image`, `Link`, `Placeholder`, `Typography`
  - Wire image upload: on image drop/paste, POST to `/api/upload`, insert returned URL
  - Expose `getHTML()` and `getMarkdown()` via `ref` or callback props
  - Style editor area with prose theme (warm background, `Lora` font)
- [ ] 9.2 Create `src/components/editor/TagInput.tsx`
  - Freeform text input; Enter or comma to add a tag
  - On keystroke, fetch `/api/tags/autocomplete?q=` and show dropdown
  - Renders added tags as removable `TagPill` components
- [ ] 9.3 Create `src/components/editor/SaveBar.tsx`
  - Shows auto-save status: "Saving…" | "Saved" | "Unsaved changes"
  - "Publish" button (changes status to PUBLISHED)
  - "Unpublish" button (if already published)
  - "Preview" link (opens `/post/[id]` in new tab)
- [ ] 9.4 Create `src/app/admin/write/page.tsx` — New essay
  - Form with: title input, `TipTapEditor`, `TagInput`, `SaveBar`
  - On first save: POST to `/api/posts` with `type: ESSAY, status: DRAFT`
  - Store returned `id`; subsequent saves use PUT to `/api/posts/[id]`
  - Auto-save interval: 30 seconds
- [ ] 9.5 Create `src/app/admin/write/[id]/page.tsx` — Edit existing essay
  - Fetch post by ID; pre-fill all editor fields
  - Same auto-save and publish flow as new essay page

---

## Phase 10 — Admin Dashboard

**Goal**: Admin can view all posts (including drafts) and manage them.

- [ ] 10.1 Create `src/app/admin/page.tsx` — Admin Dashboard
  - Server component; fetch all posts (PUBLISHED + DRAFT) for Terry
  - Table/list showing: title, type badge, status badge, date, tag count
  - "Edit" link → `/admin/write/[id]`
  - "Delete" button → calls DELETE API, refreshes list
  - "New Essay" button → `/admin/write`
- [ ] 10.2 Add admin nav to `Header.tsx` when session is active
  - Links: "Dashboard" (`/admin`) | "New Essay" (`/admin/write`) | "Sign Out"

---

## Phase 11 — PWA & Share Target

**Goal**: The site installs as a PWA on Android; sharing a URL from the share sheet opens the log entry form pre-filled.

- [ ] 11.1 Configure `next-pwa` in `next.config.js`
  - Enable service worker generation for production builds
- [ ] 11.2 Create `public/manifest.json`
  - Fields: `name`, `short_name`, `start_url`, `display: standalone`, `icons`
  - Add `share_target` with `action: /share`, `method: POST`, `enctype: application/x-www-form-urlencoded`, params `title`, `text`, `url`
- [ ] 11.3 Create app icons in `public/icons/` (192×192 and 512×512 minimum)
- [ ] 11.4 Add `<link rel="manifest">` and `<meta name="theme-color">` to `app/layout.tsx`
- [ ] 11.5 Create `src/app/api/share/route.ts` — POST handler
  - Receives `title`, `text`, `url` from Android share intent
  - Redirect to `/share?url=...&title=...` (let the UI page handle the save)
- [ ] 11.6 Create `src/components/share/ShareForm.tsx`
  - URL field (pre-filled, readonly or editable)
  - Title field (pre-filled; if missing, show "Fetching title…" and call title-fetch API)
  - Notes textarea
  - `TagInput` component
  - "Save to Log" button → POST to `/api/posts` with `type: LOG`
  - Success state: "Saved! You can close this tab."
- [ ] 11.7 Create `src/app/share/page.tsx`
  - Reads `url` and `title` from query params (from share intent redirect)
  - Renders `<ShareForm>` pre-filled with those values
- [ ] 11.8 Add title extraction fallback to `POST /api/posts`
  - If `type === LOG` and `title` is empty, server-fetches the `url` and extracts `<title>` from HTML
  - Falls back to the raw URL if fetch fails

---

## Phase 12 — Search Wiring

**Goal**: The search input on the home page returns relevant results.

- [ ] 12.1 Create `src/lib/search.ts`
  - `buildSearchQuery(term: string)` — formats input for PostgreSQL `to_tsquery` (handle spaces → `&`, sanitize special chars)
- [ ] 12.2 Update `GET /api/posts` to use `search_vector @@ to_tsquery(...)` when `search` param is present
  - Order results by `ts_rank` descending when searching; reverse-chronological otherwise
- [ ] 12.3 Verify the GIN index is used (run `EXPLAIN ANALYZE` in psql) and debounce is set to ~300 ms in `SearchInput.tsx`

---

## Phase 13 — Polish & Responsive Design

**Goal**: The site looks and feels correct on mobile and desktop.

- [ ] 13.1 Audit all pages for mobile layout (375px viewport minimum)
  - `FilterBar` wraps gracefully on small screens
  - Feed cards are full-width on mobile
  - Editor toolbar is usable on tablet (desktop-primary is acceptable)
- [ ] 13.2 Add loading skeletons or spinners for feed fetches
- [ ] 13.3 Add empty states: "No posts yet", "No results for '…'"
- [ ] 13.4 Add 404 page (`src/app/not-found.tsx`) styled to theme
- [ ] 13.5 Add `<head>` metadata to key pages (`app/layout.tsx`, `post/[id]/page.tsx`)
  - `title`, `description`, `og:title`, `og:description`
- [ ] 13.6 Final visual pass: verify all colors, fonts, card shadows, and tag pills match the DaVinci Parchment spec

---

## Phase 14 — Deployment

**Goal**: Site is live at terrymurray.com on the AWS Lightsail instance.

- [ ] 14.1 Create production PostgreSQL database (`terrymurray`) on the Lightsail instance
- [ ] 14.2 Set up Google OAuth credentials in Google Cloud Console for the production domain
- [ ] 14.3 Push repo to GitHub; SSH into Lightsail instance
- [ ] 14.4 Clone repo to `/var/www/terrymurray`; install dependencies; copy `.env.local` to server
- [ ] 14.5 Run `npx prisma migrate deploy` to apply migrations
- [ ] 14.6 Run `npm run build`
- [ ] 14.7 Start with PM2: `pm2 start npm --name "terrymurray" -- start -- -p 3001` and `pm2 save`
- [ ] 14.8 Add Nginx server block for `terrymurray.com`
  - Proxy to `http://localhost:3001`
  - Serve `/uploads/` as static alias
- [ ] 14.9 Run `certbot --nginx -d terrymurray.com -d www.terrymurray.com` for SSL
- [ ] 14.10 Smoke test: visit site, log in, create a reading log entry, write a draft essay, publish it, test share target on Android

---

## Dependency Order (Quick Reference)

```
Phase 1 (scaffold)
  └─► Phase 2 (styles)
        └─► Phase 6 (home page)  ←─ needs Phase 5 (API)
Phase 3 (database)
  └─► Phase 4 (auth) ──────────► Phase 5 (API)
                                      └─► Phase 7 (essay page)
                                      └─► Phase 8 (upload) ──► Phase 9 (editor)
                                      └─► Phase 10 (admin dashboard)
                                      └─► Phase 11 (PWA/share)
                                      └─► Phase 12 (search)
Phases 1–12 ──────────────────────► Phase 13 (polish)
                                      └─► Phase 14 (deploy)
```

---

## Notes for Vibe Coding

- **Start each session** by pointing the LLM at the relevant TDD section and this task list. Say which task number you're working on.
- **One task per prompt** keeps context tight and outputs focused.
- **After Phase 5**, you can work Phases 6–12 in nearly any order — they're mostly independent once the API exists.
- **The share target (Phase 11)** requires a real HTTPS URL to test end-to-end on Android. Use a `localhost.run` or `ngrok` tunnel during development.
- **Full-text search SQL** (Phase 3.3) must be added to the migration before running `prisma migrate deploy` in production, or applied as a standalone `prisma migrate dev --name add-search` migration.
