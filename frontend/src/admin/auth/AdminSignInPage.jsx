import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useUser, HAS_CLERK } from "../../hooks/useAuth";
import { SignIn as ClerkSignIn } from "@clerk/react";

export default function AdminSignInPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  if (!HAS_CLERK) {
    return <div style={{ color: "white", padding: 20 }}>Clerk not configured</div>;
  }

  if (isLoaded && isSignedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--cth-surface-midnight)]">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-[linear-gradient(180deg,var(--cth-admin-ink),var(--cth-surface-midnight))] text-[var(--cth-on-dark)]">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--cth-admin-muted)]">Core Truth House</p>
          <h1 className="mt-4 text-4xl font-semibold">Admin Access</h1>
          <p className="mt-4 max-w-md text-[var(--cth-admin-border)]">
            Separate back-office access for platform operations, governance, analytics, and system control.
          </p>
        </div>

        <div className="text-sm text-[var(--cth-admin-muted)]">
          Need the client workspace instead?{" "}
          <Link to="/sign-in" className="text-[var(--cth-admin-accent)] hover:underline">
            Sign in to the app
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-[var(--cth-admin-panel)]">
        <div className="w-full max-w-md rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Back Office</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--cth-admin-ink)]">Sign in</h2>
          </div>

          <ClerkSignIn
            routing="path"
            path="/admin/sign-in"
            signUpUrl="/admin/sign-in"
            forceRedirectUrl="/admin/dashboard"
          />

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 text-sm text-[var(--cth-admin-ruby)] hover:text-[var(--cth-admin-accent)]"
          >
            Return to main site
          </button>
        </div>
      </div>
    </div>
  );
}
