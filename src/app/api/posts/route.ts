import { NextRequest, NextResponse } from "next/server";
import { PostType, PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { extractDomain } from "@/lib/utils";
import { sanitizeSearchTerm } from "@/lib/search";

function normalizePost<T extends { tags: { tag: unknown }[] }>(post: T) {
  const { tags, ...rest } = post;
  return { ...rest, tags: tags.map((pt) => pt.tag) };
}

// GET /api/posts
// Query params: type (LOG|ESSAY|all), tag, search, page, limit
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      parseInt(searchParams.get("limit") ?? "20", 10),
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      status: PostStatus.PUBLISHED,
    };

    if (type && type.toUpperCase() !== "ALL") {
      where.type = type.toUpperCase() as PostType;
    }

    if (tag) {
      where.tags = { some: { tag: { name: tag } } };
    }

    if (search) {
      const sanitized = sanitizeSearchTerm(search);
      const matchingIds = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM posts
        WHERE status = 'PUBLISHED'
          AND search_vector @@ plainto_tsquery('english', ${sanitized})
        ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${sanitized})) DESC
      `;

      const ids = matchingIds.map((r) => r.id);
      const searchWhere = { ...where, id: { in: ids } };

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: searchWhere,
          include: { tags: { include: { tag: true } } },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.post.count({ where: searchWhere }),
      ]);

      return NextResponse.json({
        posts: posts.map(normalizePost),
        total,
        page,
        limit,
      });
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts: posts.map(normalizePost),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/posts — auth required
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, title, url, content, contentMarkdown, status, tags } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "type and title are required" },
        { status: 400 },
      );
    }

    if (!["LOG", "ESSAY"].includes(type)) {
      return NextResponse.json(
        { error: "type must be LOG or ESSAY" },
        { status: 400 },
      );
    }

    // Upsert user — JWT strategy doesn't auto-create DB records
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      create: {
        email: session.user.email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      },
      update: {
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      },
    });

    // Upsert tags by name
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

    const post = await prisma.post.create({
      data: {
        type: type as PostType,
        title,
        url: url ?? null,
        domain: url ? extractDomain(url) : null,
        content: content ?? null,
        contentMarkdown: contentMarkdown ?? null,
        status: (status as PostStatus) ?? PostStatus.PUBLISHED,
        authorId: user.id,
        tags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(normalizePost(post), { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
