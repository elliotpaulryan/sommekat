"use client";

import { useState, useEffect } from "react";
import MenuUpload from "@/components/MenuUpload";
import MenuResults from "@/components/MenuResults";
import LoadingState from "@/components/LoadingState";
import RestaurantSearch from "@/components/RestaurantSearch";
import type { WinePairing } from "@/lib/claude";
import type { RecipeResult } from "@/lib/claude-recipe";

type AppState = "idle" | "uploading" | "results" | "error";
type RecipeState = "idle" | "loading" | "results" | "error";

const LOCALE_CURRENCY: Record<string, string> = {
  "en-US": "USD", "en-AU": "AUD", "en-GB": "GBP", "en-CA": "CAD", "en-NZ": "NZD",
  "de-DE": "EUR", "fr-FR": "EUR", "es-ES": "EUR", "it-IT": "EUR", "nl-NL": "EUR",
  "ja-JP": "JPY", "zh-CN": "CNY", "ko-KR": "KRW", "pt-BR": "BRL", "en-IN": "INR",
  "en-SG": "SGD", "en-HK": "HKD", "en-ZA": "ZAR", "sv-SE": "SEK", "da-DK": "DKK",
  "nb-NO": "NOK", "fi-FI": "EUR", "pl-PL": "PLN", "cs-CZ": "CZK", "hu-HU": "HUF",
  "ro-RO": "RON", "th-TH": "THB", "vi-VN": "VND", "id-ID": "IDR", "ms-MY": "MYR",
  "fil-PH": "PHP", "ar-AE": "AED", "ar-SA": "SAR", "he-IL": "ILS", "tr-TR": "TRY",
  "ru-RU": "RUB", "uk-UA": "UAH", "el-GR": "EUR", "pt-PT": "EUR", "zh-TW": "TWD",
};

const SLIDER_MAX = 200;

function getCurrencyInfo(): { code: string; symbol: string } {
  try {
    const lang = navigator.language;
    const code = LOCALE_CURRENCY[lang] || "USD";
    const symbol = new Intl.NumberFormat(lang, { style: "currency", currency: code })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value || code;
    return { code, symbol };
  } catch {
    return { code: "USD", symbol: "$" };
  }
}

function getUserCountry(): string {
  try {
    const region = navigator.language.split("-")[1];
    if (!region) return "";
    return new Intl.DisplayNames(["en"], { type: "region" }).of(region) || "";
  } catch {
    return "";
  }
}

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

