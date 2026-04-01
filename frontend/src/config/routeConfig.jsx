import {
  LayoutDashboard,
  Shield,
  Search,
  Brain,
  Activity,
  Gauge,
  Zap,
  PenTool,
  Megaphone,
  Image,
  Sparkles,
  Package,
  Rocket,
  CalendarDays,
  Users,
  BarChart3,
  PlayCircle,
  FileText,
  CreditCard,
  Settings,
  Store,
  Database,
} from "lucide-react";

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
  { id: "admin", label: "Admin" },
  { id: "brandFoundation", label: "Brand Foundation" },
  { id: "strategicOS", label: "Strategic OS" },
  { id: "contentTools", label: "Content Tools" },
  { id: "offersSystems", label: "Offers and Systems" },
  { id: "distribution", label: "Distribution" },
  { id: "businessTools", label: "Business Tools" },
  { id: "account", label: "Account" },
];

export const ROUTES = [
  {
    path: "/admin",
    label: "Super Admin",
    icon: Shield,
    group: "admin",
    requiredPlan: null,
    gateType: null,
    adminOnly: true,
    superAdminOnly: true,
    tooltip: "Platform-level tenant management, billing overview, and AI configuration.",
  },
  {
    path: "/onboarding",
    label: "Onboarding",
    group: "admin",
    requiredPlan: null,
    gateType: null,
    hidden: true,
    tooltip: "Guided brand OS setup journey.",
  },
  {
    path: "/command-center",
    label: "Command Center",
    icon: LayoutDashboard,
    group: "admin",
    requiredPlan: null,
    gateType: null,
    tooltip: "Your workspace overview - brand health, journey progress, and quick access to every module.",
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    group: "admin",
    hidden: true,
    requiredPlan: null,
    gateType: null,
    redirectTo: "/command-center",
    tooltip: "Redirects to Command Center.",
  },
  {
    path: "/my-data",
    label: "My Data",
    icon: Database,
    group: "admin",
    requiredPlan: null,
    gateType: null,
    isNew: true,
    tooltip: "View all your stored brand data - Brand Memory, Foundation, Strategic OS, campaigns, documents, and more.",
  },

  {
    path: "/brand-audit",
    label: "Brand Audit",
    icon: Search,
    group: "brandFoundation",
    requiredPlan: null,
    gateType: null,
    tooltip: "Run a diagnostic across your brand and get a priority action plan.",
  },
  {
    path: "/brand-intelligence",
    label: "Brand Intelligence",
    icon: Brain,
    group: "brandFoundation",
    requiredPlan: null,
    gateType: null,
    tooltip: "Everything the platform knows about your brand - Brand Memory + Brand Foundation in one place.",
  },
  {
    path: "/brand-foundation",
    label: "Brand Foundation",
    group: "brandFoundation",
    hidden: true,
    requiredPlan: null,
    gateType: null,
    redirectTo: "/brand-intelligence?tab=foundation",
    tooltip: "Redirects to Brand Intelligence.",
  },
  {
    path: "/brand-memory",
    label: "Brand Memory",
    group: "brandFoundation",
    hidden: true,
    requiredPlan: null,
    gateType: null,
    redirectTo: "/brand-intelligence?tab=memory",
    tooltip: "Redirects to Brand Intelligence.",
  },
  {
    path: "/brand-health",
    label: "Brand Health",
    icon: Activity,
    group: "brandFoundation",
    requiredPlan: "foundation",
    gateType: "page",
    tooltip: "Track your brand consistency score across every generated output.",
    lockedTooltip: "Unlock Brand Health on The Foundation plan to track consistency as you generate content.",
  },
  {
    path: "/audit",
    label: "Brand Audit Legacy",
    group: "brandFoundation",
    hidden: true,
    requiredPlan: null,
    gateType: null,
    redirectTo: "/brand-audit",
    tooltip: "Redirects to Brand Audit.",
  },
  {
  path: "/scorecard",
  label: "Brand Scorecard",
  icon: Gauge,
  group: "brandFoundation",
  requiredPlan: "foundation",
  gateType: "page",
  tooltip: "KPI dashboard for brand performance, content health, and growth over time.",
  lockedTooltip: "Unlock the Brand Scorecard on The Foundation plan once you start generating content.",
},

  {
    path: "/strategic-os",
    label: "Strategic OS",
    icon: Zap,
    group: "strategicOS",
    badge: "New",
    requiredPlan: "foundation",
    gateType: "partial",
    tooltip: "The 9-step brand strategy engine - audience, positioning, content pillars, and monetization.",
    lockedTooltip: "Unlock the full Strategic OS on The Foundation plan. Step 1 is free to preview.",
  },

  {
    path: "/content-studio",
    label: "Content Studio",
    icon: PenTool,
    group: "contentTools",
    requiredPlan: null,
    gateType: null,
    tooltip: "Create on-brand written content.",
  },
  {
    path: "/campaign-builder",
    label: "Campaign Builder",
    icon: Megaphone,
    group: "contentTools",
    requiredPlan: "foundation",
    gateType: "page",
    tooltip: "Build campaigns from your brand strategy.",
    lockedTooltip: "Unlock Campaign Builder on The Foundation plan.",
  },
  {
    path: "/media-studio",
    label: "Media Studio",
    icon: Image,
    group: "contentTools",
    requiredPlan: null,
    gateType: null,
    tooltip: "Generate visual assets and media prompts.",
  },
  {
    path: "/identity-studio",
    label: "Identity Studio",
    icon: Sparkles,
    group: "contentTools",
    requiredPlan: null,
    gateType: null,
    tooltip: "Manage your visual identity system.",
  },

  {
    path: "/offer-builder",
    label: "Offer Builder",
    icon: Package,
    group: "offersSystems",
    requiredPlan: null,
    gateType: null,
    tooltip: "Document and structure your offers.",
  },
  {
    path: "/launch-planner",
    label: "Launch Planner",
    icon: Rocket,
    group: "offersSystems",
    requiredPlan: "foundation",
    gateType: "page",
    tooltip: "Plan launches and rollout sequences.",
    lockedTooltip: "Unlock Launch Planner on The Foundation plan.",
  },

  {
    path: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    group: "distribution",
    requiredPlan: null,
    gateType: null,
    tooltip: "Schedule content, launches, and important dates.",
  },

  {
    path: "/contacts",
    label: "Contacts",
    icon: Users,
    group: "businessTools",
    requiredPlan: null,
    gateType: null,
    tooltip: "Manage your contact records.",
  },
  {
    path: "/crm",
    label: "CRM",
    icon: Users,
    group: "businessTools",
    requiredPlan: "foundation",
    gateType: "page",
    tooltip: "Manage pipelines and lead movement.",
    lockedTooltip: "Unlock CRM on The Foundation plan.",
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    group: "businessTools",
    requiredPlan: "foundation",
    gateType: "page",
    tooltip: "Track performance across campaigns and content.",
    lockedTooltip: "Unlock Analytics on The Foundation plan.",
  },

  {
    path: "/tutorials",
    label: "Video Tutorials",
    icon: PlayCircle,
    group: "account",
    requiredPlan: null,
    gateType: null,
    badge: "New",
    tooltip: "Step-by-step video walkthroughs for every module in the platform.",
  },
  {
    path: "/documents",
    label: "Documents",
    icon: FileText,
    group: "account",
    requiredPlan: "foundation",
    gateType: "page",
    tooltip: "Brand document storage for SOPs, guidelines, and strategic references.",
    lockedTooltip: "Unlock Documents on The Foundation plan.",
  },
  {
    path: "/billing",
    label: "Billing",
    icon: CreditCard,
    group: "account",
    requiredPlan: null,
    gateType: null,
    tooltip: "Manage your plan, view credit usage, and purchase credit top-ups.",
  },
  {
    path: "/settings",
    label: "Settings",
    icon: Settings,
    group: "account",
    requiredPlan: null,
    gateType: null,
    tooltip: "Workspace name, display preferences, notifications, and integrations.",
  },
  {
    path: "/store",
    label: "Store",
    icon: Store,
    group: "account",
    requiredPlan: null,
    gateType: null,
    tooltip: "Browse and purchase digital products from Core Truth House.",
  },
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
