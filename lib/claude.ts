import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";

export interface WinePairing {
  dish: string;
  description: string;
  wineType: string;
  altWineType: string | null;
  bottleSuggestion: string;
  rationale: string;
  vivinoRating: number | null;
  robertParkerScore: number | null;
  retailPrice: string | null;
  restaurantPrice: string | null;
}

const client = new Anthropic();

const BASE_PROMPT = `You are an expert sommelier. You will be given a FOOD MENU from a restaurant.

YOUR TASK: Extract ONLY the MAIN COURSES / MAINS from the menu. Ignore starters, appetizers, entrees, sides, desserts, snacks, and drinks. Focus exclusively on the main dishes.

For each main dish, recommend a wine to pair with it. Keep the recommendation BROAD — just the grape variety or wine style (e.g. "Pinot Noir", "Chardonnay", "Shiraz", "Riesling"). Do NOT recommend specific bottles or producers unless a wine menu has been provided.

CRITICAL RULES:
- The "dish" field must ONLY contain MAIN COURSE food items.
- NEVER include starters, desserts, sides, or beverages.
- NEVER put a wine, beer, cocktail, or any beverage in the "dish" field.
- NEVER include prices (e.g. "€14", "$25", "12€", "28.00") in the "dish" or "description" fields. Strip all prices completely. The description must only contain what the food is, its ingredients, and how it is prepared.

Return your response as a JSON array with this exact structure (no markdown, no code fences, just raw JSON):
[
  {
    "dish": "Exact name of the main dish as it appears on the menu (NO prices)",
    "description": "A short description of the dish in English — what it is, key ingredients, and how it is prepared (1-2 sentences). NEVER include the price.",
    "wineType": "The grape variety or wine style (e.g., Pinot Noir, Chardonnay, Riesling, Shiraz)",
    "altWineType": "A widely available mainstream alternative (e.g. Merlot, Sauvignon Blanc, Cabernet Sauvignon)",
    "bottleSuggestion": "Just the grape variety or style (e.g. 'Pinot Noir', 'Oaked Chardonnay'). Only include a specific bottle if a wine menu was provided.",
    "rationale": "1-2 sentences explaining why this wine style pairs well with this dish",
    "vivinoRating": null,
    "robertParkerScore": null,
    "retailPrice": null,
    "restaurantPrice": null
  }
]

Additional rules:
- ALWAYS translate dish descriptions to English. If the menu is in a foreign language, the description must still be in English.
- NEVER include the dish price in the description field. The description should only contain what the dish is, its ingredients, and preparation method.
- Evaluate each dish INDEPENDENTLY. Consider its specific ingredients, flavor profile, weight, and preparation method. Choose the best wine match for THAT dish alone.
- It is perfectly fine to recommend the same wine for multiple dishes if it is genuinely the best pairing for each.
- Do NOT try to vary your recommendations just for the sake of variety — accuracy matters more than diversity.
- altWineType: A mainstream, widely available wine alternative that would also pair well with the dish. Use well-known international grape varieties (e.g. Merlot, Sauvignon Blanc, Cabernet Sauvignon, Pinot Noir, Chardonnay, Shiraz, Pinot Grigio, Riesling). This helps when the primary recommendation is a regional/niche grape that may not be available. If the primary recommendation is already mainstream, set altWineType to a different mainstream option, or null if there is no good alternative.
- vivinoRating: The Vivino community rating for the recommended wine (a number from 1.0 to 5.0, e.g. 4.2). Vivino is the world's largest wine rating platform. Use your best knowledge to estimate the rating. Only include if a specific bottle is recommended (i.e. when a wine menu is provided). Otherwise set to null.
- robertParkerScore: The Robert Parker / Wine Advocate score for the recommended wine (integer out of 100, e.g. 92). Only include if you are confident the wine has been rated. Set to null otherwise.
- retailPrice: Only include if a specific bottle is recommended. Otherwise set to null.
- restaurantPrice: The price listed on the restaurant's wine menu for this bottle, if a wine menu was provided. Include the currency symbol of the restaurant's local currency (e.g. "$45", "£32", "€28"). Set to null otherwise.`;

