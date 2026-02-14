"use client";

import { useCallback, useState, useRef } from "react";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  onUrlSubmitted: (url: string) => void;
  isUploading: boolean;
}

export default function FileUpload({
  onFileSelected,
  onUrlSubmitted,
  isUploading,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [menuUrl, setMenuUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSubmit = () => {
    if (selectedFile) onFileSelected(selectedFile);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-3xl bg-wine-dark p-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragActive
            ? "border-wine bg-burgundy-50 scale-[1.02]"
            : "border-burgundy-300 bg-cream hover:border-wine-light hover:bg-burgundy-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Menu preview"
              className="mx-auto max-h-48 rounded-lg shadow-md object-contain"
            />
            <p className="text-sm text-stone-600">{selectedFile?.name}</p>
          </div>
        ) : selectedFile ? (
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 rounded-xl bg-burgundy-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-wine"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-stone-600">{selectedFile.name}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-burgundy-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-wine"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-stone-700">
                Drop your menu here
              </p>
              <p className="mt-1 text-sm text-stone-500">
                or click to browse — JPG, PNG, WebP, GIF, or PDF
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-burgundy-300/40" />
        <span className="text-sm text-burgundy-200 font-medium">or paste a link</span>
        <div className="flex-1 border-t border-burgundy-300/40" />
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={menuUrl}
          onChange={(e) => setMenuUrl(e.target.value)}
          placeholder="https://restaurant.com/menu"
          className="flex-1 rounded-xl border border-burgundy-300/40 bg-cream px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-wine/50 focus:border-wine"
        />
        <button
          onClick={() => {
            if (menuUrl.trim()) onUrlSubmitted(menuUrl.trim());
          }}
          disabled={!menuUrl.trim() || isUploading}
          className="rounded-xl bg-wine px-5 py-3 text-sm font-medium text-white transition-all hover:bg-wine-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Go
        </button>
      </div>
      </div>

      {selectedFile && (
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-wine px-8 py-3 text-base font-medium text-white shadow-lg shadow-wine/25 transition-all hover:bg-wine-light hover:shadow-xl hover:shadow-wine/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                Analyzing Menu...
              </>
            ) : (
              <>
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
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