function getWineCircleColor(wineType: string): string {
  const lower = wineType.toLowerCase();
  if (lower.includes("rosé") || lower.includes("rose") || lower.includes("blush")) {
    return "bg-pink-400 text-white";
  }
  if (lower.includes("sparkling") || lower.includes("champagne") || lower.includes("prosecco") || lower.includes("cava") || lower.includes("crémant") || lower.includes("cremant") || lower.includes("franciacorta") || lower.includes("sekt")) {
    return "bg-amber-300 text-amber-900";
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
    return "bg-red-900 text-white";
  }
  return "bg-amber-400 text-amber-950";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"restaurant" | "recipes">("restaurant");

  // — Restaurant state —
  const [state, setState] = useState<AppState>("idle");
  const [pairings, setPairings] = useState<WinePairing[]>([]);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const [foodFiles, setFoodFiles] = useState<File[]>([]);
  const [foodUrl, setFoodUrl] = useState("");
  const [wineFiles, setWineFiles] = useState<File[]>([]);
  const [wineUrl, setWineUrl] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(SLIDER_MAX);
  const [courses, setCourses] = useState<string[]>(["mains"]);

  // Restaurant search state
  const [searchedRestaurant, setSearchedRestaurant] = useState<{ name: string; website: string | null } | null>(null);
  const [menuUploadKey, setMenuUploadKey] = useState(0);

  const [userCurrency, setUserCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const maxIsUnlimited = maxPrice >= SLIDER_MAX;

  useEffect(() => {
    const info = getCurrencyInfo();
    setUserCurrency(info.code);
    setCurrencySymbol(info.symbol);
  }, []);

  const hasFoodMenu = foodFiles.length > 0 || !!foodUrl.trim();
  const hasWineMenu = wineFiles.length > 0 || !!wineUrl.trim();
  const showPriceSlider = hasWineMenu || !!searchedRestaurant;
  const estimatePrices = !!searchedRestaurant && !hasWineMenu;

  const handleSubmit = async () => {
    setState("uploading");
    setError("");

    try {
      let response: Response;

      if (foodFiles.length > 0) {
        const formData = new FormData();
        foodFiles.forEach((f) => formData.append("files", f));
        formData.append("currency", userCurrency);
        formData.append("courses", JSON.stringify(courses));
        wineFiles.forEach((f) => formData.append("wineFiles", f));
        if (wineFiles.length === 0 && wineUrl.trim()) formData.append("wineUrl", wineUrl.trim());
        if (hasWineMenu) {
          formData.append("minPrice", String(minPrice));
          if (!maxIsUnlimited) formData.append("maxPrice", String(maxPrice));
        } else if (estimatePrices) {
          formData.append("estimatePrices", "true");
          formData.append("minPrice", String(minPrice));
          if (!maxIsUnlimited) formData.append("maxPrice", String(maxPrice));
        }

        response = await fetch("/api/pair", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/pair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: foodUrl.trim(),
            wineUrl: wineUrl.trim() || undefined,
            currency: userCurrency,
            courses,
            ...(hasWineMenu ? { minPrice, ...(maxIsUnlimited ? {} : { maxPrice }) } : {}),
            ...(estimatePrices ? { estimatePrices: true, minPrice, ...(maxIsUnlimited ? {} : { maxPrice }) } : {}),
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze menu");
      }

      setPairings(data.pairings);
      setRestaurantName(data.restaurantName || null);
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setPairings([]);
    setRestaurantName(null);
    setError("");
    setSearchedRestaurant(null);
    setFoodUrl("");
    setMenuUploadKey((k) => k + 1);
  };

  const handleRestaurantSelect = (name: string, website: string | null) => {
    setSearchedRestaurant({ name, website });
    setFoodUrl(website || "");
    setMenuUploadKey((k) => k + 1);
  };

  const handleRestaurantClear = () => {
    setSearchedRestaurant(null);
    setFoodUrl("");
    setMenuUploadKey((k) => k + 1);
  };

  // — Recipe state —
  const [recipeState, setRecipeState] = useState<RecipeState>("idle");
  const [recipeFiles, setRecipeFiles] = useState<File[]>([]);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipeUploadKey, setRecipeUploadKey] = useState(0);
  const [recipeResult, setRecipeResult] = useState<RecipeResult | null>(null);
  const [recipeError, setRecipeError] = useState("");

  const hasRecipeInput = recipeFiles.length > 0 || !!recipeUrl.trim();

  const handleRecipeSubmit = async () => {
    if (!hasRecipeInput) return;
    setRecipeState("loading");
    setRecipeError("");

    try {
      let response: Response;

      if (recipeFiles.length > 0) {
        const formData = new FormData();
        recipeFiles.forEach((f) => formData.append("files", f));
        formData.append("userCountry", getUserCountry());
        response = await fetch("/api/pair-recipe", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/pair-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: recipeUrl.trim(), userCountry: getUserCountry() }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyse recipe");
      setRecipeResult(data);
      setRecipeState("results");
    } catch (err) {
      setRecipeError(err instanceof Error ? err.message : "Something went wrong");
      setRecipeState("error");
    }
  };

  const handleRecipeReset = () => {
    setRecipeState("idle");
    setRecipeResult(null);
    setRecipeError("");
    setRecipeFiles([]);
    setRecipeUrl("");
    setRecipeUploadKey((k) => k + 1);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="relative pt-8 sm:pt-6">
        {/* Mobile: stacked centered layout */}
        <div className="flex flex-col items-center gap-3 px-6 py-6 sm:hidden">
          <button onClick={() => setActiveTab("restaurant")} className="cursor-pointer">
            <img
              src="/logo.png"
              alt="SommeKat logo"
              className="w-36 h-36 object-contain drop-shadow-2xl rounded-full border-4 border-red-900"
            />
          </button>
          <div className="flex flex-col items-center">
            <h1
              onClick={() => setActiveTab("restaurant")}
              className="cursor-pointer text-[2.75rem] font-bold text-red-900"
              style={{ fontFamily: "var(--font-baloo)", textShadow: "0 2px 10px rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}
            >
              SommeKat
            </h1>
            <p className="mt-1 bg-white/30 backdrop-blur-sm rounded-full px-3 py-0.5 text-sm text-red-900 tracking-widest uppercase font-bold">
              AI-powered wine pairing
            </p>
          </div>
        </div>
        {/* Desktop: side-by-side layout */}
        <div className="hidden sm:flex mx-auto max-w-5xl px-6 py-4 items-end gap-5">
          <button onClick={() => setActiveTab("restaurant")} className="cursor-pointer">
            <img
              src="/logo.png"
              alt="SommeKat logo"
              className="w-40 h-40 object-contain drop-shadow-2xl rounded-full border-4 border-red-900"
            />
          </button>
          <div className="pb-2 flex flex-col items-start">
            <h1
              onClick={() => setActiveTab("restaurant")}
              className="cursor-pointer text-[5rem] font-bold text-red-900"
              style={{ fontFamily: "var(--font-baloo)", textShadow: "0 2px 10px rgba(255,255,255,0.3)", letterSpacing: "0.02em" }}
            >
              SommeKat
            </h1>
            <p className="mt-1 bg-white/30 backdrop-blur-sm rounded-full px-3 py-0.5 text-base text-red-900 tracking-widest uppercase font-bold">
              AI-powered wine pairing
            </p>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="mx-auto max-w-5xl px-6 pt-4">
        <div className="flex gap-1 rounded-xl bg-wine-dark/60 p-1 max-w-xs mx-auto">
          <button
            onClick={() => setActiveTab("restaurant")}
            className={[
              "flex-1 text-center rounded-lg px-4 py-2 text-sm font-bold transition-all cursor-pointer",
              activeTab === "restaurant"
                ? "bg-white text-wine shadow-sm"
                : "text-burgundy-200 hover:text-white hover:bg-white/10",
            ].join(" ")}
          >
            Restaurant
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={[
              "flex-1 text-center rounded-lg px-4 py-2 text-sm font-bold transition-all cursor-pointer",
              activeTab === "recipes"
                ? "bg-white text-wine shadow-sm"
                : "text-burgundy-200 hover:text-white hover:bg-white/10",
            ].join(" ")}
          >
            Recipes
          </button>
        </div>
      </div>

      {/* ── Restaurant tab ── */}
      <div className={activeTab === "restaurant" ? "" : "hidden"}>
        <div className="mx-auto max-w-5xl px-6 pt-8 sm:pt-6 pb-6">
          {(state === "idle" || state === "error") && (
            <div className="text-center mb-6">
              <p className="text-lg text-red-950 font-extrabold max-w-lg mx-auto leading-relaxed drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]">
                Upload any restaurant menu and SommeKat will find the perfect wine pairing for every dish.
              </p>
            </div>
          )}

          {(state === "idle" || state === "error") && (
            <form onSubmit={(e) => { e.preventDefault(); if (hasFoodMenu) handleSubmit(); }}>
              {/* Restaurant search */}
              <div className="mx-auto max-w-3xl mb-4">
                <RestaurantSearch
                  onSelect={handleRestaurantSelect}
                  onClear={handleRestaurantClear}
                />
                {searchedRestaurant && (
                  <div className={[
                    "mt-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                    searchedRestaurant.website
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-amber-50 border border-amber-200 text-amber-800",
                  ].join(" ")}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {searchedRestaurant.website
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      }
                    </svg>
                    {searchedRestaurant.website
                      ? `Found ${searchedRestaurant.name}'s website — menu loaded below`
                      : `No website found for ${searchedRestaurant.name} — please upload the menu below`
                    }
                  </div>
                )}
              </div>

              <div className="mx-auto max-w-3xl grid gap-6 sm:grid-cols-2">
                <MenuUpload
                  key={menuUploadKey}
                  label="Food Menu"
                  sublabel="Drop your food menu here"
                  initialFiles={foodFiles}
                  initialUrl={foodUrl}
                  onFilesChange={setFoodFiles}
                  onUrlChange={setFoodUrl}
                  isUploading={false}
                />
                <MenuUpload
                  label="Wine Menu (Optional)"
                  sublabel="Drop your wine menu here"
                  initialFiles={wineFiles}
                  initialUrl={wineUrl}
                  onFilesChange={setWineFiles}
                  onUrlChange={setWineUrl}
                  isUploading={false}
                />
              </div>

              {/* Course selection */}
              <div className="mx-auto max-w-3xl mt-6 text-center">
                <p className="text-sm text-red-950 font-extrabold mb-2 drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]">Mains are always paired</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm font-extrabold text-red-950 drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]">Optional Inclusions:</span>
                  {[
                    { id: "starters", label: "Starters" },
                    { id: "desserts", label: "Desserts" },
                  ].map(({ id, label }) => {
                    const isSelected = courses.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setCourses((prev) =>
                            prev.includes(id)
                              ? prev.filter((c) => c !== id)
                              : [...prev, id]
                          );
                        }}
                        className={[
                          "rounded-full px-4 py-1.5 text-sm font-bold transition-all border-2 cursor-pointer",
                          isSelected
                            ? "bg-wine text-white border-wine shadow-md"
                            : "bg-white/80 text-wine border-wine/30 hover:border-wine/60",
                        ].join(" ")}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price range slider */}
              {showPriceSlider && (
                <div className="mx-auto max-w-3xl mt-6 rounded-2xl bg-wine-dark/60 p-5">
                  <p className="text-sm font-bold text-white mb-3 text-center">Wine Price Range (Bottle)</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white min-w-[45px]">{currencySymbol}{minPrice}</span>
                    <div className="flex-1 relative h-8">
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/20"
                        style={{ left: 0, right: 0 }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-wine-light"
                        style={{
                          left: `${(minPrice / SLIDER_MAX) * 100}%`,
                          right: `${100 - (maxPrice / SLIDER_MAX) * 100}%`,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={SLIDER_MAX}
                        step={1}
                        value={minPrice}
                        onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 1))}
                        className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-wine [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-wine [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <input
                        type="range"
                        min={0}
                        max={SLIDER_MAX}
                        step={1}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 1))}
                        className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-wine [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-wine [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
                      />
                    </div>
                    <span className="text-sm font-semibold text-white min-w-[45px] text-right">
                      {maxIsUnlimited ? "Max" : `${currencySymbol}${maxPrice}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="mt-8 text-center">
                <button
                  type="submit"
                  disabled={!hasFoodMenu}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-10 py-4 text-lg font-bold text-white border-t-2 border-l-2 border-r-2 border-b-4 transition-all",
                    hasFoodMenu
                      ? "border-t-white/30 border-l-white/20 border-r-black/20 border-b-black/30 bg-gradient-to-b from-wine-light to-wine shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer hover:from-wine hover:to-wine-light hover:shadow-[0_6px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:scale-105 active:scale-[0.98] active:border-b-2 active:shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_3px_rgba(0,0,0,0.2)]"
                      : "border-t-white/10 border-l-white/10 border-r-black/10 border-b-black/10 bg-gradient-to-b from-wine-light/40 to-wine/40 shadow-none opacity-50 cursor-not-allowed grayscale-[30%] pointer-events-none",
                  ].join(" ")}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Get Wine Pairings
                </button>
              </div>

              {state === "error" && (
                <div className="mt-6 mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
                  {error}
                </div>
              )}
            </form>
          )}

          {state === "uploading" && <LoadingState />}

          {state === "results" && (
            <MenuResults pairings={pairings} restaurantName={restaurantName} onReset={handleReset} />
          )}
        </div>
      </div>

      {/* ── Recipes tab ── */}
      <div className={activeTab === "recipes" ? "" : "hidden"}>
        <div className="mx-auto max-w-3xl px-6 pt-8 pb-10">
          <div className="text-center mb-8">
            <p className="text-base text-red-950 font-extrabold max-w-lg mx-auto drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]">
              Cooking at home? Paste a link to any online recipe or take a photo, and SommeKat will recommend the perfect wines to serve alongside your dish.
            </p>
          </div>

          {(recipeState === "idle" || recipeState === "error") && (
            <>
              <MenuUpload
                key={recipeUploadKey}
                label="Recipe"
                sublabel="Paste a link, drop a photo, or take a picture"
                initialFiles={recipeFiles}
                initialUrl={recipeUrl}
                onFilesChange={setRecipeFiles}
                onUrlChange={setRecipeUrl}
                isUploading={false}
              />
              {recipeError && (
                <p className="mt-3 text-sm text-red-700 font-medium text-center">{recipeError}</p>
              )}

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={handleRecipeSubmit}
                  disabled={!hasRecipeInput}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-10 py-4 text-lg font-bold text-white border-t-2 border-l-2 border-r-2 border-b-4 transition-all",
                    hasRecipeInput
                      ? "border-t-white/30 border-l-white/20 border-r-black/20 border-b-black/30 bg-gradient-to-b from-wine-light to-wine shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] cursor-pointer hover:from-wine hover:to-wine-light hover:shadow-[0_6px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:scale-105 active:scale-[0.98] active:border-b-2 active:shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_3px_rgba(0,0,0,0.2)]"
                      : "border-t-white/10 border-l-white/10 border-r-black/10 border-b-black/10 bg-gradient-to-b from-wine-light/40 to-wine/40 shadow-none opacity-50 cursor-not-allowed grayscale-[30%] pointer-events-none",
                  ].join(" ")}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Get Wine Pairings
                </button>
              </div>
            </>
          )}

          {recipeState === "loading" && (
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

          {recipeState === "results" && recipeResult && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-xl font-extrabold text-red-900 leading-snug">
                  Wine Pairings for <span className="font-black">{recipeResult.recipeName}</span>
                </h2>
                <button
                  onClick={handleRecipeReset}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-400 cursor-pointer self-start flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Try another recipe
                </button>
              </div>

              {recipeResult.pairings.map((pairing, i) => (
                <div key={i} className="rounded-2xl border-2 border-[#722F37] bg-white/90 shadow-md p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center ${getWineCircleColor(pairing.wineType)}`}>
                      {i + 1}
                    </span>
                    {pairing.wineType && (
                      <p className="text-base font-bold text-stone-900">{pairing.wineType}</p>
                    )}
                  </div>
                  <p className="text-sm text-stone-700 leading-relaxed">{pairing.rationale}</p>
                  {(pairing.winery || pairing.blend) && (
                    <p className="mt-2 text-xs text-stone-500 italic">
                      If available, you should try the{" "}
                      <span className="font-semibold not-italic text-stone-600">
                        {[pairing.winery, pairing.blend].filter(Boolean).join(" ")}
                      </span>
                    </p>
                  )}
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
      </div>
    </main>
  );
}
