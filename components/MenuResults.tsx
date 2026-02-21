"use client";

import type { WinePairing } from "@/lib/claude";

interface MenuResultsProps {
  pairings: WinePairing[];
  restaurantName: string | null;
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
  if (lower.includes("sparkling") || lower.includes("champagne") || lower.includes("prosecco") || lower.includes("cava") || lower.includes("crémant") || lower.includes("cremant") || lower.includes("franciacorta") || lower.includes("sekt")) {
    return "bg-amber-50 border-2 border-dashed border-amber-300 text-amber-800 shadow-[0_0_0_2px_rgba(251,191,36,0.15),0_0_0_4px_rgba(251,191,36,0.1)] animate-bubble";
  }
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
    lower.includes("agiorgitiko") ||
    lower.includes("chianti") ||
    lower.includes("barolo") ||
    lower.includes("barbaresco") ||
    lower.includes("montepulciano") ||
    lower.includes("primitivo") ||
    lower.includes("nero d'avola") ||
    lower.includes("dolcetto") ||
    lower.includes("valpolicella") ||
    lower.includes("amarone") ||
    lower.includes("rioja") ||
    lower.includes("garnacha") ||
    lower.includes("monastrell") ||
    lower.includes("touriga") ||
    lower.includes("tannat") ||
    lower.includes("corvina") ||
    lower.includes("bonarda") ||
    lower.includes("carignan") ||
    lower.includes("cinsault") ||
    lower.includes("gamay") ||
    lower.includes("beaujolais") ||
    lower.includes("bordeaux") ||
    lower.includes("burgundy") ||
    lower.includes("côtes du rhône") ||
    lower.includes("cotes du rhone") ||
    lower.includes("châteauneuf") ||
    lower.includes("chateauneuf") ||
    lower.includes("saint-émilion") ||
    lower.includes("saint-julien") ||
    lower.includes("pauillac") ||
    lower.includes("margaux") ||
    lower.includes("pomerol") ||
    lower.includes("brunello") ||
    lower.includes("lambrusco") ||
    lower.includes("zweigelt") ||
    lower.includes("blaufränkisch")
  ) {
    return "bg-red-900/30 border-red-900/50 text-red-950";
  }
  return "bg-amber-100 border-amber-400 text-amber-900";
}

function formatPrice(price: string | null): string {
  if (!price) return "—";
  let result = price.replace(/(\d)\.00(?!\d)/g, "$1");
  result = result.replace(/(\d+\.\d)(?!\d)/, "$10");
  return result;
}

const COURSE_ORDER = ["starter", "main", "dessert"] as const;
const COURSE_LABELS: Record<string, string> = {
  starter: "Starters",
  main: "Main Courses",
  dessert: "Desserts",
};

const MENU_SECTION_PRIORITY: Record<string, number> = {
  breakfast: 0,
  brunch: 1,
  lunch: 2,
  afternoon: 3,
  "all day": 4,
  bar: 5,
  dinner: 6,
  evening: 7,
  supper: 8,
  tasting: 9,
};

function menuSectionOrder(name: string): number {
  const l = name.toLowerCase();
  for (const [key, pri] of Object.entries(MENU_SECTION_PRIORITY)) {
    if (l.includes(key)) return pri;
  }
  return 99;
}

function buildCourseSections(items: WinePairing[]) {
  const hasCourseTags = items.some((p) => p.course);
  if (!hasCourseTags) return [{ key: "main", label: "Main Courses", items }];
  return COURSE_ORDER
    .map((c) => ({ key: c, label: COURSE_LABELS[c], items: items.filter((p) => p.course === c) }))
    .filter((g) => g.items.length > 0);
}

