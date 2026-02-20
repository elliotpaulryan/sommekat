import { NextRequest, NextResponse } from "next/server";
import { getRecipePairings } from "@/lib/claude-recipe";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

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

    const result = await getRecipePairings(url);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error processing recipe:", error);
    const message = error instanceof Error ? error.message : "Failed to process recipe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
