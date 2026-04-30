import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

const TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/accounts-users": "Accounts & Users",
  "/admin/analytics": "Analytics",
  "/admin/help-desk": "Help Desk",
  "/admin/notifications": "Notifications",
  "/admin/onboarding": "Onboarding",
  "/admin/pages": "Pages",
  "/admin/blog": "Blog",
  "/admin/crm": "CRM",
  "/admin/email-marketing": "Email Marketing",
  "/admin/affiliates": "Affiliates",
  "/admin/knowledge-base": "Knowledge Base",
  "/admin/entities": "Entities",
  "/admin/workflows": "Workflows",
  "/admin/api": "API",
  "/admin/playground": "Playground",
  "/admin/events": "Events",
  "/admin/metrics": "Metrics",
  "/admin/settings": "Settings",
};

export default function AdminLayout() {
  const location = useLocation();
  const title = TITLES[location.pathname] || "Admin";

  return (
    <div className="min-h-screen flex bg-[var(--cth-admin-bg)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
