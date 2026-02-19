import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { extractDomain } from "@/lib/utils";

function normalizePost<T extends { tags: { tag: unknown }[] }>(post: T) {
  const { tags, ...rest } = post;
  return { ...rest, tags: tags.map((pt) => pt.tag) };
}

// GET /api/posts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Drafts are only visible to the authenticated user
    if (post.status === "DRAFT") {
      const session = await getAuthSession();
      if (!session) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    return NextResponse.json(normalizePost(post));
  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/posts/[id] — auth required
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, url, content, contentMarkdown, status, tags } = body;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Re-sync tags: delete existing associations, create new ones
    if (tags !== undefined) {
      const tagNames: string[] = Array.isArray(tags)
        ? tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean)
        : [];

      const tagRecords = await Promise.all(
        tagNames.map((name) =>
          prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
          }),
        ),
      );

      await prisma.postTag.deleteMany({ where: { postId: id } });

      if (tagRecords.length > 0) {
        await prisma.postTag.createMany({
          data: tagRecords.map((tag) => ({ postId: id, tagId: tag.id })),
        });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) {
      updateData.url = url ?? null;
      updateData.domain = url ? extractDomain(url) : null;
    }
    if (content !== undefined) updateData.content = content ?? null;
    if (contentMarkdown !== undefined)
      updateData.contentMarkdown = contentMarkdown ?? null;
    if (status !== undefined) updateData.status = status;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(normalizePost(updatedPost));
  } catch (error) {
    console.error("PUT /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/posts/[id] — auth required
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
