import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/Auth";
import { PlanGate } from "../components/PlanGate";
import BillingWall from "../components/BillingWall";
import { APP_ROUTES } from "../config/appRoutes";
import { ADMIN_ROUTES } from "../config/adminRoutes";
import { REDIRECT_ROUTES } from "../config/redirectRoutes";
import { getPageComponent } from "./pageRegistry";
import HeadshotStudio from "../pages/HeadshotStudio";
import StudioAccess from "../pages/StudioAccess";
import TrainingVideos from "../pages/TrainingVideos";
import NotFoundPage from "../pages/NotFoundPage";
import AdminRouter from "../admin/AdminRouter";

function buildRouteElement(route) {
  const PageComponent = getPageComponent(route?.path);

  if (!PageComponent) {
    return <Navigate to="/command-center" replace />;
  }

  return (
    <ProtectedRoute>
      <BillingWall>
        <PlanGate route={route.path}>
          <PageComponent />
        </PlanGate>
      </BillingWall>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  const protectedRouteItems = [...ADMIN_ROUTES, ...APP_ROUTES].filter(
    (route) => route?.path
  );

  return (
    <Routes>
      <Route path="/headshots" element={<HeadshotStudio />} />
      <Route path="/studio/:token" element={<StudioAccess />} />
      <Route path="/help" element={<TrainingVideos />} />
      <Route path="/admin/*" element={<AdminRouter />} />

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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
