import type { VendorType } from "../vendor-types";

/** The kids catalogue category a class provider lists under by default. */
const DEFAULT_KIDS_CATEGORY: Partial<Record<VendorType, string>> = {
  kids_academics: "academics",
  kids_institutions: "academics",
  kids_stem: "stem",
  kids_school_projects: "stem",
  kids_performing_arts: "performing-arts",
  kids_arts_crafts: "art-craft",
  kids_life_skills: "life-skills",
  kids_sports_fitness: "life-skills",
  kids_camps: "holiday",
};

export function defaultKidsCategory(type: VendorType, available: readonly { id: string }[]): string {
  const wanted = DEFAULT_KIDS_CATEGORY[type];
  return available.find((c) => c.id === wanted)?.id ?? available[0]?.id ?? "";
}
