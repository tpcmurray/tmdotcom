import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import TagManager from "@/components/admin/TagManager";

export default async function AdminTagsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const tags = await prisma.tag.findMany({
    include: {
      posts: { select: { postId: true } },
    },
    orderBy: { name: "asc" },
  });

  const serializedTags = tags.map((tag: (typeof tags)[number]) => ({
    id: tag.id,
    name: tag.name,
    count: tag.posts.length,
  }));

  return (
    <div className="page-content py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-[28px] font-bold text-ink">
          Tags
        </h1>
        <Link
          href="/admin"
          className="font-meta text-[13px] text-ink-muted hover:text-brown hover:no-underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      <TagManager tags={serializedTags} />
    </div>
  );
}
