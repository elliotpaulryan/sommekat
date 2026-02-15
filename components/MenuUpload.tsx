"use client";

import { useCallback, useState, useRef } from "react";

interface MenuUploadProps {
  label: string;
  sublabel: string;
  onFileChange: (file: File | null) => void;
  onUrlChange: (url: string) => void;
  isUploading: boolean;
}

const MAX_IMAGE_SIZE = 3.5 * 1024 * 1024; // 3.5MB to stay well under Claude's 5MB base64 limit

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (file.size <= MAX_IMAGE_SIZE) {
        resolve(file);
        return;
      }
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, Math.sqrt(MAX_IMAGE_SIZE / file.size));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.8
      );
    };
    img.src = url;
  });
}

export default function MenuUpload({
  label,
  sublabel,
  onFileChange,
  onUrlChange,
  isUploading,
}: MenuUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [menuUrl, setMenuUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const compressed = await compressImage(file);
      setSelectedFile(compressed);
      onFileChange(compressed);
      setMenuUrl("");
      onUrlChange("");
      if (compressed.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(compressed));
      } else {
        setPreview(null);
      }
    },
    [onFileChange, onUrlChange]
  );

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onFileChange]);

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

  const handleUrlInput = (value: string) => {
    setMenuUrl(value);
    onUrlChange(value);
    if (value.trim()) {
      setSelectedFile(null);
      setPreview(null);
      onFileChange(null);
    }
  };

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
          className={`relative cursor-pointer rounded-2xl border-2 p-8 text-center transition-all duration-200 ${
            dragActive
              ? "border-dashed border-wine bg-burgundy-50 scale-[1.02]"
              : selectedFile
                ? "border-solid border-green-500 bg-green-50/80 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"
                : "border-dashed border-burgundy-300 bg-cream hover:border-wine-light hover:bg-burgundy-50/50"
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
            <div className="space-y-3">
              <img
                src={preview}
                alt="Menu preview"
                className="mx-auto max-h-32 rounded-lg shadow-md object-contain"
              />
              <p className="text-sm text-stone-600">{selectedFile?.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-xs text-wine underline"
              >
                Remove
              </button>
            </div>
          ) : selectedFile ? (
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-burgundy-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-wine"
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-xs text-wine underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-burgundy-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-wine"
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
                <p className="text-base font-medium text-stone-700">
                  {sublabel}
                </p>
                <p className="mt-1 text-xs text-wine font-medium">
                  or click to take a photo
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  JPG, PNG, WebP, GIF, or PDF
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 border-t border-burgundy-300/40" />
          <span className="text-xs text-burgundy-200 font-medium">
            or paste a link
          </span>
          <div className="flex-1 border-t border-burgundy-300/40" />
        </div>

        {/* URL input */}
        <input
          type="url"
          value={menuUrl}
          onChange={(e) => handleUrlInput(e.target.value)}
          placeholder="https://restaurant.com/menu"
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-wine/50 focus:border-wine transition-all ${
            menuUrl.trim()
              ? "border-green-500 bg-green-50/80 shadow-[0_0_0_2px_rgba(34,197,94,0.15)]"
              : "border-burgundy-300/40 bg-cream"
          }`}
        />
      </div>
    </div>
  );
}
