import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

type Params = Promise<{ path: string[] }>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { path: segments } = await params;
  const filename = segments.join("/");

  const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads/images");
  const filePath = path.resolve(uploadDir, filename);

  // Prevent path traversal
  if (!filePath.startsWith(uploadDir)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
