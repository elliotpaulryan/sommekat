import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";

export interface WinePairing {
  dish: string;
  description: string;
  course: "starter" | "main" | "dessert";
  wineType: string;
  altWineType: string | null;
  bottleSuggestion: string;
  producer: string | null;
  rationale: string;
  vivinoRating: number | null;
  retailPrice: string | null;
  restaurantPriceGlass: string | null;
  restaurantPriceBottle: string | null;
  outsidePriceRange: boolean;
}

const client = new Anthropic();

function buildBasePrompt(courses: string[]): string {
  const includeStarters = courses.includes("starters");
  const includeMains = courses.includes("mains");
  const includeDesserts = courses.includes("desserts");

  const courseNames = [
    includeStarters && "STARTERS/APPETIZERS",
    includeMains && "MAIN COURSES",
    includeDesserts && "DESSERTS",
  ].filter(Boolean).join(", ");

  const courseInstructions: string[] = [];
  if (includeStarters) {
    courseInstructions.push(`STARTERS/APPETIZERS: Smaller dishes served before the main course. Labelled as "Starters", "Appetizers", "Entrées" (non-American), "Antipasti", "Hors d'oeuvres", "Primi" (Italian), "Entrées" (French), "Vorspeisen" (German), or similar. Includes soups and salads if they are listed as starters. Set "course" to "starter" for these.`);
  }
  if (includeMains) {
    courseInstructions.push(`MAIN COURSES: The primary, substantial dishes that form the centre of a meal — typically protein-based dishes with sides, or hearty standalone dishes. Labelled as "Mains", "Main Courses", "Entrées" (American English), "Plats" (French), "Secondi" (Italian), "Principales" (Spanish), "Hauptgerichte" (German), or they may not be labelled at all. Set "course" to "main" for these.`);
  }
  if (includeDesserts) {
    courseInstructions.push(`DESSERTS: Sweet dishes served at the end of the meal. Labelled as "Desserts", "Dolci" (Italian), "Postres" (Spanish), "Nachspeisen" (German), "Desserts/Puddings" (British), or similar. Includes cheese boards if listed in the dessert section. Set "course" to "dessert" for these. For desserts, consider dessert wines (Sauternes, Moscato d'Asti, Port, late-harvest Riesling, Tokaji) or sparkling wines as pairings.`);
  }

  const excludeList: string[] = [];
  if (!includeStarters) excludeList.push("Starters, appetizers, antipasti, mezze, tapas, soups, salads");
  if (!includeDesserts) excludeList.push("Desserts, cheese boards, petit fours");
  excludeList.push("Side dishes, vegetables listed as sides, chips/fries listed separately");
  excludeList.push("Drinks of any kind (wine, beer, cocktails, coffee, tea, juice, water)");
  excludeList.push("Children's menu items");
  excludeList.push("Breads, dips, nibbles, bar snacks");

  return `You are an expert sommelier. You will be given a FOOD MENU from a restaurant.

YOUR TASK: Extract ${courseNames} from the menu and recommend a wine for each dish.

WHAT TO INCLUDE:
${courseInstructions.map(i => `- ${i}`).join("\n")}

WHAT TO EXCLUDE — do NOT include any of the following:
${excludeList.map(i => `- ${i}`).join("\n")}

For each dish, recommend a wine to pair with it. Keep the recommendation BROAD — just the grape variety or wine style (e.g. "Pinot Noir", "Chardonnay", "Shiraz", "Riesling"). Do NOT recommend specific bottles or producers unless a wine menu has been provided.

CRITICAL RULES:
- NEVER put a wine, beer, cocktail, or any beverage in the "dish" field.
- If you are unsure whether something belongs in a selected course category, err on the side of EXCLUDING it.
- NEVER include prices (e.g. "€14", "$25", "12€", "28.00") in the "dish" or "description" fields. Strip all prices completely.

Return your response as a JSON object (no markdown, no code fences, raw JSON only):
{
  "restaurantName": string | null,
  "menuCurrency": "ISO code detected from menu prices (e.g. 'GBP', 'EUR', 'AUD') or null if not found",
  "pairings": [
  {
    "dish": "Dish title only — exactly as on menu, 1-5 words, original language. NEVER ingredients or prices.",
    "description": "1-2 sentences in English: what it is, key ingredients, preparation. No prices.",
    "course": "starter | main | dessert",
    "wineType": "Grape variety or wine style (e.g. Pinot Noir, Chardonnay)",
    "altWineType": "Mainstream alternative or null",
    "bottleSuggestion": "No wine menu: 2-4 word style descriptor (e.g. 'Dry White', 'Bold Full-Bodied Red') — no grape names. Wine menu provided: exact bottle name from list.",
    "producer": "Winery name if recommending a specific bottle, else null",
    "rationale": "1-2 concise sentences on why this wine pairs with the dish's main component. Lead with the pairing logic, not 'the dish needs/demands'. Be slightly technical (e.g. residual sugar tempering heat, tannins binding protein, high acid cutting fat). Vary language across pairings.",
    "vivinoRating": "number 1.0-5.0 if specific bottle recommended, -1 if unknown, else null",
    "retailPrice": "Typical retail price with currency symbol if specific bottle, 'Not found' if unknown, else null",
    "restaurantPriceGlass": "Per-glass price from wine menu with symbol, or null",
    "restaurantPriceBottle": "Per-bottle price from wine menu with symbol, or null",
    "outsidePriceRange": false
  }
  ]
}

Rules:
- Evaluate each dish INDEPENDENTLY using this structured approach:
  1. IDENTIFY THE PRIMARY PROTEIN OR MAIN INGREDIENT FIRST. This is the most important factor. Fish and seafood almost always pair better with white wines. Red meat pairs with red wines. Poultry and pork are flexible.
  2. THEN consider the preparation method (grilled, poached, fried, braised, etc.) and how it affects weight and flavour intensity.
  3. THEN refine based on the sauce, spices, and secondary ingredients. Spicy dishes need wines with lower tannins and often a touch of sweetness (e.g. Gewürztraminer, off-dry Riesling, Viognier). Creamy sauces pair with richer whites. Acidic/tomato-based sauces need wines with good acidity.
  4. MATCH the weight of the wine to the weight of the dish. Light dishes get light wines, heavy dishes get full-bodied wines.

  COMMON PAIRING PRINCIPLES — follow these closely:
  - Salmon → white or light rosé (Chardonnay, Pinot Grigio, dry Rosé, Viognier). Even spicy salmon pairs better with an aromatic white than a red.
  - White fish → crisp whites (Sauvignon Blanc, Chablis, Vermentino, Albariño)
  - Shellfish/crustaceans → Champagne, Muscadet, Chablis, Sauvignon Blanc
  - Lamb → Cabernet Sauvignon, Syrah/Shiraz, Tempranillo, Rioja
  - Beef steak → Cabernet Sauvignon, Malbec, Shiraz
  - Pork → Pinot Noir, Chenin Blanc, Riesling (depends on preparation)
  - Chicken → highly flexible, match to the sauce/preparation rather than the protein
  - Pasta → match to the sauce, not the pasta itself
  - Spicy food → off-dry Riesling, Gewürztraminer, Viognier, Torrontés (NOT tannic reds)
  - Chocolate desserts → Port, Brachetto d'Acqui, or a rich red like Zinfandel
  - Fruit desserts → Moscato d'Asti, late-harvest Riesling, Sauternes
  - Cream/custard desserts → Sauternes, Tokaji, Muscat de Beaumes-de-Venise

- Same wine may be recommended for multiple dishes if genuinely the best pairing — accuracy over variety.
- altWineType: different mainstream option; null if no good alternative.
- vivinoRating: MUST provide best estimate for any specific bottle; -1 if truly unknown; null only when no wine menu.
- retailPrice: MUST provide best estimate for any specific bottle; "Not found" if truly unknown; null only when no wine menu.`;
}

