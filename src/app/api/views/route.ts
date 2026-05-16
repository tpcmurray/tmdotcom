import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/views — public, increments viewCount for a published post.
// Designed for navigator.sendBeacon calls from external-link clicks.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const id = body && typeof body.id === "string" ? body.id : null;

    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!post || post.status !== "PUBLISHED") {
      return new NextResponse(null, { status: 204 });
    }

    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("POST /api/views error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
