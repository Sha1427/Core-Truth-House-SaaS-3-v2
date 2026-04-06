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

function PlaceholderPage({ title, description }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "#0D0010",
        color: "#F0E6E4",
      }}
    >
      <h1 style={{ marginBottom: "0.75rem" }}>{title}</h1>
      <p style={{ opacity: 0.8 }}>
        {description || "This route is registered, but the page is not wired yet."}
      </p>
    </div>
  );
}

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

  // helpful aliases
  "/workspace": CommandCenter,
};

export function getPageComponent(path) {
  if (!path) {
    return () => <PlaceholderPage title="Unknown Route" />;
  }

  return (
    pageRegistry[path] ||
    (() => (
      <PlaceholderPage
        title="Page not found"
        description={`No page component is mapped for route: ${path}`}
      />
    ))
  );
}

export { pageRegistry };
export default pageRegistry;