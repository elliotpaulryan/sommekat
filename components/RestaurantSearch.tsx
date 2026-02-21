"use client";

import { useState, useEffect, useRef } from "react";

interface Prediction {
  placeId: string;
  name: string;
  address: string;
}

interface RestaurantSearchProps {
  onSelect: (name: string, website: string | null) => void;
  onClear: () => void;
}

function generateToken(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function RestaurantSearch({ onSelect, onClear }: RestaurantSearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);

  const sessionTokenRef = useRef<string>(generateToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = (value: string) => {
    clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/restaurant-search?query=${encodeURIComponent(value)}&sessionToken=${sessionTokenRef.current}`
        );
        const data = await res.json();
        setPredictions(data.predictions || []);
        setIsOpen(true);
      } catch {
        setPredictions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (hasSelected) {
      // New search after selection — start a fresh session
      setHasSelected(false);
      sessionTokenRef.current = generateToken();
      onClear();
    }
    search(value);
  };

  const handleSelect = async (prediction: Prediction) => {
    setQuery(prediction.name);
    setIsOpen(false);
    setPredictions([]);
    setHasSelected(true);
    setIsFetchingDetails(true);

    // Capture token and immediately rotate — the Details call closes the session
    const token = sessionTokenRef.current;
    sessionTokenRef.current = generateToken();

    try {
      const res = await fetch(
        `/api/restaurant-details?placeId=${prediction.placeId}&sessionToken=${token}`
      );
      const data = await res.json();
      onSelect(data.name || prediction.name, data.website || null);
    } catch {
      onSelect(prediction.name, null);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setHasSelected(false);
    setPredictions([]);
    setIsOpen(false);
    sessionTokenRef.current = generateToken();
    onClear();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          placeholder="Search for a restaurant to auto-load the menu…"
          className="w-full rounded-2xl border-2 border-wine-dark/30 bg-white/90 pl-11 pr-10 py-3.5 text-stone-900 placeholder:text-stone-400 focus:border-wine focus:outline-none focus:ring-2 focus:ring-wine/20 transition-all text-base"
        />
        {isSearching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-stone-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}
        {query && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-2xl border border-stone-200 bg-white shadow-2xl overflow-hidden">
          {predictions.map((p, i) => (
            <button
              key={p.placeId}
              type="button"
              onClick={() => handleSelect(p)}
              className={[
                "w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer",
                i < predictions.length - 1 ? "border-b border-stone-100" : "",
              ].join(" ")}
            >
              <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
              <p className="text-xs text-stone-500 mt-0.5">{p.address}</p>
            </button>
          ))}
        </div>
      )}

      {isFetchingDetails && (
        <p className="mt-2 text-sm text-center text-stone-500">Looking up restaurant details…</p>
      )}
    </div>
  );
}
