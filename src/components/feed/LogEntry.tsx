import TagPill from "@/components/ui/TagPill";
import { stripHtml } from "@/lib/utils";
import type { Post } from "@/components/feed/PostFeed";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface LogEntryProps {
  post: Post;
}

export default function LogEntry({ post }: LogEntryProps) {
  const notes = post.content ? stripHtml(post.content) : null;

  return (
    <article className="pb-6 mb-6 border-b border-edge/50 last:border-b-0 last:pb-0 last:mb-0">
      {/* Type label */}
      <p className="font-meta text-[11px] font-semibold uppercase tracking-[0.8px] text-ink-muted mb-1.5">
        Reading Log
      </p>

      {/* Title */}
      <h3 className="font-heading text-[22px] font-semibold leading-snug mb-1.5">
        <a
          href={post.url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink hover:text-brown hover:no-underline"
        >
          {post.title}
        </a>
      </h3>

      {/* Meta: domain · date */}
      <div className="flex items-center gap-2 font-meta text-[13px] text-ink-muted mb-2.5">
        {post.domain && post.url && (
          <>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brown font-medium hover:no-underline"
            >
              {post.domain} ↗
            </a>
            <span className="text-edge">·</span>
          </>
        )}
        <span>{formatDate(post.createdAt)}</span>
      </div>

      {/* Notes */}
      {notes && (
        <p className="font-body text-[15px] text-ink-soft leading-relaxed mb-2.5">
          {notes}
        </p>
      )}

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
