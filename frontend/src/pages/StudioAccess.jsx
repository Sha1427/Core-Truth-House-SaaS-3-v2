import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function StudioAccess() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [studioUrl, setStudioUrl] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/headshots/verify/${token}`
        );
        if (res.ok) {
          const data = await res.json();
          setStudioUrl(data.studio_url);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };
    verify();
  }, [token]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0010", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <p>Verifying your access...</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div style={{ minHeight: "100vh", background: "#0D0010", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h2 style={{ color: "#AF0024", marginBottom: 16 }}>Invalid Access Link</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 32 }}>
          This link is invalid or has expired. Purchase access to continue.
        </p><a href="/headshots"
          style={{ padding: "16px 32px", background: "#AF0024", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 16 }}
        >
          Get Access
        </a>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", background: "#0D0010" }}>
      <iframe
        src={studioUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="camera; microphone; clipboard-write"
        title="The Presence Studio"
      />
    </div>
  );
}
