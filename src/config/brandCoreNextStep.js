// Tier-aware "Next Step" map for Brand Core and post-Brand-Core flow.
//
// Each entry under a path is keyed by plan tier. The leaf is one of:
//   { href, label, copy }                         // normal next-step CTA
//   { upgradeTo, ctaLabel, copy }                 // paywall prompt → /billing
//
// Pages call getNextStep(currentPath, plan) and render whichever shape comes back.

export const NEXT_STEP_MAP = {
  "/brand-foundation": {
    foundation: {
      href: "/brand-positioning",
      label: "Open Brand Positioning",
      copy: "Move into Brand Positioning and lock the category, audience, and differentiator your brand owns.",
    },
    structure: {
      href: "/brand-positioning",
      label: "Open Brand Positioning",
      copy: "Move into Brand Positioning and lock the category, audience, and differentiator your brand owns.",
    },
    house: {
      href: "/brand-positioning",
      label: "Open Brand Positioning",
      copy: "Move into Brand Positioning and lock the category, audience, and differentiator your brand owns.",
    },
    estate: {
      href: "/brand-positioning",
      label: "Open Brand Positioning",
      copy: "Move into Brand Positioning and lock the category, audience, and differentiator your brand owns.",
    },
  },

  "/brand-positioning": {
    foundation: {
      href: "/messaging-structure",
      label: "Open Messaging Structure",
      copy: "Move into Messaging Structure and turn your positioning into the brand promise, pitch, one-liner, and core message your brand speaks from.",
    },
    structure: {
      href: "/messaging-structure",
      label: "Open Messaging Structure",
      copy: "Move into Messaging Structure and turn your positioning into the brand promise, pitch, one-liner, and core message your brand speaks from.",
    },
    house: {
      href: "/messaging-structure",
      label: "Open Messaging Structure",
      copy: "Move into Messaging Structure and turn your positioning into the brand promise, pitch, one-liner, and core message your brand speaks from.",
    },
    estate: {
      href: "/messaging-structure",
      label: "Open Messaging Structure",
      copy: "Move into Messaging Structure and turn your positioning into the brand promise, pitch, one-liner, and core message your brand speaks from.",
    },
  },

  "/messaging-structure": {
    foundation: {
      href: "/audience",
      label: "Open Audience",
      copy: "Move into Audience and build the avatars and profiles your messaging will speak to.",
    },
    structure: {
      href: "/audience",
      label: "Open Audience",
      copy: "Move into Audience and build the avatars and profiles your messaging will speak to.",
    },
    house: {
      href: "/audience",
      label: "Open Audience",
      copy: "Move into Audience and build the avatars and profiles your messaging will speak to.",
    },
    estate: {
      href: "/audience",
      label: "Open Audience",
      copy: "Move into Audience and build the avatars and profiles your messaging will speak to.",
    },
  },

  "/audience": {
    foundation: {
      href: "/identity-studio",
      label: "Open Identity Studio",
      copy: "Move into Identity Studio and give your audience a visual identity they recognize on sight.",
    },
    structure: {
      href: "/identity-studio",
      label: "Open Identity Studio",
      copy: "Move into Identity Studio and give your audience a visual identity they recognize on sight.",
    },
    house: {
      href: "/identity-studio",
      label: "Open Identity Studio",
      copy: "Move into Identity Studio and give your audience a visual identity they recognize on sight.",
    },
    estate: {
      href: "/identity-studio",
      label: "Open Identity Studio",
      copy: "Move into Identity Studio and give your audience a visual identity they recognize on sight.",
    },
  },

  "/identity-studio": {
    foundation: {
      href: "/strategic-os",
      label: "Open Strategic OS",
      copy: "Move into Strategic OS and turn your foundation, positioning, audience, and identity into a working brand strategy.",
    },
    structure: {
      href: "/strategic-os",
      label: "Open Strategic OS",
      copy: "Move into Strategic OS and turn your foundation, positioning, audience, and identity into a working brand strategy.",
    },
    house: {
      href: "/strategic-os",
      label: "Open Strategic OS",
      copy: "Move into Strategic OS and turn your foundation, positioning, audience, and identity into a working brand strategy.",
    },
    estate: {
      href: "/strategic-os",
      label: "Open Strategic OS",
      copy: "Move into Strategic OS and turn your foundation, positioning, audience, and identity into a working brand strategy.",
    },
  },

  "/strategic-os": {
    foundation: {
      upgradeTo: "structure",
      ctaLabel: "Upgrade to The Structure",
      copy: "You've finished Brand Core. Upgrade to The Structure to turn this strategy into campaigns, offers, content, and the systems behind them.",
    },
    structure: {
      href: "/campaign-builder",
      label: "Open Campaign Builder",
      copy: "Move into Campaign Builder and turn this strategy into a launch sequence you can run.",
    },
    house: {
      href: "/campaign-builder",
      label: "Open Campaign Builder",
      copy: "Move into Campaign Builder and turn this strategy into a launch sequence you can run.",
    },
    estate: {
      href: "/campaign-builder",
      label: "Open Campaign Builder",
      copy: "Move into Campaign Builder and turn this strategy into a launch sequence you can run.",
    },
  },

  "/campaign-builder": {
    structure: {
      href: "/offer-builder",
      label: "Open Offer Builder",
      copy: "Move into Offer Builder and shape the offer this campaign is going to sell.",
    },
    house: {
      href: "/offer-builder",
      label: "Open Offer Builder",
      copy: "Move into Offer Builder and shape the offer this campaign is going to sell.",
    },
    estate: {
      href: "/offer-builder",
      label: "Open Offer Builder",
      copy: "Move into Offer Builder and shape the offer this campaign is going to sell.",
    },
  },

  "/offer-builder": {
    structure: {
      href: "/content-studio",
      label: "Open Content Studio",
      copy: "Move into Content Studio and produce the content that carries this offer to your audience.",
    },
    house: {
      href: "/content-studio",
      label: "Open Content Studio",
      copy: "Move into Content Studio and produce the content that carries this offer to your audience.",
    },
    estate: {
      href: "/content-studio",
      label: "Open Content Studio",
      copy: "Move into Content Studio and produce the content that carries this offer to your audience.",
    },
  },

  "/content-studio": {
    structure: {
      href: "/systems-builder",
      label: "Open Systems Builder",
      copy: "Move into Systems Builder and lock in the workflows that keep this content engine running.",
    },
    house: {
      href: "/systems-builder",
      label: "Open Systems Builder",
      copy: "Move into Systems Builder and lock in the workflows that keep this content engine running.",
    },
    estate: {
      href: "/systems-builder",
      label: "Open Systems Builder",
      copy: "Move into Systems Builder and lock in the workflows that keep this content engine running.",
    },
  },

  "/systems-builder": {
    structure: {
      upgradeTo: "house",
      ctaLabel: "Upgrade to The House",
      copy: "You've finished Structure. Upgrade to The House to unlock Media Studio, Launch Planner, Social Planner, CRM, Brand Kit Export, and the full production layer that turns your brand system into visible execution.",
    },
    house: {
      href: "/customer-journey",
      label: "Open Customer Journey",
      copy: "Map how your ideal client moves from stranger to buyer to advocate across all 8 stages of their journey.",
    },
    estate: {
      href: "/customer-journey",
      label: "Open Customer Journey",
      copy: "Map how your ideal client moves from stranger to buyer to advocate across all 8 stages of their journey.",
    },
  },

  "/customer-journey": {
    structure: {
      href: "/offer-builder",
      label: "Open Offer Builder",
      copy: "Move into Offer Builder and shape the offers that match the journey you just mapped.",
    },
    house: {
      href: "/offer-builder",
      label: "Open Offer Builder",
      copy: "Move into Offer Builder and shape the offers that match the journey you just mapped.",
    },
    estate: {
      href: "/offer-builder",
      label: "Open Offer Builder",
      copy: "Move into Offer Builder and shape the offers that match the journey you just mapped.",
    },
  },
};

export function getNextStep(path, plan) {
  const entry = NEXT_STEP_MAP[path];
  if (!entry) return null;
  const normalizedPlan = String(plan || "foundation").toLowerCase();
  return entry[normalizedPlan] || entry.foundation || null;
}
