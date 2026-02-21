import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");
  const sessionToken = request.nextUrl.searchParams.get("sessionToken");

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,website");
  url.searchParams.set("key", apiKey);
  if (sessionToken) url.searchParams.set("sessiontoken", sessionToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  return NextResponse.json({
    name: data.result?.name ?? null,
    website: data.result?.website ?? null,
  });
}
