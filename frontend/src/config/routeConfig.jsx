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
  { id: "workspaceCore", label: "Dashboard" },
  { id: "brandFoundation", label: "Brand Core" },
  { id: "structure", label: "Systems" },
  { id: "execution", label: "Content + Growth" },
  { id: "insightsOps", label: "Business Tools" },
  { id: "library", label: "Workspace" },
  { id: "help", label: "Support" },
  { id: "account", label: "Billing + Account" },
  { id: "platformAdmin", label: "Admin" },
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

const GROUP_ROUTE_ORDER = {
  workspaceCore: [
    "/command-center",
  ],
  brandFoundation: [
    "/brand-audit",
    "/brand-foundation",
    "/identity-studio",
    "/strategic-os",
  ],
  structure: [
    "/systems-builder",
    "/offer-builder",
  ],
  execution: [
    "/content-studio",
    "/campaign-builder",
    "/media-studio",
  ],
  insightsOps: [
    "/crm",
    "/contacts",
    "/calendar",
    "/blog-cms",
    "/social-media-manager",
  ],
  library: [
    "/my-data",
    "/prompt-hub",
  ],
  help: [
    "/tutorials",
  ],
  account: [
    "/billing",
    "/settings",
    "/store",
  ],
};

function sortRoutesForGroup(groupId, routes) {
  const preferredOrder = GROUP_ROUTE_ORDER[groupId];
  if (!preferredOrder) return routes;

  const orderMap = new Map(preferredOrder.map((path, index) => [path, index]));

  return [...routes].sort((a, b) => {
    const aIndex = orderMap.has(a.path) ? orderMap.get(a.path) : Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.has(b.path) ? orderMap.get(b.path) : Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) return aIndex - bIndex;
    return String(a.label || "").localeCompare(String(b.label || ""));
  });
}

export function getRoutesByGroup(groupId) {
  const routes = ROUTES.filter((route) => route.group === groupId && !route.hidden);
  return sortRoutesForGroup(groupId, routes);
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
