// frontend/src/navigation/AppRouter.jsx

import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { SignInPage, SignUpPage, ProtectedRoute } from "../components/Auth";
import { PlanGate } from "../components/PlanGate";
import { ROUTES } from "../config/routeConfig";
import { getPageComponent } from "./pageRegistry";

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
      <Route path="/" element={<Navigate to="/command-center" replace />} />

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
