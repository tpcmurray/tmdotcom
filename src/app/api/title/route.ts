import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url param required" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TerryMurrayBot/1.0)" },
    });
    clearTimeout(timeout);

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch
      ? titleMatch[1].trim().replace(/\s+/g, " ")
      : new URL(url).hostname;

    return NextResponse.json({ title });
  } catch {
    // Fallback to hostname on any fetch error
    try {
      return NextResponse.json({ title: new URL(url).hostname });
    } catch {
      return NextResponse.json({ title: url });
    }
  }
}
