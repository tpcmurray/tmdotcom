import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripHtml, extractDomain } from "@/lib/utils";

const SITE_URL = process.env.NEXTAUTH_URL || "https://terrymurray.com";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildRssItem(post: {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  content: string | null;
  createdAt: Date;
}) {
  const description = post.content ? stripHtml(post.content) : "";
  const link = post.url || `${SITE_URL}/post/${post.id}`;

  return {
    title: post.title,
    link,
    guid: `${SITE_URL}/post/${post.id}`,
    pubDate: post.createdAt.toUTCString(),
    description,
    domain: post.domain || (post.url ? extractDomain(post.url) : null),
  };
}

function generateRssXml(
  title: string,
  description: string,
  items: ReturnType<typeof buildRssItem>[]
) {
  const itemsXml = items
    .map((item) => {
      let fullDescription = item.description;
      if (item.domain) {
        fullDescription = `[${item.domain}] ${fullDescription}`;
      }

      return `    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${fullDescription}]]></description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed/log" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;
}

// GET /feed/log
export async function GET(_req: NextRequest) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        type: "LOG",
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const items = posts.map(buildRssItem);
    const xml = generateRssXml(
      "Terry Murray — Reading Log",
      "AI content Terry Murray is reading and bookmarking.",
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
    console.error("GET /feed/log error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
