import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// GET /api/admin/tags — all tags with total post count (not just published)
export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tags = await prisma.tag.findMany({
      include: {
        posts: { select: { postId: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      tags.map((tag: (typeof tags)[number]) => ({
        id: tag.id,
        name: tag.name,
        count: tag.posts.length,
      })),
    );
  } catch (error) {
    console.error("GET /api/admin/tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