const WINE_MENU_ADDENDUM = `

A wine menu has also been provided. You MUST ONLY recommend wines that appear on this wine list. Do NOT suggest any wine that is not on the list. For each dish, find the best matching wine FROM the wine menu. In the bottleSuggestion field, use the exact wine name and producer as listed on the wine menu. Include the restaurantPrice from the wine menu. Include the vivinoRating (1.0-5.0), robertParkerScore (out of 100), and retailPrice for the specific bottle if you know them.`;

function makeContentBlock(base64: string, mimeType: string): ContentBlockParam {
  if (mimeType === "application/pdf") {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64,
      },
    };
  }
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
      data: base64,
    },
  };
}

async function fetchUrlAsContentBlock(url: string): Promise<ContentBlockParam> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from URL (status ${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());

  if (contentType.includes("application/pdf")) {
    return {
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: buffer.toString("base64"),
      },
    };
  } else if (contentType.includes("image/")) {
    const mediaType = contentType.split(";")[0].trim() as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: buffer.toString("base64"),
      },
    };
  }

  // Strip HTML tags to get plain text content
  const html = buffer.toString("utf-8");
  const plainText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30000);

  return {
    type: "text",
    text: `Menu from URL: ${url}\n\nPage content:\n${plainText}`,
  };
}

function parseResponse(text: string): WinePairing[] {
  console.log("Claude response:", text.slice(0, 500));
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error(
      `No JSON array found in response. Claude said: "${text.slice(0, 300)}"`
    );
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

interface WineMenuOptions {
  wineMenuBase64?: string;
  wineMenuMimeType?: string;
  wineMenuUrl?: string;
  currency?: string;
}

export async function getWinePairings(
  fileBase64: string,
  mimeType: string,
  wineMenu?: WineMenuOptions
): Promise<WinePairing[]> {
  const contentBlocks: ContentBlockParam[] = [
    makeContentBlock(fileBase64, mimeType),
  ];

  const currency = wineMenu?.currency || "USD";
  let prompt = BASE_PROMPT + `\n- Use ${currency} as the currency for all prices.`;

  // Add wine menu if provided
  if (wineMenu?.wineMenuBase64 && wineMenu.wineMenuMimeType) {
    contentBlocks.push(
      { type: "text", text: "The following is the restaurant's wine menu:" },
      makeContentBlock(wineMenu.wineMenuBase64, wineMenu.wineMenuMimeType)
    );
    prompt += WINE_MENU_ADDENDUM;
  } else if (wineMenu?.wineMenuUrl) {
    const wineBlock = await fetchUrlAsContentBlock(wineMenu.wineMenuUrl);
    contentBlocks.push(
      { type: "text", text: "The following is the restaurant's wine menu:" },
      wineBlock
    );
    prompt += WINE_MENU_ADDENDUM;
  }

  contentBlocks.push({ type: "text", text: prompt });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseResponse(text);
}

export async function getWinePairingsFromUrl(
  url: string,
  wineUrl?: string,
  currency?: string
): Promise<WinePairing[]> {
  const foodBlock = await fetchUrlAsContentBlock(url);

  const contentBlocks: ContentBlockParam[] = [foodBlock];
  let prompt = BASE_PROMPT + `\n- Use ${currency || "USD"} as the currency for all prices.`;

  if (wineUrl) {
    const wineBlock = await fetchUrlAsContentBlock(wineUrl);
    contentBlocks.push(
      { type: "text", text: "The following is the restaurant's wine menu:" },
      wineBlock
    );
    prompt += WINE_MENU_ADDENDUM;
  }

  contentBlocks.push({ type: "text", text: prompt });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseResponse(text);
}
