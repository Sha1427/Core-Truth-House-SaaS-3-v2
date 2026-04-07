// frontend/src/navigation/AppRouter.jsx
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SignInPage, SignUpPage, ProtectedRoute } from "../components/Auth";
import { PlanGate } from "../components/PlanGate";
import { APP_ROUTES } from "../config/appRoutes";
import { ADMIN_ROUTES } from "../config/adminRoutes";
import { REDIRECT_ROUTES } from "../config/redirectRoutes";
import { getPageComponent } from "./pageRegistry";
import HeadshotStudio from "../pages/HeadshotStudio";
import StudioAccess from "../pages/StudioAccess";
import LandingPage from "../pages/LandingPage";
import AboutPage from "../pages/AboutPage";
import { BlogList } from "../pages/PublicBlog";
import DigitalStore from "../pages/DigitalStore";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import ContactPage from "../pages/ContactPage";
import TermsOfService from "../pages/TermsOfService";
import TrainingVideos from "../pages/TrainingVideos";

function buildRouteElement(route) {
  if (route?.redirectTo) {
    return <Navigate to={route.redirectTo} replace />;
  }

  const PageComponent = getPageComponent(route?.path);

  return (
    <ProtectedRoute>
      <PlanGate route={route.path}>
        <PageComponent />
      </PlanGate>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  const protectedRouteItems = [...ADMIN_ROUTES, ...APP_ROUTES].filter((route) => route?.path);

  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      <Route path="/" element={<LandingPage />} />
      <Route path="/headshots" element={<HeadshotStudio />} />
      <Route path="/studio/:token" element={<StudioAccess />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/store" element={<DigitalStore />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/help" element={<TrainingVideos />} />

      {REDIRECT_ROUTES.map((route) => (
  <Route
    key={route.path}
    path={route.path}
    element={<Navigate to={route.redirectTo} replace />}
  />
))}

{protectedRouteItems.map((route) => (
  <Route
    key={route.path}
    path={route.path}
    element={buildRouteElement(route)}
  />
))}

      <Route path="*" element={<Navigate to="/command-center" replace />} />
    </Routes>
  );
}
