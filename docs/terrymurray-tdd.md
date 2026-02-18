# terrymurray.com — Technical Design Document

## Project Overview

**terrymurray.com** is a personal AI knowledge hub — a public-facing website where Terry Murray logs the AI content he consumes (articles, videos, whitepapers) and publishes original thoughts and essays about AI. The site serves two purposes: (1) capturing ideas and notes that would otherwise be lost, and (2) providing colleagues and peers with a curated feed of AI content and original thinking.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js (App Router) + TypeScript | Best-in-class React framework, strong LLM code generation support |
| Database | PostgreSQL | Already familiar, robust, runs on existing infrastructure |
| ORM | Prisma | Type-safe database access, excellent migration tooling |
| Auth | NextAuth.js | Google OAuth integration, session management |
| Editor | TipTap | WYSIWYG with markdown toggle, image support, extensible |
| PWA | next-pwa | Service worker generation, share target manifest |
| Styling | Tailwind CSS | Utility-first, fast iteration, easy theming |
| Hosting | AWS Lightsail | Existing instance, co-hosted with weatheristic.com |
| Process Manager | PM2 | Keep Node process alive, log management |
| Image Storage | Local filesystem (v1), S3/R2 (if needed) | Simple start, migrate if storage grows |

---

## Data Model

### Tables

#### `users`
Single-user app, but NextAuth requires this table.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | String | |
| email | String | Unique |
| image | String? | Google avatar URL |
| created_at | DateTime | |
| updated_at | DateTime | |

#### `posts`
Unified table for both reading log entries and essays.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| type | Enum: `LOG`, `ESSAY` | Distinguishes content type |
| title | String | Article title (log) or essay title |
| url | String? | External URL (log entries only) |
| domain | String? | Extracted domain for display (e.g., "arxiv.org") |
| content | Text? | Essay body (HTML from TipTap) or log notes |
| content_markdown | Text? | Raw markdown version of essay content |
| status | Enum: `PUBLISHED`, `DRAFT` | Drafts are essays only |
| author_id | UUID | FK → users.id |
| created_at | DateTime | When the content was logged/written |
| updated_at | DateTime | |

#### `tags`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | String | Unique, lowercase normalized |
| created_at | DateTime | |

#### `post_tags`
Join table for many-to-many relationship.

| Column | Type | Notes |
|--------|------|-------|
| post_id | UUID | FK → posts.id |
| tag_id | UUID | FK → tags.id |

**Composite PK**: (post_id, tag_id)

#### `images`
Tracks uploaded images for essays.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| post_id | UUID? | FK → posts.id (nullable for orphaned uploads) |
| filename | String | Original filename |
| path | String | Server path or S3 key |
| mime_type | String | |
| size_bytes | Integer | |
| created_at | DateTime | |

### Prisma Schema (Reference)

```prisma
enum PostType {
  LOG
  ESSAY
}

enum PostStatus {
  PUBLISHED
  DRAFT
}

model Post {
  id               String     @id @default(uuid())
  type             PostType
  title            String
  url              String?
  domain           String?
  content          String?    @db.Text
  contentMarkdown  String?    @db.Text @map("content_markdown")
  status           PostStatus @default(PUBLISHED)
  authorId         String     @map("author_id")
  author           User       @relation(fields: [authorId], references: [id])
  tags             PostTag[]
  images           Image[]
  createdAt        DateTime   @default(now()) @map("created_at")
  updatedAt        DateTime   @updatedAt @map("updated_at")

  @@map("posts")
}

model Tag {
  id        String    @id @default(uuid())
  name      String    @unique
  posts     PostTag[]
  createdAt DateTime  @default(now()) @map("created_at")

  @@map("tags")
}

model PostTag {
  postId String @map("post_id")
  tagId  String @map("tag_id")
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

model Image {
  id        String   @id @default(uuid())
  postId    String?  @map("post_id")
  post      Post?    @relation(fields: [postId], references: [id], onDelete: SetNull)
  filename  String
  path      String
  mimeType  String   @map("mime_type")
  sizeBytes Int      @map("size_bytes")
  createdAt DateTime @default(now()) @map("created_at")

  @@map("images")
}
```

---

## API Routes

### Public Routes (No Auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Landing page with bio + feed |
| GET | `/api/posts` | Paginated posts list. Query params: `type` (LOG/ESSAY/all), `tag`, `search`, `page`, `limit` |
| GET | `/api/posts/[id]` | Single post detail |
| GET | `/api/tags` | All tags with post counts |
| GET | `/post/[id]` | Full essay page (SSR) |

### Protected Routes (Auth Required)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/posts` | Create new post (log entry or essay) |
| PUT | `/api/posts/[id]` | Update post |
| DELETE | `/api/posts/[id]` | Delete post |
| POST | `/api/upload` | Upload image, returns URL |
| GET | `/api/tags/autocomplete?q=` | Tag autocomplete suggestions |
| GET | `/admin` | Admin dashboard (drafts, manage posts) |
| GET | `/admin/write` | Essay editor |
| GET | `/admin/write/[id]` | Edit existing essay |

