import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface RecipePairing {
  wineType: string;
  suggestion: string;
  winery: string | null;
  blend: string | null;
  rationale: string;
}

export interface RecipeResult {
  recipeName: string;
  description: string;
  pairings: RecipePairing[];
}

const RECIPE_SYSTEM_PROMPT = `You are SommeKat, an expert sommelier with a warm, knowledgeable personality. You help home cooks find the perfect wine to accompany their cooking. You speak like an enthusiastic wine professional — informed and slightly technical, but never stuffy. You focus on what makes a pairing work, not just what to buy.`;

async function fetchRecipePage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SommeKat/1.0)" },
  });
  if (!response.ok) {
    throw new Error(`Could not fetch the recipe page (status ${response.status}). Please check the URL and try again.`);
  }

  const html = await response.text();
  const text = html
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
    .slice(0, 25000);

  if (!text || text.length < 100) {
    throw new Error("Could not extract content from that page. Try a different recipe URL.");
  }

  return text;
}

export async function getRecipePairings(url: string, userCountry?: string): Promise<RecipeResult> {
  const recipeText = await fetchRecipePage(url);

  const userPrompt = `Here is the content of a recipe page:

${recipeText}

Based on the recipe's main ingredients, cooking method, and flavour profile, recommend 2-3 wines that would pair well with this dish when served at home.

Return a JSON object (no markdown, no code fences, raw JSON only) with this structure:
{
  "recipeName": "The name of the recipe",
  "description": "1-2 sentences describing the finished dish — its main flavours, textures, and cooking style",
  "pairings": [
    {
      "wineType": "Grape variety or wine style (e.g. Pinot Noir, Chardonnay)",
      "suggestion": "2-4 word style descriptor (e.g. 'Crisp Dry White', 'Medium-Bodied Red') — no grape names here",
      "winery": "A specific winery that makes an excellent example of this style — choose a producer that is well-regarded and widely stocked ${userCountry ? `in ${userCountry}` : "internationally"}. No vintage year.",
      "blend": "The specific wine name or cuvée from that producer (e.g. 'Reserve Chardonnay', 'Estate Pinot Noir'). No vintage year.",
      "rationale": "1-2 concise sentences on why this wine works with this dish. Focus on the main ingredients and cooking method. Be slightly technical — mention specific wine characteristics (e.g. acidity, tannin structure, residual sugar) and how they interact with the dish. Write for a curious home cook who wants to learn something. Vary language across recommendations."
    }
  ]
}

Rules:
- Focus pairing logic on the PRIMARY protein or main ingredient first, then the cooking method and dominant flavours
- IMPORTANT: Base wine selection purely on flavour compatibility — DO NOT choose wines based on the geographic origin of the dish. An Italian recipe does not mean Italian wine; a French recipe does not mean French wine. Ignore where the dish comes from entirely.
- The user is${userCountry ? ` in ${userCountry}` : " an international user"}. Recommend grape varieties and wine styles that are widely available there, and choose a winery whose bottles can realistically be found in a mainstream supermarket or wine retailer${userCountry ? ` in ${userCountry}` : ""}.
- Always provide exactly 3 pairings, ranked from best to third-best match
- Keep suggestions accessible — avoid extremely obscure varieties
- For winery and blend: choose real, well-known producers stocked${userCountry ? ` in ${userCountry}` : " in the user's market"}. Do NOT include vintage year in either field.
- If the page doesn't appear to contain a recipe, set recipeName to null`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    temperature: 0,
    system: [{ type: "text", text: RECIPE_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userPrompt }],
  });

  if (message.stop_reason === "max_tokens") {
    throw new Error("Recipe response was too long. Please try a simpler recipe URL.");
  }

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
  const objStart = cleaned.indexOf("{");
  const objEnd = cleaned.lastIndexOf("}");

  if (objStart === -1 || objEnd === -1) {
    throw new Error("Could not parse wine pairing response. Please try again.");
  }

  const parsed = JSON.parse(cleaned.slice(objStart, objEnd + 1));

  if (!parsed.recipeName) {
    throw new Error("That URL doesn't appear to contain a recipe. Please try a direct link to a recipe page.");
  }

  return {
    recipeName: parsed.recipeName,
    description: parsed.description ?? "",
    pairings: (parsed.pairings ?? []).map((p: any) => ({
      wineType: p.wineType ?? "",
      suggestion: p.suggestion ?? "",
      winery: p.winery ?? null,
      blend: p.blend ?? null,
      rationale: p.rationale ?? "",
    })),
  };
}
