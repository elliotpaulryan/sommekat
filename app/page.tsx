"use client";

import { useState, useEffect } from "react";
import MenuUpload from "@/components/MenuUpload";
import MenuResults from "@/components/MenuResults";
import LoadingState from "@/components/LoadingState";
import type { WinePairing } from "@/lib/claude";

type AppState = "idle" | "uploading" | "results" | "error";

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

export default function Home() {
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
    setFoodFiles([]);
    setFoodUrl("");
    setWineFiles([]);
    setWineUrl("");
  };

  return (
    <main className="min-h-screen">
      {/* Header with logo */}
      <header className="relative pt-8 sm:pt-6">
        {/* Mobile: stacked centered layout */}
        <div className="flex flex-col items-center gap-3 px-6 py-6 sm:hidden">
          <a href="/">
            <img
              src="/logo.png"
              alt="SommeKat logo"
              className="w-36 h-36 object-contain drop-shadow-2xl rounded-full cursor-pointer border-4 border-red-900"
            />
          </a>
          <div className="text-center">
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
        {/* Desktop: side-by-side layout */}
        <div className="hidden sm:flex mx-auto max-w-5xl px-6 py-4 items-end gap-5">
          <a href="/">
            <img
              src="/logo.png"
              alt="SommeKat logo"
              className="w-40 h-40 object-contain drop-shadow-2xl rounded-full cursor-pointer border-4 border-red-900"
            />
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

      <div className="mx-auto max-w-5xl px-6 pt-12 sm:pt-10 pb-6">
        {/* Tagline — only show on idle/error */}
        {(state === "idle" || state === "error") && (
          <div className="text-center mb-6">
            <p className="text-lg text-red-900 font-bold max-w-lg mx-auto leading-relaxed">
              Upload a photo or PDF of any restaurant menu and SommeKat
              will recommend the ideal wine pairing for each item.
            </p>
          </div>
        )}

        {/* Upload */}
        {(state === "idle" || state === "error") && (
          <form onSubmit={(e) => { e.preventDefault(); if (hasFoodMenu) handleSubmit(); }}>
            <div className="mx-auto max-w-3xl grid gap-6 sm:grid-cols-2">
              <MenuUpload
                label="Food Menu"
                sublabel="Drop your food menu here"
                onFilesChange={setFoodFiles}
                onUrlChange={setFoodUrl}
                isUploading={false}
              />
              <MenuUpload
                label="Wine Menu (Optional)"
                sublabel="Drop your wine menu here"
                onFilesChange={setWineFiles}
                onUrlChange={setWineUrl}
                isUploading={false}
              />
            </div>

            {/* Course selection */}
            <div className="mx-auto max-w-3xl mt-6 text-center">
              <p className="text-sm text-red-900 font-bold mb-2">Mains are always included</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm font-bold text-red-900">Optional Inclusions:</span>
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

            {/* Price range slider — only when wine menu is provided */}
            {hasWineMenu && (
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
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

        {/* Uploading */}
        {state === "uploading" && <LoadingState />}

        {/* Results */}
        {state === "results" && (
          <MenuResults pairings={pairings} restaurantName={restaurantName} onReset={handleReset} />
        )}
      </div>
    </main>
  );
}
