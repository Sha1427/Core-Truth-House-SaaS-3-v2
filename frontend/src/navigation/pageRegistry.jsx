// frontend/src/navigation/pageRegistry.jsx

import React from "react";

import CommandCenter from "../pages/CommandCenter";
import Dashboard from "../pages/Dashboard";
import Billing from "../pages/Billing";
import BrandIntelligencePage from "../pages/BrandIntelligencePage";
import BrandAudit from "../pages/BrandAudit";
import BrandHealthDashboard from "../pages/BrandHealthDashboard";
import BrandScorecard from "../pages/BrandScorecard";
import StrategicOS from "../pages/StrategicOS";
import Analytics from "../pages/Analytics";
import DigitalStore from "../pages/DigitalStore";
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
import ContactPage from "../pages/ContactPage";
import VideoTutorialsPage from "../pages/VideoTutorialsPage";
import OnboardingWorkflow from "../pages/OnboardingWorkflow";

const pageRegistry = {
  "/admin": AdminDashboard,
  "/onboarding": OnboardingWorkflow,
  "/command-center": CommandCenter,
  "/dashboard": Dashboard,

  "/my-data": TenantDataDashboard,

  "/brand-audit": BrandAudit,
  "/brand-intelligence": BrandIntelligencePage,
  "/brand-foundation": BrandIntelligencePage,
  "/brand-memory": BrandIntelligencePage,
  "/brand-health": BrandHealthDashboard,
  "/audit": BrandAudit,
  "/scorecard": BrandScorecard,

  "/strategic-os": StrategicOS,

  "/content-studio": ContentStudio,
  "/campaign-builder": CampaignBuilder,
  "/media-studio": MediaStudio,
  "/identity-studio": IdentityStudio,

  "/offer-builder": OfferBuilder,
  "/launch-planner": LaunchPlanner,

  "/calendar": Calendar,

  "/contacts": ContactPage,
  "/crm": CRMSuite,
  "/analytics": Analytics,

  "/tutorials": VideoTutorialsPage,
  "/documents": DocumentManager,
  "/billing": Billing,
  "/settings": Settings,
  "/store": DigitalStore,

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
  return pageRegistry[normalizedPath] || CommandCenter;
}

export function hasRegisteredPage(path) {
  const normalizedPath = normalizePath(path);
  return Boolean(pageRegistry[normalizedPath]);
}

export { pageRegistry, normalizePath };
export default pageRegistry;
