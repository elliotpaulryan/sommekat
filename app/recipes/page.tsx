"use client";

import { useState } from "react";
import type { RecipeResult } from "@/lib/claude-recipe";

function getWineColor(wineType: string): string {
  const lower = wineType.toLowerCase();
  if (lower.includes("rosé") || lower.includes("rose") || lower.includes("blush")) {
    return "bg-pink-100 border-pink-300 text-pink-900";
  }
  if (lower.includes("sparkling") || lower.includes("champagne") || lower.includes("prosecco") || lower.includes("cava") || lower.includes("crémant") || lower.includes("cremant") || lower.includes("franciacorta") || lower.includes("sekt")) {
    return "bg-amber-50 border-2 border-dashed border-amber-300 text-amber-800 shadow-[0_0_0_2px_rgba(251,191,36,0.15),0_0_0_4px_rgba(251,191,36,0.1)]";
  }
  if (
    lower.includes("red") || lower.includes("cabernet") || lower.includes("merlot") ||
    lower.includes("pinot noir") || lower.includes("syrah") || lower.includes("shiraz") ||
    lower.includes("malbec") || lower.includes("tempranillo") || lower.includes("sangiovese") ||
    lower.includes("nebbiolo") || lower.includes("zinfandel") || lower.includes("grenache") ||
    lower.includes("mourvèdre") || lower.includes("mourvedre") || lower.includes("carmenere") ||
    lower.includes("pinotage") || lower.includes("aglianico") || lower.includes("barbera") ||
    lower.includes("xinomavro") || lower.includes("agiorgitiko") || lower.includes("chianti") ||
    lower.includes("barolo") || lower.includes("barbaresco") || lower.includes("montepulciano") ||
    lower.includes("primitivo") || lower.includes("nero d'avola") || lower.includes("dolcetto") ||
    lower.includes("valpolicella") || lower.includes("amarone") || lower.includes("rioja") ||
    lower.includes("garnacha") || lower.includes("monastrell") || lower.includes("touriga") ||
    lower.includes("tannat") || lower.includes("corvina") || lower.includes("bonarda") ||
    lower.includes("carignan") || lower.includes("cinsault") || lower.includes("gamay") ||
    lower.includes("beaujolais") || lower.includes("bordeaux") || lower.includes("burgundy") ||
    lower.includes("côtes du rhône") || lower.includes("cotes du rhone") ||
    lower.includes("châteauneuf") || lower.includes("chateauneuf") ||
    lower.includes("saint-émilion") || lower.includes("saint-julien") ||
    lower.includes("pauillac") || lower.includes("margaux") || lower.includes("pomerol") ||
    lower.includes("brunello") || lower.includes("lambrusco") || lower.includes("zweigelt") ||
    lower.includes("blaufränkisch")
  ) {
    return "bg-red-900/30 border-red-900/50 text-red-950";
  }
  return "bg-amber-100 border-amber-400 text-amber-900";
}

type PageState = "idle" | "loading" | "results" | "error";

