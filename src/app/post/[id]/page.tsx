import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { stripHtml, calculateReadingTime } from "@/lib/utils";
import EssayRenderer from "@/components/feed/EssayRenderer";
import TagPill from "@/components/ui/TagPill";

type Params = Promise<{ id: string }>;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  if (!post) return null;

  if (post.status === "DRAFT") {
    const session = await getAuthSession();
    if (!session) return null;
  }

  return {
    ...post,
    tags: post.tags.map((pt: (typeof post.tags)[number]) => pt.tag),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: "Not Found" };
  }

  const description = post.content
    ? stripHtml(post.content).slice(0, 160).trimEnd() + "…"
    : undefined;

  return {
    title: `${post.title} — Terry Murray`,
    description,
    openGraph: {
      title: post.title,
      description,
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) notFound();

  return (
    <div className="pt-12 pb-10 sm:pt-16 sm:pb-12">
      <Link
        href="/"
        className="font-meta text-[13px] text-ink-muted inline-block mb-8 hover:text-brown hover:no-underline"
      >
        ← Back to feed
      </Link>

      <div className="mb-8">
        <h1 className="font-heading text-[28px] sm:text-[36px] font-bold leading-tight text-ink mb-3">
          {post.title}
        </h1>
        <div className="font-meta text-[14px] text-ink-muted flex items-center gap-3">
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{calculateReadingTime(post.content)} min read</span>
        </div>
      </div>

      <EssayRenderer content={post.content} />

      {post.tags.length > 0 && (
        <div className="mt-10 pt-5 border-t border-edge/50 flex flex-wrap gap-1.5">
          {post.tags.map((tag: { id: string; name: string }) => (
            <TagPill key={tag.id} name={tag.name} />
          ))}
        </div>
      )}
    </div>
  );
}
