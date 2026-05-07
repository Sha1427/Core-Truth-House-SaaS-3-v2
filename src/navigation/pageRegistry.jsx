import MethodologyPage from "../pages/MethodologyPage";
import CommandCenter from "../pages/CommandCenter";
import Billing from "../pages/Billing";
import BrandIntelligencePage from "../pages/BrandIntelligencePage";
import BrandAudit from "../pages/BrandAudit";
import BrandFoundation from "../pages/BrandFoundation";
import BrandPositioning from "../pages/BrandPositioning";
import MessagingStructure from "../pages/MessagingStructure";
import Audience from "../pages/Audience";
import AvatarEditor from "../pages/AvatarEditor";
import BrandHealthDashboard from "../pages/BrandHealthDashboard";
import StrategicOS from "../pages/StrategicOS";
import SystemsBuilder from "../pages/SystemsBuilder";
import Analytics from "../pages/Analytics";
import BlogCMS from "../pages/BlogCMS";
import Settings from "../pages/Settings";
import CRMSuite from "../pages/CRMSuite";
import MailSuite from "../pages/MailSuite";
import DocumentManager from "../pages/DocumentManager";
import TenantDataDashboardV2 from "../pages/TenantDataDashboardV2";
import ContentStudio from "../pages/ContentStudio";
import CampaignBuilder from "../pages/CampaignBuilder";
import CampaignSetup from "../pages/CampaignSetup";
import MediaStudio from "../pages/MediaStudio";
import IdentityStudio from "../pages/IdentityStudio";
import OfferBuilder from "../pages/OfferBuilder";
import LaunchPlanner from "../pages/LaunchPlanner";
import Calendar from "../pages/Calendar";
import SocialMediaManager from "../pages/SocialMediaManager";
import CommunityPage from "../pages/CommunityPage";
import VideoTutorialsPage from "../pages/VideoTutorialsPage";
import OnboardingWorkflow from "../pages/OnboardingWorkflow";
import PromptHub from "../pages/PromptHub";
import DemoModePage from "../pages/DemoModePage";

const FirstCampaign = CampaignBuilder;

const pageRegistry = {
  "/onboarding": OnboardingWorkflow,
  "/command-center": CommandCenter,
  "/demo-mode": DemoModePage,
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

  "/content-studio": ContentStudio,
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
