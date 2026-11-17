/**
 * Names and pages for each strategy level. Plain data with no server imports, so the sidebar
 * (a client component) and server pages share one source of truth.
 * The database keeps the Scaling Up keys: "bhag" is shown as North Star, "target" as 3–5 Year Goal.
 */
export type Level = "bhag" | "target" | "annual" | "rock";

export const LEVELS: Record<
  Level,
  {
    /** Singular name, e.g. "Annual Goal". */
    label: string;
    plural: string;
    /** Compact tag shown above titles in lists. */
    short: string;
    /** The sidebar page that lists every item at this level. */
    path: string;
    parent: Level | null;
    child: Level | null;
    hint: string;
  }
> = {
  bhag: {
    label: "North Star",
    plural: "North Star",
    short: "North Star",
    path: "/strategy/north-star",
    parent: null,
    child: "target",
    hint: "Your BHAG (Big Hairy Audacious Goal): a 10–25 year, mountain-sized goal that is roughly 70% achievable.",
  },
  target: {
    label: "3–5 Year Goal",
    plural: "3–5 Year Goals",
    short: "3–5 yr",
    path: "/strategy/3-5-year",
    parent: "bhag",
    child: "annual",
    hint: "Mid-range financial and operational targets that bridge the North Star and the near future.",
  },
  annual: {
    label: "Annual Goal",
    plural: "Annual Goals",
    short: "Annual",
    path: "/strategy/annual",
    parent: "target",
    child: "rock",
    hint: "Concrete, measurable targets for the year.",
  },
  rock: {
    label: "Quarterly Rock",
    plural: "Quarterly Rocks",
    short: "Rock",
    path: "/strategy/rocks",
    parent: "annual",
    child: null,
    hint: "The 3–5 critical priorities for the next 90 days. Initiatives deliver Rocks.",
  },
};

export const LEVEL_ORDER: Level[] = ["bhag", "target", "annual", "rock"];
