import { NextRequest, NextResponse } from "next/server";
import { getWinePairings, getWinePairingsFromUrl } from "@/lib/claude";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
  "application/pdf",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

async function fileToBase64(file: File) {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes).toString("base64");
}

function validateFile(file: File, label: string) {
  // Allow files with no MIME type (some mobile browsers) if they have a valid extension
  const ext = file.name.toLowerCase().split(".").pop() || "";
  const validExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp", "tiff", "tif", "pdf"];
  if (!ALLOWED_TYPES.includes(file.type) && !validExtensions.includes(ext)) {
    return `Unsupported ${label} file type: ${file.type || "unknown"}. Please upload a JPG, PNG, WebP, GIF, or PDF.`;
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
      const { url, wineUrl, currency, minPrice, maxPrice, courses, estimatePrices } = await request.json();

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

      const parsedCourses = Array.isArray(courses) ? courses : ["mains"];
      const result = await getWinePairingsFromUrl(url, wineUrl || undefined, currency || "USD", minPrice, maxPrice, parsedCourses, !!estimatePrices);
      return NextResponse.json({ pairings: result.pairings, restaurantName: result.restaurantName, menuCurrency: result.menuCurrency });
    }

    // Handle file upload (multipart form data)
    const formData = await request.formData();
    const foodFiles = formData.getAll("files") as File[];

    if (foodFiles.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    for (const file of foodFiles) {
      const fileError = validateFile(file, "Food menu");
      if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
    }

    const foodFileData = await Promise.all(
      foodFiles.map(async (f) => ({ base64: await fileToBase64(f), mimeType: f.type || "image/jpeg" }))
    );

    // Handle optional wine menu (files or URL)
    const wineFileUploads = formData.getAll("wineFiles") as File[];
    const wineUrlField = formData.get("wineUrl") as string | null;

    let wineFileData: Array<{ base64: string; mimeType: string }> | undefined;
    let wineUrlValue: string | undefined;

    if (wineFileUploads.length > 0) {
      for (const f of wineFileUploads) {
        const wineError = validateFile(f, "Wine menu");
        if (wineError) return NextResponse.json({ error: wineError }, { status: 400 });
      }
      wineFileData = await Promise.all(
        wineFileUploads.map(async (f) => ({ base64: await fileToBase64(f), mimeType: f.type || "image/jpeg" }))
      );
    } else if (wineUrlField) {
      wineUrlValue = wineUrlField;
    }

    const currencyField = formData.get("currency") as string | null;
    const minPriceField = formData.get("minPrice") as string | null;
    const maxPriceField = formData.get("maxPrice") as string | null;
    const coursesField = formData.get("courses") as string | null;
    const estimatePricesField = formData.get("estimatePrices") as string | null;
    const parsedCourses = coursesField ? JSON.parse(coursesField) : ["mains"];

    const result = await getWinePairings(foodFileData, {
      wineMenuFiles: wineFileData,
      wineMenuUrl: wineUrlValue,
      currency: currencyField || "USD",
      minPrice: minPriceField ? Number(minPriceField) : undefined,
      maxPrice: maxPriceField ? Number(maxPriceField) : undefined,
      courses: parsedCourses,
      estimatePrices: estimatePricesField === "true",
    });

    return NextResponse.json({ pairings: result.pairings, restaurantName: result.restaurantName, menuCurrency: result.menuCurrency });
  } catch (error: unknown) {
    console.error("Error processing menu:", error);
    const raw = error instanceof Error ? error.message : "Failed to process menu";
    const message = raw === "MAX_DISHES_EXCEEDED"
      ? "Maximum dish limit reached (50 dishes). Please upload a smaller menu or split it across multiple requests."
      : raw;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
