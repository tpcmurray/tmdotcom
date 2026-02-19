import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tags — all tags with published post count
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        posts: {
          where: {
            post: { status: "PUBLISHED" },
          },
          select: { postId: true },
        },
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
    console.error("GET /api/tags error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
