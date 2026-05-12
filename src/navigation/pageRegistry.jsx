import { lazy } from "react";

const MethodologyPage = lazy(() => import("../pages/MethodologyPage"));
const CommandCenter = lazy(() => import("../pages/CommandCenter"));
const Billing = lazy(() => import("../pages/Billing"));
const BrandIntelligencePage = lazy(() => import("../pages/BrandIntelligencePage"));
const BrandAudit = lazy(() => import("../pages/BrandAudit"));
const BrandFoundation = lazy(() => import("../pages/BrandFoundation"));
const BrandPositioning = lazy(() => import("../pages/BrandPositioning"));
const MessagingStructure = lazy(() => import("../pages/MessagingStructure"));
const Audience = lazy(() => import("../pages/Audience"));
const AvatarEditor = lazy(() => import("../pages/AvatarEditor"));
const BrandHealthDashboard = lazy(() => import("../pages/BrandHealthDashboard"));
const StrategicOS = lazy(() => import("../pages/StrategicOS"));
const SystemsBuilder = lazy(() => import("../pages/SystemsBuilder"));
const CustomerJourney = lazy(() => import("../pages/CustomerJourney"));
const Analytics = lazy(() => import("../pages/Analytics"));
const BlogCMS = lazy(() => import("../pages/BlogCMS"));
const Settings = lazy(() => import("../pages/Settings"));
const CRMSuite = lazy(() => import("../pages/CRMSuite"));
const MailSuite = lazy(() => import("../pages/MailSuite"));
const DocumentManager = lazy(() => import("../pages/DocumentManager"));
const TenantDataDashboardV2 = lazy(() => import("../pages/TenantDataDashboardV2"));
const ContentStudio = lazy(() => import("../pages/ContentStudio"));
const CampaignBuilder = lazy(() => import("../pages/CampaignBuilder"));
const CampaignSetup = lazy(() => import("../pages/CampaignSetup"));
const MediaStudio = lazy(() => import("../pages/MediaStudio"));
const IdentityStudio = lazy(() => import("../pages/IdentityStudio"));
const OfferBuilder = lazy(() => import("../pages/OfferBuilder"));
const LaunchPlanner = lazy(() => import("../pages/LaunchPlanner"));
const Calendar = lazy(() => import("../pages/Calendar"));
const SocialMediaManager = lazy(() => import("../pages/SocialMediaManager"));
const CommunityPage = lazy(() => import("../pages/CommunityPage"));
const CohortManager = lazy(() => import("../pages/CohortManager"));
const VideoTutorialsPage = lazy(() => import("../pages/VideoTutorialsPage"));
const OnboardingWorkflow = lazy(() => import("../pages/OnboardingWorkflow"));
const PromptHub = lazy(() => import("../pages/PromptHub"));
const PromptGenerator = lazy(() => import("../pages/PromptGenerator"));

const FirstCampaign = CampaignBuilder;

const pageRegistry = {
  "/onboarding": OnboardingWorkflow,
  "/command-center": CommandCenter,
  "/my-data": TenantDataDashboardV2,

  "/brand-audit": BrandAudit,
  "/brand-memory": BrandFoundation,
  "/brand-foundation": BrandFoundation,
  "/brand-positioning": BrandPositioning,
  "/messaging-structure": MessagingStructure,
  "/audience": Audience,
  "/audience/avatars/new": AvatarEditor,
  "/audience/avatars/:id": AvatarEditor,
  "/brand-intelligence": BrandIntelligencePage,
  "/brand-health": BrandHealthDashboard,
  "/scorecard": BrandHealthDashboard,

  "/strategic-os": StrategicOS,
  "/systems-builder": SystemsBuilder,
  "/customer-journey": CustomerJourney,

  "/content-studio": ContentStudio,
  "/prompt-generator": PromptGenerator,
  "/campaign-builder": CampaignBuilder,
  "/campaign-setup": CampaignSetup,
  "/first-campaign": FirstCampaign,
  "/media-studio": MediaStudio,
  "/identity-studio": IdentityStudio,

  "/offer-builder": OfferBuilder,
  "/launch-planner": LaunchPlanner,

  "/calendar": Calendar,
  "/social-media-manager": SocialMediaManager,
  "/community": CommunityPage,
  "/cohort-manager": CohortManager,

  "/methodology": MethodologyPage,
  "/crm": CRMSuite,
  "/mail": MailSuite,
  "/analytics": Analytics,
  "/blog-cms": BlogCMS,

  "/tutorials": VideoTutorialsPage,
  "/prompt-hub": PromptHub,
  "/documents": TenantDataDashboardV2,
    "/workspace-library": TenantDataDashboardV2,
  "/billing": Billing,
  "/settings": Settings,

  "/workspace": CommandCenter,
};

const routeAliases = {
  "/": "/command-center",
  "/home": "/command-center",
  "/brand": "/brand-foundation",
};

function normalizePath(path) {
  const raw = String(path || "").trim();

  if (!raw) return "/command-center";

  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return routeAliases[normalized] || normalized;
}

export function getPageComponent(path) {
  const normalizedPath = normalizePath(path);
  const component = pageRegistry[normalizedPath];

  if (!component) {
    console.warn(`[pageRegistry] No registered page for path: ${normalizedPath}`);
    return CommandCenter;
  }

  return component;
}

export function hasRegisteredPage(path) {
  const normalizedPath = normalizePath(path);
  return Boolean(pageRegistry[normalizedPath]);
}

export { pageRegistry, normalizePath };
export default pageRegistry;
