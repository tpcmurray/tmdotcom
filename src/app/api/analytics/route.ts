import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// GET /api/analytics — admin only
export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [topPosts, aggregate] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { viewCount: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          type: true,
          viewCount: true,
          createdAt: true,
        },
      }),
      prisma.post.aggregate({
        where: { status: "PUBLISHED" },
        _sum: { viewCount: true },
      }),
    ]);

    return NextResponse.json({
      totalViews: aggregate._sum.viewCount ?? 0,
      topPosts,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
