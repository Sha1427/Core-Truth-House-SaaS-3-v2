import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSignIn } from "@clerk/react";

const C = {
  bg: "#efe7e3",
  panel: "#f8f4f2",
  panelAlt: "#f2e9e5",
  sidebarStart: "#140f2b",
  sidebarEnd: "#120717",
  accent: "#e04e35",
  ink: "#2b1040",
  ruby: "#763b5b",
  border: "#d8c5c3",
  muted: "#a88f9f",
  tuscany: "#c7a09d",
};

const DEFAULTS = {
  email: "",
  password: "",
  rememberMe: true,
};

export default function CoreLoginForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();

  const redirectUrl = useMemo(() => {
    return searchParams.get("redirect_url") || "/command-center";
  }, [searchParams]);

  const [form, setForm] = useState(DEFAULTS);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const validate = () => {
    if (!form.email.trim()) return "Enter a valid email.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Invalid email address.";
    if (!form.password.trim()) return "Enter your password.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isLoaded || !signIn) {
      setError("Sign in is still loading. Try again in a moment.");
      return;
    }

    setStatus("submitting");

    try {
      const result = await signIn.create({
        identifier: form.email.trim(),
        password: form.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(redirectUrl, { replace: true });
        return;
      }

      setError("Additional verification is required. Please continue through the secure sign-in flow.");
      setStatus("idle");
    } catch (err) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Invalid email or password.";
      setError(message);
      setStatus("idle");
    }
  };

  return (
    <div className="cth-login-card">
      <div className="cth-login-mark">CTH</div>

      <p className="cth-login-eyebrow">Welcome back</p>
      <h1>Sign in to Core Truth House</h1>
      <p className="cth-login-copy">
        Enter your details to continue building from your brand operating system.
      </p>

      <form onSubmit={handleSubmit} className="cth-login-form">
        <label>
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="Email"
            autoComplete="email"
          />
        </label>

        <label>
          <span>Password</span>
          <div className="cth-password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="cth-login-row">
          <label className="cth-remember">
            <input
              type="checkbox"
              checked={form.rememberMe}
              onChange={(event) => update("rememberMe", event.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <Link to="/sign-in" className="cth-forgot">
            Forgot password?
          </Link>
        </div>

        {error ? <div className="cth-login-error">{error}</div> : null}

        <button
          type="submit"
          className="cth-login-submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Signing in..." : "Log in"}
        </button>
      </form>

      <p className="cth-login-bottom">
        New here? <Link to="/sign-up">Create an account</Link>
      </p>

      <style>{`
        .cth-login-card {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          background: linear-gradient(180deg, ${C.panel}, #ffffff);
          border: 1px solid ${C.border};
          border-radius: 34px;
          padding: 34px;
          box-shadow: 0 28px 90px rgba(20,15,43,0.16), 0 1px 0 rgba(255,255,255,0.75) inset;
          color: ${C.ink};
          font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .cth-login-mark {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(224,78,53,0.12);
          border: 1px solid rgba(224,78,53,0.18);
          color: ${C.accent};
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.08em;
          margin-bottom: 22px;
        }

        .cth-login-eyebrow {
          margin: 0;
          color: ${C.accent};
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .cth-login-card h1 {
          margin: 10px 0 10px;
          color: ${C.ink};
          font-family: Georgia, serif;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 1;
          letter-spacing: -0.055em;
        }

        .cth-login-copy {
          margin: 0 0 26px;
          color: ${C.ruby};
          line-height: 1.65;
          font-weight: 650;
        }

        .cth-login-form {
          display: grid;
          gap: 16px;
        }

        .cth-login-form label {
          display: grid;
          gap: 8px;
        }

        .cth-login-form label > span {
          color: ${C.ink};
          font-size: 13px;
          font-weight: 950;
        }

        .cth-login-form input[type="email"],
        .cth-password-field {
          min-height: 52px;
          border-radius: 18px;
          border: 1px solid ${C.border};
          background: #ffffff;
          color: ${C.ink};
          outline: none;
          box-shadow: 0 1px 0 rgba(255,255,255,0.75) inset;
        }

        .cth-login-form input[type="email"] {
          padding: 0 16px;
          font-weight: 750;
        }

        .cth-password-field {
          display: grid;
          grid-template-columns: 1fr auto;
          overflow: hidden;
        }

        .cth-password-field input {
          min-width: 0;
          height: 52px;
          border: none;
          outline: none;
          background: transparent;
          color: ${C.ink};
          padding: 0 16px;
          font-weight: 750;
        }

        .cth-password-field button {
          height: 52px;
          border: none;
          border-left: 1px solid ${C.border};
          background: ${C.panelAlt};
          color: ${C.ruby};
          padding: 0 14px;
          font-size: 13px;
          font-weight: 950;
          cursor: pointer;
        }

        .cth-login-form input:focus,
        .cth-password-field:focus-within {
          border-color: ${C.accent};
          box-shadow: 0 0 0 4px rgba(224,78,53,0.12);
        }

        .cth-login-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .cth-remember {
          display: inline-flex !important;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 9px !important;
          color: ${C.ruby};
          font-weight: 800;
          font-size: 14px;
        }

        .cth-remember input {
          width: 16px;
          height: 16px;
          accent-color: ${C.accent};
        }

        .cth-forgot,
        .cth-login-bottom a {
          color: ${C.accent};
          text-decoration: none;
          font-weight: 900;
        }

        .cth-login-error {
          border-radius: 16px;
          background: rgba(180,67,67,0.10);
          border: 1px solid rgba(180,67,67,0.22);
          color: #8f1f1f;
          padding: 12px 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .cth-login-submit {
          min-height: 52px;
          border: none;
          border-radius: 999px;
          background: ${C.accent};
          color: #fff;
          font-size: 15px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 18px 40px rgba(224,78,53,0.22);
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }

        .cth-login-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: saturate(1.06);
          box-shadow: 0 26px 58px rgba(224,78,53,0.32);
        }

        .cth-login-submit:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .cth-login-bottom {
          margin: 22px 0 0;
          text-align: center;
          color: ${C.ruby};
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
