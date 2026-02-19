import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const title = formData.get("title")?.toString() || "";
  const text = formData.get("text")?.toString() || "";
  const url = formData.get("url")?.toString() || "";

  // Android often puts the URL in the "text" field
  const sharedUrl = url || extractUrlFromText(text);
  const sharedTitle = title || "";

  const params = new URLSearchParams();
  if (sharedUrl) params.set("url", sharedUrl);
  if (sharedTitle) params.set("title", sharedTitle);

  return NextResponse.redirect(
    new URL(`/share?${params.toString()}`, req.url),
  );
}

function extractUrlFromText(text: string): string {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : "";
}
