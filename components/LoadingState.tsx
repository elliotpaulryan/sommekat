"use client";

export default function LoadingState() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 rounded-full bg-burgundy-50 px-6 py-3 text-wine">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="font-medium">
            Analyzing your menu & selecting wines...
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-stone-200 bg-white p-6"
          >
            <div className="space-y-3 mb-4">
              <div className="h-5 w-3/4 rounded-lg animate-shimmer" />
              <div className="h-4 w-full rounded-lg animate-shimmer" />
            </div>
            <div className="border-t border-stone-100 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg animate-shimmer" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 rounded-full animate-shimmer" />
                  <div className="h-4 w-48 rounded-lg animate-shimmer" />
                </div>
              </div>
              <div className="pl-11 space-y-2">
                <div className="h-3 w-full rounded-lg animate-shimmer" />
                <div className="h-3 w-2/3 rounded-lg animate-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
