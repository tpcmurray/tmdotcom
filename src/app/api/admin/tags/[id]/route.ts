import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

// PUT /api/admin/tags/[id] — rename tag
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
    const { name } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 },
      );
    }

    const newName = name.toLowerCase().trim();

    // Check if another tag already has this name
    const existing = await prisma.tag.findUnique({ where: { name: newName } });
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: `Tag "${newName}" already exists. Use merge instead.` },
        { status: 409 },
      );
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: { name: newName },
    });

    return NextResponse.json({ id: updated.id, name: updated.name });
  } catch (error) {
    console.error("PUT /api/admin/tags/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/tags/[id] — delete tag (only if no posts use it)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const postCount = await prisma.postTag.count({ where: { tagId: id } });
    if (postCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a tag that is still used by posts." },
        { status: 400 },
      );
    }

    await prisma.tag.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/admin/tags/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
