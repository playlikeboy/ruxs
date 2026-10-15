import { getServiceKind } from "@/config/service-kinds";

/** Store or item artwork: the merchant's photo, or a soft gradient with the service emoji. */
export function StoreCover({
  kind,
  imageUrl,
  alt,
  className = "",
  emojiClass = "text-6xl",
}: {
  kind: string;
  imageUrl?: string | null;
  alt: string;
  className?: string;
  emojiClass?: string;
}) {
  const config = getServiceKind(kind);
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
      className={"flex items-center justify-center bg-gradient-to-br " + config.cover + " " + className}
    >
      <span className={"drop-shadow-sm " + emojiClass} aria-hidden="true">
        {config.emoji}
      </span>
    </div>
  );
}
