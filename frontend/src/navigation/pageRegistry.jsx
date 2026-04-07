import CommandCenter from "../pages/CommandCenter";
import Billing from "../pages/Billing";
import BrandIntelligencePage from "../pages/BrandIntelligencePage";
import BrandAudit from "../pages/BrandAudit";
import BrandHealthDashboard from "../pages/BrandHealthDashboard";
import BrandScorecard from "../pages/BrandScorecard";
import StrategicOS from "../pages/StrategicOS";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import CRMSuite from "../pages/CRMSuite";
import DocumentManager from "../pages/DocumentManager";
import AdminDashboard from "../pages/AdminDashboard";
import TenantDataDashboard from "../pages/TenantDataDashboard";
import ContentStudio from "../pages/ContentStudio";
import CampaignBuilder from "../pages/CampaignBuilder";
import MediaStudio from "../pages/MediaStudio";
import IdentityStudio from "../pages/IdentityStudio";
import OfferBuilder from "../pages/OfferBuilder";
import LaunchPlanner from "../pages/LaunchPlanner";
import Calendar from "../pages/Calendar";
import VideoTutorialsPage from "../pages/VideoTutorialsPage";
import OnboardingWorkflow from "../pages/OnboardingWorkflow";
// import ContactsPage from "../pages/ContactsPage";

const pageRegistry = {
  "/admin": AdminDashboard,
  "/onboarding": OnboardingWorkflow,
  "/command-center": CommandCenter,
  "/my-data": TenantDataDashboard,

  "/brand-audit": BrandAudit,
  "/brand-intelligence": BrandIntelligencePage,
  "/brand-health": BrandHealthDashboard,
  "/scorecard": BrandScorecard,

  "/strategic-os": StrategicOS,

  "/content-studio": ContentStudio,
  "/campaign-builder": CampaignBuilder,
  "/media-studio": MediaStudio,
  "/identity-studio": IdentityStudio,

  "/offer-builder": OfferBuilder,
  "/launch-planner": LaunchPlanner,

  "/calendar": Calendar,

  // "/contacts": ContactsPage,
  "/crm": CRMSuite,
  "/analytics": Analytics,

  "/tutorials": VideoTutorialsPage,
  "/documents": DocumentManager,
  "/billing": Billing,
  "/settings": Settings,

  "/workspace": CommandCenter,
};

const routeAliases = {
  "/": "/command-center",
  "/home": "/command-center",
  "/brand": "/brand-intelligence",
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
