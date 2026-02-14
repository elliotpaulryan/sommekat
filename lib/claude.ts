import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";

export interface WinePairing {
  dish: string;
  description: string;
  wineType: string;
  altWineType: string | null;
  bottleSuggestion: string;
  producer: string | null;
  rationale: string;
  vivinoRating: number | null;
  robertParkerScore: number | null;
  retailPrice: string | null;
  restaurantPriceGlass: string | null;
  restaurantPriceBottle: string | null;
  outsidePriceRange: boolean;
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
    "producer": "The winery/producer name (e.g. 'Penfolds', 'Cloudy Bay', 'Château Margaux'). Only include if a specific bottle from a wine menu is recommended. Otherwise null.",
    "rationale": "1-2 sentences explaining why this wine style pairs well with this dish",
    "producer": null,
    "vivinoRating": null,
    "robertParkerScore": null,
    "retailPrice": null,
    "restaurantPriceGlass": null,
    "restaurantPriceBottle": null,
    "outsidePriceRange": false
  }
]

Additional rules:
- ALWAYS translate dish descriptions to English. If the menu is in a foreign language, the description must still be in English.
- NEVER include the dish price in the description field. The description should only contain what the dish is, its ingredients, and preparation method.
- Evaluate each dish INDEPENDENTLY using this structured approach:
  1. IDENTIFY THE PRIMARY PROTEIN OR MAIN INGREDIENT FIRST. This is the most important factor. Fish and seafood almost always pair better with white wines. Red meat pairs with red wines. Poultry and pork are flexible.
  2. THEN consider the preparation method (grilled, poached, fried, braised, etc.) and how it affects weight and flavour intensity.
  3. THEN refine based on the sauce, spices, and secondary ingredients. Spicy dishes need wines with lower tannins and often a touch of sweetness (e.g. Gewürztraminer, off-dry Riesling, Viognier). Creamy sauces pair with richer whites. Acidic/tomato-based sauces need wines with good acidity.
  4. MATCH the weight of the wine to the weight of the dish. Light dishes get light wines, heavy dishes get full-bodied wines.

  COMMON PAIRING PRINCIPLES — follow these closely:
  - Salmon → white or light rosé (Chardonnay, Pinot Grigio, dry Rosé, Viognier). Only pair salmon with a red if it is heavily spiced/blackened AND served with red wine sauce. Even spicy salmon (e.g. Moroccan, harissa) pairs better with an aromatic white (Gewürztraminer, Viognier, off-dry Riesling) than a red.
  - White fish (cod, sea bass, halibut) → crisp whites (Sauvignon Blanc, Chablis, Vermentino, Albariño)
  - Shellfish/crustaceans → Champagne, Muscadet, Chablis, Sauvignon Blanc
  - Lamb → Cabernet Sauvignon, Syrah/Shiraz, Tempranillo, Rioja
  - Beef steak → Cabernet Sauvignon, Malbec, Shiraz
  - Pork → Pinot Noir, Chenin Blanc, Riesling (depends on preparation)
  - Chicken → highly flexible, match to the sauce/preparation rather than the protein
  - Pasta → match to the sauce, not the pasta itself
  - Spicy food → off-dry Riesling, Gewürztraminer, Viognier, Torrontés (NOT tannic reds — tannins amplify heat)

