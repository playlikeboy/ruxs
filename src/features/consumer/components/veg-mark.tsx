/** The familiar Indian veg / non-veg square mark. Nothing when unknown. */
export function VegMark({ isVeg }: { isVeg: boolean | null }) {
  if (isVeg == null) return null;
  return (
    <span
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
      className={"flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] " + (isVeg ? "border-good" : "border-bad")}
    >
      <span className={"h-2 w-2 rounded-full " + (isVeg ? "bg-good" : "bg-bad")} />
      <span className="sr-only">{isVeg ? "Vegetarian" : "Non-vegetarian"}</span>
    </span>
  );
}
