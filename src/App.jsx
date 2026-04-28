// frontend/src/App.jsx

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./index.css";

import { Toaster } from "./components/ui/toaster";
import Chatbot from "./components/Chatbot";
import TiersPage from "./pages/TiersPage";

const ProtectedApp = lazy(() => import("./ProtectedApp"));

const LandingPage = lazy(() => import("./pages/LandingPage"));
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const BlogJournalPage = lazy(() => import("./pages/BlogJournalPage"));
const StorefrontPage = lazy(() => import("./pages/StorefrontPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const BrandDiagnosticPage = lazy(() => import("./pages/BrandDiagnosticPage"));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#efe7e3] px-6 py-12 text-[#2b1040]">
      Loading Core Truth House...
    </div>
  );
}

function PublicRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/brand-diagnostic" element={<BrandDiagnosticPage />} />
        <Route path="/brand-diagnostic/" element={<BrandDiagnosticPage />} />
        <Route path="/tiers" element={<TiersPage />} />
        <Route path="/pricing" element={<TiersPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/methodology/*" element={<MethodologyPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogJournalPage />} />
        <Route path="/blog/:slug" element={<BlogJournalPage />} />
        <Route path="/store" element={<StorefrontPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route
          path="/*"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedApp />
            </Suspense>
          }
        />
      </Routes>

      <Chatbot />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <PublicRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
