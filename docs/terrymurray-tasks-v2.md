# terrymurray.com — v2 Phases & Tasks

> Post-launch enhancements derived from `terrymurray-tdd.md` v2 roadmap.
> Work through phases top-to-bottom. Each task is a focused prompt or coding session.

---

## Phase V1 — Reading Time

**Goal**: Display estimated reading time on essay cards and detail pages.

- [ ] V1.1 Add `calculateReadingTime(content: string): number` to `src/lib/utils.ts`
  - Word count = `content.split(/\s+/).length`
  - Minutes = `Math.ceil(wordCount / 200)`
- [ ] V1.2 Update `EssayEntry.tsx` to show reading time
  - Display below date: "X min read"
  - Only show for ESSAY type posts, not LOG
- [ ] V1.3 Update `EssayRenderer.tsx` to show reading time
  - Display at top of essay, below title: "X min read"

---

## Phase V2 — RSS Feeds

**Goal**: Provide RSS feeds for essays and reading log entries.

- [ ] V2.1 Create `src/app/feed/essays/route.ts`
  - `GET /feed/essays.xml`
  - Query: `type=ESSAY`, `status=PUBLISHED`
  - Generate RSS 2.0 XML with title, link, description, pubDate, guid
- [ ] V2.2 Create `src/app/feed/log/route.ts`
  - `GET /feed/log.xml`
  - Query: `type=LOG`, `status=PUBLISHED`
  - Same RSS 2.0 format

---

## Phase V3 — Analytics

**Goal**: Track page views per post, visible to admin only.

- [ ] V3.1 Update Prisma schema: add `viewCount Int @default(0)` to Post model
  - Run `npx prisma migrate dev --name add_view_count`
- [ ] V3.2 Update `GET /api/posts/[id]` to increment viewCount
  - Increment on each request (or use a simpler approach like hourly buckets if needed)
- [ ] V3.3 Update `GET /api/posts` response to include `viewCount`
- [ ] V3.4 Create `src/app/api/analytics/route.ts`
  - `GET /api/analytics` (protected)
  - Return top posts by viewCount, total views, etc.
- [ ] V3.5 Update AdminPostList to show view counts

---

## Phase V4 — Comments System

**Goal**: Allow readers to comment on essays.

- [ ] V4.1 Update Prisma schema: add Comment model
  ```prisma
  model Comment {
    id        String   @id @default(uuid())
    postId    String   @map("post_id")
    post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
    author    String
    content   String   @db.Text
    createdAt DateTime @default(now()) @map("created_at")
  
    @@map("comments")
  }
  ```
  - Run migration
- [ ] V4.2 Create `src/app/api/posts/[id]/comments/route.ts`
  - `GET` - List comments for a post (ordered by createdAt desc)
  - `POST` - Add comment (no auth required)
- [ ] V4.3 Create `src/app/api/comments/[id]/route.ts`
  - `DELETE` - Delete comment (admin only)
- [ ] V4.4 Update `EssayRenderer.tsx` to show comment form
  - Text input for name/email
  - Textarea for comment
  - Submit button → POST to comments API
- [ ] V4.5 Display list of comments below essay content
  - Author name, date, comment text

---

## Phase V5 — Tag Management

**Goal**: Admin can manage tags (rename, merge, delete).

- [ ] V5.1 Create `src/app/api/admin/tags/route.ts`
  - `GET` - List all tags with post counts
- [ ] V5.2 Create `src/app/api/admin/tags/[id]/route.ts`
  - `PUT` - Rename tag (update tag name)
- [ ] V5.3 Create `src/app/api/admin/tags/merge/route.ts`
  - `POST` - Merge tag A into tag B (update post_tags, delete A)
- [ ] V5.4 Create `src/app/admin/tags/page.tsx` — Tag management UI
  - Table of all tags with post counts
  - "Rename" button → inline edit or modal
  - "Merge" button → select target tag
  - "Delete" button → only if post count is 0

---

## Phase V6 — Export Data

**Goal**: Admin can export all site data as JSON.

- [ ] V6.1 Create `src/app/api/admin/export/route.ts`
  - `GET` (protected)
  - Fetch all posts with tags and images
  - Return as JSON with proper headers for download
- [ ] V6.2 Create `src/app/admin/export/page.tsx` — Export UI
  - "Export All Data" button
  - Downloads `terrymurray-export-YYYY-MM-DD.json`

---

## Dependency Order (Quick Reference)

```
Phase V1 (reading time)
  └─► Phase V2 (RSS feeds)
Phase V3 (analytics) — needs V1 first (depends on Post model)
Phase V4 (comments) — needs V3 (database schema)
Phase V5 (tag management) — independent
Phase V6 (export) — independent
```

---

## Notes for Implementation

- **Reading time** uses `content_markdown` field (or content if markdown is null)
- **RSS feeds** should cache or regenerate on post publish (static generation with ISR is fine)
- **Analytics** view count can be approximate — don't over-engineer deduplication
- **Comments** are public (no auth) to allow readers to comment easily
- **Export** includes image URLs, not base64 (URLs point to uploaded files)
