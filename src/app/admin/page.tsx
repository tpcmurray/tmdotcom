import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import Button from "@/components/ui/Button";
import AdminPostList from "@/components/admin/AdminPostList";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getAuthSession();
  if (!session) redirect("/login");

  const { filter } = await searchParams;
  const activeFilter = filter || "all";

  const where: Record<string, unknown> = {};
  if (activeFilter === "drafts") where.status = "DRAFT";
  if (activeFilter === "log") where.type = "LOG";
  if (activeFilter === "essays") where.type = "ESSAY";

  const posts = await prisma.post.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serializedPosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    type: post.type,
    status: post.status,
    domain: post.domain,
    createdAt: post.createdAt.toISOString(),
    tags: post.tags.map((pt) => pt.tag.name),
  }));

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-[28px] font-bold text-ink">
          Dashboard
        </h1>
        <Link href="/admin/write">
          <Button variant="primary">+ New Essay</Button>
        </Link>
      </div>

      <div className="flex gap-0 border-b border-edge mb-6">
        {[
          { key: "all", label: "All Posts" },
          { key: "drafts", label: "Drafts" },
          { key: "log", label: "Reading Log" },
          { key: "essays", label: "Essays" },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/admin" : `/admin?filter=${tab.key}`}
            className={`font-meta text-[14px] font-medium px-5 py-2.5 border-b-2 -mb-px hover:no-underline ${
              activeFilter === tab.key
                ? "text-brown border-brown"
                : "text-ink-soft border-transparent hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <AdminPostList posts={serializedPosts} />
    </div>
  );
}
