// frontend/src/navigation/AppRouter.jsx
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SignInPage, SignUpPage, ProtectedRoute } from "../components/Auth";
import { PlanGate } from "../components/PlanGate";
import { ROUTES } from "../config/routeConfig";
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
  const PageComponent = getPageComponent(route.path);
  if (route.redirectTo) {
    return <Navigate to={route.redirectTo} replace />;
  }
  return (
    <ProtectedRoute>
      <PlanGate route={route}>
        <PageComponent />
      </PlanGate>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  const routeItems = Array.isArray(ROUTES) ? ROUTES.filter((route) => route?.path) : [];
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route path="/headshots" element={<HeadshotStudio />} />
      <Route path="/studio/:token" element={<StudioAccess />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/store" element={<DigitalStore />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/help" element={<TrainingVideos />} />
      {routeItems.map((route) => (
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
