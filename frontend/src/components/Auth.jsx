import React from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { useColors } from "../context/ThemeContext";
import { Layers, ArrowLeft } from "lucide-react";
import { useUser, useClerk, HAS_CLERK } from "../hooks/useAuth";
import { SignIn as ClerkSignIn, SignUp as ClerkSignUp } from "@clerk/react";

let SignIn = null;
let SignUp = null;

if (HAS_CLERK) {
  SignIn = ClerkSignIn;
  SignUp = ClerkSignUp;
}

function AuthShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "#0D0010", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "rgba(199,160,157,0.7)", cursor: "pointer", marginBottom: 24 }}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#AF0024,#E04E35)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Layers size={28} color="white" />
          </div>
          <h1 style={{ color: "#fff" }}>{title}</h1>
          <p style={{ color: "rgba(199,160,157,0.8)" }}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const location = useLocation();

  if (!HAS_CLERK) {
    return children;
  }
  if (!isLoaded) {
    return <div style={{ color: "white", padding: 20 }}>Loading...</div>;
  }
  if (!isSignedIn) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?redirect_url=${redirect}`} replace />;
  }
  return children;
}

export function SignInPage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!HAS_CLERK) {
    return <div style={{ color: "white", padding: 20 }}>Clerk not configured</div>;
  }

  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect_url") || "/command-center";

  if (isLoaded && isSignedIn) {
    return <Navigate to={redirectUrl} replace />;
  }

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to continue">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl={redirectUrl}
      />
    </AuthShell>
  );
}

export function SignUpPage() {
  const { isSignedIn } = useUser();

  if (!HAS_CLERK) {
    return <div style={{ color: "white", padding: 20 }}>Clerk not configured</div>;
  }

  if (isSignedIn) {
    return <Navigate to="/command-center" replace />;
  }

  return (
    <AuthShell title="Create Account" subtitle="Start building">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/command-center"
      />
    </AuthShell>
  );
}

export function UserButton() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!HAS_CLERK || !isLoaded || !user) return null;

  return (
    <button
      onClick={async () => {
        await signOut();
        window.location.href = "/sign-in";
      }}
      style={{
        padding: "8px 12px",
        background: "#111",
        color: "white",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      Sign Out
    </button>
  );
}
