import Link from "next/link";
import TagPill from "@/components/ui/TagPill";
import { stripHtml, calculateReadingTime } from "@/lib/utils";
import type { Post } from "@/components/feed/PostFeed";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function excerpt(content: string | null): string {
  if (!content) return "";
  const text = stripHtml(content);
  return text.length > 150 ? text.slice(0, 150).trimEnd() + "…" : text;
}

interface EssayEntryProps {
  post: Post;
}

export default function EssayEntry({ post }: EssayEntryProps) {
  const text = excerpt(post.content);

  return (
    <article className="pb-6 mb-6 border-b border-edge/50 last:border-b-0 last:pb-0 last:mb-0">
      {/* Type label */}
      <p className="font-meta text-[11px] font-semibold uppercase tracking-[0.8px] text-brown mb-1.5">
        Essay
      </p>

      {/* Title */}
      <h3 className="font-heading text-[22px] font-semibold leading-snug mb-1.5">
        <Link
          href={`/post/${post.id}`}
          className="text-ink hover:text-brown hover:no-underline"
        >
          {post.title}
        </Link>
      </h3>

      {/* Meta: date + reading time */}
      <div className="font-meta text-[13px] text-ink-muted mb-2.5">
        {formatDate(post.createdAt)}
        {post.type === "ESSAY" && (
          <>
            {" "}·{" "}
            <span>{calculateReadingTime(post.content)} min read</span>
          </>
        )}
      </div>

      {/* Excerpt */}
      {text && (
        <p className="font-body text-[15px] text-ink-soft leading-relaxed mb-2.5">
          {text}
        </p>
      )}

      {/* Read more */}
      <Link
        href={`/post/${post.id}`}
        className="font-meta text-[14px] font-medium text-brown hover:no-underline inline-block mb-2.5"
      >
        Read more →
      </Link>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagPill key={tag.id} name={tag.name} />
          ))}
        </div>
      )}
    </article>
  );
}
