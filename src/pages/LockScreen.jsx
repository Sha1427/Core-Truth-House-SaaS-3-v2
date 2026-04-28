import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useAuth";

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

const PLACEHOLDER_PROFILE = {
 name: "Nnenna Jioke",
 role: "Core Truth House Member",
 avatar: "/assets/avatar3.jpg",
 logoWhite: "/assets/logo-white.svg",
 defaultPassword: "zab#723",
};

export default function LockScreen() {
 const navigate = useNavigate();
 const { user, isLoaded } = useUser();

 // Uses real Clerk profile data when available, with template placeholders as fallback.
 const profile = useMemo(() => {
 const fullName =
 user?.fullName ||
 [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
 user?.username ||
 user?.primaryEmailAddress?.emailAddress ||
 PLACEHOLDER_PROFILE.name;

 return {
 name: fullName,
 role: user ? "Core Truth House Member" : PLACEHOLDER_PROFILE.role,
 avatar: user?.imageUrl || PLACEHOLDER_PROFILE.avatar,
 logoWhite: PLACEHOLDER_PROFILE.logoWhite,
 defaultPassword: PLACEHOLDER_PROFILE.defaultPassword,
 };
 }, [user]);

 const [password, setPassword] = useState(profile.defaultPassword);
 const [showPassword, setShowPassword] = useState(false);
 const [notice, setNotice] = useState("");

 const initials = useMemo(() => {
 return String(profile.name || "CTH")
 .split(" ")
 .map((part) => part[0])
 .join("")
 .slice(0, 2)
 .toUpperCase();
 }, [profile.name]);

 const handleUnlock = (event) => {
 event.preventDefault();

 if (!password.trim()) {
 setNotice("Enter your password to continue.");
 return;
 }

 // Temporary placeholder behavior. Later connect to Clerk re-auth/session logic.
 navigate("/command-center");
 };

 return (
 <main className="cth-lockscreen">
 <div className="cth-lockscreen-overlay" />

 <section className="cth-lockscreen-panel" aria-label="Workspace lock screen">
 <div className="cth-avatar-wrap">
 <img
 src={profile.avatar}
 alt={profile.name}
 className="cth-lock-avatar-img"
 onError={(event) => {
 event.currentTarget.style.display = "none";
 const fallback = event.currentTarget.nextElementSibling;
 if (fallback) fallback.style.display = "grid";
 }}
 />
 <div className="cth-lock-avatar-fallback">{initials}</div>
 </div>

 <p className="cth-lock-eyebrow">Workspace locked</p>

 <h1>{profile.name}</h1>

 <p className="cth-lock-subtitle">
 {isLoaded ? "Enter your password to unlock the screen." : "Loading your workspace profile..."}
 </p>

 <form onSubmit={handleUnlock} className="cth-lock-form">
 <div className="cth-lock-password">
 <input
 value={password}
 type={showPassword ? "text" : "password"}
 onChange={(event) => {
 setPassword(event.target.value);
 setNotice("");
 }}
 placeholder="Enter password"
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

 {notice ? <div className="cth-lock-notice">{notice}</div> : null}

 <button type="submit" className="cth-unlock-button">
 Unlock
 </button>
 </form>

 <Link className="cth-different-account" to="/sign-in">
 Sign in using a different account
 </Link>
 </section>

 <footer className="cth-lockscreen-footer">
 <Link to="/" className="cth-footer-logo" aria-label="Core Truth House home">
 <img
 src={profile.logoWhite}
 alt="Core Truth House"
 onError={(event) => {
 event.currentTarget.style.display = "none";
 const fallback = event.currentTarget.nextElementSibling;
 if (fallback) fallback.style.display = "block";
 }}
 />
 <span>Core Truth House</span>
 </Link>
 </footer>

 <style>{`
 body {
 margin: 0;
 background: ${C.sidebarEnd} !important;
 color: #ffffff !important;
 }

 .cth-lockscreen {
 min-height: 100vh;
 width: 100%;
 position: relative;
 overflow: hidden;
 display: flex;
 align-items: center;
 justify-content: center;
 padding: 32px 20px 96px;
 font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 background:
 radial-gradient(circle at 18% 18%, rgba(224,78,53,0.30), transparent 30%),
 radial-gradient(circle at 82% 10%, rgba(199,160,157,0.20), transparent 28%),
 linear-gradient(145deg, ${C.sidebarStart}, ${C.sidebarEnd});
 }

 .cth-lockscreen::before {
 content: "";
 position: absolute;
 inset: 0;
 background:
 linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
 linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
 background-size: 72px 72px;
 opacity: 0.8;
 pointer-events: none;
 }

 .cth-lockscreen::after {
 content: "";
 position: absolute;
 right: -12%;
 bottom: -28%;
 width: 620px;
 height: 620px;
 border-radius: 999px;
 background:
 radial-gradient(circle at 38% 38%, rgba(224,78,53,0.30), rgba(118,59,91,0.22) 34%, rgba(18,7,23,0.10) 62%, transparent 72%);
 border: 1px solid rgba(248,244,242,0.10);
 pointer-events: none;
 }

 .cth-lockscreen-overlay {
 position: absolute;
 inset: 0;
 background:
 linear-gradient(180deg, rgba(18,7,23,0.42), rgba(18,7,23,0.72)),
 radial-gradient(circle at center, transparent 0%, rgba(18,7,23,0.38) 72%);
 pointer-events: none;
 }

 .cth-lockscreen-panel {
 position: relative;
 z-index: 2;
 width: min(380px, 100%);
 text-align: center;
 color: #fff;
 display: flex;
 flex-direction: column;
 align-items: center;
 }

 .cth-avatar-wrap {
 width: 96px;
 height: 96px;
 margin-bottom: 22px;
 position: relative;
 }

 .cth-lock-avatar-img,
 .cth-lock-avatar-fallback {
 width: 96px;
 height: 96px;
 border-radius: 999px;
 border: 2px solid rgba(248,244,242,0.45);
 box-shadow: 0 22px 60px rgba(0,0,0,0.35);
 }

 .cth-lock-avatar-img {
 object-fit: cover;
 background: rgba(248,244,242,0.10);
 }

 .cth-lock-avatar-fallback {
 display: none;
 place-items: center;
 background: linear-gradient(145deg, rgba(224,78,53,0.92), rgba(118,59,91,0.92));
 color: #fff;
 font-size: 26px;
 font-weight: 950;
 letter-spacing: -0.04em;
 }

 .cth-lock-eyebrow {
 margin: 0 0 10px;
 color: ${C.tuscany};
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.18em;
 text-transform: uppercase;
 }

 .cth-lockscreen-panel h1 {
 margin: 0;
 color: #fff;
 font-family: Georgia, serif;
 font-size: clamp(2.4rem, 6vw, 3.7rem);
 line-height: 1;
 letter-spacing: -0.06em;
 text-shadow: 0 14px 50px rgba(0,0,0,0.38);
 }

 .cth-lock-subtitle {
 margin: 12px 0 28px;
 color: rgba(248,244,242,0.78);
 font-size: 16px;
 line-height: 1.6;
 font-weight: 650;
 }

 .cth-lock-form {
 width: 100%;
 display: grid;
 gap: 14px;
 }

 .cth-lock-password {
 display: grid;
 grid-template-columns: 1fr auto;
 align-items: center;
 min-height: 54px;
 border-radius: 18px;
 background: rgba(248,244,242,0.96);
 border: 1px solid rgba(248,244,242,0.55);
 box-shadow: 0 18px 50px rgba(0,0,0,0.22);
 overflow: hidden;
 }

 .cth-lock-password input {
 min-width: 0;
 height: 54px;
 border: none;
 outline: none;
 background: transparent;
 color: ${C.ink};
 padding: 0 16px;
 font-size: 15px;
 font-weight: 800;
 }

 .cth-lock-password input::placeholder {
 color: rgba(43,16,64,0.45);
 }

 .cth-lock-password button {
 height: 54px;
 border: none;
 border-left: 1px solid ${C.border};
 background: ${C.panelAlt};
 color: ${C.ruby};
 padding: 0 14px;
 font-size: 13px;
 font-weight: 950;
 cursor: pointer;
 }

 .cth-lock-notice {
 border-radius: 16px;
 background: rgba(248,244,242,0.12);
 border: 1px solid rgba(248,244,242,0.20);
 color: #fff;
 padding: 12px 14px;
 font-weight: 850;
 }

 .cth-unlock-button {
 min-height: 54px;
 border: none;
 border-radius: 18px;
 background: ${C.accent};
 color: #fff;
 font-size: 15px;
 font-weight: 950;
 cursor: pointer;
 box-shadow: 0 20px 46px rgba(224,78,53,0.28);
 transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
 }

 .cth-unlock-button:hover {
 transform: translateY(-2px);
 filter: saturate(1.06);
 box-shadow: 0 26px 58px rgba(224,78,53,0.36);
 }

 .cth-different-account {
 margin-top: 20px;
 color: rgba(248,244,242,0.82);
 text-decoration: none;
 font-weight: 800;
 }

 .cth-different-account:hover {
 color: #fff;
 }

 .cth-lockscreen-footer {
 position: absolute;
 z-index: 2;
 left: 0;
 right: 0;
 bottom: 34px;
 display: flex;
 justify-content: center;
 }

 .cth-footer-logo {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 12px;
 color: rgba(248,244,242,0.82);
 text-decoration: none;
 font-family: Georgia, serif;
 font-size: 18px;
 font-weight: 900;
 }

 .cth-footer-logo img {
 max-height: 34px;
 width: auto;
 }

 .cth-footer-logo span {
 display: none;
 }

 @media (max-width: 640px) {
 .cth-lockscreen {
 padding: 28px 18px 88px;
 }

 .cth-lockscreen-panel {
 width: min(350px, 100%);
 }

 .cth-avatar-wrap,
 .cth-lock-avatar-img,
 .cth-lock-avatar-fallback {
 width: 86px;
 height: 86px;
 }
 }
 `}</style>
 </main>
 );
}
