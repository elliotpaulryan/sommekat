"use client";

import type { WinePairing } from "@/lib/claude";

interface MenuResultsProps {
  pairings: WinePairing[];
  onReset: () => void;
}

function getWineColor(wineType: string): string {
  const lower = wineType.toLowerCase();
  if (
    lower.includes("rosé") ||
    lower.includes("rose") ||
    lower.includes("blush")
  ) {
    return "bg-pink-100 border-pink-300 text-pink-900";
  }
  if (lower.includes("sparkling") || lower.includes("champagne") || lower.includes("prosecco") || lower.includes("cava")) {
    return "bg-amber-50 border-amber-200 text-amber-800";
  }
  // Red wines
  if (
    lower.includes("red") ||
    lower.includes("cabernet") ||
    lower.includes("merlot") ||
    lower.includes("pinot noir") ||
    lower.includes("syrah") ||
    lower.includes("shiraz") ||
    lower.includes("malbec") ||
    lower.includes("tempranillo") ||
    lower.includes("sangiovese") ||
    lower.includes("nebbiolo") ||
    lower.includes("zinfandel") ||
    lower.includes("grenache") ||
    lower.includes("mourvèdre") ||
    lower.includes("mourvedre") ||
    lower.includes("carmenere") ||
    lower.includes("pinotage") ||
    lower.includes("aglianico") ||
    lower.includes("barbera") ||
    lower.includes("xinomavro") ||
    lower.includes("agiorgitiko")
  ) {
    return "bg-red-900/30 border-red-900/50 text-red-950";
  }
  // White wines (default — golden)
  return "bg-amber-100 border-amber-400 text-amber-900";
}

export default function MenuResults({ pairings, onReset }: MenuResultsProps) {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-red-900">
            Your Wine Pairings
          </h2>
          <p className="text-red-900/80 mt-1 font-semibold">
            {pairings.length} dish{pairings.length !== 1 ? "es" : ""} found
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-400"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Try Another Menu
        </button>
      </div>

      <div className="space-y-2 rounded-xl bg-wine-dark/60 p-1.5 sm:p-2">
        {pairings.map((pairing, index) => (
          <div
            key={index}
            className="group rounded-lg border-2 border-[#722F37] bg-white shadow-sm transition-all hover:shadow-md hover:border-[#5a252c] overflow-hidden"
          >
            <div className="grid sm:grid-cols-2">
              {/* Left — Dish */}
              <div className="p-6 sm:border-r border-stone-100">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
                  Dish
                </p>
                <h3 className="text-xl font-bold text-stone-900">
                  {pairing.dish}
                </h3>
                <p className="mt-2 text-sm font-medium text-black leading-relaxed">
                  {pairing.description || "No description available"}
                </p>
              </div>

              {/* Right — Wine */}
              <div className="p-6 bg-burgundy-50/30">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
                  Paired Wine
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-stone-900">
                    {pairing.bottleSuggestion}
                  </h3>
                  {(pairing.restaurantPriceGlass || pairing.restaurantPriceBottle) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-wine text-white px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                      On Menu
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${getWineColor(
                      pairing.wineType
                    )}`}
                  >
                    {pairing.wineType}
                  </span>
                  {pairing.altWineType && (
                    <span
                      className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${getWineColor(
                        pairing.altWineType
                      )}`}
                    >
                      Alt: {pairing.altWineType}
                    </span>
                  )}
                </div>

                {/* Badges row — only show when a specific bottle is recommended (wine list uploaded) */}
                {(pairing.vivinoRating != null || pairing.restaurantPriceGlass || pairing.restaurantPriceBottle || pairing.retailPrice) && (
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr_1fr] sm:grid-cols-[1fr_auto_1fr_1fr] gap-2">
                    <a
                      href={`https://www.vivino.com/search/wines?q=${encodeURIComponent([pairing.producer, pairing.bottleSuggestion].filter(Boolean).join(" "))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-purple-50 border border-purple-200 p-2 text-center hover:bg-purple-100 transition-colors cursor-pointer no-underline"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Vivino</p>
                      <p className="text-base font-bold text-purple-900 mt-0.5">
                        {pairing.vivinoRating != null ? `${pairing.vivinoRating}/5` : "—"}
                      </p>
                    </a>
                    {/* Glass + Bottle linked pair */}
                    <div className="col-span-2 flex rounded-lg border border-blue-200 overflow-hidden">
                      <div className="flex-1 bg-sky-50 p-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Glass</p>
                        <p className="text-base font-bold text-sky-900 mt-0.5">
                          {pairing.restaurantPriceGlass || "—"}
                        </p>
                      </div>
                      <div className="w-px bg-blue-200" />
                      <div className="flex-1 bg-blue-50 p-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Bottle</p>
                        <p className="text-base font-bold text-blue-900 mt-0.5">
                          {pairing.restaurantPriceBottle || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Retail</p>
                      <p className="text-base font-bold text-green-900 mt-0.5">
                        {pairing.retailPrice || "—"}
                      </p>
                    </div>
                  </div>
                )}
                {pairing.outsidePriceRange && (
                  <p className="mt-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    Note: This wine is outside your selected price range, but it is the best pairing for this dish and the closest wine to your price point.
                  </p>
                )}
                <p className="mt-3 text-sm font-medium text-black leading-relaxed">
                  {pairing.rationale}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