function PairingCard({ pairing }: { pairing: WinePairing }) {
  return (
    <div className="group rounded-lg border-2 border-[#722F37] bg-white shadow-sm transition-all hover:shadow-md hover:border-[#5a252c] overflow-hidden">
      <div className="grid sm:grid-cols-2">
        {/* Left — Dish */}
        <div className="p-6 sm:border-r border-stone-100">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
            Dish
          </p>
          <h3 className="text-xl font-bold text-stone-900">{pairing.dish}</h3>
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
          {pairing.region && (
            <p className="text-sm text-stone-500 font-medium mt-0.5">{pairing.region}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${getWineColor(pairing.wineType)}`}
            >
              {pairing.wineType}
            </span>
            {pairing.altWineType && (
              <span
                className={`inline-block rounded-full border px-3 py-0.5 text-xs font-semibold ${getWineColor(pairing.altWineType)}`}
              >
                Alt: {pairing.altWineType}
              </span>
            )}
          </div>

          {(pairing.vivinoRating != null || pairing.restaurantPriceGlass || pairing.restaurantPriceBottle || pairing.retailPrice) && (
            <div className="mt-3 space-y-2">
              {(pairing.restaurantPriceGlass || pairing.restaurantPriceBottle) && (
                pairing.restaurantPriceGlass ? (
                  <div className="flex rounded-lg border border-blue-200 overflow-hidden">
                    <div className="flex-1 bg-sky-50 p-2 text-center min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Glass</p>
                      <p className="text-base font-bold text-sky-900 mt-0.5 truncate">
                        {formatPrice(pairing.restaurantPriceGlass)}
                      </p>
                    </div>
                    <div className="w-px bg-blue-200" />
                    <div className="flex-1 bg-blue-50 p-2 text-center min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Bottle</p>
                      <p className="text-base font-bold text-blue-900 mt-0.5 truncate">
                        {formatPrice(pairing.restaurantPriceBottle)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Bottle</p>
                    <p className="text-base font-bold text-blue-900 mt-0.5">
                      {formatPrice(pairing.restaurantPriceBottle)}
                    </p>
                  </div>
                )
              )}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.vivino.com/search/wines?q=${encodeURIComponent([pairing.producer, pairing.bottleSuggestion].filter(Boolean).join(" "))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-purple-50 border border-purple-200 p-2 text-center hover:bg-purple-100 transition-colors cursor-pointer no-underline"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Vivino</p>
                  <p className="text-base font-bold text-purple-900 mt-0.5">
                    {pairing.vivinoRating != null && pairing.vivinoRating > 0 ? `${pairing.vivinoRating}/5` : "Not found"}
                  </p>
                </a>
                <div className="rounded-lg bg-green-50 border border-green-200 p-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-700">Retail</p>
                  <p className="text-base font-bold text-green-900 mt-0.5">
                    {formatPrice(pairing.retailPrice)}
                  </p>
                </div>
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
  );
}

function CourseSectionBlock({ items, label, showLabel }: { items: WinePairing[]; label: string; showLabel: boolean }) {
  return (
    <div className="mb-4">
      {showLabel && (
        <h4 className="text-lg font-extrabold text-red-900 mb-2">{label}</h4>
      )}
      <div className="space-y-2 rounded-xl bg-wine-dark/60 p-1.5 sm:p-2">
        {items.map((pairing, index) => (
          <PairingCard key={index} pairing={pairing} />
        ))}
      </div>
    </div>
  );
}

export default function MenuResults({ pairings, restaurantName, onReset }: MenuResultsProps) {
  // Detect unique menu sections (e.g. Breakfast, Lunch, Dinner)
  const allSectionNames = [...new Set(pairings.map((p) => p.menuSection).filter((s): s is string => !!s))];
  const sortedSectionNames = allSectionNames.sort((a, b) => menuSectionOrder(a) - menuSectionOrder(b));
  const hasMultipleMenuSections = sortedSectionNames.length > 1;

  // For single-section view: course grouping (existing behaviour)
  const courseSections = buildCourseSections(pairings);
  const hasCourseTags = pairings.some((p) => p.course);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-red-900">
            {restaurantName
              ? <><span className="font-bold">Your Wine Pairings for</span> <span className="font-black">{restaurantName}</span></>
              : "Your Wine Pairings"}
          </h2>
          <p className="text-red-900/80 mt-1 font-bold">
            {pairings.length} dish{pairings.length !== 1 ? "es" : ""} found
          </p>
          {hasMultipleMenuSections && (
            <div className="mt-1 ml-3 space-y-0.5">
              {sortedSectionNames.map((name) => (
                <p key={name} className="text-sm text-red-900/80 font-bold">
                  {pairings.filter((p) => p.menuSection === name).length} {name.toLowerCase()} dishes
                </p>
              ))}
            </div>
          )}
          {!hasMultipleMenuSections && hasCourseTags && courseSections.length > 1 && (
            <div className="mt-1 ml-3 space-y-0.5">
              {courseSections.map((s) => (
                <p key={s.key} className="text-sm text-red-900/80 font-bold">
                  {s.items.length} {s.label.toLowerCase()}
                </p>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-400 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {hasMultipleMenuSections ? (
        // Group by menu section (Breakfast / Lunch / Dinner etc.)
        <>
          {sortedSectionNames.map((sectionName) => {
            const sectionPairings = pairings.filter((p) => p.menuSection === sectionName);
            const courses = buildCourseSections(sectionPairings);
            return (
              <div key={sectionName} className="mb-10">
                <h3 className="text-xl font-extrabold text-red-900 mb-3 flex items-center gap-2">
                  <span className="inline-block rounded-lg bg-red-900/10 border border-red-900/20 px-3 py-1">
                    {sectionName}
                  </span>
                  <span className="text-sm font-bold text-red-900/60">{sectionPairings.length} dishes</span>
                </h3>
                {courses.map((c) => (
                  <CourseSectionBlock key={c.key} items={c.items} label={c.label} showLabel={courses.length > 1} />
                ))}
              </div>
            );
          })}
          {/* Fallback: dishes with no menuSection tag */}
          {pairings.some((p) => !p.menuSection) && (
            <div className="mb-10">
              <h3 className="text-xl font-extrabold text-red-900 mb-3">Other</h3>
              {buildCourseSections(pairings.filter((p) => !p.menuSection)).map((c) => (
                <CourseSectionBlock key={c.key} items={c.items} label={c.label} showLabel={false} />
              ))}
            </div>
          )}
        </>
      ) : (
        // Single menu: group by course only
        courseSections.map((section) => (
          <CourseSectionBlock
            key={section.key}
            items={section.items}
            label={section.label}
            showLabel={courseSections.length > 1}
          />
        ))
      )}
    </div>
  );
}
