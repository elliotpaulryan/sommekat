"use client";

import { useState } from "react";
import MenuUpload from "@/components/MenuUpload";
import MenuResults from "@/components/MenuResults";
import LoadingState from "@/components/LoadingState";
import type { WinePairing } from "@/lib/claude";

type AppState = "idle" | "uploading" | "results" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [pairings, setPairings] = useState<WinePairing[]>([]);
  const [error, setError] = useState<string>("");

  const [foodFile, setFoodFile] = useState<File | null>(null);
  const [foodUrl, setFoodUrl] = useState("");
  const [wineFile, setWineFile] = useState<File | null>(null);
  const [wineUrl, setWineUrl] = useState("");

  const hasFoodMenu = !!foodFile || !!foodUrl.trim();

  const handleSubmit = async () => {
    setState("uploading");
    setError("");

    try {
      let response: Response;

      const currency = new Intl.NumberFormat(navigator.language, { style: "currency", currency: "USD" })
        .resolvedOptions().locale;
      // Get the currency code from the user's locale
      const userCurrency = (() => {
        try {
          const parts = new Intl.NumberFormat(navigator.language, { style: "currency", currency: "USD" }).resolvedOptions();
          // Map locale to likely currency
          const localeCurrency: Record<string, string> = {
            "en-US": "USD", "en-AU": "AUD", "en-GB": "GBP", "en-CA": "CAD", "en-NZ": "NZD",
            "de-DE": "EUR", "fr-FR": "EUR", "es-ES": "EUR", "it-IT": "EUR", "nl-NL": "EUR",
            "ja-JP": "JPY", "zh-CN": "CNY", "ko-KR": "KRW", "pt-BR": "BRL", "en-IN": "INR",
            "en-SG": "SGD", "en-HK": "HKD", "en-ZA": "ZAR", "sv-SE": "SEK", "da-DK": "DKK",
            "nb-NO": "NOK", "fi-FI": "EUR", "pl-PL": "PLN", "cs-CZ": "CZK", "hu-HU": "HUF",
            "ro-RO": "RON", "th-TH": "THB", "vi-VN": "VND", "id-ID": "IDR", "ms-MY": "MYR",
            "fil-PH": "PHP", "ar-AE": "AED", "ar-SA": "SAR", "he-IL": "ILS", "tr-TR": "TRY",
            "ru-RU": "RUB", "uk-UA": "UAH", "el-GR": "EUR", "pt-PT": "EUR", "zh-TW": "TWD",
          };
          return localeCurrency[navigator.language] || "USD";
        } catch {
          return "USD";
        }
      })();

      if (foodFile) {
        const formData = new FormData();
        formData.append("file", foodFile);
        formData.append("currency", userCurrency);
        if (wineFile) formData.append("wineFile", wineFile);
        if (!wineFile && wineUrl.trim()) formData.append("wineUrl", wineUrl.trim());

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
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze menu");
      }

      setPairings(data.pairings);
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setPairings([]);
    setError("");
    setFoodFile(null);
    setFoodUrl("");
    setWineFile(null);
    setWineUrl("");
  };

  return (
    <main className="min-h-screen">
      {/* Header with logo */}
      <header className="relative pt-8 sm:pt-12">
        {/* Mobile: stacked centered layout */}
        <div className="flex flex-col items-center gap-3 px-6 py-6 sm:hidden">
          <a href="/">
            <img
              src="/logo.png"
              alt="SommeKat logo"
              className="w-36 h-36 object-contain drop-shadow-2xl rounded-full cursor-pointer"
            />
          </a>
          <div className="text-center">
            <a href="/" className="no-underline">
              <h1 className="text-5xl text-white cursor-pointer" style={{ fontFamily: "var(--font-baloo)", textShadow: "0 4px 20px rgba(0,0,0,0.6)", letterSpacing: "0.02em" }}>
                SommeKat
              </h1>
            </a>
            <p className="mt-1 text-sm text-white/80 tracking-widest uppercase" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
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
              className="w-44 h-44 object-contain drop-shadow-2xl rounded-full cursor-pointer"
            />
          </a>
          <div className="pb-2">
            <a href="/" className="no-underline">
              <h1 className="text-8xl text-white cursor-pointer" style={{ fontFamily: "var(--font-baloo)", textShadow: "0 4px 20px rgba(0,0,0,0.6)", letterSpacing: "0.02em" }}>
                SommeKat
              </h1>
            </a>
            <p className="mt-1 text-base text-white/80 tracking-widest uppercase" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              AI-powered wine pairing
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pt-20 sm:pt-24 pb-12">
        {/* Tagline — only show on idle/error */}
        {(state === "idle" || state === "error") && (
          <div className="text-center mb-12">
            <p className="text-lg text-white max-w-lg mx-auto leading-relaxed">
              Upload a photo or PDF of any restaurant menu and our AI sommelier
              will recommend the ideal wine pairing for each item.
            </p>
          </div>
        )}

        {/* Upload */}
        {(state === "idle" || state === "error") && (
          <>
            <div className="mx-auto max-w-3xl grid gap-6 sm:grid-cols-2">
              <MenuUpload
                label="Food Menu"
                sublabel="Drop your food menu here"
                onFileChange={setFoodFile}
                onUrlChange={setFoodUrl}
                isUploading={false}
              />
              <MenuUpload
                label="Wine Menu (Optional)"
                sublabel="Drop your wine menu here"
                onFileChange={setWineFile}
                onUrlChange={setWineUrl}
                isUploading={false}
              />
            </div>

            {/* Submit button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmit}
                disabled={!hasFoodMenu}
                className="inline-flex items-center gap-2 rounded-xl bg-wine px-8 py-3 text-base font-medium text-white shadow-lg shadow-wine/25 transition-all hover:bg-wine-light hover:shadow-xl hover:shadow-wine/30 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </>
        )}

        {/* Uploading */}
        {state === "uploading" && <LoadingState />}

        {/* Results */}
        {state === "results" && (
          <MenuResults pairings={pairings} onReset={handleReset} />
        )}
      </div>
    </main>
  );
}