const WINE_MENU_ADDENDUM = `

A wine menu has also been provided. You MUST ONLY recommend wines that appear on this wine list. Do NOT suggest any wine that is not on the list. For each dish, find the best matching wine FROM the wine menu. In the bottleSuggestion field, use the exact wine name and producer as listed on the wine menu. Include restaurantPriceGlass and restaurantPriceBottle from the wine menu if listed. You MUST provide vivinoRating (your best estimate, 1.0-5.0) and retailPrice (typical retail price with currency symbol) for every specific bottle — never leave these null when recommending a named wine.`;

function buildPriceRangePrompt(minPrice: number | undefined, maxPrice: number | undefined, userCurrency: string): string {
  if (minPrice == null && maxPrice == null) return "";
  const conversionNote = `The user's price range is in ${userCurrency}. If the wine menu uses a DIFFERENT currency, you MUST convert the user's price range to the menu's currency using approximate exchange rates before filtering. Apply the filter using the converted values in the menu's currency.`;
  if (minPrice != null && maxPrice != null) {
    return `\n\nThe user has set a preferred BOTTLE price range of ${minPrice} to ${maxPrice} ${userCurrency}. ${conversionNote} Filter the wine list by bottle price only (ignore glass prices for filtering). For each dish, pick the best pairing from wines with a bottle price within the converted range and set "outsidePriceRange" to false. ONLY if there are absolutely NO wines on the menu with a bottle price within this range for a dish, recommend the closest-priced wine and set "outsidePriceRange" to true.`;
  }
  if (minPrice != null) {
    return `\n\nThe user has set a minimum BOTTLE price of ${minPrice} ${userCurrency} with no upper limit. ${conversionNote} Filter by bottle price only (ignore glass prices for filtering). For each dish, pick the best pairing from wines with a bottle price at or above the converted value and set "outsidePriceRange" to false. ONLY if there are absolutely NO wines on the menu with a bottle price at or above this value for a dish, recommend the closest-priced wine and set "outsidePriceRange" to true.`;
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

interface ParsedResponse {
  restaurantName: string | null;
  menuCurrency: string | null;
  pairings: WinePairing[];
}

function parseResponse(text: string): ParsedResponse {
  console.log("Claude response:", text.slice(0, 500));
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();

  // Try parsing as object first (new format)
  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1) {
    try {
      const parsed = JSON.parse(cleaned.slice(objStart, objEnd + 1));
      if (parsed.pairings && Array.isArray(parsed.pairings)) {
        return { restaurantName: parsed.restaurantName || null, menuCurrency: parsed.menuCurrency || null, pairings: parsed.pairings };
      }
    } catch {
      // Fall through to array parsing
    }
  }

  // Fallback: parse as array (backward compat)
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error(
      `No JSON found in response. Claude said: "${text.slice(0, 300)}"`
    );
  }
  return { restaurantName: null, menuCurrency: null, pairings: JSON.parse(cleaned.slice(start, end + 1)) };
}

