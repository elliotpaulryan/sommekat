import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const sessionToken = request.nextUrl.searchParams.get("sessionToken");

  if (!query || query.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", query);
  url.searchParams.set("types", "restaurant");
  url.searchParams.set("key", apiKey);
  if (sessionToken) url.searchParams.set("sessiontoken", sessionToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  return NextResponse.json({
    predictions: (data.predictions || []).slice(0, 5).map((p: { place_id: string; structured_formatting?: { main_text?: string; secondary_text?: string }; description?: string }) => ({
      placeId: p.place_id,
      name: p.structured_formatting?.main_text || p.description || "",
      address: p.structured_formatting?.secondary_text || "",
    })),
  });
}
