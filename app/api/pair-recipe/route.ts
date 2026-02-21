import { NextRequest, NextResponse } from "next/server";
import { getRecipePairings, getRecipePairingsFromFiles } from "@/lib/claude-recipe";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/heic", "image/heif", "image/bmp", "image/tiff",
  "application/pdf",
];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function validateFile(file: File) {
  const ext = file.name.toLowerCase().split(".").pop() || "";
  const validExts = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp", "tiff", "tif", "pdf"];
  if (!ALLOWED_TYPES.includes(file.type) && !validExts.includes(ext)) {
    return `Unsupported file type: ${file.type || "unknown"}. Please upload a JPG, PNG, WebP, GIF, or PDF.`;
  }
  if (file.size > MAX_FILE_SIZE) return "File too large. Maximum size is 20MB.";
  return null;
}

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes).toString("base64");
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // File upload path
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("files") as File[];
      const userCountry = formData.get("userCountry") as string | null;

      if (files.length === 0) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      for (const file of files) {
        const err = validateFile(file);
        if (err) return NextResponse.json({ error: err }, { status: 400 });
      }

      const fileData = await Promise.all(
        files.map(async (f) => ({ base64: await fileToBase64(f), mimeType: f.type || "image/jpeg" }))
      );

      const result = await getRecipePairingsFromFiles(fileData, userCountry ?? undefined);
      return NextResponse.json(result);
    }

    // URL path
    const { url, userCountry } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "URL must use HTTP or HTTPS" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const result = await getRecipePairings(url, typeof userCountry === "string" ? userCountry : undefined);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error processing recipe:", error);
    const message = error instanceof Error ? error.message : "Failed to process recipe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
