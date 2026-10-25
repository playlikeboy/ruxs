import { CoverArt } from "@/components/ui/cover-art";
import type { CoverStyle } from "@/config/service-kinds";

/** Store or item artwork: the category's drawn illustration, never a photo. */
export function StoreCover({
  cover,
  alt,
  className = "",
}: {
  cover: CoverStyle & { id?: string };
  alt: string;
  className?: string;
}) {
  return <CoverArt theme={cover.id} label={alt || undefined} className={"overflow-hidden " + className} />;
}
