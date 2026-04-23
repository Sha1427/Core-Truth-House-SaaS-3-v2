import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminLayout from "./AdminLayout";
import AdminSignInPage from "./auth/AdminSignInPage";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminAccountsUsersPage from "./pages/AdminAccountsUsersPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminHelpDeskPage from "./pages/AdminHelpDeskPage";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import AdminOnboardingPage from "./pages/AdminOnboardingPage";
import AdminPagesPage from "./pages/AdminPagesPage";
import AdminBlogPage from "./pages/AdminBlogPage";
import AdminCRMPage from "./pages/AdminCRMPage";
import AdminEmailMarketingPage from "./pages/AdminEmailMarketingPage";
import AdminAffiliatesPage from "./pages/AdminAffiliatesPage";
import AdminKnowledgeBasePage from "./pages/AdminKnowledgeBasePage";
import AdminEntitiesPage from "./pages/AdminEntitiesPage";
import AdminWorkflowsPage from "./pages/AdminWorkflowsPage";
import AdminApiPage from "./pages/AdminApiPage";
import AdminPlaygroundPage from "./pages/AdminPlaygroundPage";
import AdminEventsPage from "./pages/AdminEventsPage";
import AdminMetricsPage from "./pages/AdminMetricsPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminStoreProductsPage from "./pages/AdminStoreProductsPage";
import AdminStoreOrdersPage from "./pages/AdminStoreOrdersPage";

export default function AdminRouter() {
  return (
    <Routes>
      <Route path="sign-in" element={<AdminSignInPage />} />
      <Route path="" element={<Navigate to="/admin/dashboard" replace />} />

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="accounts-users" element={<AdminAccountsUsersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="help-desk" element={<AdminHelpDeskPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="onboarding" element={<AdminOnboardingPage />} />

          <Route path="pages" element={<AdminPagesPage />} />
          <Route path="blog" element={<AdminBlogPage />} />
          <Route path="crm" element={<AdminCRMPage />} />
          <Route path="email-marketing" element={<AdminEmailMarketingPage />} />
          <Route path="affiliates" element={<AdminAffiliatesPage />} />
          <Route path="knowledge-base" element={<AdminKnowledgeBasePage />} />

          <Route path="entities" element={<AdminEntitiesPage />} />
          <Route path="workflows" element={<AdminWorkflowsPage />} />
          <Route path="api" element={<AdminApiPage />} />
          <Route path="playground" element={<AdminPlaygroundPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="metrics" element={<AdminMetricsPage />} />

          <Route path="store-products" element={<AdminStoreProductsPage />} />
          <Route path="store-orders" element={<AdminStoreOrdersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
