import { AppIcon } from "@/components/ui/app-icon";
import type { CoverStyle } from "@/config/service-kinds";

/** Store or item artwork: the merchant's photo, or the category's gradient with its icon. */
export function StoreCover({
  cover,
  imageUrl,
  alt,
  className = "",
  emojiClass = "h-16 w-16",
}: {
  cover: CoverStyle & { id?: string };
  imageUrl?: string | null;
  alt: string;
  className?: string;
  emojiClass?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={alt} loading="lazy" className={"object-cover " + className} />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={"flex items-center justify-center " + className}
      style={{ backgroundImage: `linear-gradient(135deg, ${cover.coverFrom}, ${cover.coverTo})` }}
    >
      <AppIcon name={cover.id} className={"text-brand-deep/80 " + emojiClass} strokeWidth={1.6} />
    </div>
  );
}
