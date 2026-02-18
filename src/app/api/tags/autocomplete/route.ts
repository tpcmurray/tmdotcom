import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tags/autocomplete?q=<prefix>
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";

    if (!q) {
      return NextResponse.json([]);
    }

    const tags = await prisma.tag.findMany({
      where: {
        name: { startsWith: q },
      },
      orderBy: { name: "asc" },
      take: 10,
      select: { id: true, name: true },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("GET /api/tags/autocomplete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
