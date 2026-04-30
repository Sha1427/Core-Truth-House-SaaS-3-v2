import React, { useState } from "react";

const FEATURES = [
 {
 title: "Identity Lock Technology",
 desc: "Maintains your authentic likeness across every style and background.",
 },
 {
 title: "Executive to Creative",
 desc: "Choose your industry, outfit, lighting, and aesthetic details.",
 },
 {
 title: "High-Res Downloads",
 desc: "Ready for LinkedIn, press kits, and professional brand profiles.",
 },
 {
 title: "Instant Access",
 desc: "Your studio link lands in your inbox immediately after purchase.",
 },
];

export default function HeadshotStudio() {
 const [email, setEmail] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 const handleCheckout = async () => {
 if (!email.trim()) {
 setError("Please enter your email address.");
 return;
 }

 setError("");
 setLoading(true);

 try {
 const res = await fetch(
 `${import.meta.env.VITE_API_BASE_URL}/api/headshots/checkout`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email: email.trim() }),
 }
 );

 const data = await res.json();

 if (data.url) {
 window.location.href = data.url;
 } else {
 setError("Something went wrong. Please try again.");
 }
 } catch {
 setError("Something went wrong. Please try again.");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div
 className="cth-page"
 style={{
 minHeight: "100vh",
 fontFamily:
 "'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
 }}
 >
 <header
 className="flex items-center justify-between px-6 py-5 md:px-8"
 style={{
 borderBottom: "1px solid var(--cth-app-border)",
 background: "var(--cth-app-panel)",
 }}
 >
 <a href="/" className="text-lg font-bold cth-heading">
 Core Truth House
 </a>

 <a href="/sign-in" className="text-sm cth-muted">
 Sign In
 </a>
 </header>

 <main className="mx-auto max-w-[760px] px-6 py-16 text-center md:py-20">
 <p className="cth-kicker mb-5">The Presence Studio</p>

 <h1 className="mb-6 text-[clamp(36px,6vw,60px)] font-extrabold leading-tight tracking-[-1px] cth-heading">
 Look like the brand you are building.
 </h1>

 <p className="mx-auto mb-12 max-w-[560px] text-xl leading-relaxed cth-muted">
 Professional, studio-quality AI headshots designed for founders,
 executives, creators, and teams.
 </p>

 <div className="mb-10">
 <span className="text-6xl font-extrabold cth-heading">$47</span>
 <span className="ml-2 text-lg cth-muted">one-time access</span>
 </div>

 <div className="mx-auto flex max-w-[460px] flex-col items-center gap-3">
 <input
 type="email"
 placeholder="Enter your email address"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
 className="cth-input text-base"
 style={{ padding: "16px 20px" }}
 />

 {error ? (
 <p className="m-0 text-sm cth-text-danger">{error}</p>
 ) : null}

 <button
 onClick={handleCheckout}
 disabled={loading}
 className="cth-button-primary w-full text-lg"
 style={{
 padding: "18px 32px",
 opacity: loading ? 0.7 : 1,
 cursor: loading ? "not-allowed" : "pointer",
 }}
 type="button"
 >
 {loading ? "Redirecting to checkout..." : "Get My Headshots"}
 </button>

 <a href="/contact" className="mt-2 text-sm cth-muted">
 Questions? Contact Us
 </a>
 </div>
 </main>

 <section className="mx-auto grid max-w-[900px] grid-cols-1 gap-5 px-6 pb-20 md:grid-cols-2 lg:grid-cols-4">
 {FEATURES.map((feature) => (
 <div key={feature.title} className="cth-card p-7">
 <h3 className="mb-2 text-[15px] font-bold cth-heading">
 {feature.title}
 </h3>
 <p className="m-0 text-sm leading-relaxed cth-muted">
 {feature.desc}
 </p>
 </div>
 ))}
 </section>

 <footer
 className="px-6 py-8 text-center text-sm cth-muted"
 style={{ borderTop: "1px solid var(--cth-app-border)" }}
 >
 © {new Date().getFullYear()} Core Truth House. All rights reserved.
 </footer>
 </div>
 );
}
