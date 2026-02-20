import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// POST /api/admin/tags/merge — merge sourceId into targetId
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sourceId, targetId } = await req.json();

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { error: "sourceId and targetId are required" },
        { status: 400 },
      );
    }

    if (sourceId === targetId) {
      return NextResponse.json(
        { error: "Cannot merge a tag into itself" },
        { status: 400 },
      );
    }

    // Get all post associations for the source tag
    const sourceLinks = await prisma.postTag.findMany({
      where: { tagId: sourceId },
    });

    // For each post linked to the source tag, link it to the target tag
    // (skip if the post is already linked to the target)
    for (const link of sourceLinks) {
      const alreadyLinked = await prisma.postTag.findUnique({
        where: {
          postId_tagId: { postId: link.postId, tagId: targetId },
        },
      });

      if (!alreadyLinked) {
        await prisma.postTag.create({
          data: { postId: link.postId, tagId: targetId },
        });
      }
    }

    // Delete all source tag associations then delete the source tag
    await prisma.postTag.deleteMany({ where: { tagId: sourceId } });
    await prisma.tag.delete({ where: { id: sourceId } });

    return NextResponse.json({ merged: true });
  } catch (error) {
    console.error("POST /api/admin/tags/merge error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