- It is perfectly fine to recommend the same wine for multiple dishes if it is genuinely the best pairing for each.
- Do NOT try to vary your recommendations just for the sake of variety — accuracy matters more than diversity.
- Think carefully about each pairing. A bad recommendation is worse than a repetitive one. Quality over variety.
- altWineType: A mainstream, widely available wine alternative that would also pair well with the dish. Use well-known international grape varieties (e.g. Merlot, Sauvignon Blanc, Cabernet Sauvignon, Pinot Noir, Chardonnay, Shiraz, Pinot Grigio, Riesling). This helps when the primary recommendation is a regional/niche grape that may not be available. If the primary recommendation is already mainstream, set altWineType to a different mainstream option, or null if there is no good alternative.
- vivinoRating: The Vivino community rating for the recommended wine (a number from 1.0 to 5.0, e.g. 4.2). Vivino is the world's largest wine rating platform. Use your best knowledge to estimate the rating. Only include if a specific bottle is recommended (i.e. when a wine menu is provided). Otherwise set to null.
- robertParkerScore: The Robert Parker / Wine Advocate score for the recommended wine (integer out of 100, e.g. 92). Only include if you are confident the wine has been rated. Set to null otherwise.
- retailPrice: Only include if a specific bottle is recommended. Otherwise set to null.
- restaurantPriceGlass: The per-glass price listed on the restaurant's wine menu, if available. Include the currency symbol (e.g. "$12", "£8", "€10"). Set to null if no glass price is listed or no wine menu was provided.
- restaurantPriceBottle: The per-bottle price listed on the restaurant's wine menu, if available. Include the currency symbol (e.g. "$45", "£32", "€28"). Set to null if no bottle price is listed or no wine menu was provided.`;

const WINE_MENU_ADDENDUM = `

A wine menu has also been provided. You MUST ONLY recommend wines that appear on this wine list. Do NOT suggest any wine that is not on the list. For each dish, find the best matching wine FROM the wine menu. In the bottleSuggestion field, use the exact wine name and producer as listed on the wine menu. Include restaurantPriceGlass and restaurantPriceBottle from the wine menu if listed. Include the vivinoRating (1.0-5.0), robertParkerScore (out of 100), and retailPrice for the specific bottle if you know them.`;

function buildPriceRangePrompt(minPrice: number | undefined, maxPrice: number | undefined, currency: string): string {
  if (minPrice == null && maxPrice == null) return "";
  if (minPrice != null && maxPrice != null) {
    return `\n\nThe user has set a preferred BOTTLE price range of ${minPrice} to ${maxPrice} ${currency}. You MUST ONLY recommend wines whose BOTTLE price falls within this range. Filter the wine list by bottle price only (ignore glass prices for filtering). For each dish, pick the best pairing from wines with a bottle price within the range and set "outsidePriceRange" to false. ONLY if there are absolutely NO wines on the menu with a bottle price within this range for a dish, recommend the closest-priced wine and set "outsidePriceRange" to true.`;
  }
  if (minPrice != null) {
    return `\n\nThe user has set a minimum BOTTLE price of ${minPrice} ${currency} with no upper limit. You MUST ONLY recommend wines whose BOTTLE price is at or above ${minPrice} ${currency}. Filter by bottle price only (ignore glass prices for filtering). For each dish, pick the best pairing from wines with a bottle price at or above this value and set "outsidePriceRange" to false. ONLY if there are absolutely NO wines on the menu with a bottle price at or above this value for a dish, recommend the closest-priced wine and set "outsidePriceRange" to true.`;
  }
  return "";
}

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
  minPrice?: number;
  maxPrice?: number;
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
    prompt += buildPriceRangePrompt(wineMenu.minPrice, wineMenu.maxPrice, currency);
  } else if (wineMenu?.wineMenuUrl) {
    const wineBlock = await fetchUrlAsContentBlock(wineMenu.wineMenuUrl);
    contentBlocks.push(
      { type: "text", text: "The following is the restaurant's wine menu:" },
      wineBlock
    );
    prompt += WINE_MENU_ADDENDUM;
    prompt += buildPriceRangePrompt(wineMenu.minPrice, wineMenu.maxPrice, currency);
  }

  contentBlocks.push({ type: "text", text: prompt });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    thinking: {
      type: "enabled",
      budget_tokens: 8000,
    },
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

  return parseResponse(text);
}

export async function getWinePairingsFromUrl(
  url: string,
  wineUrl?: string,
  currency?: string,
  minPrice?: number,
  maxPrice?: number
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
    prompt += buildPriceRangePrompt(minPrice, maxPrice, currency || "USD");
  }

  contentBlocks.push({ type: "text", text: prompt });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16384,
    thinking: {
      type: "enabled",
      budget_tokens: 8000,
    },
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

  return parseResponse(text);
}