export default function RecipesPage() {
  const [state, setState] = useState<PageState>("idle");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [result, setResult] = useState<RecipeResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!recipeUrl.trim()) return;
    setState("loading");
    setError("");

    try {
      const response = await fetch("/api/pair-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipeUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyse recipe");
      setResult(data);
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="relative pt-8 sm:pt-6">
        {/* Mobile header */}
        <div className="flex sm:hidden mx-auto max-w-5xl px-6 py-4 items-center gap-4">
          <a href="/">
            <img src="/logo.png" alt="SommeKat logo" className="w-16 h-16 object-contain drop-shadow-xl rounded-full border-2 border-red-900" />
          </a>
          <div>
            <a href="/" className="no-underline">
              <h1 className="text-[2.75rem] font-bold text-red-900 cursor-pointer" style={{ fontFamily: "var(--font-baloo)", textShadow: "0 2px 10px rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
                SommeKat
              </h1>
            </a>
            <p className="mt-1 text-sm text-red-900/80 tracking-widest uppercase font-bold">
              AI-powered wine pairing
            </p>
          </div>
        </div>
        {/* Desktop header */}
        <div className="hidden sm:flex mx-auto max-w-5xl px-6 py-4 items-end gap-5">
          <a href="/">
            <img src="/logo.png" alt="SommeKat logo" className="w-40 h-40 object-contain drop-shadow-2xl rounded-full cursor-pointer border-4 border-red-900" />
          </a>
          <div className="pb-2">
            <a href="/" className="no-underline">
              <h1 className="text-[5rem] font-bold text-red-900 cursor-pointer" style={{ fontFamily: "var(--font-baloo)", textShadow: "0 2px 10px rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}>
                SommeKat
              </h1>
            </a>
            <p className="mt-1 text-base text-red-900/80 tracking-widest uppercase font-bold">
              AI-powered wine pairing
            </p>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="mx-auto max-w-5xl px-6 pt-4">
        <div className="flex gap-1 rounded-xl bg-wine-dark/60 p-1 max-w-xs mx-auto">
          <a href="/" className={[
            "flex-1 text-center rounded-lg px-4 py-2 text-sm font-bold transition-all no-underline",
            "text-burgundy-200 hover:text-white hover:bg-white/10",
          ].join(" ")}>
            Restaurant
          </a>
          <span className={[
            "flex-1 text-center rounded-lg px-4 py-2 text-sm font-bold transition-all",
            "bg-white text-wine shadow-sm",
          ].join(" ")}>
            Recipes
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pt-8 pb-10">

        {/* Page title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-red-900 mb-2">Recipe Wine Pairing</h2>
          <p className="text-red-900/80 font-bold text-base max-w-lg mx-auto">
            Cooking at home? Paste a link to any online recipe and SommeKat will recommend the perfect wines to serve alongside your dish.
          </p>
        </div>

        {/* Input — idle/error */}
        {(state === "idle" || state === "error") && (
          <div className="rounded-3xl bg-wine-dark p-6">
            <p className="text-xl font-medium text-burgundy-200 mb-3 text-center">Recipe URL</p>
            <input
              type="url"
              value={recipeUrl}
              onChange={(e) => setRecipeUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="https://www.example.com/my-favourite-recipe"
              className={[
                "w-full rounded-xl border px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-wine/50 focus:border-wine transition-all",
                recipeUrl.trim()
                  ? "border-green-500 bg-green-50/80 shadow-[0_0_0_2px_rgba(34,197,94,0.15)]"
                  : "border-burgundy-300/40 bg-cream",
              ].join(" ")}
            />

            {error && (
              <p className="mt-3 text-sm text-red-200 font-medium text-center">{error}</p>
            )}

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!recipeUrl.trim()}
                className={[
                  "px-8 py-3 rounded-xl text-base font-extrabold tracking-wide transition-all duration-150 select-none",
                  recipeUrl.trim()
                    ? "text-white cursor-pointer active:translate-y-[2px] active:shadow-none"
                    : "text-white/50 cursor-not-allowed",
                ].join(" ")}
                style={recipeUrl.trim() ? {
                  background: "linear-gradient(180deg, #9b4d57 0%, #722F37 100%)",
                  border: "1px solid #5a1f26",
                  boxShadow: "0 2px 0 #4a1520, 0 4px 8px rgba(0,0,0,0.25)",
                } : {
                  background: "linear-gradient(180deg, #6b3039 0%, #4a1e24 100%)",
                  border: "1px solid #3a1218",
                  boxShadow: "none",
                }}
              >
                Get Wine Pairings
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {state === "loading" && (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-wine-dark/80 px-8 py-5 shadow-xl">
              <svg className="animate-spin h-6 w-6 text-burgundy-200" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-burgundy-200 font-bold text-lg">Analysing your recipe…</span>
            </div>
          </div>
        )}

        {/* Results */}
        {state === "results" && result && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-red-900">
                  Wine Pairings for <span className="font-black">{result.recipeName}</span>
                </h2>
                {result.description && (
                  <p className="mt-1 text-red-900/80 font-bold text-sm">{result.description}</p>
                )}
              </div>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-400 cursor-pointer flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Try another recipe
              </button>
            </div>

            {/* Pairing cards */}
            {result.pairings.map((pairing, i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-[#722F37] bg-white/90 shadow-md p-5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${getWineColor(pairing.wineType)}`}>
                    {pairing.wineType}
                  </span>
                  {pairing.altWineType && (
                    <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${getWineColor(pairing.altWineType)}`}>
                      Alt: {pairing.altWineType}
                    </span>
                  )}
                  <span className="inline-block rounded-full border border-stone-200 bg-stone-50 px-3 py-0.5 text-xs font-semibold text-stone-600">
                    {pairing.suggestion}
                  </span>
                </div>
                {(pairing.winery || pairing.blend) && (
                  <div className="mb-3">
                    <p className="text-base font-bold text-stone-900">
                      {pairing.winery}{pairing.blend ? ` — ${pairing.blend}` : ""}
                    </p>
                  </div>
                )}
                <p className="text-sm text-stone-700 leading-relaxed">{pairing.rationale}</p>
                <a
                  href={`https://www.vivino.com/search/wines?q=${encodeURIComponent([pairing.winery, pairing.blend].filter(Boolean).join(" ") || pairing.wineType)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-purple-700 hover:text-purple-900 transition-colors no-underline"
                >
                  <span>Search on Vivino</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}
