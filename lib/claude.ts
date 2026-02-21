import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";

export interface WinePairing {
  dish: string;
  description: string;
  course: "starter" | "main" | "dessert";
  menuSection: string | null;
  wineType: string;
  altWineType: string | null;
  bottleSuggestion: string;
  region: string | null;
  producer: string | null;
  rationale: string;
  vivinoRating: number | null;
  retailPrice: string | null;
  restaurantPriceGlass: string | null;
  restaurantPriceBottle: string | null;
  outsidePriceRange: boolean;
}

const client = new Anthropic();

function buildBasePrompt(courses: string[], estimatePrices = false): string {
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

For each dish, recommend a wine to pair with it. ${estimatePrices ? "Recommend a SPECIFIC well-known bottle and producer (e.g. 'Cloudy Bay Sauvignon Blanc' by Cloudy Bay) so that Vivino ratings and retail prices can be estimated." : "Keep the recommendation BROAD — just the grape variety or wine style (e.g. \"Pinot Noir\", \"Chardonnay\", \"Shiraz\", \"Riesling\"). Do NOT recommend specific bottles or producers unless a wine menu has been provided."}

CRITICAL RULES:
- NEVER put a wine, beer, cocktail, or any beverage in the "dish" field.
- If you are unsure whether something belongs in a selected course category, err on the side of EXCLUDING it.
- NEVER include prices (e.g. "€14", "$25", "12€", "28.00") in the "dish" or "description" fields. Strip all prices completely.

Return your response as a JSON object (no markdown, no code fences, raw JSON only). OMIT any field whose value would be null — do not include null fields at all.
{
  "restaurantName": string (omit if not found),
  "menuCurrency": "ISO code detected from menu prices (e.g. 'GBP', 'EUR', 'AUD') — omit if not found",
  "pairings": [
  {
    "dish": "Dish title only — exactly as on menu, 1-5 words, original language. NEVER ingredients or prices.",
    "desc": "1-2 sentences in English: what it is, key ingredients, preparation. No prices.",
    "course": "starter | main | dessert",
    "menuSection": "Only include when the restaurant website has multiple distinct menus/meal periods (e.g. 'Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Tasting Menu', 'All Day', 'Bar Menu'). Use the exact menu name as it appears on the site. Omit if there is only one menu or if unclear.",
    "wine": "Grape variety or wine style (e.g. Pinot Noir, Chardonnay)",
    "altWine": "Mainstream alternative — omit if none",
    "suggestion": "No wine menu: 2-4 word style descriptor (e.g. 'Dry White', 'Bold Full-Bodied Red') — no grape names. Wine menu provided: wine name WITHOUT region (e.g. 'Cloudy Bay Sauvignon Blanc', not 'Cloudy Bay Marlborough Sauvignon Blanc').",
    "region": "Wine region from the wine menu (e.g. 'Marlborough', 'Napa Valley', 'Barossa Valley') — omit if not listed on the wine menu",
    "producer": "Winery name if recommending a specific bottle — omit if not applicable",
    "rationale": "1-2 concise sentences on why this wine pairs with the dish's main component. Lead with the pairing logic, not 'the dish needs/demands'. Be slightly technical (e.g. residual sugar tempering heat, tannins binding protein, high acid cutting fat). Vary language across pairings.",
    "vivino": ${estimatePrices ? `"Estimated Vivino community rating 1.0-5.0 for the specific bottle you are recommending — MUST include, use your best knowledge"` : `"number 1.0-5.0 if specific bottle recommended, -1 if unknown — omit if no wine menu"`},
    "retail": ${estimatePrices ? `"Estimated retail price with currency symbol for the specific bottle in the user's local market — MUST include, use your best knowledge"` : `"Retail price with currency symbol if specific bottle, 'Not found' if unknown — omit if no wine menu"`},
    "glassPrice": "Per-glass price from wine menu with symbol — omit if not listed",
    "bottlePrice": "Per-bottle price from wine menu with symbol — omit if not listed",
    "outOfRange": true (only include this field when true — omit when false)
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
- altWine: different mainstream option; omit if none.
- vivino: ${estimatePrices ? "MUST provide estimated Vivino rating for the specific bottle you recommended." : "MUST provide best estimate for any specific bottle; -1 if truly unknown; omit only when no wine menu."}
- retail: ${estimatePrices ? "MUST provide estimated retail price for the specific bottle you recommended." : "MUST provide best estimate for any specific bottle; \"Not found\" if truly unknown; omit only when no wine menu."}`;
}

const WINE_MENU_ADDENDUM = `

A wine menu has also been provided. You MUST ONLY recommend wines that appear on this wine list. Do NOT suggest any wine that is not on the list. For each dish, find the best matching wine FROM the wine menu. In the "suggestion" field, use the exact wine name and producer as listed on the wine menu. Include "glassPrice" and "bottlePrice" from the wine menu if listed. You MUST provide "vivino" (your best estimate, 1.0-5.0) and "retail" (typical retail price with currency symbol) for every specific bottle.`;

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

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  "Cache-Control": "no-cache",
};

function htmlToText(html: string): string {
  return html
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
    .trim();
}

function findMenuLinks(html: string, baseUrl: string): string[] {
  const linkPattern = /href=["']([^"']+)["']/gi;
  const menuKeywords = /\b(menu|menus|food|dining|eat|carte|dishes|lunch|dinner|breakfast|brunch|supper|snacks|small.plates|tasting|set.menu|prix.fixe|all.day|evening|afternoon|sunday|starters|mains|desserts|a-la-carte)\b/i;
  const skipExt = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|ttf|mp4|webp)(\?.*)?$/i;
  const seen = new Set<string>();
  const candidates: string[] = [];
  const base = new URL(baseUrl);

  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#") || skipExt.test(href)) continue;
    if (!menuKeywords.test(href)) continue;
    try {
      const resolved = new URL(href, baseUrl).href;
      const candidate = new URL(resolved);
      if (candidate.hostname !== base.hostname) continue;
      if (candidate.pathname === base.pathname) continue;
      if (!seen.has(resolved)) {
        seen.add(resolved);
        candidates.push(resolved);
      }
    } catch { /* skip malformed */ }
  }

  return candidates.slice(0, 8);
}

async function fetchHtmlRaw(url: string): Promise<{ html: string; text: string } | null> {
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return null;
    const html = await res.text();
    return { html, text: htmlToText(html) };
  } catch {
    return null;
  }
}

async function fetchUrlAsContentBlock(url: string): Promise<ContentBlockParam> {
  const response = await fetch(url, { headers: BROWSER_HEADERS });
  if (!response.ok) {
    throw new Error(`Failed to fetch from URL (status ${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());

  if (contentType.includes("application/pdf")) {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: buffer.toString("base64") },
    };
  } else if (contentType.includes("image/")) {
    const mediaType = contentType.split(";")[0].trim() as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    return {
      type: "image",
      source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") },
    };
  }

  // HTML: two-level menu subpage discovery
  const html = buffer.toString("utf-8");
  const homeText = htmlToText(html);

  const seen = new Set<string>([url]);

  // Level 1: menu links from homepage
  const level1Links = findMenuLinks(html, url);
  level1Links.forEach(l => seen.add(l));

  // Fetch level 1 pages in parallel
  const level1Results = await Promise.all(level1Links.map(l => fetchHtmlRaw(l)));

  // Level 2: discover further menu links from each level-1 page
  const level2Links: string[] = [];
  for (const result of level1Results) {
    if (!result) continue;
    for (const link of findMenuLinks(result.html, url)) {
      if (!seen.has(link)) { seen.add(link); level2Links.push(link); }
    }
  }

  // Fetch level 2 pages (cap total subpages at 10)
  const toFetch2 = level2Links.slice(0, Math.max(0, 10 - level1Links.length));
  const level2Results = await Promise.all(toFetch2.map(l => fetchHtmlRaw(l)));

  // Build combined content with URL labels so Claude knows which page is which
  const sections: string[] = [`Homepage (${url}):\n${homeText}`];
  level1Links.forEach((link, i) => {
    const r = level1Results[i];
    if (r && r.text.length > 100) sections.push(`Menu page (${link}):\n${r.text}`);
  });
  toFetch2.forEach((link, i) => {
    const r = level2Results[i];
    if (r && r.text.length > 100) sections.push(`Menu page (${link}):\n${r.text}`);
  });

  const combined = sections.join("\n\n---\n\n").slice(0, 80000);

  return {
    type: "text",
    text: `Restaurant website content:\n\n${combined}`,
  };
}

interface ParsedResponse {
  restaurantName: string | null;
  menuCurrency: string | null;
  pairings: WinePairing[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalisePairing(p: any): WinePairing {
  return {
    dish: p.dish ?? "",
    description: p.desc ?? p.description ?? "",
    course: p.course ?? "main",
    menuSection: p.menuSection ?? null,
    wineType: p.wine ?? p.wineType ?? "",
    altWineType: p.altWine ?? p.altWineType ?? null,
    bottleSuggestion: p.suggestion ?? p.bottleSuggestion ?? "",
    region: p.region ?? null,
    producer: p.producer ?? null,
    rationale: p.rationale ?? "",
    vivinoRating: p.vivino ?? p.vivinoRating ?? null,
    retailPrice: p.retail ?? p.retailPrice ?? null,
    restaurantPriceGlass: p.glassPrice ?? p.restaurantPriceGlass ?? null,
    restaurantPriceBottle: p.bottlePrice ?? p.restaurantPriceBottle ?? null,
    outsidePriceRange: p.outOfRange ?? p.outsidePriceRange ?? false,
  };
}

function extractBalancedJSON(str: string, open: string, close: string): string {
  let depth = 0;
  let start = -1;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === open) { if (start === -1) start = i; depth++; }
    else if (str[i] === close) { depth--; if (depth === 0 && start !== -1) return str.slice(start, i + 1); }
  }
  return "";
}

function parseResponse(text: string): ParsedResponse {
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();

  // Try parsing as object first (new format)
  const objStr = extractBalancedJSON(cleaned, "{", "}");
  if (objStr) {
    try {
      const parsed = JSON.parse(objStr);
      if (parsed.pairings && Array.isArray(parsed.pairings)) {
        return {
          restaurantName: parsed.restaurantName || null,
          menuCurrency: parsed.menuCurrency || null,
          pairings: parsed.pairings.map(normalisePairing),
        };
      }
    } catch {
      // Fall through to array parsing
    }
  }

  // Fallback: parse as array (backward compat)
  const arrStr = extractBalancedJSON(cleaned, "[", "]");
  if (!arrStr) {
    throw new Error(`No JSON found in response. Claude said: "${text.slice(0, 300)}"`);
  }
  return { restaurantName: null, menuCurrency: null, pairings: JSON.parse(arrStr).map(normalisePairing) };
}

const ESTIMATE_PRICES_ADDENDUM = `
No wine list has been provided. However, please estimate the following fields from your knowledge for each pairing — OVERRIDE the 'omit if no wine menu' rule for these two fields only:
- "vivino": Your best estimate of a typical Vivino community rating (1.0–5.0) for the wine style you are recommending. Use your training knowledge of typical ratings for this grape/style.
- "retail": Estimated retail price with currency symbol for a good-quality, widely available bottle of this wine style in the user's local market.`;

function buildBudgetPrompt(minPrice: number | undefined, maxPrice: number | undefined, currency: string): string {
  if (minPrice == null && maxPrice == null) return "";
  if (minPrice != null && maxPrice != null) {
    return `\n\nThe user's preferred bottle budget is ${minPrice}–${maxPrice} ${currency}. Recommend wines that fit comfortably within this price range at retail. Only go outside this range if no suitable pairing exists within budget, in which case set "outOfRange" to true.`;
  }
  if (minPrice != null) {
    return `\n\nThe user's minimum bottle budget is ${minPrice} ${currency} with no upper limit.`;
  }
  return "";
}

interface WineMenuOptions {
  wineMenuFiles?: Array<{ base64: string; mimeType: string }>;
  wineMenuUrl?: string;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  courses?: string[];
  estimatePrices?: boolean;
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
  const systemPrompt = buildBasePrompt(courses, !!wineMenu?.estimatePrices);

  // Variable instructions appended to user message
  let userInstructions = `- Detect the currency from the menu prices (look for currency symbols like $, £, €, or currency codes). Use the MENU's currency for all prices in your response, and set "menuCurrency" to the ISO currency code (e.g. "GBP", "EUR", "AUD"). If no currency can be detected from the menu, fall back to ${currency} and set "menuCurrency" to "${currency}".`;

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
    userInstructions += WINE_MENU_ADDENDUM;
    userInstructions += buildPriceRangePrompt(wineMenu.minPrice, wineMenu.maxPrice, currency);
  } else if (wineMenu?.wineMenuUrl) {
    const wineBlock = await fetchUrlAsContentBlock(wineMenu.wineMenuUrl);
    contentBlocks.push(
      { type: "text", text: "The following is the restaurant's wine menu:" },
      wineBlock
    );
    userInstructions += WINE_MENU_ADDENDUM;
    userInstructions += buildPriceRangePrompt(wineMenu.minPrice, wineMenu.maxPrice, currency);
  } else if (wineMenu?.estimatePrices) {
    userInstructions += ESTIMATE_PRICES_ADDENDUM;
    userInstructions += buildBudgetPrompt(wineMenu.minPrice, wineMenu.maxPrice, currency);
  }

  contentBlocks.push({ type: "text", text: userInstructions });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 6500,
    temperature: 0,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
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
  courses?: string[],
  estimatePrices?: boolean
): Promise<ParsedResponse> {
  const foodBlock = await fetchUrlAsContentBlock(url);

  const contentBlocks: ContentBlockParam[] = [foodBlock];
  const fallbackCurrency = currency || "USD";
  const systemPrompt = buildBasePrompt(courses || ["mains"], !!estimatePrices);
  let userInstructions = `- Detect the currency from the menu prices (look for currency symbols like $, £, €, or currency codes). Use the MENU's currency for all prices in your response, and set "menuCurrency" to the ISO currency code (e.g. "GBP", "EUR", "AUD"). If no currency can be detected from the menu, fall back to ${fallbackCurrency} and set "menuCurrency" to "${fallbackCurrency}".`;

  if (wineUrl) {
    const wineBlock = await fetchUrlAsContentBlock(wineUrl);
    contentBlocks.push(
      { type: "text", text: "The following is the restaurant's wine menu:" },
      wineBlock
    );
    userInstructions += WINE_MENU_ADDENDUM;
    userInstructions += buildPriceRangePrompt(minPrice, maxPrice, currency || "USD");
  } else if (estimatePrices) {
    userInstructions += ESTIMATE_PRICES_ADDENDUM;
    userInstructions += buildBudgetPrompt(minPrice, maxPrice, currency || "USD");
  }

  contentBlocks.push({ type: "text", text: userInstructions });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 6500,
    temperature: 0,
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
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
