"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Upload, X, Loader2, Play, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { uploadImageAction } from "@/features/assets/actions";
import { MAX_IMAGE_BYTES, getYouTubeEmbedUrl, getYouTubeThumbnailUrl, isValidYouTubeUrl } from "@/core/media";
import { inputClass } from "./field";
import { cn } from "./cn";

async function upload(file: File) {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("name", file.name);
  return uploadImageAction(fd);
}

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
  const inputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setLoading(true);
    try {
      const res = await upload(file);
      if (res.ok && res.url) {
        onChange(res.url);
        toast.success("Image uploaded");
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
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {hint && <p className="text-xs text-muted">{hint}</p>}

      {value ? (
        <div className="relative inline-block overflow-hidden rounded-control border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded preview" className="h-28 w-44 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/75 text-white transition hover:bg-bad"
            aria-label="Remove image"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          aria-busy={loading}
          onClick={() => fileInputRef.current?.click()}
          className="group flex h-24 w-full flex-col items-center justify-center rounded-control border-2 border-dashed border-line bg-surface/60 p-3 transition hover:border-accent/60 hover:bg-surface disabled:cursor-wait"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach/40 text-accent" aria-hidden="true">
                <Upload size={14} />
              </span>
              <span className="text-sm font-medium text-ink">Choose an image to upload</span>
              <span className="text-xs text-muted">PNG, JPG or WEBP, up to 5 MB</span>
            </div>
          )}
        </button>
      )}

      <input id={inputId} ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" tabIndex={-1} />
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
  const labelId = useId();

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
      let skipped = 0;
      for (const f of files) {
        if (!f.type.startsWith("image/") || f.size > MAX_IMAGE_BYTES) {
          skipped++;
          continue;
        }
        const res = await upload(f);
        if (res.ok && res.url) newUrls.push(res.url);
        else skipped++;
      }
      if (skipped > 0) toast.error(`${skipped} file(s) skipped. Use PNG, JPG or WEBP under 5 MB.`);
      if (newUrls.length > 0) {
        onChange([...values, ...newUrls]);
        toast.success(`Uploaded ${newUrls.length} image(s)`);
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
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div>
          {label && (
            <p id={labelId} className="flex items-center gap-1.5 text-sm font-medium text-ink">
              {isCertificate && <ShieldCheck size={14} className="text-good" aria-hidden="true" />}
              {label}
            </p>
          )}
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
        <span className="text-xs font-medium tabular-nums text-muted">
          {values.length}/{max}
        </span>
      </div>

      <div role="group" aria-labelledby={label ? labelId : undefined} className="flex flex-wrap gap-2.5">
        {values.map((url, idx) => (
          <div key={url + idx} className="relative h-20 w-24 overflow-hidden rounded-control border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
            {/* Always visible: hover-only controls are unreachable on touch and by keyboard. */}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/75 text-white transition hover:bg-bad"
              aria-label={`Remove upload ${idx + 1}`}
            >
              <X size={13} aria-hidden="true" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white transition hover:bg-ink/80"
              aria-label={`Open upload ${idx + 1} in a new tab`}
            >
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        ))}

        {values.length < max && (
          <button
            type="button"
            disabled={loading}
            aria-busy={loading}
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-24 flex-col items-center justify-center rounded-control border-2 border-dashed border-line bg-surface/50 text-muted transition hover:border-accent/60 hover:text-ink disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-accent" aria-hidden="true" />
                <span className="sr-only">Uploading…</span>
              </>
            ) : (
              <>
                <Upload size={14} className="mb-0.5 text-accent" aria-hidden="true" />
                <span className="text-xs font-medium">Add {isCertificate ? "certificate" : "image"}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFiles} className="sr-only" tabIndex={-1} aria-hidden="true" />
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
  const inputId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isValid = isValidYouTubeUrl(value);
  const thumbnail = getYouTubeThumbnailUrl(value);
  const embed = getYouTubeEmbedUrl(value);

  // Move focus into the preview and let Escape close it.
  useEffect(() => {
    if (!modalOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}

      <div className="flex gap-2">
        <input
          id={inputId}
          type="url"
          inputMode="url"
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.trim() || null)}
          className={inputClass}
        />
        {isValid && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-sm font-semibold text-ink transition hover:bg-brand-peach/40"
          >
            <Play size={12} fill="currentColor" aria-hidden="true" />
            <span>Test video</span>
          </button>
        )}
      </div>

      {isValid && thumbnail && (
        <div className="relative mt-2 inline-block overflow-hidden rounded-control border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbnail} alt="" className="h-20 w-36 object-cover" />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label="Play preview video"
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/20"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm" aria-hidden="true">
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </span>
          </button>
        </div>
      )}

      {/* Video Modal Preview */}
      {modalOpen && embed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preview video"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-2xl overflow-hidden rounded-card bg-black shadow-2xl">
            <button
              ref={closeRef}
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close video preview"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/40"
            >
              <X size={16} aria-hidden="true" />
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
