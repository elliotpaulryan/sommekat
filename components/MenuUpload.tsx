"use client";

import { useCallback, useState, useRef } from "react";

interface MenuUploadProps {
  label: string;
  sublabel: string;
  initialFiles?: File[];
  initialUrl?: string;
  onFilesChange: (files: File[]) => void;
  onUrlChange: (url: string) => void;
  isUploading: boolean;
}

const MAX_IMAGE_SIZE = 3.5 * 1024 * 1024; // 3.5MB to stay well under Claude's 5MB base64 limit
const MAX_DIMENSION = 4000; // Stay within iOS canvas memory limits
// Types Claude accepts natively — anything else needs converting to JPEG
const CLAUDE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.toLowerCase().split(".").pop() || "";
  return ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp", "tiff", "tif"].includes(ext);
}

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!isImageFile(file) || file.type === "application/pdf") {
      resolve(file);
      return;
    }
    if (file.type === "image/gif") {
      resolve(file);
      return;
    }
    const needsConversion = !CLAUDE_IMAGE_TYPES.has(file.type) || !file.type || file.size > MAX_IMAGE_SIZE;
    if (!needsConversion) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        // Cap dimensions to avoid exceeding iOS canvas memory limits
        const scaleDim = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height, 1);
        const scaleSize = file.size > MAX_IMAGE_SIZE ? Math.min(1, Math.sqrt(MAX_IMAGE_SIZE / file.size)) : 1;
        const scale = Math.min(scaleDim, scaleSize);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; } // iOS refused canvas context — send original
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85
        );
      } catch {
        resolve(file); // Canvas failed — send original and let server handle it
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export default function MenuUpload({
  label,
  sublabel,
  initialFiles = [],
  initialUrl = "",
  onFilesChange,
  onUrlChange,
  isUploading,
}: MenuUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles);
  const [previews, setPreviews] = useState<(string | null)[]>(
    initialFiles.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null))
  );
  const [menuUrl, setMenuUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const compressed = await Promise.all(newFiles.map(compressImage));
      const newPreviews = compressed.map((f) =>
        f.type.startsWith("image/") ? URL.createObjectURL(f) : null
      );
      setSelectedFiles((prev) => {
        const updated = [...prev, ...compressed];
        onFilesChange(updated);
        return updated;
      });
      setPreviews((prev) => [...prev, ...newPreviews]);
      setMenuUrl("");
      onUrlChange("");
    },
    [onFilesChange, onUrlChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      setSelectedFiles((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        onFilesChange(updated);
        return updated;
      });
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [onFilesChange]
  );

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    onFilesChange([]);
    if (inputRef.current) inputRef.current.value = "";
  }, [onFilesChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) addFiles(files);
    },
    [addFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) addFiles(files);
      // Reset input so the same file can be re-added after removal
      if (inputRef.current) inputRef.current.value = "";
    },
    [addFiles]
  );

  const handleUrlInput = (value: string) => {
    setMenuUrl(value);
    onUrlChange(value);
    if (value.trim()) {
      setSelectedFiles([]);
      setPreviews([]);
      onFilesChange([]);
    }
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className="w-full">
      <div className="rounded-3xl bg-wine-dark p-6">
        {/* Label */}
        <p className="text-2xl font-medium text-burgundy-200 mb-3 text-center">{label}</p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={[
            "relative cursor-pointer rounded-2xl border-2 p-6 text-center transition-all duration-200",
            dragActive
              ? "border-dashed border-wine bg-burgundy-50 scale-[1.02]"
              : hasFiles
                ? "border-solid border-green-500 bg-green-50/80 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
                : "border-dashed border-burgundy-300 bg-cream hover:border-wine-light hover:bg-burgundy-50/50",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*,image/heic,image/heif,.heic,.heif,application/pdf,.pdf"
            multiple
            onChange={handleChange}
            className="hidden"
          />

          {hasFiles ? (
            <div onClick={(e) => e.stopPropagation()}>
              {/* File list */}
              <div className="space-y-2 mb-3">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-1.5">
                    {previews[i] ? (
                      <img
                        src={previews[i]!}
                        alt=""
                        className="h-8 w-8 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <svg className="w-5 h-5 text-wine flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span className="text-xs text-stone-700 truncate flex-1 text-left">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-wine/60 hover:text-wine flex-shrink-0 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {/* Add more / clear */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  className="text-xs text-wine font-medium underline cursor-pointer"
                >
                  + Add more pages
                </button>
                <span className="text-stone-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-stone-500 underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-burgundy-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-wine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-stone-700">{sublabel}</p>
                <p className="mt-1 text-xs text-wine font-medium">or click to take a photo</p>
                <p className="mt-1 text-xs text-stone-500">JPG, PNG, WebP, GIF, PDF — multiple pages supported</p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 border-t border-burgundy-300/40" />
          <span className="text-xs text-burgundy-200 font-medium">or paste a link</span>
          <div className="flex-1 border-t border-burgundy-300/40" />
        </div>

        {/* URL input */}
        <input
          type="url"
          value={menuUrl}
          onChange={(e) => handleUrlInput(e.target.value)}
          placeholder="https://restaurant.com/menu"
          className={[
            "w-full rounded-xl border px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-wine/50 focus:border-wine transition-all",
            menuUrl.trim()
              ? "border-green-500 bg-green-50/80 shadow-[0_0_0_2px_rgba(34,197,94,0.15)]"
              : "border-burgundy-300/40 bg-cream",
          ].join(" ")}
        />
      </div>
    </div>
  );
}