interface WineMenuOptions {
  wineMenuFiles?: Array<{ base64: string; mimeType: string }>;
  wineMenuUrl?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  courses?: string[];
}

export async function getWinePairings(
  foodFiles: Array<{ base64: string; mimeType: string }>,
  wineMenu?: WineMenuOptions
): Promise<ParsedResponse> {
  const contentBlocks: ContentBlockParam[] = [];

  if (foodFiles.length > 1) {
    contentBlocks.push({ type: "text", text: `The food menu is provided across ${foodFiles.length} pages/images:` });
  }
  for (const f of foodFiles) {
    contentBlocks.push(makeContentBlock(f.base64, f.mimeType));
  }

  const currency = wineMenu?.currency || "USD";
  const courses = wineMenu?.courses || ["mains"];
  let prompt = buildBasePrompt(courses) + `\n- Detect the currency from the menu prices (look for currency symbols like $, £, €, or currency codes). Use the MENU's currency for all prices in your response, and set "menuCurrency" to the ISO currency code (e.g. "GBP", "EUR", "AUD"). If no currency can be detected from the menu, fall back to ${currency} and set "menuCurrency" to "${currency}".`;

  // Add wine menu if provided
  if (wineMenu?.wineMenuFiles && wineMenu.wineMenuFiles.length > 0) {
    if (wineMenu.wineMenuFiles.length > 1) {
      contentBlocks.push({ type: "text", text: `The wine menu is provided across ${wineMenu.wineMenuFiles.length} pages/images:` });
    } else {
      contentBlocks.push({ type: "text", text: "The following is the restaurant's wine menu:" });
    }
    for (const f of wineMenu.wineMenuFiles) {
      contentBlocks.push(makeContentBlock(f.base64, f.mimeType));
    }
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
    max_tokens: 6500,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error("MAX_DISHES_EXCEEDED");
  }

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseResponse(text);
}

export async function getWinePairingsFromUrl(
  url: string,
  wineUrl?: string,
  currency?: string,
  minPrice?: number,
  maxPrice?: number,
  courses?: string[]
): Promise<ParsedResponse> {
  const foodBlock = await fetchUrlAsContentBlock(url);

  const contentBlocks: ContentBlockParam[] = [foodBlock];
  const fallbackCurrency = currency || "USD";
  let prompt = buildBasePrompt(courses || ["mains"]) + `\n- Detect the currency from the menu prices (look for currency symbols like $, £, €, or currency codes). Use the MENU's currency for all prices in your response, and set "menuCurrency" to the ISO currency code (e.g. "GBP", "EUR", "AUD"). If no currency can be detected from the menu, fall back to ${fallbackCurrency} and set "menuCurrency" to "${fallbackCurrency}".`;

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
    max_tokens: 6500,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error("MAX_DISHES_EXCEEDED");
  }

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseResponse(text);
}
