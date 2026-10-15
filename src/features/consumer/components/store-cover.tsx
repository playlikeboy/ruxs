import type { CoverStyle } from "@/config/service-kinds";

/** Store or item artwork: the merchant's photo, or the category's gradient with its emoji. */
export function StoreCover({
  cover,
  imageUrl,
  alt,
  className = "",
  emojiClass = "text-6xl",
}: {
  cover: CoverStyle;
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
      <span className={"drop-shadow-sm " + emojiClass} aria-hidden="true">
        {cover.emoji}
      </span>
    </div>
  );
}
