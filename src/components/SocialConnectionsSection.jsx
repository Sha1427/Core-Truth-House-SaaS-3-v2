import React, { useEffect, useState } from "react";
import {
 Instagram,
 Facebook,
 Linkedin,
 Music,
 Pin,
 Store,
 Hash,
 Loader2,
 X,
 AlertCircle,
} from "lucide-react";

import apiClient from "../lib/apiClient";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PLATFORMS = [
 { key: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", note: "Posting + profile sync" },
 { key: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", note: "Page posting" },
 { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2", note: "Personal share" },
 { key: "tiktok", label: "TikTok", icon: Music, color: "#FF0050", note: "Video posting" },
 { key: "pinterest", label: "Pinterest", icon: Pin, color: "#E60023", note: "Pin posting" },
 { key: "google_business", label: "Google Business", icon: Store, color: "#4285F4", note: "Local Posts" },
 { key: "threads", label: "Threads", icon: Hash, color: "#101010", note: "Thread posting" },
];

const PRIMARY_BUTTON_STYLE = {
 display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
 padding: "10px 16px", borderRadius: 4,
 background: "var(--cth-command-purple)", color: "var(--cth-command-gold)",
 fontFamily: SANS, fontSize: 14, fontWeight: 600,
 border: "none", cursor: "pointer",
};

const DESTRUCTIVE_OUTLINE_STYLE = {
 display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
 padding: "8px 14px", borderRadius: 4,
 background: "transparent",
 border: "1px solid var(--cth-command-crimson)",
 color: "var(--cth-command-crimson)",
 fontFamily: SANS, fontSize: 14, fontWeight: 500,
 cursor: "pointer",
};

function Toast({ toast }) {
 if (!toast) return null;
 const isError = toast.tone === "error";
 return (
 <div
 role="status"
 aria-live="polite"
 style={{
 position: "fixed", bottom: 24, right: 24, zIndex: 80,
 background: "var(--cth-command-panel)",
 border: `1px solid ${isError ? "var(--cth-command-crimson)" : "var(--cth-command-gold)"}`,
 borderRadius: 4, padding: "12px 18px",
 boxShadow: "0 20px 40px rgba(13,0,16,0.18)",
 fontFamily: SANS, fontSize: 14, fontWeight: 500,
 color: "var(--cth-command-ink)",
 display: "flex", alignItems: "center", gap: 10, maxWidth: 420,
 }}
 >
 {isError ? <AlertCircle size={16} style={{ color: "var(--cth-command-crimson)" }} /> : null}
 <span>{toast.message}</span>
 </div>
 );
}

export default function SocialConnectionsSection() {
 const [connections, setConnections] = useState({});
 const [routing, setRouting] = useState(null);
 const [loading, setLoading] = useState(false);
 const [busyPlatform, setBusyPlatform] = useState("");
 const [toast, setToast] = useState(null);

 const routingMode = routing?.mode || "direct";

 const showToast = (message, tone = "success") => setToast({ message, tone });

 useEffect(() => {
 if (!toast) return undefined;
 const id = setTimeout(() => setToast(null), 2500);
 return () => clearTimeout(id);
 }, [toast]);

 async function loadAll() {
 setLoading(true);
 try {
 const routingRes = await apiClient.get("/api/social/zernio/connection").catch(() => null);
 const routingPayload = routingRes?.data && typeof routingRes.data === "object" ? routingRes.data : routingRes;
 setRouting(routingPayload?.routing || null);

 const results = await Promise.allSettled(
 PLATFORMS.map((p) => apiClient.get(`/api/social/${p.key}/connection`))
 );
 const next = {};
 PLATFORMS.forEach((p, idx) => {
 const r = results[idx];
 if (r.status === "fulfilled") {
 const payload = r.value?.data && typeof r.value.data === "object" ? r.value.data : r.value;
 next[p.key] = payload?.connection || null;
 } else {
 next[p.key] = null;
 }
 });
 setConnections(next);
 } finally {
 setLoading(false);
 }
 }

 useEffect(() => {
 void loadAll();
 }, []);

 // Resolve per-platform connection across all routing modes.
 function getConnection(platformKey) {
 if (routingMode === "direct") return connections[platformKey] || null;
 const list = (routing?.[routingMode] || {}).connected_platforms || [];
 return list.find((c) => c.platform === platformKey) || null;
 }

 async function handleConnect(platformKey) {
 setBusyPlatform(platformKey);
 try {
 let url = null;
 if (routingMode === "zernio") {
 const res = await apiClient.post("/api/social/zernio/connect", { platform: platformKey });
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 url = payload?.authorize_url;
 } else if (routingMode === "ayrshare") {
 const res = await apiClient.post("/api/social/ayrshare/connect", { platforms: [platformKey] });
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 url = payload?.authorize_url;
 } else {
 const res = await apiClient.post(`/api/social/${platformKey}/connect`);
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 url = payload?.authorize_url;
 }
 if (!url) throw new Error("Connect endpoint did not return an authorize URL.");
 window.location.href = url;
 } catch (err) {
 const detail = err?.response?.data?.detail || err?.message;
 const platformLabel = PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 if (err?.response?.status === 500 && /not configured/i.test(detail || "")) {
 showToast(`${platformLabel} OAuth is not configured on the backend yet.`, "error");
 } else {
 showToast(detail || `Could not start ${platformLabel} connect flow`, "error");
 }
 } finally {
 setBusyPlatform("");
 }
 }

 async function handleDisconnect(platformKey) {
 setBusyPlatform(platformKey);
 try {
 if (routingMode === "zernio") {
 await apiClient.delete("/api/social/zernio/disconnect", { data: { platform: platformKey } });
 } else if (routingMode === "ayrshare") {
 await apiClient.delete("/api/social/ayrshare/disconnect", { data: { platform: platformKey } });
 } else {
 await apiClient.delete(`/api/social/${platformKey}/disconnect`);
 }
 const platformLabel = PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 showToast(`${platformLabel} disconnected`);
 await loadAll();
 } catch (err) {
 const detail = err?.response?.data?.detail || err?.message;
 const platformLabel = PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 showToast(detail || `Could not disconnect ${platformLabel}`, "error");
 } finally {
 setBusyPlatform("");
 }
 }

 return (
 <div>
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
 <h2 style={{
 fontFamily: SERIF, fontSize: 22, fontWeight: 600,
 color: "var(--cth-command-ink)", margin: 0, letterSpacing: "-0.005em",
 }}>
 Connected Accounts
 </h2>
 </div>
 <p style={{
 fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)",
 margin: "8px 0 16px", lineHeight: 1.55,
 }}>
 Connect each platform so you can schedule and publish posts. Sign in once;
 we keep the credentials secure server-side.
 </p>

 <div style={{ display: "grid", gap: 10 }}>
 {PLATFORMS.map((platform) => {
 const Icon = platform.icon;
 const conn = getConnection(platform.key);
 const isConnected = Boolean(conn);
 const busy = busyPlatform === platform.key;
 const username = conn?.username || conn?.account_id || "";
 return (
 <div
 key={platform.key}
 style={{
 display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between",
 gap: 12, padding: "12px 14px",
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
 <span style={{
 width: 32, height: 32, borderRadius: 4,
 background: `${platform.color}15`,
 border: `1px solid ${platform.color}25`,
 color: platform.color,
 display: "inline-flex", alignItems: "center", justifyContent: "center",
 flexShrink: 0,
 }}>
 <Icon size={16} />
 </span>
 <div style={{ minWidth: 0 }}>
 <div style={{
 fontFamily: SANS, fontSize: 14, fontWeight: 600,
 color: "var(--cth-command-ink)", lineHeight: 1.2,
 }}>
 {platform.label}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)", marginTop: 2 }}>
 {isConnected
 ? (username ? `Connected · ${username}` : "Connected")
 : platform.note}
 </div>
 </div>
 </div>
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
 {isConnected ? (
 <button
 type="button"
 onClick={() => handleDisconnect(platform.key)}
 disabled={busy}
 style={{ ...DESTRUCTIVE_OUTLINE_STYLE, opacity: busy ? 0.7 : 1 }}
 >
 {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
 Disconnect
 </button>
 ) : (
 <button
 type="button"
 onClick={() => handleConnect(platform.key)}
 disabled={busy || loading}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: busy || loading ? 0.7 : 1 }}
 >
 {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
 Connect
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>

 <Toast toast={toast} />
 </div>
 );
}
