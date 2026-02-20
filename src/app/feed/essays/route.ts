import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripHtml } from "@/lib/utils";

const SITE_URL = process.env.NEXTAUTH_URL || "https://terrymurray.com";

function buildRssItem(post: {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  url: string | null;
}) {
  const description = post.content
    ? stripHtml(post.content).slice(0, 200).trimEnd() + "…"
    : "";

  return {
    title: post.title,
    link: `${SITE_URL}/post/${post.id}`,
    guid: `${SITE_URL}/post/${post.id}`,
    pubDate: post.createdAt.toUTCString(),
    description,
  };
}

function generateRssXml(title: string, description: string, items: ReturnType<typeof buildRssItem>[]) {
  const itemsXml = items
    .map(
      (item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed/essays" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;
}

// GET /feed/essays
export async function GET(_req: NextRequest) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        type: "ESSAY",
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const items = posts.map(buildRssItem);
    const xml = generateRssXml(
      "Terry Murray — Essays",
      "Original essays and thoughts on AI from Terry Murray.",
      items
    );

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("GET /feed/essays error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
