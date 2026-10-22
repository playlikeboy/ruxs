"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Play, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { uploadToImgbb } from "@/lib/imgbb";
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl, isValidYouTubeUrl } from "@/core/media";

interface ImageUploadProps {
  label?: string;
  hint?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ImageUpload({ label, hint, value, onChange, className = "" }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file must be under 15MB");
      return;
    }

    setLoading(true);
    try {
      const res = await uploadToImgbb(file, file.name);
      if (res.success && res.url) {
        onChange(res.url);
        toast.success("Image uploaded via ImgBB");
      } else {
        toast.error(res.error || "Upload failed");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <label className="block text-xs font-semibold text-ink">{label}</label>}
      {hint && <p className="text-[11px] text-muted">{hint}</p>}

      {value ? (
        <div className="relative inline-block overflow-hidden rounded-[12px] border border-line bg-surface shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded preview" className="h-28 w-44 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/75 text-white shadow backdrop-blur transition hover:bg-bad"
            title="Remove image"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-line bg-surface/60 p-3 transition hover:border-accent/60 hover:bg-surface"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Loader2 size={16} className="animate-spin" />
              <span>Uploading to ImgBB…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-peach/40 text-accent transition group-hover:scale-105">
                <Upload size={14} />
              </div>
              <span className="text-xs font-medium text-ink">Click or drop image to upload</span>
              <span className="text-[10px] text-muted">PNG, JPG, WEBP up to 15MB</span>
            </div>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  );
}

interface MultiImageUploadProps {
  label?: string;
  hint?: string;
  values?: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  className?: string;
  isCertificate?: boolean;
}

export function MultiImageUpload({
  label,
  hint,
  values = [],
  onChange,
  max = 10,
  className = "",
  isCertificate = false,
}: MultiImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    if (values.length + files.length > max) {
      toast.error(`You can upload at most ${max} items.`);
      return;
    }

    setLoading(true);
    const newUrls: string[] = [];
    try {
      for (const f of files) {
        if (!f.type.startsWith("image/")) continue;
        const res = await uploadToImgbb(f, f.name);
        if (res.success && res.url) {
          newUrls.push(res.url);
        }
      }
      if (newUrls.length > 0) {
        onChange([...values, ...newUrls]);
        toast.success(`Uploaded ${newUrls.length} image(s) to ImgBB`);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          {label && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              {isCertificate && <ShieldCheck size={14} className="text-good" />}
              {label}
            </label>
          )}
          {hint && <p className="text-[11px] text-muted">{hint}</p>}
        </div>
        <span className="text-[11px] font-medium text-muted">
          {values.length}/{max}
        </span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {values.map((url, idx) => (
          <div key={url + idx} className="group relative h-20 w-24 overflow-hidden rounded-[10px] border border-line bg-surface shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/75 text-white opacity-0 transition group-hover:opacity-100 hover:bg-bad"
              title="Remove"
            >
              <X size={12} />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded bg-ink/60 text-white opacity-0 transition group-hover:opacity-100"
              title="Open full image"
            >
              <ExternalLink size={10} />
            </a>
          </div>
        ))}

        {values.length < max && (
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-24 flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-line bg-surface/50 text-muted transition hover:border-accent/60 hover:text-ink disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-accent" />
            ) : (
              <>
                <Upload size={14} className="mb-0.5 text-accent" />
                <span className="text-[10px] font-medium">Add {isCertificate ? "certificate" : "image"}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFiles} className="hidden" />
    </div>
  );
}

interface VideoInputProps {
  label?: string;
  hint?: string;
  placeholder?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function VideoInput({
  label = "Preview Video (YouTube URL)",
  hint = "Parents can watch your demo class, teaching, or performance",
  placeholder = "https://www.youtube.com/watch?v=...",
  value,
  onChange,
  className = "",
}: VideoInputProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isValid = isValidYouTubeUrl(value);
  const thumbnail = getYouTubeThumbnailUrl(value);
  const embed = getYouTubeEmbedUrl(value);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold text-ink">{label}</label>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}

      <div className="flex gap-2">
        <input
          type="url"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.trim() || null)}
          className="min-h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {isValid && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-[10px] bg-red-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-red-700"
          >
            <Play size={12} fill="currentColor" />
            <span>Test Video</span>
          </button>
        )}
      </div>

      {isValid && thumbnail && (
        <div className="relative mt-2 inline-block overflow-hidden rounded-[10px] border border-line shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail} alt="YouTube thumbnail" className="h-20 w-36 object-cover" />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/20"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm">
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </span>
          </button>
        </div>
      )}

      {/* Video Modal Preview */}
      {modalOpen && embed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40"
            >
              <X size={16} />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={embed + "&autoplay=1"}
                title="Preview video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
