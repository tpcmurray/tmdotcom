"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface AdminPost {
  id: string;
  title: string;
  type: string;
  status: string;
  domain: string | null;
  createdAt: string;
  tags: string[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminPostList({ posts }: { posts: AdminPost[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete post.");
      }
    } catch {
      alert("Failed to delete post.");
    } finally {
      setDeleting(null);
    }
  }

  if (posts.length === 0) {
    return (
      <p className="font-meta text-[14px] text-ink-muted py-8 text-center">
        No posts found.
      </p>
    );
  }

  return (
    <ul className="list-none">
      {posts.map((post) => {
        const typeLabel =
          post.type === "ESSAY"
            ? "Essay"
            : `Log${post.domain ? ` \u00b7 ${post.domain}` : ""}`;
        const editHref =
          post.type === "ESSAY"
            ? `/admin/write/${post.id}`
            : `/admin/write/${post.id}`;

        return (
          <li
            key={post.id}
            className="flex items-center justify-between py-3.5 border-b border-edge/50"
          >
            <div className="flex-1 min-w-0">
              <div className="font-body text-[15px] font-medium text-ink truncate mb-0.5">
                {post.title}
              </div>
              <div className="font-meta text-[12px] text-ink-muted flex items-center gap-2 flex-wrap">
                <span
                  className={`status-badge ${
                    post.status === "DRAFT" ? "draft" : "published"
                  }`}
                >
                  {post.status === "DRAFT" ? "Draft" : "Published"}
                </span>
                <span>{typeLabel}</span>
                <span>&middot;</span>
                <span>{formatDate(post.createdAt)}</span>
                {post.tags.length > 0 && (
                  <>
                    <span>&middot;</span>
                    <span>{post.tags.join(", ")}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 ml-4 shrink-0">
              <Link
                href={editHref}
                className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-ink-soft hover:text-ink hover:no-underline"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(post.id, post.title)}
                disabled={deleting === post.id}
                className="font-meta text-[12px] px-2.5 py-1 rounded border border-edge bg-card text-ink-soft hover:text-red-700 hover:border-red-300 disabled:opacity-50 cursor-pointer"
              >
                {deleting === post.id ? "..." : "Delete"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
