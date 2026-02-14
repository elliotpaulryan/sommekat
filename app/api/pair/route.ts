import { NextRequest, NextResponse } from "next/server";
import { getWinePairings, getWinePairingsFromUrl } from "@/lib/claude";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes).toString("base64");
}

function validateFile(file: File, label: string) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported ${label} file type: ${file.type}. Please upload a JPG, PNG, WebP, GIF, or PDF.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${label} file too large. Maximum size is 20MB.`;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle URL submission (JSON body)
    if (contentType.includes("application/json")) {
      const { url, wineUrl, currency } = await request.json();

      if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
      }

      try {
        const parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return NextResponse.json({ error: "URL must use HTTP or HTTPS" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }

      if (wineUrl) {
        try {
          const parsedWineUrl = new URL(wineUrl);
          if (!["http:", "https:"].includes(parsedWineUrl.protocol)) {
            return NextResponse.json({ error: "Wine URL must use HTTP or HTTPS" }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: "Invalid wine URL" }, { status: 400 });
        }
      }

      const pairings = await getWinePairingsFromUrl(url, wineUrl || undefined, currency || "USD");
      return NextResponse.json({ pairings });
    }

    // Handle file upload (multipart form data)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileError = validateFile(file, "Food menu");
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    const base64 = await fileToBase64(file);

    // Handle optional wine menu (file or URL)
    const wineFileUpload = formData.get("wineFile") as File | null;
    const wineUrlField = formData.get("wineUrl") as string | null;

    let wineBase64: string | undefined;
    let wineMimeType: string | undefined;
    let wineUrlValue: string | undefined;

    if (wineFileUpload) {
      const wineError = validateFile(wineFileUpload, "Wine menu");
      if (wineError) {
        return NextResponse.json({ error: wineError }, { status: 400 });
      }
      wineBase64 = await fileToBase64(wineFileUpload);
      wineMimeType = wineFileUpload.type;
    } else if (wineUrlField) {
      wineUrlValue = wineUrlField;
    }

    const currencyField = formData.get("currency") as string | null;

    const pairings = await getWinePairings(base64, file.type, {
      wineMenuBase64: wineBase64,
      wineMenuMimeType: wineMimeType,
      wineMenuUrl: wineUrlValue,
      currency: currencyField || "USD",
    });

    return NextResponse.json({ pairings });
  } catch (error: unknown) {
    console.error("Error processing menu:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process menu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