### PWA Share Target

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/share` | Receives shared URL from Android share sheet |
| GET | `/share` | Share target UI — form with pre-filled URL, title field, notes, tags |

---

## Authentication

### NextAuth.js Configuration

- **Provider**: Google OAuth only
- **Strategy**: JWT (no database sessions needed for single user)
- **Access Control**: Whitelist Terry's Google email. All other Google accounts are rejected.
- **Middleware**: Next.js middleware protects `/admin/*` and `/api/*` mutation routes

```typescript
// Simplified auth check
const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL; // terry's email

callbacks: {
  async signIn({ user }) {
    return user.email === ALLOWED_EMAIL;
  }
}
```

---

## PWA Share Target

### Manifest Configuration

```json
{
  "name": "Terry Murray AI",
  "short_name": "TM AI",
  "start_url": "/",
  "display": "standalone",
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "application/x-www-form-urlencoded",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### Share Flow

1. User reads article on phone
2. Taps Android share button → selects "Terry Murray AI"
3. PWA opens `/share` page with URL and title pre-populated
4. User optionally adds notes and tags
5. User taps "Save" → POST to `/api/posts` with type `LOG`
6. Confirmation shown, PWA can close or return to previous app

### Title Extraction Fallback

When sharing a URL, the title may or may not come from the share intent. As a fallback:

1. Use the `title` from the Android share intent if provided
2. If missing, server-side fetch the URL and extract `<title>` from the HTML
3. If that fails, use the URL as the title
4. User can always manually edit the title before saving

---

## Search (v1)

### Implementation

PostgreSQL full-text search — no need for Elasticsearch on a personal site.

```sql
-- Add tsvector column
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- Populate from title + content
CREATE FUNCTION posts_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(
      regexp_replace(NEW.content, '<[^>]+>', ' ', 'g'), ''
    )), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_search_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_update();

CREATE INDEX posts_search_idx ON posts USING gin(search_vector);
```

Search API strips HTML tags before indexing, weights title matches higher than body matches.

---

## Essay Editor

### TipTap Configuration

**Mode**: WYSIWYG (default) with toggle to raw markdown view

**Extensions**:
- StarterKit (bold, italic, headings, lists, blockquote, code block, horizontal rule)
- Image (drag/drop, paste, upload)
- Link (auto-detect URLs)
- Placeholder
- Markdown (for markdown toggle)
- Typography (smart quotes, etc.)

**Image Upload Flow**:
1. User drags/drops or pastes image into editor
2. Client uploads to `/api/upload` via multipart form
3. Server saves to `./uploads/images/` directory
4. Server returns public URL
5. TipTap inserts `<img>` with returned URL

**Auto-save**: Drafts auto-save every 30 seconds while editing. Visual indicator shows save status.

**Publishing Flow**:
1. Write essay → saved as DRAFT automatically
2. Preview renders the post as it will appear publicly
3. Click "Publish" → status changes to PUBLISHED, appears in feed
4. Can unpublish (back to DRAFT) or edit published essays

---

## Frontend Architecture

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Bio section + unified feed with filters |
| `/post/[id]` | PostPage | Full essay view (SSR for SEO) |
| `/admin` | AdminDashboard | Manage all posts, drafts list |
| `/admin/write` | EditorPage | TipTap essay editor |
| `/admin/write/[id]` | EditorPage | Edit existing essay |
| `/share` | SharePage | PWA share target form |
| `/login` | LoginPage | Google OAuth sign-in |

### Component Hierarchy

```
Layout
├── Header (site title, nav, login button if admin)
├── Main Content
│   ├── HomePage
│   │   ├── BioSection
│   │   ├── FilterBar (type toggle + tag filter + search)
│   │   └── PostFeed
│   │       ├── LogEntry (reading log card)
│   │       └── EssayEntry (essay card, links to full page)
│   ├── PostPage
│   │   └── EssayRenderer (rendered HTML content)
│   ├── AdminDashboard
│   │   └── PostManager (list, edit, delete)
│   ├── EditorPage
│   │   ├── TitleInput
│   │   ├── TipTapEditor
│   │   ├── TagInput (freeform + autocomplete)
│   │   ├── StatusToggle (Draft/Published)
│   │   └── SaveBar (auto-save indicator, publish button)
│   └── SharePage
│       ├── URLField (pre-filled)
│       ├── TitleField (pre-filled or fetched)
│       ├── NotesField
│       ├── TagInput
│       └── SaveButton
└── Footer (minimal)
```

### Feed Behavior

- **Default view**: All posts (LOG + ESSAY), reverse chronological
- **Filter toggles**: "All" | "Reading Log" | "Essays" — mutually exclusive
- **Tag filter**: Click a tag to filter by it, shown as pills/chips
- **Search**: Text input, debounced, searches title + content
- **Pagination**: Infinite scroll or "Load More" button
- **Essay cards**: Show title, date, first ~150 chars of content, tag pills, "Read more →" link
- **Log entry cards**: Show title (linked to domain URL), domain badge, date, notes (if any), tag pills

### Design System — DaVinci Parchment Theme

**Colors**:
```css
:root {
  --bg-primary: #F5F0E8;        /* Warm parchment */
  --bg-secondary: #EDE7D9;      /* Slightly darker parchment */
  --bg-card: #FAF7F2;           /* Card/elevated surface */
  --text-primary: #3E2F1C;      /* Dark brown, main text */
  --text-secondary: #6B5B4A;    /* Medium brown, secondary text */
  --text-muted: #9A8B78;        /* Muted brown, dates/meta */
  --accent: #8B4513;            /* Saddle brown, links/accents */
  --accent-hover: #A0522D;      /* Sienna, hover state */
  --border: #D4C9B8;            /* Subtle warm border */
  --tag-bg: #E8DFD0;            /* Tag pill background */
  --tag-text: #5C4A35;          /* Tag pill text */
}
```

**Typography**:
```css
--font-heading: 'Cormorant Garamond', serif;   /* Headings, site title */
--font-body: 'Lora', serif;                     /* Body text, essays */
--font-meta: 'Source Sans 3', sans-serif;        /* Dates, tags, UI elements */
```

**Texture**: Subtle paper grain background using CSS noise or a tiled texture image. Very light — just enough to feel warm, not distracting.

**Cards**: Slightly elevated with warm shadows, no harsh borders. Think aged paper resting on a desk.

**Links**: Saddle brown, underlined on hover. No bright blues.

---

## Deployment

### Lightsail Instance Setup

```bash
# Assumes Node.js, PostgreSQL, and Nginx are already installed
# (co-hosting with weatheristic.com)

