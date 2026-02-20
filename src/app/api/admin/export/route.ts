import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// GET /api/admin/export — export all site data as JSON
export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [posts, tags] = await Promise.all([
      prisma.post.findMany({
        include: {
          tags: { include: { tag: true } },
          images: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
    ]);

    const data = {
      exportedAt: new Date().toISOString(),
      posts: posts.map((post: (typeof posts)[number]) => ({
        id: post.id,
        type: post.type,
        title: post.title,
        url: post.url,
        domain: post.domain,
        content: post.content,
        contentMarkdown: post.contentMarkdown,
        status: post.status,
        viewCount: post.viewCount,
        tags: post.tags.map((pt: (typeof post.tags)[number]) => pt.tag.name),
        images: post.images.map((img: (typeof post.images)[number]) => ({
          id: img.id,
          filename: img.filename,
          path: img.path,
          mimeType: img.mimeType,
          sizeBytes: img.sizeBytes,
        })),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      tags: tags.map((tag: (typeof tags)[number]) => ({
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt.toISOString(),
      })),
    };

    const filename = `terrymurray-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
