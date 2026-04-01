import React, { useState } from "react";

export default function HeadshotStudio() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!email) {
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
          body: JSON.stringify({ email }),
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
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0010", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <a href="/" style={{ color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 18 }}>
          Core Truth House
        </a>
        <a href="/sign-in" style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textDecoration: "none" }}>
          Sign In
        </a>
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "#AF0024", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", fontSize: 13, marginBottom: 20 }}>
          The Presence Studio
        </p>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: -1 }}>
          Look like the brand you are building.
        </h1>
        <p style={{ fontSize: 20, color: "rgba(255,255,255,0.65)", maxWidth: 560, margin: "0 auto 56px", lineHeight: 1.6 }}>
          Professional, studio-quality AI headshots designed for founders, executives, creators, and teams.
        </p>
        <div style={{ marginBottom: 40 }}>
          <span style={{ fontSize: 56, fontWeight: 800 }}>$47</span>
          <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 10, fontSize: 18 }}>one-time access</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 460, margin: "0 auto" }}>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
            style={{
              width: "100%",
              padding: "16px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: 16,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
          {error && (
            <p style={{ color: "#AF0024", fontSize: 14, margin: 0 }}>{error}</p>
          )}
          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              width: "100%",
              padding: "18px 32px",
              background: loading ? "rgba(175,0,36,0.5)" : "#AF0024",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 18,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Redirecting to checkout..." : "Get My Headshots"}
          </button>
          
            href="/contact"
            style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textDecoration: "none", marginTop: 8 }}
          >
            Questions? Contact Us
          </a>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
        {[
          { title: "Identity Lock Technology", desc: "Maintains your authentic likeness across every style and background." },
          { title: "Executive to Creative", desc: "Choose your industry, outfit, lighting, and aesthetic details." },
          { title: "High-Res Downloads", desc: "Ready for LinkedIn, press kits, and professional brand profiles." },
          { title: "Instant Access", desc: "Your studio link lands in your inbox immediately after purchase." },
        ].map((f) => (
          <div key={f.title} style={{ padding: 28, background: "rgba(255,255,255,0.04)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
            <h3 style={{ marginBottom: 10, fontSize: 15, fontWeight: 700 }}>{f.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 24px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
        © {new Date().getFullYear()} Core Truth House. All rights reserved.
      </div>
    </div>
  );
}