# Clone and build
git clone <repo> /var/www/terrymurray
cd /var/www/terrymurray
npm install
npx prisma migrate deploy
npm run build

# PM2 process
pm2 start npm --name "terrymurray" -- start -- -p 3001
pm2 save

# Nginx reverse proxy (add to existing config)
server {
    server_name terrymurray.com www.terrymurray.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Image uploads
    location /uploads/ {
        alias /var/www/terrymurray/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SSL via Let's Encrypt (certbot)
}
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/terrymurray
NEXTAUTH_URL=https://terrymurray.com
NEXTAUTH_SECRET=<generated-secret>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
ALLOWED_EMAIL=<terry's-google-email>
UPLOAD_DIR=./uploads/images
```

---

## Version Roadmap

### v1 (Launch)
- Landing page with bio
- Unified chronological feed with type filter and tag filter
- Full-text search
- Reading log via PWA share target (Android)
- Essay editor (TipTap WYSIWYG + markdown toggle)
- Draft/publish workflow
- Image uploads in essays
- Freeform tags with autocomplete
- Google OAuth (single user)
- Responsive design (mobile-first)

### v2 (Post-Launch)
- RSS feed (`/feed.xml`)
- Basic analytics (page views per post, tracked server-side)
- Comments system (likely a lightweight embed like Giscus or custom)
- OpenGraph/meta tags for social sharing previews
- Reading time estimates on essays
- "Pin" important posts to top of feed
- Tag management admin page
- Export data (JSON backup)

---

## File Structure

```
terrymurray/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json
│   ├── sw.js (generated by next-pwa)
│   ├── icons/
│   └── textures/
│       └── paper-grain.png
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Home/feed
│   │   ├── post/
│   │   │   └── [id]/page.tsx         # Full essay view
│   │   ├── share/
│   │   │   └── page.tsx              # PWA share target
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx              # Dashboard
│   │   │   └── write/
│   │   │       ├── page.tsx          # New essay
│   │   │       └── [id]/page.tsx     # Edit essay
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── posts/
│   │       │   ├── route.ts          # GET (list), POST (create)
│   │       │   └── [id]/route.ts     # GET, PUT, DELETE
│   │       ├── tags/
│   │       │   ├── route.ts          # GET all tags
│   │       │   └── autocomplete/route.ts
│   │       ├── upload/route.ts
│   │       └── share/route.ts        # PWA share POST handler
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── feed/
│   │   │   ├── PostFeed.tsx
│   │   │   ├── LogEntry.tsx
│   │   │   ├── EssayEntry.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── editor/
│   │   │   ├── TipTapEditor.tsx
│   │   │   ├── TagInput.tsx
│   │   │   └── SaveBar.tsx
│   │   ├── share/
│   │   │   └── ShareForm.tsx
│   │   └── ui/
│   │       ├── TagPill.tsx
│   │       ├── SearchInput.tsx
│   │       └── Button.tsx
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth config
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── utils.ts                  # Domain extraction, etc.
│   │   └── search.ts                 # Search query builder
│   └── styles/
│       └── globals.css               # Tailwind + CSS variables + texture
├── uploads/
│   └── images/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local
```
