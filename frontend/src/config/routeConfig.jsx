import { APP_ROUTES } from "./appRoutes";
import { ADMIN_ROUTES } from "./adminRoutes";
import { REDIRECT_ROUTES } from "./redirectRoutes";

export const PLAN_ORDER = ["free", "audit", "foundation", "structure", "house", "estate", "legacy"];

export const PLAN_LABELS = {
  free: "Free",
  audit: "Brand Audit",
  foundation: "The Foundation - $47/mo",
  structure: "The Structure - $97/mo",
  house: "The House - $197/mo",
  estate: "The Estate - $397/mo",
  legacy: "Legacy",
};

export const TOOLTIP_COPY = {
  lockedDefault: "Upgrade your plan to unlock this feature.",
  adminOnly: "This area is only available to administrators.",
  superAdminOnly: "This area is only available to the super admin.",
  comingSoon: "This feature is coming soon.",
};

export const SIDEBAR_GROUPS = [
  { id: "platformAdmin", label: "Admin" },
  { id: "workspaceCore", label: "Workspace" },
  { id: "brandFoundation", label: "Brand Foundation" },
  { id: "strategicOS", label: "Strategic OS" },
  { id: "contentTools", label: "Content Tools" },
  { id: "offersSystems", label: "Offers and Systems" },
  { id: "distribution", label: "Distribution" },
  { id: "businessTools", label: "Business Tools" },
  { id: "account", label: "Account" },
];

export const ROUTES = [
  ...ADMIN_ROUTES,
  ...APP_ROUTES,
  ...REDIRECT_ROUTES.map((route) => ({
    ...route,
    hidden: true,
    requiredPlan: null,
    gateType: null,
  })),
];

export function getRoute(path) {
  return ROUTES.find((route) => route.path === path) || null;
}

export function getRoutesByGroup(groupId) {
  return ROUTES.filter((route) => route.group === groupId && !route.hidden);
}

export function isGated(path, userPlan = "free") {
  const route = getRoute(path);
  if (!route?.requiredPlan) return false;
  return PLAN_ORDER.indexOf(userPlan) < PLAN_ORDER.indexOf(route.requiredPlan);
}

export function getTooltipText(path, userPlan = "free") {
  const route = getRoute(path);
  if (!route) return "";
  if (isGated(path, userPlan) && route.lockedTooltip) return route.lockedTooltip;
  return route.tooltip || "";
}
