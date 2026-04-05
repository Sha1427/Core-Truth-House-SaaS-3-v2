import React from "react";

import CommandCenter from "../pages/CommandCenter";
import Billing from "../pages/Billing";
import BrandIntelligencePage from "../pages/BrandIntelligencePage";
import BrandAudit from "../pages/BrandAudit";
import StrategicOS from "../pages/StrategicOS";
import Analytics from "../pages/Analytics";
import DigitalStore from "../pages/DigitalStore";
import Settings from "../pages/Settings";
import CRMSuite from "../pages/CRMSuite";
import DocumentManager from "../pages/DocumentManager";
import AdminDashboard from "../pages/AdminDashboard";
import MediaStudio from "../pages/MediaStudio";

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
  "/command-center": CommandCenter,
  "/dashboard": CommandCenter,
  "/billing": Billing,
  "/brand-intelligence": BrandIntelligencePage,
  "/brand-audit": BrandAudit,
  "/strategic-os": StrategicOS,
  "/analytics": Analytics,
  "/store": DigitalStore,
  "/settings": Settings,
  "/crm": CRMSuite,
  "/documents": DocumentManager,
  "/admin": AdminDashboard,

  // FULLY WIRED REAL PAGE
  "/media-studio": MediaStudio,

  // placeholders
  "/campaign-builder": () => <PlaceholderPage title="Campaign Builder" />,
  "/content-studio": () => <PlaceholderPage title="Content Studio" />,
  "/workspace": () => <PlaceholderPage title="Workspace" />,
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