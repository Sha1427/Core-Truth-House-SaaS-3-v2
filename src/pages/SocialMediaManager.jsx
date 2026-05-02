import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import {
 Plus,
 ChevronLeft,
 ChevronRight,
 Instagram,
 Linkedin,
 Facebook,
 Clock,
 Send,
 Trash2,
 Wand2,
 Loader2,
 X,
 Share2,
 Hash,
 Sparkles,
 Video,
 Upload,
 Music,
 Store,
 Pin,
 Layout as LayoutIcon,
 Check,
 Calendar as CalendarIcon,
 Grid3x3,
 List as ListIcon,
 AlertCircle,
 RefreshCw,
} from "lucide-react";
import TrackingLinkManager from "../components/mail/TrackingLinkManager";
import CampaignContextBanner from "../components/shared/CampaignContextBanner";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PLATFORM_CFG = {
 instagram: { icon: Instagram, color: "#E1306C", limit: 2200, label: "Instagram" },
 linkedin: { icon: Linkedin, color: "#0A66C2", limit: 3000, label: "LinkedIn" },
 facebook: { icon: Facebook, color: "#1877F2", limit: 5000, label: "Facebook" },
 tiktok: { icon: Music, color: "#FF0050", limit: 2200, label: "TikTok" },
 google_business: { icon: Store, color: "#4285F4", limit: 1500, label: "Google Business" },
 threads: { icon: Hash, color: "#101010", limit: 500, label: "Threads" },
 pinterest: { icon: Pin, color: "#E60023", limit: 500, label: "Pinterest" },
};

const STATUS_CFG = {
 draft: { label: "Draft", tone: "muted" },
 needs_approval: { label: "Needs Approval", tone: "gold" },
 rejected: { label: "Rejected", tone: "crimson" },
 scheduled: { label: "Scheduled", tone: "purple" },
 published: { label: "Published", tone: "success" },
 failed: { label: "Failed", tone: "crimson" },
};

const STATUS_FILTER_OPTIONS = [
 { key: "all", label: "All Statuses" },
 { key: "draft", label: "Drafts" },
 { key: "scheduled", label: "Scheduled" },
 { key: "needs_approval", label: "Needs Approval" },
 { key: "published", label: "Published" },
 { key: "failed", label: "Failed" },
];

const SORT_OPTIONS = [
 { key: "time", label: "Most recent" },
 { key: "likes", label: "Most likes" },
 { key: "shares", label: "Most shares" },
 { key: "comments", label: "Most comments" },
 { key: "clicks", label: "Most clicks" },
];

const TONES = [
 "professional",
 "casual",
 "witty",
 "inspirational",
 "educational",
 "conversational",
];

const SURFACES = [
 { key: "publish", label: "Publish Calendar", icon: CalendarIcon },
 { key: "grid", label: "Instagram Grid", icon: Grid3x3 },
 { key: "posts", label: "Posts", icon: ListIcon },
];

const SOCIAL_CONNECT_PLATFORMS = [
 { key: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C", urlKey: "instagram_connect", note: "Posting + profile sync" },
 { key: "facebook", label: "Facebook", icon: Facebook, color: "#1877F2", urlKey: "facebook_connect", note: "Page posting" },
 { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2", urlKey: "linkedin_connect", note: "Personal share" },
 { key: "tiktok", label: "TikTok", icon: Music, color: "#FF0050", urlKey: "tiktok_connect", note: "Video posting" },
 { key: "pinterest", label: "Pinterest", icon: Pin, color: "#E60023", urlKey: "pinterest_connect", note: "Pin posting" },
 { key: "google_business", label: "Google Business", icon: Store, color: "#4285F4", urlKey: "google_business_connect", note: "Local Posts" },
 { key: "threads", label: "Threads", icon: Hash, color: "#101010", urlKey: "threads_connect", note: "Thread posting" },
];

const PAGE_STYLE = {
 background: "var(--cth-command-blush)",
 minHeight: "100%",
};

const PANEL_STYLE = {
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
};

const SOFT_PANEL_STYLE = {
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
};

const INPUT_STYLE = {
 width: "100%",
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 padding: "10px 12px",
 color: "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 14,
 outline: "none",
};

const SMALL_INPUT_STYLE = {
 ...INPUT_STYLE,
 padding: "8px 12px",
 fontSize: 13,
};

const PRIMARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 4,
 background: "var(--cth-command-purple)",
 color: "var(--cth-command-gold)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const SECONDARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "8px 14px",
 borderRadius: 4,
 background: "transparent",
 border: "1px solid var(--cth-command-border)",
 color: "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 cursor: "pointer",
};

const DESTRUCTIVE_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 4,
 background: "var(--cth-command-crimson)",
 color: "var(--cth-command-ivory)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const DESTRUCTIVE_OUTLINE_STYLE = {
 ...SECONDARY_BUTTON_STYLE,
 color: "var(--cth-command-crimson)",
 border: "1px solid var(--cth-command-crimson)",
};

const EYEBROW_STYLE = {
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.18em",
 textTransform: "uppercase",
 color: "var(--cth-command-muted)",
};

function backendAssetUrl(url) {
 if (!url) return "";
 if (/^https?:\/\//i.test(url)) return url;

 const base =
 import.meta.env.VITE_API_BASE_URL ||
 import.meta.env.VITE_BACKEND_URL ||
 "https://api.coretruthhouse.com";

 return `${String(base).replace(/\/+$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

function FieldLabel({ children, hint }) {
 return (
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
 <label style={{ ...EYEBROW_STYLE, fontSize: 11 }}>{children}</label>
 {hint ? <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>{hint}</span> : null}
 </div>
 );
}

function Eyebrow({ children }) {
 return <div style={EYEBROW_STYLE}>{children}</div>;
}

function Chip({ children, tone = "muted" }) {
 const tones = {
 default: { background: "rgba(175,0,42,0.10)", border: "1px solid rgba(175,0,42,0.22)", color: "var(--cth-command-crimson)" },
 crimson: { background: "rgba(175,0,42,0.10)", border: "1px solid rgba(175,0,42,0.22)", color: "var(--cth-command-crimson)" },
 muted: { background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" },
 gold: { background: "rgba(196,169,91,0.18)", border: "1px solid rgba(196,169,91,0.40)", color: "var(--cth-command-purple)" },
 purple: { background: "rgba(51,3,60,0.10)", border: "1px solid rgba(51,3,60,0.22)", color: "var(--cth-command-purple)" },
 success: { background: "rgba(34,135,90,0.12)", border: "1px solid rgba(34,135,90,0.28)", color: "#15803d" },
 };
 const style = tones[tone] || tones.muted;
 return (
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 borderRadius: 999,
 padding: "3px 10px",
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.06em",
 textTransform: "uppercase",
 ...style,
 }}
 >
 {children}
 </span>
 );
}

function PlatformBadge({ platform, size = "sm" }) {
 const cfg = PLATFORM_CFG[platform] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 const padding = size === "sm" ? "3px 10px" : "6px 12px";
 const fontSize = size === "sm" ? 11 : 12;
 const iconSize = size === "sm" ? 11 : 13;
 return (
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: 6,
 borderRadius: 999,
 padding,
 background: `${cfg.color}15`,
 color: cfg.color,
 border: `1px solid ${cfg.color}25`,
 fontFamily: SANS,
 fontSize,
 fontWeight: 600,
 letterSpacing: "0.04em",
 }}
 >
 <Icon size={iconSize} /> {cfg.label}
 </span>
 );
}

function MetricTile({ label, value, accent }) {
 return (
 <div style={{ ...PANEL_STYLE, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <span
 aria-hidden="true"
 style={{
 width: 8,
 height: 8,
 borderRadius: "50%",
 background: accent,
 display: "inline-block",
 }}
 />
 <span style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>{label}</span>
 </div>
 <span
 style={{
 fontFamily: SERIF,
 fontSize: 32,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 lineHeight: 1,
 }}
 >
 {value}
 </span>
 </div>
 );
}

function Panel({ eyebrow, title, subtitle, action, children, padding = 24 }) {
 const showHeader = Boolean(eyebrow || title || subtitle || action);
 return (
 <section style={{ ...PANEL_STYLE, padding }}>
 {showHeader ? (
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 20,
 }}
 >
 <div style={{ minWidth: 0 }}>
 {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
 {title ? (
 <h2
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: eyebrow ? "6px 0 0" : 0,
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 }}
 >
 {title}
 </h2>
 ) : null}
 {subtitle ? (
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "6px 0 0",
 lineHeight: 1.5,
 }}
 >
 {subtitle}
 </p>
 ) : null}
 </div>
 {action}
 </div>
 ) : null}
 {children}
 </section>
 );
}

function EmptyState({ icon: Icon, title, body }) {
 return (
 <div
 style={{
 padding: "32px 18px",
 textAlign: "center",
 background: "var(--cth-command-panel-soft)",
 border: "1px dashed var(--cth-command-border)",
 borderRadius: 4,
 }}
 >
 {Icon ? (
 <Icon
 size={28}
 style={{ color: "var(--cth-command-muted)", display: "block", margin: "0 auto 10px" }}
 />
 ) : null}
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 16,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginBottom: 6,
 }}
 >
 {title}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)" }}>{body}</div>
 </div>
 );
}

function IconButton({ onClick, label, hoverColor = "var(--cth-command-crimson)", disabled = false, busy = false, children }) {
 const [hover, setHover] = useState(false);
 return (
 <button
 type="button"
 aria-label={label}
 onClick={onClick}
 disabled={disabled || busy}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 style={{
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 width: 32,
 height: 32,
 borderRadius: 4,
 background: "transparent",
 border: `1px solid ${hover && !disabled ? "var(--cth-command-border)" : "transparent"}`,
 color: hover && !disabled ? hoverColor : "var(--cth-command-muted)",
 cursor: disabled || busy ? "default" : "pointer",
 opacity: disabled ? 0.4 : 1,
 transition: "color 150ms ease, border-color 150ms ease",
 }}
 >
 {busy ? <Loader2 size={14} className="animate-spin" /> : children}
 </button>
 );
}

function TabBar({ value, onChange }) {
 return (
 <div
 style={{
 display: "inline-flex",
 gap: 4,
 padding: 4,
 borderRadius: 4,
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 }}
 >
 {SURFACES.map((tab) => {
 const Icon = tab.icon;
 const active = value === tab.key;
 return (
 <button
 key={tab.key}
 type="button"
 onClick={() => onChange(tab.key)}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: 8,
 padding: "8px 14px",
 borderRadius: 4,
 background: active ? "var(--cth-command-purple)" : "transparent",
 color: active ? "var(--cth-command-gold)" : "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
 transition: "background 150ms ease, color 150ms ease",
 }}
 >
 <Icon size={14} /> {tab.label}
 </button>
 );
 })}
 </div>
 );
}

function Toast({ toast }) {
 if (!toast) return null;
 const isError = toast.tone === "error";
 return (
 <div
 role="status"
 aria-live="polite"
 style={{
 position: "fixed",
 bottom: 24,
 right: 24,
 zIndex: 80,
 background: "var(--cth-command-panel)",
 border: `1px solid ${isError ? "var(--cth-command-crimson)" : "var(--cth-command-gold)"}`,
 borderRadius: 4,
 padding: "12px 18px",
 boxShadow: "0 20px 40px rgba(13,0,16,0.18)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 color: "var(--cth-command-ink)",
 display: "flex",
 alignItems: "center",
 gap: 10,
 maxWidth: 420,
 }}
 >
 {isError ? <AlertCircle size={16} style={{ color: "var(--cth-command-crimson)", flexShrink: 0 }} /> : null}
 <span>{toast.message}</span>
 </div>
 );
}

function ConfirmModal({ confirm, busy, onCancel, onConfirm }) {
 if (!confirm) return null;
 return (
 <div
 role="presentation"
 onClick={onCancel}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 70,
 background: "rgba(13, 0, 16, 0.6)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 padding: 16,
 }}
 >
 <div
 role="dialog"
 aria-modal="true"
 onClick={(e) => e.stopPropagation()}
 style={{
 width: "100%",
 maxWidth: 480,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 padding: 28,
 boxShadow: "0 30px 60px rgba(13,0,16,0.25)",
 }}
 >
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 {confirm.title}
 </h3>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "12px 0 24px",
 lineHeight: 1.55,
 }}
 >
 {confirm.body}
 </p>
 <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
 <button
 type="button"
 onClick={onCancel}
 disabled={busy}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: busy ? 0.6 : 1 }}
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={onConfirm}
 disabled={busy}
 style={{
 ...(confirm.confirmTone === "primary" ? PRIMARY_BUTTON_STYLE : DESTRUCTIVE_BUTTON_STYLE),
 opacity: busy ? 0.7 : 1,
 }}
 >
 {busy
 ? <Loader2 size={14} className="animate-spin" />
 : confirm.confirmTone === "primary"
 ? <Send size={14} />
 : <Trash2 size={14} />}
 {confirm.confirmLabel || "Delete"}
 </button>
 </div>
 </div>
 </div>
 );
}

export default function SocialMediaManager() {
 const { currentWorkspace } = useWorkspace();
 const location = useLocation();
 const navigate = useNavigate();
 const handoff = location.state || {};
 const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";
 const surfaceParam = new URLSearchParams(location.search).get("surface");

 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [posts, setPosts] = useState([]);
 const [calendarData, setCalendarData] = useState({});
 const [platforms, setPlatforms] = useState([]);
 const [analytics, setAnalytics] = useState(null);
 const [currentDate, setCurrentDate] = useState(new Date());
 const [showModal, setShowModal] = useState(null);
 const [editingPostId, setEditingPostId] = useState(null);
 const [formData, setFormData] = useState({});
 const [selectedPlatforms, setSelectedPlatforms] = useState([]);
 const [activePlatformTab, setActivePlatformTab] = useState("instagram");
 const [platformContent, setPlatformContent] = useState({});
 const [generating, setGenerating] = useState(false);
 const [savingPost, setSavingPost] = useState(false);
 const [activeView, setActiveView] = useState("publish");
 const [filterPlatform, setFilterPlatform] = useState("all");
 const [filterStatus, setFilterStatus] = useState("all");
 const [sortBy, setSortBy] = useState("time");
 const [selectedPostIds, setSelectedPostIds] = useState([]);
 const [bulkScheduleDate, setBulkScheduleDate] = useState("");
 const [bulkScheduling, setBulkScheduling] = useState(false);
 const [publishingId, setPublishingId] = useState(null);
 const [recycleBusy, setRecycleBusy] = useState(false);
 const [syncingProfile, setSyncingProfile] = useState(false);
 const [connections, setConnections] = useState({});
 const [connectionsLoading, setConnectionsLoading] = useState(false);
 const [actionBusyPlatform, setActionBusyPlatform] = useState("");
 const [pinterestBoards, setPinterestBoards] = useState([]);
 const [pinterestBoardsLoading, setPinterestBoardsLoading] = useState(false);
 const [gbpLocations, setGbpLocations] = useState([]);
 const [gbpLocationsLoading, setGbpLocationsLoading] = useState(false);
 const [routing, setRouting] = useState(null);
 const [routingLoading, setRoutingLoading] = useState(false);
 const routingMode = routing?.mode || "direct";

 // Backwards-compatible aliases for the existing IG-only sync UI.
 const igConnection =
 connections.instagram ||
 (routing?.zernio?.connected_platforms || []).find((c) => c.platform === "instagram") ||
 (routing?.ayrshare?.connected_platforms || []).find((c) => c.platform === "instagram") ||
 null;
 const igConnectionLoading = connectionsLoading;
 const igActionBusy = actionBusyPlatform === "instagram";
 const [gridProfile, setGridProfile] = useState({
 handle: "yourbrand",
 display_name: "Your Brand",
 category: "Brand / Business",
 bio_line_1: "Write a clear brand promise",
 bio_line_2: "Show what you help people do",
 bio_line_3: "Add a simple CTA or offer",
 website: "yourbrand.com",
 avatar_url: "",
 posts_count: 0,
 followers_count: 0,
 following_count: 0,
 });

 const [confirm, setConfirm] = useState(null);
 const [confirmBusy, setConfirmBusy] = useState(false);
 const [toast, setToast] = useState(null);

 const showToast = (message, tone = "success") => setToast({ message, tone });

 useEffect(() => {
 if (!toast) return undefined;
 const id = setTimeout(() => setToast(null), 2500);
 return () => clearTimeout(id);
 }, [toast]);

 const closePostModal = () => {
 setShowModal(null);
 if (surfaceParam === "create") {
 navigate("/social-media-manager?surface=publish", { replace: true });
 }
 };

 useEffect(() => {
 const allowed = new Set(["create", "plan", "grid", "publish", "linkhub", "posts"]);
 if (!surfaceParam || !allowed.has(surfaceParam)) return;

 if (surfaceParam === "create") {
 setActiveView("publish");
 setSelectedPlatforms((prev) => (prev.length ? prev : ["instagram"]));
 setFormData((d) => ({ ...d, platform: d.platform || "instagram" }));
 setShowModal("post");
 return;
 }

 const mapped =
 surfaceParam === "plan"
 ? "publish"
 : surfaceParam === "linkhub"
 ? "posts"
 : surfaceParam;

 setActiveView(mapped);
 // Only sync from URL on URL changes — do NOT depend on activeView/showModal/selectedPlatforms,
 // otherwise this effect re-runs after every user-initiated tab click and reverts it.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [surfaceParam]);

 useEffect(() => {
 if (!selectedPlatforms.length) {
 if (activePlatformTab !== "") setActivePlatformTab("");
 return;
 }
 if (!selectedPlatforms.includes(activePlatformTab)) {
 setActivePlatformTab(selectedPlatforms[0]);
 }
 }, [selectedPlatforms, activePlatformTab]);

 useEffect(() => {
 try {
 const raw = localStorage.getItem(`cth-social-grid-profile:${workspaceId}`);
 if (!raw) return;
 const saved = JSON.parse(raw);
 setGridProfile((prev) => ({ ...prev, ...saved }));
 } catch (err) {
 console.error("Grid profile load error:", err);
 }
 }, [workspaceId]);

 useEffect(() => {
 try {
 localStorage.setItem(
 `cth-social-grid-profile:${workspaceId}`,
 JSON.stringify(gridProfile)
 );
 } catch (err) {
 console.error("Grid profile save error:", err);
 }
 }, [gridProfile, workspaceId]);

 const [gridSlots, setGridSlots] = useState([]);
 const [draggedGridIndex, setDraggedGridIndex] = useState(null);
 const [pendingGridSlotIndex, setPendingGridSlotIndex] = useState(null);
 const [uploadingMedia, setUploadingMedia] = useState(false);
 const [mediaPreview, setMediaPreview] = useState([]);
 const mediaInputRef = useRef(null);
 const gridSlotFileInputRef = useRef(null);
 const gridAvatarInputRef = useRef(null);

 const currentYear = currentDate.getFullYear();
 const currentMonth = currentDate.getMonth() + 1;

 useEffect(() => {
 if (!workspaceId) return;
 void fetchAllData();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [currentYear, currentMonth, workspaceId]);

 useEffect(() => {
 if (!workspaceId) return;
 void loadAllConnections();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [workspaceId]);

 useEffect(() => {
 const params = new URLSearchParams(location.search);
 let matchedPlatform = null;
 let status = null;

 const aggregatorKeys = [
 { urlKey: "zernio_connect", label: "Zernio" },
 { urlKey: "ayrshare_connect", label: "Ayrshare" },
 ];
 for (const v of aggregatorKeys) {
 const value = params.get(v.urlKey);
 if (value) {
 if (value === "success") {
 const platform = params.get("platform");
 showToast(
 platform
 ? `${v.label} connected · ${platform} ready`
 : `${v.label} connected`
 );
 void loadAllConnections();
 } else if (value === "error") {
 const detail = params.get("reason") || params.get("detail") || "Connection failed";
 showToast(`${v.label} connect failed: ${detail}`, "error");
 }
 const cleaned = new URLSearchParams(location.search);
 cleaned.delete(v.urlKey);
 ["platform", "reason", "detail"].forEach((k) => cleaned.delete(k));
 const qs = cleaned.toString();
 navigate(`${location.pathname}${qs ? `?${qs}` : ""}`, { replace: true });
 return;
 }
 }

 for (const platform of SOCIAL_CONNECT_PLATFORMS) {
 const value = params.get(platform.urlKey);
 if (value) {
 matchedPlatform = platform;
 status = value;
 break;
 }
 }

 if (!matchedPlatform || !status) return;

 if (status === "success") {
 const username = params.get("username") || params.get("page") || params.get("name") || params.get("account");
 showToast(
 username
 ? `${matchedPlatform.label} connected as ${username}`
 : `${matchedPlatform.label} connected`
 );
 void loadAllConnections();
 } else if (status === "error") {
 const detail = params.get("detail") || params.get("reason") || "Connection failed";
 showToast(`${matchedPlatform.label} connect failed: ${detail}`, "error");
 }

 const cleaned = new URLSearchParams(location.search);
 SOCIAL_CONNECT_PLATFORMS.forEach((p) => cleaned.delete(p.urlKey));
 ["username", "page", "name", "account", "reason", "detail"].forEach((k) => cleaned.delete(k));
 const qs = cleaned.toString();
 navigate(`${location.pathname}${qs ? `?${qs}` : ""}`, { replace: true });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [location.search]);

 const [activeCampaignId, setActiveCampaignId] = useState(() => handoff?.campaignId || null);
 const [activeCampaignName, setActiveCampaignName] = useState(() => handoff?.campaignName || null);

 const [showCampaignDrawer, setShowCampaignDrawer] = useState(false);
 const [drawerCampaigns, setDrawerCampaigns] = useState([]);
 const [drawerCampaignsLoading, setDrawerCampaignsLoading] = useState(false);
 const [drawerSelectedCampaignId, setDrawerSelectedCampaignId] = useState(null);
 const [drawerContent, setDrawerContent] = useState([]);
 const [drawerMedia, setDrawerMedia] = useState([]);
 const [drawerSelectedContentId, setDrawerSelectedContentId] = useState(null);
 const [drawerSelectedMediaIds, setDrawerSelectedMediaIds] = useState([]);
 const [drawerLoading, setDrawerLoading] = useState(false);

 useEffect(() => {
 if (!handoff) return;
 const pf = handoff.prefillContent;
 const pt = handoff.prefillTitle;
 const cid = handoff.contentItemId;
 const camp = handoff.campaignId;
 const campName = handoff.campaignName;
 if (!pf && !pt && !cid && !camp) return;

 if (camp) {
 setActiveCampaignId(camp);
 if (campName) setActiveCampaignName(campName);
 }
 setFormData((prev) => ({
 ...prev,
 ...(pf ? { content: pf } : {}),
 ...(pt ? { title: pt } : {}),
 ...(cid ? { content_item_id: cid } : {}),
 ...(camp ? { campaign_id: camp } : {}),
 }));
 if (pf || pt) {
 setShowModal("post");
 if (!selectedPlatforms.length) setSelectedPlatforms(["instagram"]);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [handoff?.prefillContent, handoff?.prefillTitle, handoff?.contentItemId, handoff?.campaignId, handoff?.campaignName]);

 useEffect(() => {
 if (!handoff?.campaignId || !Array.isArray(handoff?.contentPlan) || !handoff.contentPlan.length) return;

 const firstItem = handoff.contentPlan[0] || {};
 const platformLower = String(firstItem.platform || "").toLowerCase();
 const normalizedPlatform = platformLower.includes("linkedin")
 ? "linkedin"
 : platformLower.includes("instagram")
 ? "instagram"
 : platformLower.includes("facebook")
 ? "facebook"
 : platformLower.includes("tiktok")
 ? "tiktok"
 : "instagram";

 setActiveView("publish");
 setShowModal("post");
 setSelectedPlatforms([normalizedPlatform]);
 setFormData((prev) => ({
 ...prev,
 campaign_id: handoff.campaignId || "",
 title: handoff.campaignName || "",
 topic: firstItem.topic || handoff.offerName || handoff.campaignName || "",
 platform: normalizedPlatform,
 content: prev.content || "",
 scheduled_date: prev.scheduled_date || new Date().toISOString().slice(0, 10),
 media_urls: prev.media_urls || [],
 }));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [handoff]);

 async function fetchAllData(opts = {}) {
 const { silent = false } = opts;
 if (silent) setRefreshing(true);
 else setLoading(true);

 try {
 const [postsRes, calRes, platRes, anaRes] = await Promise.all([
 apiClient.get("/api/social/posts", { params: { limit: 50 } }),
 apiClient.get("/api/social/posts/calendar", {
 params: { year: currentYear, month: currentMonth },
 }),
 apiClient.get("/api/social/platforms"),
 apiClient.get("/api/social/analytics"),
 ]);

 const fetchedPosts = postsRes?.posts || [];
 setPosts(fetchedPosts);
 setCalendarData(calRes?.calendar || {});
 setPlatforms(platRes?.platforms || []);
 setAnalytics(anaRes || null);
 return { posts: fetchedPosts };
 } catch (err) {
 console.error("Social fetch error:", err);
 setPosts([]);
 setCalendarData({});
 setPlatforms([]);
 setAnalytics(null);
 if (silent) showToast("Could not refresh social data", "error");
 return { posts: [] };
 } finally {
 setLoading(false);
 setRefreshing(false);
 }
 }

 async function openCampaignDrawer() {
 setShowCampaignDrawer(true);
 setDrawerCampaignsLoading(true);
 setDrawerSelectedCampaignId(null);
 setDrawerContent([]);
 setDrawerMedia([]);
 setDrawerSelectedContentId(null);
 setDrawerSelectedMediaIds([]);
 try {
 const res = await apiClient.get('/api/campaigns', {
 params: { user_id: currentWorkspace?.user_id || '', workspace_id: workspaceId },
 });
 setDrawerCampaigns(res?.campaigns || []);
 } catch (err) {
 console.error('Failed to load campaigns for drawer:', err);
 setDrawerCampaigns([]);
 showToast("Could not load campaigns", "error");
 } finally {
 setDrawerCampaignsLoading(false);
 }
 }

 async function selectDrawerCampaign(campaign) {
 if (!campaign?.id) return;
 setDrawerSelectedCampaignId(campaign.id);
 setDrawerSelectedContentId(null);
 setDrawerSelectedMediaIds([]);
 setDrawerLoading(true);
 try {
 const [contentRes, mediaRes] = await Promise.allSettled([
 apiClient.get('/api/persist/content/library', {
 params: {
 user_id: currentWorkspace?.user_id || '',
 workspace_id: workspaceId,
 campaign_id: campaign.id,
 },
 }),
 apiClient.get(`/api/media/campaign/${campaign.id}`),
 ]);
 const allContent = contentRes.status === 'fulfilled' ? (contentRes.value?.items || contentRes.value?.content || []) : [];
 setDrawerContent(allContent.filter((it) => it.campaign_id === campaign.id));
 setDrawerMedia(mediaRes.status === 'fulfilled' ? (mediaRes.value?.media || []) : []);
 } catch (err) {
 console.error('Failed to load campaign assets for drawer:', err);
 showToast("Could not load campaign assets", "error");
 } finally {
 setDrawerLoading(false);
 }
 }

 function applyDrawerSelections() {
 const selectedCampaign = drawerCampaigns.find((c) => c.id === drawerSelectedCampaignId);
 const selectedContent = drawerContent.find((c) => c.id === drawerSelectedContentId);
 const selectedMediaItems = drawerMedia.filter((m) => drawerSelectedMediaIds.includes(m.asset_id || m.id));
 const mediaUrls = selectedMediaItems
 .map((m) => m.preview_url || m.file_url || m.url || '')
 .filter(Boolean);
 const mediaIds = selectedMediaItems.map((m) => m.asset_id || m.id).filter(Boolean);

 if (selectedCampaign) {
 setActiveCampaignId(selectedCampaign.id);
 setActiveCampaignName(selectedCampaign.name || null);
 }

 setFormData((prev) => ({
 ...prev,
 campaign_id: selectedCampaign?.id || prev.campaign_id || null,
 content: selectedContent?.content || prev.content || '',
 title: selectedContent?.title || prev.title || '',
 content_item_id: selectedContent?.id || prev.content_item_id || null,
 media_urls: [...(prev.media_urls || []), ...mediaUrls],
 media_asset_ids: [...(prev.media_asset_ids || []), ...mediaIds],
 }));

 if (!selectedPlatforms.length) setSelectedPlatforms(['instagram']);
 setShowCampaignDrawer(false);
 setShowModal('post');
 }

 const activePlatformKey = activePlatformTab || formData.platform || selectedPlatforms[0] || "instagram";
 const activePlatformData = platformContent[activePlatformKey] || {};
 const charLimit = PLATFORM_CFG[activePlatformKey]?.limit || 2200;
 const charCount = (activePlatformData.content || formData.content || "").length;

 const overLimitPlatforms = useMemo(() => {
 return selectedPlatforms.filter((pid) => {
 const limit = PLATFORM_CFG[pid]?.limit || 2200;
 const content = (platformContent[pid]?.content) || (pid === activePlatformKey ? (formData.content || "") : "");
 return content.length > limit;
 });
 }, [selectedPlatforms, platformContent, formData.content, activePlatformKey]);

 const canSavePost =
 selectedPlatforms.length > 0 &&
 (Object.values(platformContent).some((entry) => entry?.content) ||
 formData.content || formData.topic || formData.title) &&
 overLimitPlatforms.length === 0;

 async function handleCreatePost() {
 setSavingPost(true);
 try {
 if (editingPostId) {
 const postData = {
 ...formData,
 media_urls: formData.media_urls || [],
 cta_url: formData.cta_url || "",
 link_in_bio_url: formData.link_in_bio_url || "",
 content: activePlatformData.content || formData.content || "",
 hashtags: activePlatformData.hashtags || formData.hashtags || [],
 platform: formData.platform || activePlatformKey || "instagram",
 campaign_id: formData.campaign_id || activeCampaignId || null,
 content_item_id: formData.content_item_id || null,
 media_asset_ids: formData.media_asset_ids || [],
 platform_extra: formData.platform_extra || {},
 };

 await apiClient.put(`/api/social/posts/${editingPostId}`, postData);
 showToast("Post updated");

 closePostModal();
 setEditingPostId(null);
 setFormData({});
 setSelectedPlatforms([]);
 setActivePlatformTab("instagram");
 setPlatformContent({});
 setMediaPreview([]);
 await fetchAllData({ silent: true });
 } else {
 const platformsToSave = selectedPlatforms.length
 ? selectedPlatforms
 : [formData.platform || "instagram"];

 const responses = await Promise.all(
 platformsToSave.map((platformId) => {
 const platformData = platformContent[platformId] || {};
 const postData = {
 ...formData,
 platform: platformId,
 content: platformData.content || formData.content || "",
 hashtags: platformData.hashtags || formData.hashtags || [],
 media_urls: formData.media_urls || [],
 cta_url: formData.cta_url || "",
 link_in_bio_url: formData.link_in_bio_url || "",
 campaign_id: formData.campaign_id || activeCampaignId || null,
 content_item_id: formData.content_item_id || null,
 media_asset_ids: formData.media_asset_ids || [],
 platform_extra: formData.platform_extra || {},
 };

 return apiClient.post("/api/social/posts", postData);
 })
 );
 showToast(`${platformsToSave.length} post${platformsToSave.length === 1 ? "" : "s"} saved`);

 // Capture new post ID(s) — defensive against varying response shapes
 const newIds = responses
 .map((r) => r?.post?.id || r?.id || r?.data?.post?.id || r?.data?.id)
 .filter(Boolean);

 const fetchResult = await fetchAllData({ silent: true });
 const fetchedPosts = fetchResult?.posts || [];

 // Single new post → re-open in edit mode so user can finalize.
 // Multi-platform → close modal, switch to Posts view (newest first).
 if (platformsToSave.length === 1 && newIds.length === 1) {
 const newPost = fetchedPosts.find((p) => String(p.id) === String(newIds[0]));
 if (newPost) {
 if (surfaceParam === "create") {
 navigate("/social-media-manager?surface=publish", { replace: true });
 }
 handleEditPost(newPost);
 return;
 }
 }

 closePostModal();
 setEditingPostId(null);
 setFormData({});
 setSelectedPlatforms([]);
 setActivePlatformTab("instagram");
 setPlatformContent({});
 setMediaPreview([]);
 setActiveView("posts");
 }
 } catch (err) {
 console.error("Create post error:", err);
 showToast("Could not save post", "error");
 } finally {
 setSavingPost(false);
 }
 }

 async function handleBulkSchedule() {
 if (!selectedPostIds.length || !bulkScheduleDate) return;

 setBulkScheduling(true);
 try {
 await Promise.all(
 selectedPostIds.map((id) =>
 apiClient.put(`/api/social/posts/${id}`, {
 scheduled_for: new Date(bulkScheduleDate).toISOString(),
 status: "scheduled",
 })
 )
 );

 const count = selectedPostIds.length;
 setSelectedPostIds([]);
 setBulkScheduleDate("");
 await fetchAllData({ silent: true });
 showToast(`${count} post${count === 1 ? "" : "s"} scheduled`);
 } catch (err) {
 console.error("Bulk schedule error:", err);
 showToast("Bulk scheduling failed", "error");
 } finally {
 setBulkScheduling(false);
 }
 }

 function handleRecycleTopPost() {
 setRecycleBusy(true);
 try {
 const ranked = [...posts].sort((a, b) => {
 const aScore =
 Number(a.engagement_rate || 0) +
 Number(a.clicks || 0) +
 Number(a.likes || 0) +
 Number(a.comments || 0) +
 Number(a.shares || 0);

 const bScore =
 Number(b.engagement_rate || 0) +
 Number(b.clicks || 0) +
 Number(b.likes || 0) +
 Number(b.comments || 0) +
 Number(b.shares || 0);

 return bScore - aScore;
 });

 const sourcePost =
 ranked.find((post) => post.status === "published") ||
 ranked.find((post) => post.status === "scheduled") ||
 ranked[0];

 if (!sourcePost) {
 showToast("No posts available to recycle yet", "error");
 return;
 }

 setShowModal("post");
 setEditingPostId(null);
 setSelectedPlatforms([sourcePost.platform || "instagram"]);
 setFormData({
 title: sourcePost.title || sourcePost.topic || "",
 topic: sourcePost.topic || sourcePost.title || "",
 platform: sourcePost.platform || "instagram",
 content: sourcePost.content || "",
 hashtags: sourcePost.hashtags || [],
 media_urls: sourcePost.media_urls || [],
 first_comment: sourcePost.first_comment || "",
 cta_url: sourcePost.cta_url || "",
 link_in_bio_url: sourcePost.link_in_bio_url || "",
 status: "draft",
 recycled_from_post_id: sourcePost.id,
 recycle_mode: true,
 });
 setMediaPreview(
 (sourcePost.media_urls || []).map((url, i) => ({
 url,
 name: `recycled-${i + 1}`,
 type: "image",
 }))
 );
 } finally {
 setRecycleBusy(false);
 }
 }

 async function handleMediaUpload(event) {
 const files = event.target.files;
 if (!files?.length) return;

 setUploadingMedia(true);

 try {
 const newUrls = [...(formData.media_urls || [])];
 const newPreviews = [...mediaPreview];

 for (const file of files) {
 const fd = new FormData();
 fd.append("file", file);

 const res = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 newUrls.push(res.file_url);
 newPreviews.push({
 url: res.file_url,
 name: file.name,
 type: res.media_type,
 });
 }

 setFormData((d) => ({ ...d, media_urls: newUrls }));
 setMediaPreview(newPreviews);
 } catch (err) {
 console.error("Upload error:", err);
 showToast("Media upload failed", "error");
 } finally {
 setUploadingMedia(false);
 if (mediaInputRef.current) mediaInputRef.current.value = "";
 }
 }

 async function handleGridFileDrop(event, slotIndex) {
 event.preventDefault();

 const file = event.dataTransfer?.files?.[0];
 if (!file) {
 handleGridDrop(slotIndex);
 return;
 }

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 showToast("Please drop an image file for Instagram grid planning", "error");
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 await apiClient.post("/api/social/posts", {
 platform: "instagram",
 content: "",
 topic: file.name.replace(/\.[^.]+$/, ""),
 media_urls: [uploadRes.file_url],
 status: "draft",
 hashtags: [],
 });

 await fetchAllData({ silent: true });
 showToast("Image added to grid");
 } catch (err) {
 console.error("Grid file drop upload error:", err);
 showToast("Could not add image to grid", "error");
 }
 }

 async function handleGridSlotFileSelect(event) {
 const file = event.target.files?.[0];
 if (!file) return;

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 showToast("Please choose an image file for Instagram grid planning", "error");
 if (gridSlotFileInputRef.current) gridSlotFileInputRef.current.value = "";
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 await apiClient.post("/api/social/posts", {
 platform: "instagram",
 content: "",
 topic: file.name.replace(/\.[^.]+$/, ""),
 media_urls: [uploadRes.file_url],
 status: "draft",
 hashtags: [],
 });

 await fetchAllData({ silent: true });
 showToast("Image added to grid");
 } catch (err) {
 console.error("Grid slot file select upload error:", err);
 showToast("Could not add image to grid", "error");
 } finally {
 setPendingGridSlotIndex(null);
 if (gridSlotFileInputRef.current) gridSlotFileInputRef.current.value = "";
 }
 }

 async function handleGridAvatarSelect(event) {
 const file = event.target.files?.[0];
 if (!file) return;

 const isImage = String(file.type || "").startsWith("image/");
 if (!isImage) {
 showToast("Please choose an image file for the avatar", "error");
 if (gridAvatarInputRef.current) gridAvatarInputRef.current.value = "";
 return;
 }

 try {
 const fd = new FormData();
 fd.append("file", file);

 const uploadRes = await apiClient.post("/api/social/upload-media", fd, {
 headers: {},
 });

 setGridProfile((prev) => ({
 ...prev,
 avatar_url: uploadRes.file_url,
 }));
 showToast("Avatar updated");
 } catch (err) {
 console.error("Grid avatar upload error:", err);
 showToast("Could not upload avatar image", "error");
 } finally {
 if (gridAvatarInputRef.current) gridAvatarInputRef.current.value = "";
 }
 }

 async function loadRouting() {
 setRoutingLoading(true);
 try {
 const res = await apiClient.get("/api/social/zernio/connection");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setRouting(payload?.routing || null);
 } catch (err) {
 console.warn("Could not load routing config:", err);
 setRouting(null);
 } finally {
 setRoutingLoading(false);
 }
 }

 async function loadAllConnections() {
 setConnectionsLoading(true);
 try {
 await loadRouting();
 // Direct-mode connections come from per-platform endpoints.
 const results = await Promise.allSettled(
 SOCIAL_CONNECT_PLATFORMS.map((p) =>
 apiClient.get(`/api/social/${p.key}/connection`)
 )
 );
 const next = {};
 SOCIAL_CONNECT_PLATFORMS.forEach((p, idx) => {
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
 setConnectionsLoading(false);
 }
 }

 // Resolve connection state for a platform across all routing modes.
 function getPlatformConnection(platformKey) {
 if (routingMode === "direct") {
 return connections[platformKey] || null;
 }
 const vendorBlock = routing?.[routingMode] || {};
 const list = vendorBlock.connected_platforms || [];
 return list.find((c) => c.platform === platformKey) || null;
 }

 async function loadIgConnection() {
 // Refresh just the IG entry; used after explicit IG callbacks.
 try {
 const res = await apiClient.get("/api/social/instagram/connection");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setConnections((prev) => ({ ...prev, instagram: payload?.connection || null }));
 } catch (err) {
 console.warn("Could not load IG connection status:", err);
 }
 }

 const linkedFacebookPageName =
 igConnection?.extra?.page_name || igConnection?.extra?.page_id || null;

 async function handleConnectPlatform(platformKey) {
 setActionBusyPlatform(platformKey);
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
 if (!url) {
 throw new Error("Connect endpoint did not return an authorize URL.");
 }
 window.location.href = url;
 } catch (err) {
 console.error(`${platformKey} connect error:`, err);
 const detail = err?.response?.data?.detail || err?.message;
 const platformLabel =
 SOCIAL_CONNECT_PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 if (err?.response?.status === 500 && /not configured/i.test(detail || "")) {
 showToast(`${platformLabel} OAuth is not configured on the backend yet.`, "error");
 } else {
 showToast(detail || `Could not start ${platformLabel} connect flow`, "error");
 }
 } finally {
 setActionBusyPlatform("");
 }
 }

 async function handleDisconnectPlatform(platformKey) {
 setActionBusyPlatform(platformKey);
 try {
 if (routingMode === "zernio") {
 await apiClient.delete("/api/social/zernio/disconnect", { data: { platform: platformKey } });
 } else if (routingMode === "ayrshare") {
 await apiClient.delete("/api/social/ayrshare/disconnect", { data: { platform: platformKey } });
 } else {
 await apiClient.delete(`/api/social/${platformKey}/disconnect`);
 if (platformKey === "instagram") {
 setConnections((prev) => ({ ...prev, facebook: null }));
 }
 }
 setConnections((prev) => ({ ...prev, [platformKey]: null }));
 await loadRouting();
 const platformLabel =
 SOCIAL_CONNECT_PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 showToast(`${platformLabel} disconnected`);
 } catch (err) {
 const detail = err?.response?.data?.detail || err?.message;
 const platformLabel =
 SOCIAL_CONNECT_PLATFORMS.find((p) => p.key === platformKey)?.label || platformKey;
 showToast(detail || `Could not disconnect ${platformLabel}`, "error");
 } finally {
 setActionBusyPlatform("");
 }
 }

 async function handleSetRoutingMode(nextMode) {
 if (nextMode === routingMode) return;
 try {
 // Switching to direct: just clear the aggregator's local cache.
 // Switching to zernio/ayrshare: the first /connect call will set the mode.
 if (nextMode === "direct") {
 // No backend mutation needed; the next direct-mode connect proceeds normally.
 setRouting((prev) => prev ? { ...prev, mode: "direct" } : { mode: "direct" });
 showToast("Routing mode set to Direct.");
 return;
 }
 // Provision/ensure the aggregator profile by hitting /connect with no platform —
 // both vendor /connect endpoints set mode in the backend before returning.
 // We don't redirect though — just toast and let the user click a platform.
 setRouting((prev) => prev ? { ...prev, mode: nextMode } : { mode: nextMode });
 showToast(`Routing mode set to ${nextMode === "zernio" ? "Zernio" : "Ayrshare"}. Click a platform to connect.`);
 } catch (err) {
 const detail = err?.response?.data?.detail || err?.message;
 showToast(detail || "Could not change routing mode.", "error");
 }
 }

 // Compatibility shims so existing IG-specific buttons keep working.
 const handleConnectInstagram = () => handleConnectPlatform("instagram");
 const handleDisconnectInstagram = () => handleDisconnectPlatform("instagram");

 async function loadPinterestBoards() {
 if (!connections.pinterest) return;
 setPinterestBoardsLoading(true);
 try {
 const res = await apiClient.get("/api/social/pinterest/boards");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setPinterestBoards(payload?.boards || []);
 } catch (err) {
 console.warn("Could not load Pinterest boards:", err);
 setPinterestBoards([]);
 } finally {
 setPinterestBoardsLoading(false);
 }
 }

 async function loadGbpLocations() {
 if (!connections.google_business) return;
 setGbpLocationsLoading(true);
 try {
 const res = await apiClient.get("/api/social/google_business/locations");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 setGbpLocations(payload?.locations || []);
 } catch (err) {
 console.warn("Could not load Google Business locations:", err);
 setGbpLocations([]);
 } finally {
 setGbpLocationsLoading(false);
 }
 }

 useEffect(() => {
 if (showModal !== "post") return;
 if (selectedPlatforms.includes("pinterest") && connections.pinterest && !pinterestBoards.length) {
 void loadPinterestBoards();
 }
 if (selectedPlatforms.includes("google_business") && connections.google_business && !gbpLocations.length) {
 void loadGbpLocations();
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [showModal, selectedPlatforms, connections.pinterest, connections.google_business]);

 async function handleSyncInstagramProfile() {
 setSyncingProfile(true);
 try {
 const res = await apiClient.get("/api/social/instagram/profile");
 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 const profile = payload?.profile || payload;

 const username = profile?.username || profile?.handle || "";
 const displayName = profile?.name || profile?.display_name || profile?.full_name || "";
 const biography = profile?.biography || profile?.bio || "";
 const avatarUrl = profile?.profile_picture_url || profile?.avatar_url || profile?.profile_pic || "";
 const website = profile?.website || profile?.external_url || "";
 const followersCount = Number(profile?.followers_count ?? profile?.followers ?? 0);
 const followingCount = Number(
 profile?.follows_count ?? profile?.following_count ?? profile?.following ?? 0
 );
 const mediaCount = Number(profile?.media_count ?? profile?.posts_count ?? profile?.posts ?? 0);

 const bioLines = String(biography || "").split(/\r?\n/).filter((line) => line.trim().length);

 if (!username && !displayName && !biography && !avatarUrl) {
 showToast("Instagram returned an empty profile", "error");
 return;
 }

 setGridProfile((prev) => ({
 ...prev,
 handle: username || prev.handle,
 display_name: displayName || prev.display_name,
 bio_line_1: bioLines[0] || prev.bio_line_1,
 bio_line_2: bioLines[1] || prev.bio_line_2,
 bio_line_3: bioLines[2] || prev.bio_line_3,
 avatar_url: avatarUrl || prev.avatar_url,
 website: website || prev.website,
 posts_count: mediaCount || prev.posts_count,
 followers_count: followersCount || prev.followers_count,
 following_count: followingCount || prev.following_count,
 }));

 showToast("Profile synced from Instagram");
 } catch (err) {
 console.error("Instagram sync error:", err);
 const status = err?.response?.status;
 const detail = err?.response?.data?.detail || err?.message;
 if (status === 404) {
 showToast("Instagram sync isn't available yet — connect your account first.", "error");
 } else if (status === 401 || status === 403) {
 showToast("Instagram account is not connected.", "error");
 } else {
 showToast(detail || "Could not sync from Instagram", "error");
 }
 } finally {
 setSyncingProfile(false);
 }
 }

 function removeMedia(index) {
 const urls = [...(formData.media_urls || [])];
 urls.splice(index, 1);

 const previews = [...mediaPreview];
 previews.splice(index, 1);

 setFormData((d) => ({ ...d, media_urls: urls }));
 setMediaPreview(previews);
 }

 function removeHashtag(tag) {
 const currentTags = activePlatformData.hashtags || formData.hashtags || [];
 const next = currentTags.filter((t) => t !== tag);
 setPlatformContent((prev) => ({
 ...prev,
 [activePlatformKey]: {
 ...(prev[activePlatformKey] || {}),
 hashtags: next,
 },
 }));
 setFormData((d) => ({ ...d, hashtags: next }));
 }

 const requestDeletePost = (post) => {
 setConfirm({
 kind: "post",
 id: post.id,
 title: "Delete post?",
 body: "This will permanently delete this post. This cannot be undone.",
 confirmLabel: "Delete",
 });
 };

 const requestResetGrid = () => {
 const filled = gridSlots.filter((p) => !p?.isEmpty && p?.id);
 if (!filled.length) return;
 setConfirm({
 kind: "grid",
 ids: filled.map((p) => p.id),
 title: "Reset Instagram grid?",
 body: `This will permanently delete all ${filled.length} planned post${filled.length === 1 ? "" : "s"} in the grid. This cannot be undone.`,
 confirmLabel: "Reset",
 });
 };

 const cancelConfirm = () => {
 if (confirmBusy) return;
 setConfirm(null);
 };

 const requestPublishPost = (post) => {
 if (!post?.id) return;
 setConfirm({
 kind: "publish",
 id: post.id,
 title: "Publish to Instagram now?",
 body: "This post will go live on the connected account immediately. This cannot be undone.",
 confirmLabel: "Publish",
 confirmTone: "primary",
 });
 };

 const performConfirm = async () => {
 if (!confirm) return;
 setConfirmBusy(true);
 try {
 if (confirm.kind === "post") {
 await apiClient.delete(`/api/social/posts/${confirm.id}`);
 await fetchAllData({ silent: true });
 setConfirm(null);
 showToast("Post deleted");
 } else if (confirm.kind === "grid") {
 await Promise.all(confirm.ids.map((id) => apiClient.delete(`/api/social/posts/${id}`)));
 setDraggedGridIndex(null);
 await fetchAllData({ silent: true });
 setConfirm(null);
 showToast("Grid reset");
 } else if (confirm.kind === "publish") {
 await apiClient.post(`/api/social/posts/${confirm.id}/publish`, {});
 await fetchAllData({ silent: true });
 setConfirm(null);
 showToast("Post published");
 }
 } catch (err) {
 console.error("Confirm action error:", err);
 setConfirm(null);
 const errorMessages = {
 grid: "Could not reset grid",
 publish: "Could not publish post",
 post: "Could not delete post",
 };
 showToast(errorMessages[confirm.kind] || "Action failed", "error");
 } finally {
 setConfirmBusy(false);
 }
 };

 function handleEditPost(post) {
 setEditingPostId(post.id);
 setShowModal("post");
 setSelectedPlatforms([post.platform || "instagram"]);
 setFormData({
 ...post,
 media_urls: post.media_urls || [],
 hashtags: post.hashtags || [],
 first_comment: post.first_comment || "",
 cta_url: post.cta_url || "",
 link_in_bio_url: post.link_in_bio_url || "",
 recycle_mode: false,
 });
 setMediaPreview(
 (post.media_urls || []).map((url, i) => ({
 url,
 name: `media-${i + 1}`,
 type: "image",
 }))
 );
 }

 async function handlePublishPost(id) {
 setPublishingId(id);
 try {
 await apiClient.post(`/api/social/posts/${id}/publish`, {});
 await fetchAllData({ silent: true });
 showToast("Post published");
 } catch (err) {
 console.error("Publish error:", err);
 showToast("Could not publish post", "error");
 } finally {
 setPublishingId(null);
 }
 }

 async function handleGenerateContent() {
 if (!formData.topic || !selectedPlatforms.length) return;

 setGenerating(true);

 try {
 const results = await Promise.all(
 selectedPlatforms.map(async (platformId) => {
 const res = await apiClient.post("/api/social/generate", {
 topic: formData.topic,
 platform: platformId,
 tone: formData.tone || "professional",
 include_hashtags: true,
 include_cta: true,
 });

 const payload = res?.data && typeof res.data === "object" ? res.data : res;
 const content =
 payload?.generated_content ??
 payload?.content ??
 payload?.text ??
 payload?.result ??
 payload?.message ??
 "";
 const hashtags =
 payload?.hashtags ??
 payload?.tags ??
 [];

 if (!content) {
 console.warn("[social/generate] empty content for", platformId, "response:", res);
 }

 return [platformId, {
 content: typeof content === "string" ? content : "",
 hashtags: Array.isArray(hashtags) ? hashtags : [],
 }];
 })
 );

 const nextPlatformContent = Object.fromEntries(results);
 const allEmpty = Object.values(nextPlatformContent).every((entry) => !entry.content);

 setPlatformContent((prev) => ({
 ...prev,
 ...nextPlatformContent,
 }));

 const primaryPlatform = activePlatformKey || selectedPlatforms[0] || "instagram";
 const primaryData = nextPlatformContent[primaryPlatform] || nextPlatformContent[selectedPlatforms[0]] || {};

 setFormData((d) => ({
 ...d,
 platform: primaryPlatform,
 content: primaryData.content || d.content || "",
 hashtags: primaryData.hashtags?.length ? primaryData.hashtags : (d.hashtags || []),
 }));

 if (allEmpty) {
 showToast("Generator returned no content. Check the backend response.", "error");
 } else {
 showToast("Content generated");
 }
 } catch (err) {
 console.error("AI gen error:", err);
 const message =
 err?.response?.data?.detail || err?.message || "AI generation failed";
 showToast(message, "error");
 } finally {
 setGenerating(false);
 }
 }

 function navigateMonth(dir) {
 const d = new Date(currentDate);
 d.setMonth(d.getMonth() + dir);
 setCurrentDate(d);
 }

 function renderCalendar() {
 const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
 const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
 const cells = [];
 const today = new Date().toISOString().slice(0, 10);

 for (let i = 0; i < firstDay; i += 1) {
 cells.push(<div key={`e-${i}`} style={{ minHeight: 120, background: "transparent" }} />);
 }

 for (let day = 1; day <= daysInMonth; day += 1) {
 const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
 const dayPosts = calendarData[dateStr] || [];
 const isToday = today === dateStr;

 cells.push(
 <div
 key={day}
 style={{
 minHeight: 140,
 padding: 10,
 borderRadius: 4,
 background: isToday ? "rgba(175,0,42,0.06)" : "var(--cth-command-panel)",
 border: `1px solid ${isToday ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
 display: "flex",
 flexDirection: "column",
 gap: 8,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 minWidth: 24,
 height: 24,
 padding: "0 8px",
 borderRadius: 999,
 background: isToday ? "var(--cth-command-crimson)" : "var(--cth-command-panel-soft)",
 color: isToday ? "var(--cth-command-ivory)" : "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 12,
 fontWeight: 600,
 }}
 >
 {day}
 </span>
 {dayPosts.length > 0 ? (
 <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
 {dayPosts.length}
 </span>
 ) : null}
 </div>

 <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
 {dayPosts.slice(0, 3).map((post, i) => {
 const cfg = PLATFORM_CFG[post.platform] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 return (
 <button
 key={i}
 type="button"
 onClick={() => handleEditPost(post)}
 style={{
 display: "flex",
 alignItems: "center",
 gap: 6,
 width: "100%",
 padding: "5px 8px",
 borderRadius: 4,
 background: `${cfg.color}12`,
 border: `1px solid ${cfg.color}25`,
 color: "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 11,
 textAlign: "left",
 cursor: "pointer",
 }}
 >
 <Icon size={11} style={{ color: cfg.color, flexShrink: 0 }} />
 <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
 {post.content?.slice(0, 26) || "Untitled"}
 </span>
 </button>
 );
 })}
 {dayPosts.length > 3 ? (
 <button
 type="button"
 onClick={() => handleEditPost(dayPosts[3])}
 style={{
 background: "transparent",
 border: "none",
 padding: "0 0 0 4px",
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 color: "var(--cth-command-muted)",
 cursor: "pointer",
 textAlign: "left",
 }}
 >
 +{dayPosts.length - 3} more
 </button>
 ) : null}
 </div>
 </div>
 );
 }

 return cells;
 }

 const filteredPosts = useMemo(() => {
 let next = posts.filter((p) => filterPlatform === "all" || p.platform === filterPlatform);
 if (filterStatus !== "all") next = next.filter((p) => p.status === filterStatus);

 const metricValue = (post, key) => Number(post?.[key] || 0);

 next.sort((a, b) => {
 if (sortBy === "likes") return metricValue(b, "likes") - metricValue(a, "likes");
 if (sortBy === "shares") return metricValue(b, "shares") - metricValue(a, "shares");
 if (sortBy === "comments") return metricValue(b, "comments") - metricValue(a, "comments");
 if (sortBy === "clicks") return metricValue(b, "clicks") - metricValue(a, "clicks");

 const aTime = new Date(a.scheduled_for || a.created_at || 0).getTime();
 const bTime = new Date(b.scheduled_for || b.created_at || 0).getTime();
 return bTime - aTime;
 });

 return next;
 }, [posts, filterPlatform, filterStatus, sortBy]);

 const instagramGridPosts = useMemo(() => {
 const ranked = [...posts]
 .filter((p) => p.platform === "instagram")
 .sort((a, b) => {
 const aDate = new Date(a.scheduled_for || a.created_at || 0).getTime();
 const bDate = new Date(b.scheduled_for || b.created_at || 0).getTime();
 return bDate - aDate;
 });

 const slots = [...ranked.slice(0, 18)];
 while (slots.length < 18) {
 slots.push({
 id: `grid-empty-${slots.length + 1}`,
 isEmpty: true,
 label: `Slot ${slots.length + 1}`,
 });
 }
 return slots;
 }, [posts]);

 useEffect(() => {
 setGridSlots(instagramGridPosts);
 }, [instagramGridPosts]);

 const handleGridDrop = (dropIndex) => {
 if (draggedGridIndex === null || draggedGridIndex === dropIndex) return;

 setGridSlots((prev) => {
 const next = [...prev];
 const dragged = next[draggedGridIndex];
 next[draggedGridIndex] = next[dropIndex];
 next[dropIndex] = dragged;
 return next.map((item, idx) =>
 item?.isEmpty ? { ...item, label: `Slot ${idx + 1}` } : item
 );
 });

 setDraggedGridIndex(null);
 };

 const handleManualRefresh = async () => {
 await fetchAllData({ silent: true });
 if (toast?.tone !== "error") {
 showToast("Social data refreshed");
 }
 };

 const totalPosts = analytics?.total_posts || 0;
 const totalScheduled = analytics?.total_scheduled || 0;
 const totalPublished = analytics?.total_published || 0;
 const totalDrafts = posts.filter((p) => p.status === "draft").length;

 const modalTitle = formData.recycle_mode
 ? "Recycle Post"
 : editingPostId
 ? "Edit Post"
 : "Create Post";

 const modalSubmitLabel = editingPostId
 ? "Update Post"
 : formData.scheduled_for
 ? "Schedule Post"
 : "Save as Draft";

 return (
 <DashboardLayout>
 <TopBar
 title="Social Media Manager"
 subtitle={`${totalPosts} posts / ${totalScheduled} scheduled / ${totalPublished} published`}
 action={
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <button
 type="button"
 onClick={() => openCampaignDrawer()}
 style={{
 ...SECONDARY_BUTTON_STYLE,
 padding: "10px 16px",
 background: "var(--cth-command-panel-soft)",
 color: "var(--cth-command-purple)",
 fontWeight: 600,
 }}
 >
 <LayoutIcon size={15} /> From Campaign
 </button>
 <button
 data-testid="create-post-btn"
 type="button"
 onClick={() => {
 setSelectedPlatforms(["instagram"]);
 setFormData((d) => ({ ...d, platform: d.platform || "instagram" }));
 setShowModal("post");
 }}
 style={PRIMARY_BUTTON_STYLE}
 >
 <Plus size={16} /> Create Post
 </button>
 </div>
 }
 />

 <CampaignContextBanner
 campaignId={activeCampaignId}
 campaignName={activeCampaignName}
 label="Composing for campaign:"
 onClear={() => {
 setActiveCampaignId(null);
 setActiveCampaignName(null);
 setFormData((d) => ({ ...d, campaign_id: null }));
 }}
 />

 <div data-testid="social-media-manager" style={PAGE_STYLE} className="px-4 py-6 md:px-7 md:py-8">
 {loading ? (
 <div style={{ padding: "80px 0", textAlign: "center" }}>
 <Loader2 size={32} className="animate-spin" style={{ color: "var(--cth-command-crimson)" }} />
 </div>
 ) : (
 <>
 <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
 <div>
 <Eyebrow>Social Planner</Eyebrow>
 <p style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", margin: "8px 0 0" }}>
 Plan, schedule, and publish across every channel from one workspace.
 </p>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <TabBar value={activeView} onChange={setActiveView} />
 <button
 type="button"
 onClick={handleManualRefresh}
 disabled={refreshing}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: refreshing ? 0.7 : 1 }}
 >
 {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
 Refresh
 </button>
 </div>
 </div>

 <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <MetricTile label="Total Posts" value={totalPosts} accent="var(--cth-command-purple)" />
 <MetricTile label="Scheduled" value={totalScheduled} accent="var(--cth-command-gold)" />
 <MetricTile label="Published" value={totalPublished} accent="#15803d" />
 <MetricTile label="Drafts" value={totalDrafts} accent="var(--cth-command-muted)" />
 </div>

 {activeView === "publish" && (
 <Panel
 eyebrow="Publish Calendar"
 title={currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
 subtitle="View scheduled posts, open drafts, and manage your publishing flow."
 action={
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <button
 data-testid="prev-month"
 type="button"
 onClick={() => navigateMonth(-1)}
 aria-label="Previous month"
 style={{ ...SECONDARY_BUTTON_STYLE, width: 38, height: 38, padding: 0 }}
 >
 <ChevronLeft size={16} />
 </button>
 <button
 data-testid="next-month"
 type="button"
 onClick={() => navigateMonth(1)}
 aria-label="Next month"
 style={{ ...SECONDARY_BUTTON_STYLE, width: 38, height: 38, padding: 0 }}
 >
 <ChevronRight size={16} />
 </button>
 </div>
 }
 padding={20}
 >
 <div style={{ overflowX: "auto" }}>
 <div style={{ minWidth: 720 }}>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
 <div
 key={d}
 style={{
 ...EYEBROW_STYLE,
 fontSize: 10,
 letterSpacing: "0.18em",
 textAlign: "center",
 padding: "8px 0",
 }}
 >
 {d}
 </div>
 ))}
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
 {renderCalendar()}
 </div>
 </div>
 </div>

 {Object.keys(calendarData).length === 0 ? (
 <div style={{ marginTop: 16 }}>
 <EmptyState
 icon={CalendarIcon}
 title="No posts scheduled this month"
 body="Use Create Post or open a campaign to populate the calendar."
 />
 </div>
 ) : null}
 </Panel>
 )}

 {activeView === "grid" && (
 <div data-testid="instagram-grid-planner" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
 <Panel padding={24}>
 <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 alignItems: "center",
 justifyContent: "space-between",
 gap: 12,
 paddingBottom: 12,
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <div>
 <Eyebrow>Profile</Eyebrow>
 <p style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)", margin: "4px 0 0" }}>
 Edit by hand or pull live data from a connected Instagram account.
 </p>
 {igConnection?.username ? (
 <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
 <Chip tone="success">Instagram</Chip>
 <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
 @{igConnection.username}
 </span>
 {linkedFacebookPageName ? (
 <>
 <Chip tone="success">Facebook</Chip>
 <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
 {linkedFacebookPageName}
 </span>
 </>
 ) : null}
 </div>
 ) : !igConnectionLoading ? (
 <div style={{ marginTop: 8 }}>
 <Chip tone="muted">Not connected</Chip>
 </div>
 ) : null}
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
 {igConnection ? (
 <button
 type="button"
 onClick={handleDisconnectInstagram}
 disabled={igActionBusy}
 style={{ ...DESTRUCTIVE_OUTLINE_STYLE, opacity: igActionBusy ? 0.7 : 1 }}
 title="Disconnect Instagram"
 >
 {igActionBusy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
 Disconnect
 </button>
 ) : (
 <button
 type="button"
 onClick={handleConnectInstagram}
 disabled={igActionBusy || igConnectionLoading}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: (igActionBusy || igConnectionLoading) ? 0.7 : 1 }}
 title="Connect Instagram"
 >
 {igActionBusy ? <Loader2 size={14} className="animate-spin" /> : <Instagram size={14} />}
 Connect Instagram + Facebook
 </button>
 )}
 <button
 type="button"
 onClick={handleSyncInstagramProfile}
 disabled={syncingProfile || !igConnection}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: (syncingProfile || !igConnection) ? 0.7 : 1 }}
 title={igConnection ? "Sync profile from Instagram" : "Connect Instagram first"}
 >
 {syncingProfile ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
 {syncingProfile ? "Syncing…" : "Sync from Instagram"}
 </button>
 </div>
 </div>

 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 24 }}>
 <input
 ref={gridAvatarInputRef}
 type="file"
 accept="image/*"
 onChange={handleGridAvatarSelect}
 style={{ display: "none" }}
 />

 <button
 type="button"
 onClick={() => gridAvatarInputRef.current?.click()}
 title="Upload avatar"
 style={{
 width: 96,
 height: 96,
 borderRadius: "50%",
 background: "var(--cth-command-panel-soft)",
 border: "2px solid var(--cth-command-border)",
 overflow: "hidden",
 cursor: "pointer",
 padding: 0,
 position: "relative",
 }}
 >
 {gridProfile.avatar_url ? (
 <img
 src={backendAssetUrl(gridProfile.avatar_url)}
 alt=""
 style={{ width: "100%", height: "100%", objectFit: "cover" }}
 />
 ) : (
 <div style={{
 width: "100%", height: "100%",
 display: "flex", alignItems: "center", justifyContent: "center",
 fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)",
 }}>Upload</div>
 )}
 </button>

 <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 8 }}>
 <input
 value={gridProfile.handle}
 onChange={(e) => setGridProfile((p) => ({ ...p, handle: e.target.value }))}
 style={{
 background: "transparent",
 border: "none",
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 outline: "none",
 padding: 0,
 }}
 />
 <input
 value={gridProfile.display_name}
 onChange={(e) => setGridProfile((p) => ({ ...p, display_name: e.target.value }))}
 style={{
 background: "transparent",
 border: "none",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 outline: "none",
 padding: 0,
 }}
 />
 <input
 value={gridProfile.category}
 onChange={(e) => setGridProfile((p) => ({ ...p, category: e.target.value }))}
 style={{
 background: "transparent",
 border: "none",
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 outline: "none",
 padding: 0,
 }}
 />
 {[1, 2, 3].map((n) => (
 <input
 key={n}
 value={gridProfile[`bio_line_${n}`]}
 onChange={(e) => setGridProfile((p) => ({ ...p, [`bio_line_${n}`]: e.target.value }))}
 style={{
 background: "transparent",
 border: "none",
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-ink)",
 outline: "none",
 padding: 0,
 }}
 />
 ))}
 <input
 value={gridProfile.website}
 onChange={(e) => setGridProfile((p) => ({ ...p, website: e.target.value }))}
 style={{
 background: "transparent",
 border: "none",
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-crimson)",
 outline: "none",
 padding: 0,
 }}
 />
 </div>

 <div style={{ display: "flex", gap: 24, alignSelf: "center" }}>
 {[
 { label: "Posts", value: gridProfile.posts_count || gridSlots.filter((p) => !p?.isEmpty).length },
 { label: "Followers", value: gridProfile.followers_count || 0 },
 { label: "Following", value: gridProfile.following_count || 0 },
 ].map((stat) => (
 <div key={stat.label} style={{ textAlign: "center" }}>
 <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: "var(--cth-command-ink)", lineHeight: 1 }}>
 {stat.value}
 </div>
 <div style={{ ...EYEBROW_STYLE, fontSize: 10, marginTop: 6 }}>{stat.label}</div>
 </div>
 ))}
 </div>
 </div>

 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
 <div>
 <Eyebrow>Instagram Grid Planner</Eyebrow>
 <p style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)", margin: "4px 0 0" }}>
 Plan 18 posts at a glance in a 4:5 feed layout.
 </p>
 </div>
 <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
 {gridSlots.filter((p) => !p?.isEmpty).length}/18 filled
 </span>
 </div>

 <input
 ref={gridSlotFileInputRef}
 type="file"
 accept="image/*"
 onChange={handleGridSlotFileSelect}
 style={{ display: "none" }}
 />

 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
 {gridSlots.map((post, index) => {
 if (post.isEmpty) {
 return (
 <div
 key={post.id}
 onDragOver={(e) => e.preventDefault()}
 onDrop={(e) => handleGridFileDrop(e, index)}
 style={{
 background: "var(--cth-command-panel-soft)",
 border: "1px dashed var(--cth-command-border)",
 borderRadius: 4,
 overflow: "hidden",
 }}
 >
 <div style={{
 aspectRatio: "4 / 5",
 display: "flex",
 flexDirection: "column",
 alignItems: "center",
 justifyContent: "center",
 padding: 14,
 textAlign: "center",
 gap: 8,
 }}>
 <span style={{ ...EYEBROW_STYLE, fontSize: 10 }}>{post.label}</span>
 <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
 Drop image or
 </span>
 <button
 type="button"
 onClick={() => {
 setPendingGridSlotIndex(index);
 gridSlotFileInputRef.current?.click();
 }}
 style={{
 ...PRIMARY_BUTTON_STYLE,
 padding: "6px 12px",
 fontSize: 12,
 }}
 >
 Select Image
 </button>
 </div>
 </div>
 );
 }

 const statusCfg = STATUS_CFG[post.status] || STATUS_CFG.draft;
 const thumb = post.media_urls?.[0];

 return (
 <div
 key={post.id}
 draggable
 onDragStart={() => setDraggedGridIndex(index)}
 onDragOver={(e) => e.preventDefault()}
 onDrop={() => handleGridDrop(index)}
 style={{
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 overflow: "hidden",
 position: "relative",
 cursor: "grab",
 }}
 >
 <button
 type="button"
 onClick={() => handleEditPost(post)}
 style={{
 display: "block",
 width: "100%",
 padding: 0,
 background: "transparent",
 border: "none",
 textAlign: "left",
 cursor: "pointer",
 }}
 >
 <div style={{
 aspectRatio: "4 / 5",
 width: "100%",
 background: "var(--cth-command-panel-soft)",
 overflow: "hidden",
 }}>
 {thumb ? (
 <img
 src={backendAssetUrl(thumb)}
 alt=""
 style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
 onError={(e) => {
 e.currentTarget.style.display = "none";
 }}
 />
 ) : (
 <div style={{
 width: "100%", height: "100%",
 display: "flex", alignItems: "center", justifyContent: "center",
 padding: 14, textAlign: "center",
 fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)",
 }}>
 No media preview
 </div>
 )}
 </div>

 <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
 <span style={{ ...EYEBROW_STYLE, fontSize: 9, letterSpacing: "0.16em" }}>
 Slot {index + 1}
 </span>
 <Chip tone={statusCfg.tone}>{statusCfg.label}</Chip>
 </div>
 <p style={{
 margin: 0,
 fontFamily: SANS, fontSize: 12, lineHeight: 1.5,
 color: "var(--cth-command-ink)",
 display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
 overflow: "hidden",
 }}>
 {post.content || post.topic || "Untitled Instagram post"}
 </p>
 </div>
 </button>

 <div
 style={{
 position: "absolute",
 top: 8,
 right: 8,
 display: "flex",
 gap: 4,
 }}
 >
 {post.status === "scheduled" ? (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 requestPublishPost(post);
 }}
 aria-label="Publish now"
 title="Publish now"
 style={{
 width: 28,
 height: 28,
 borderRadius: 4,
 background: "var(--cth-command-purple)",
 color: "var(--cth-command-gold)",
 border: "none",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 cursor: "pointer",
 }}
 >
 <Send size={13} />
 </button>
 ) : null}
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 requestDeletePost(post);
 }}
 aria-label="Delete post"
 title="Delete post"
 style={{
 width: 28,
 height: 28,
 borderRadius: 4,
 background: "rgba(13,0,16,0.7)",
 color: "var(--cth-command-ivory)",
 border: "none",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 cursor: "pointer",
 }}
 >
 <Trash2 size={13} />
 </button>
 </div>
 </div>
 );
 })}
 </div>

 {gridSlots.filter((p) => !p?.isEmpty).length === 18 ? (
 <div style={{ display: "flex", justifyContent: "flex-end" }}>
 <button
 type="button"
 onClick={requestResetGrid}
 style={DESTRUCTIVE_OUTLINE_STYLE}
 >
 <Trash2 size={14} /> Reset Grid
 </button>
 </div>
 ) : null}
 </div>
 </Panel>
 </div>
 )}

 {activeView === "posts" && (
 <div data-testid="posts-list" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 <Panel
 eyebrow="Recycle"
 title="Recycle top-performing posts"
 subtitle="Reopen your strongest content as a fresh draft so you can refine, reschedule, and keep proven ideas working longer."
 action={
 <button
 type="button"
 onClick={handleRecycleTopPost}
 disabled={recycleBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: recycleBusy ? 0.7 : 1 }}
 >
 {recycleBusy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
 Recycle Top Post
 </button>
 }
 />

 <Panel padding={20}>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
 <div style={{ flex: "1 1 180px", minWidth: 160 }}>
 <FieldLabel>Status</FieldLabel>
 <select
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 data-testid="status-filter"
 style={SMALL_INPUT_STYLE}
 >
 {STATUS_FILTER_OPTIONS.map((opt) => (
 <option key={opt.key} value={opt.key}>{opt.label}</option>
 ))}
 </select>
 </div>
 <div style={{ flex: "1 1 180px", minWidth: 160 }}>
 <FieldLabel>Platform</FieldLabel>
 <select
 value={filterPlatform}
 onChange={(e) => setFilterPlatform(e.target.value)}
 data-testid="platform-filter"
 style={SMALL_INPUT_STYLE}
 >
 <option value="all">All Platforms</option>
 {Object.entries(PLATFORM_CFG).map(([id, c]) => (
 <option key={id} value={id}>{c.label}</option>
 ))}
 </select>
 </div>
 <div style={{ flex: "1 1 180px", minWidth: 160 }}>
 <FieldLabel>Sort by</FieldLabel>
 <select
 value={sortBy}
 onChange={(e) => setSortBy(e.target.value)}
 data-testid="sort-posts"
 style={SMALL_INPUT_STYLE}
 >
 {SORT_OPTIONS.map((opt) => (
 <option key={opt.key} value={opt.key}>{opt.label}</option>
 ))}
 </select>
 </div>
 </div>

 {filteredPosts.length > 0 ? (
 <div style={{
 marginTop: 16,
 padding: 14,
 ...SOFT_PANEL_STYLE,
 display: "flex", flexDirection: "column", gap: 10,
 }}>
 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 <button
 type="button"
 onClick={() => {
 if (selectedPostIds.length === filteredPosts.length) {
 setSelectedPostIds([]);
 } else {
 setSelectedPostIds(filteredPosts.map((post) => post.id));
 }
 }}
 style={SECONDARY_BUTTON_STYLE}
 >
 {selectedPostIds.length === filteredPosts.length ? "Clear Selection" : "Select All"}
 </button>
 <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
 {selectedPostIds.length} selected
 </span>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <input
 type="datetime-local"
 value={bulkScheduleDate}
 onChange={(e) => setBulkScheduleDate(e.target.value)}
 style={SMALL_INPUT_STYLE}
 />
 <button
 type="button"
 onClick={handleBulkSchedule}
 disabled={!selectedPostIds.length || !bulkScheduleDate || bulkScheduling}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: (!selectedPostIds.length || !bulkScheduleDate || bulkScheduling) ? 0.4 : 1 }}
 >
 {bulkScheduling ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
 Bulk Schedule
 </button>
 </div>
 </div>
 </div>
 ) : null}
 </Panel>

 {filteredPosts.length > 0 ? (
 filteredPosts.map((post) => {
 const statusCfg = STATUS_CFG[post.status] || STATUS_CFG.draft;
 const checked = selectedPostIds.includes(post.id);
 return (
 <div
 key={post.id}
 data-testid={`post-${post.id}`}
 style={{
 ...PANEL_STYLE,
 padding: 20,
 outline: checked ? "2px solid var(--cth-command-crimson)" : "none",
 outlineOffset: -2,
 }}
 >
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
 <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1 }}>
 <input
 type="checkbox"
 checked={checked}
 onChange={(e) => {
 setSelectedPostIds((prev) =>
 e.target.checked ? [...prev, post.id] : prev.filter((id) => id !== post.id)
 );
 }}
 style={{
 marginTop: 4,
 width: 16, height: 16,
 accentColor: "var(--cth-command-crimson)",
 cursor: "pointer",
 }}
 />

 <div style={{ minWidth: 0, flex: 1 }}>
 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 10 }}>
 <PlatformBadge platform={post.platform} />
 <Chip tone={statusCfg.tone}>{statusCfg.label}</Chip>
 {post.campaign_id ? <Chip tone="purple">Campaign</Chip> : null}
 {post.content_item_id ? <Chip tone="muted">Content</Chip> : null}
 </div>

 <p style={{
 margin: "0 0 10px",
 fontFamily: SANS, fontSize: 14, lineHeight: 1.55,
 color: "var(--cth-command-ink)",
 display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
 overflow: "hidden",
 }}>
 {post.content}
 </p>

 {post.media_urls?.length > 0 ? (
 <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
 {post.media_urls.slice(0, 4).map((url, i) => (
 <img
 key={i}
 src={backendAssetUrl(url)}
 alt=""
 style={{
 width: 48, height: 48, borderRadius: 4, objectFit: "cover",
 border: "1px solid var(--cth-command-border)",
 }}
 />
 ))}
 {post.media_urls.length > 4 ? (
 <span style={{
 width: 48, height: 48, borderRadius: 4,
 display: "flex", alignItems: "center", justifyContent: "center",
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)",
 }}>+{post.media_urls.length - 4}</span>
 ) : null}
 </div>
 ) : null}

 {post.hashtags && post.hashtags.length > 0 ? (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
 {post.hashtags.slice(0, 6).map((tag, i) => (
 <span key={i} style={{
 fontFamily: SANS, fontSize: 11,
 padding: "2px 8px", borderRadius: 999,
 background: "var(--cth-command-panel-soft)",
 color: "var(--cth-command-muted)",
 border: "1px solid var(--cth-command-border)",
 }}>#{tag}</span>
 ))}
 {post.hashtags.length > 6 ? (
 <span style={{
 fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)",
 alignSelf: "center",
 }}>+{post.hashtags.length - 6}</span>
 ) : null}
 </div>
 ) : null}

 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
 {post.scheduled_for ? (
 <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
 <Clock size={11} />
 {new Date(post.scheduled_for).toLocaleString("en-US", {
 month: "short", day: "numeric",
 hour: "2-digit", minute: "2-digit",
 })}
 </span>
 ) : null}
 {post.content ? <span>{post.content.length} chars</span> : null}
 </div>
 </div>
 </div>

 <div style={{ display: "flex", flexShrink: 0, gap: 4 }}>
 <IconButton label="Edit post" onClick={() => handleEditPost(post)}>
 <Wand2 size={14} />
 </IconButton>
 {post.status === "scheduled" ? (
 <IconButton
 label="Publish now"
 onClick={() => handlePublishPost(post.id)}
 busy={publishingId === post.id}
 hoverColor="#15803d"
 >
 <Send size={14} />
 </IconButton>
 ) : null}
 <IconButton label="Delete post" onClick={() => requestDeletePost(post)}>
 <Trash2 size={14} />
 </IconButton>
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <EmptyState
 icon={Share2}
 title="No posts match these filters"
 body={posts.length === 0 ? "Create your first social media post to get started." : "Adjust the status, platform, or sort to see results."}
 />
 )}
 </div>
 )}
 </>
 )}
 </div>

 {showModal === "post" ? (
 <div
 role="presentation"
 onClick={closePostModal}
 data-testid="post-modal"
 style={{
 position: "fixed", inset: 0, zIndex: 50,
 background: "rgba(13, 0, 16, 0.6)",
 display: "flex", alignItems: "center", justifyContent: "center",
 padding: 16,
 }}
 >
 <div
 role="dialog"
 aria-modal="true"
 onClick={(e) => e.stopPropagation()}
 style={{
 width: "100%", maxWidth: 760,
 maxHeight: "90vh",
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 boxShadow: "0 30px 60px rgba(13,0,16,0.30)",
 display: "flex", flexDirection: "column",
 overflow: "hidden",
 }}
 >
 <div style={{
 display: "flex", alignItems: "center", justifyContent: "space-between",
 padding: "18px 24px", borderBottom: "1px solid var(--cth-command-border)",
 }}>
 <div>
 <Eyebrow>{formData.recycle_mode ? "Recycle" : editingPostId ? "Edit" : "New"}</Eyebrow>
 <h3 style={{
 fontFamily: SERIF, fontSize: 20, fontWeight: 600,
 color: "var(--cth-command-ink)", margin: "4px 0 0",
 }}>{modalTitle}</h3>
 </div>
 <IconButton label="Close modal" onClick={closePostModal}>
 <X size={16} />
 </IconButton>
 </div>

 <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
 <div>
 <FieldLabel>Platforms</FieldLabel>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
 {Object.entries(PLATFORM_CFG).map(([id, cfg]) => {
 const Icon = cfg.icon;
 const active = selectedPlatforms.includes(id);
 return (
 <button
 key={id}
 type="button"
 data-testid={`select-${id}`}
 onClick={() => setSelectedPlatforms((prev) => {
 const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
 setFormData((d) => ({ ...d, platform: next[0] || "" }));
 return next;
 })}
 style={{
 display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
 padding: "12px 6px", borderRadius: 4,
 background: active ? `${cfg.color}15` : "var(--cth-command-panel-soft)",
 border: `1px solid ${active ? `${cfg.color}50` : "var(--cth-command-border)"}`,
 color: active ? cfg.color : "var(--cth-command-muted)",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 cursor: "pointer",
 }}
 >
 <Icon size={18} />
 <span>{cfg.label.split(" ")[0]}</span>
 </button>
 );
 })}
 </div>
 </div>

 {(selectedPlatforms.includes("pinterest") || selectedPlatforms.includes("google_business")) ? (
 <div style={{
 display: "grid", gap: 12,
 padding: 14,
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 }}>
 <div style={{ ...EYEBROW_STYLE, color: "var(--cth-command-crimson)" }}>
 Platform settings
 </div>

 {selectedPlatforms.includes("pinterest") ? (
 <div>
 <FieldLabel
 hint={
 connections.pinterest
 ? null
 : <span style={{ color: "var(--cth-command-crimson)" }}>Pinterest not connected</span>
 }
 >
 Pinterest board
 </FieldLabel>
 <select
 value={formData.platform_extra?.pinterest_board_id || ""}
 onChange={(e) => setFormData((d) => ({
 ...d,
 platform_extra: {
 ...(d.platform_extra || {}),
 pinterest_board_id: e.target.value || undefined,
 },
 }))}
 disabled={!connections.pinterest || pinterestBoardsLoading}
 style={INPUT_STYLE}
 >
 <option value="">
 {pinterestBoardsLoading
 ? "Loading boards…"
 : pinterestBoards.length
 ? "Select a board"
 : "No boards available"}
 </option>
 {pinterestBoards.map((board) => (
 <option key={board.id} value={board.id}>{board.name}</option>
 ))}
 </select>
 </div>
 ) : null}

 {selectedPlatforms.includes("google_business") ? (
 <div>
 <FieldLabel
 hint={
 connections.google_business
 ? null
 : <span style={{ color: "var(--cth-command-crimson)" }}>Google Business not connected</span>
 }
 >
 Google Business location
 </FieldLabel>
 <select
 value={formData.platform_extra?.google_business_location_id || ""}
 onChange={(e) => setFormData((d) => ({
 ...d,
 platform_extra: {
 ...(d.platform_extra || {}),
 google_business_location_id: e.target.value || undefined,
 },
 }))}
 disabled={!connections.google_business || gbpLocationsLoading}
 style={INPUT_STYLE}
 >
 <option value="">
 {gbpLocationsLoading
 ? "Loading locations…"
 : gbpLocations.length
 ? "Select a location"
 : "No locations available"}
 </option>
 {gbpLocations.map((loc) => {
 const id = (loc.name || "").split("/").pop();
 return (
 <option key={id} value={id}>{loc.title || id}</option>
 );
 })}
 </select>
 </div>
 ) : null}
 </div>
 ) : null}

 <div>
 {selectedPlatforms.length > 1 ? (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
 {selectedPlatforms.map((platformId) => {
 const cfg = PLATFORM_CFG[platformId] || PLATFORM_CFG.instagram;
 const Icon = cfg.icon;
 const active = activePlatformKey === platformId;
 return (
 <button
 key={platformId}
 type="button"
 onClick={() => setActivePlatformTab(platformId)}
 style={{
 display: "inline-flex", alignItems: "center", gap: 6,
 padding: "6px 12px", borderRadius: 4,
 background: active ? `${cfg.color}15` : "var(--cth-command-panel-soft)",
 border: `1px solid ${active ? `${cfg.color}50` : "var(--cth-command-border)"}`,
 color: active ? cfg.color : "var(--cth-command-muted)",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 cursor: "pointer",
 }}
 >
 <Icon size={13} /> {cfg.label}
 </button>
 );
 })}
 </div>
 ) : null}

 <FieldLabel
 hint={
 <span style={{ color: charCount > charLimit ? "var(--cth-command-crimson)" : "var(--cth-command-muted)" }}>
 {charCount}/{charLimit}
 </span>
 }
 >
 Content {PLATFORM_CFG[activePlatformKey]?.label ? `· ${PLATFORM_CFG[activePlatformKey].label}` : ""}
 </FieldLabel>

 <textarea
 data-testid="post-content-textarea"
 value={activePlatformData.content || formData.content || ""}
 onChange={(e) => {
 const nextValue = e.target.value;
 setPlatformContent((prev) => ({
 ...prev,
 [activePlatformKey]: {
 ...(prev[activePlatformKey] || {}),
 content: nextValue,
 hashtags: (prev[activePlatformKey] || {}).hashtags || formData.hashtags || [],
 },
 }));
 setFormData((d) => ({
 ...d,
 content: activePlatformKey === (d.platform || selectedPlatforms[0] || "instagram") ? nextValue : d.content,
 }));
 }}
 placeholder="Write your post or use the AI generator below…"
 rows={5}
 style={{ ...INPUT_STYLE, resize: "vertical" }}
 />
 {charCount > charLimit ? (
 <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 12, color: "var(--cth-command-crimson)" }}>
 Over the {PLATFORM_CFG[activePlatformKey]?.label || "platform"} limit. Trim before saving.
 </p>
 ) : null}

 <div style={{
 marginTop: 12,
 background: "var(--cth-command-panel-soft)",
 border: "2px solid var(--cth-command-gold)",
 borderRadius: 4,
 overflow: "hidden",
 }}>
 <div style={{
 display: "flex", alignItems: "center", gap: 10,
 padding: "12px 16px",
 borderBottom: "1px solid var(--cth-command-border)",
 background: "var(--cth-command-panel)",
 }}>
 <Sparkles size={16} style={{ color: "var(--cth-command-crimson)" }} />
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{
 fontFamily: SERIF, fontSize: 15, fontWeight: 600,
 color: "var(--cth-command-ink)", lineHeight: 1.2,
 }}>
 Generate with AI
 </div>
 <div style={{
 fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)",
 marginTop: 2,
 }}>
 Topic + tone → draft caption and hashtags for the active platform.
 </div>
 </div>
 </div>
 <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
 <input
 data-testid="ai-topic-input"
 placeholder="What should the post be about?"
 value={formData.topic || ""}
 onChange={(e) => setFormData((d) => ({ ...d, topic: e.target.value }))}
 style={INPUT_STYLE}
 />
 <div style={{ display: "flex", gap: 8 }}>
 <select
 value={formData.tone || "professional"}
 onChange={(e) => setFormData((d) => ({ ...d, tone: e.target.value }))}
 style={{ ...INPUT_STYLE, flex: 1, textTransform: "capitalize" }}
 >
 {TONES.map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 <button
 data-testid="generate-btn"
 type="button"
 onClick={handleGenerateContent}
 disabled={!formData.topic || !selectedPlatforms.length || generating}
 style={{
 ...PRIMARY_BUTTON_STYLE,
 opacity: (!formData.topic || !selectedPlatforms.length || generating) ? 0.4 : 1,
 }}
 >
 {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
 {generating ? "Generating…" : "Generate"}
 </button>
 </div>
 {(!formData.topic || !selectedPlatforms.length) && !generating ? (
 <p style={{ margin: 0, fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
 {!selectedPlatforms.length
 ? "Select at least one platform above to enable generation."
 : "Add a topic to enable generation."}
 </p>
 ) : null}
 </div>
 </div>
 </div>

 {(activePlatformData.hashtags || formData.hashtags || []).length > 0 ? (
 <div>
 <FieldLabel hint="Click a tag to remove">Hashtags</FieldLabel>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {(activePlatformData.hashtags || formData.hashtags || []).map((tag, i) => (
 <button
 key={i}
 type="button"
 onClick={() => removeHashtag(tag)}
 style={{
 display: "inline-flex", alignItems: "center", gap: 4,
 padding: "4px 10px", borderRadius: 999,
 background: "rgba(175,0,42,0.10)",
 border: "1px solid rgba(175,0,42,0.22)",
 color: "var(--cth-command-crimson)",
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 cursor: "pointer",
 }}
 >
 #{tag}
 <X size={11} />
 </button>
 ))}
 </div>
 </div>
 ) : null}

 <div>
 <FieldLabel>Media (optional)</FieldLabel>
 <input
 ref={mediaInputRef}
 type="file"
 accept="image/*,video/*"
 multiple
 onChange={handleMediaUpload}
 style={{ display: "none" }}
 data-testid="social-media-file-input"
 />

 {mediaPreview.length > 0 ? (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
 {mediaPreview.map((m, i) => (
 <div key={i} style={{ position: "relative" }}>
 {m.type === "video" ? (
 <div style={{
 width: 80, height: 80, borderRadius: 4,
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 display: "flex", alignItems: "center", justifyContent: "center",
 color: "var(--cth-command-crimson)",
 }}>
 <Video size={22} />
 </div>
 ) : (
 <img
 src={backendAssetUrl(m.url)}
 alt={m.name}
 style={{
 width: 80, height: 80, borderRadius: 4, objectFit: "cover",
 border: "1px solid var(--cth-command-border)",
 }}
 />
 )}
 <button
 type="button"
 onClick={() => removeMedia(i)}
 aria-label="Remove media"
 style={{
 position: "absolute", top: -6, right: -6,
 width: 22, height: 22, borderRadius: "50%",
 background: "var(--cth-command-crimson)",
 color: "var(--cth-command-ivory)",
 border: "none", cursor: "pointer",
 display: "flex", alignItems: "center", justifyContent: "center",
 }}
 >
 <X size={11} />
 </button>
 </div>
 ))}
 </div>
 ) : null}

 <button
 data-testid="upload-media-btn"
 type="button"
 onClick={() => mediaInputRef.current?.click()}
 disabled={uploadingMedia}
 style={{
 width: "100%",
 display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
 padding: "12px 16px", borderRadius: 4,
 background: "var(--cth-command-panel-soft)",
 border: "1px dashed var(--cth-command-border)",
 color: "var(--cth-command-muted)",
 fontFamily: SANS, fontSize: 13, fontWeight: 500,
 cursor: uploadingMedia ? "default" : "pointer",
 opacity: uploadingMedia ? 0.7 : 1,
 }}
 >
 {uploadingMedia ? (
 <><Loader2 size={14} className="animate-spin" /> Uploading…</>
 ) : (
 <><Upload size={14} /> Upload Images or Videos</>
 )}
 </button>
 </div>

 <div>
 <FieldLabel>Schedule (optional)</FieldLabel>
 <input
 type="datetime-local"
 value={formData.scheduled_for ? formData.scheduled_for.slice(0, 16) : ""}
 onChange={(e) => setFormData((d) => ({
 ...d,
 scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
 status: e.target.value ? "scheduled" : "draft",
 }))}
 style={INPUT_STYLE}
 />
 </div>

 <div>
 <FieldLabel>CTA URL</FieldLabel>
 <input
 type="url"
 value={formData.cta_url || ""}
 onChange={(e) => setFormData((d) => ({ ...d, cta_url: e.target.value }))}
 placeholder="https://yourdomain.com/cta"
 style={INPUT_STYLE}
 />
 </div>

 <div>
 <FieldLabel>Link-in-bio URL</FieldLabel>
 <input
 type="url"
 value={formData.link_in_bio_url || ""}
 onChange={(e) => setFormData((d) => ({ ...d, link_in_bio_url: e.target.value }))}
 placeholder="https://yourdomain.com/link-in-bio"
 style={INPUT_STYLE}
 />
 </div>

 <div style={{
 borderTop: "1px solid var(--cth-command-border)",
 paddingTop: 16,
 }}>
 <div style={{ marginBottom: 10 }}>
 <div style={EYEBROW_STYLE}>Tracked Links</div>
 <p style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
 Create tracked links for the CTA, profile, or campaign URL on this post.
 </p>
 </div>
 <TrackingLinkManager
 title="Social Tracking Links"
 subtitle=""
 defaultLabel={formData?.title || formData?.topic || "Social CTA"}
 defaultUrl={
 formData?.cta_url ||
 formData?.link_in_bio_url ||
 handoff?.ctaUrl ||
 handoff?.cta_url ||
 handoff?.landingPageUrl ||
 handoff?.landing_page_url ||
 ""
 }
 context={{
 source: "social_media_manager",
 platform: activePlatformKey || "",
 post_id: editingPostId || "",
 campaign_id: handoff?.campaignId || activeCampaignId || "",
 cta_url: formData?.cta_url || "",
 link_in_bio_url: formData?.link_in_bio_url || "",
 metadata: { surface: activeView || "" },
 }}
 compact
 />
 </div>

 <div>
 <FieldLabel>First comment (optional)</FieldLabel>
 <textarea
 value={formData.first_comment || ""}
 onChange={(e) => setFormData((d) => ({ ...d, first_comment: e.target.value }))}
 rows={3}
 placeholder="Add a first comment to publish right after the post…"
 style={{ ...INPUT_STYLE, resize: "vertical" }}
 />
 </div>
 </div>

 <div style={{
 display: "flex", justifyContent: "flex-end", gap: 10,
 padding: "16px 24px", borderTop: "1px solid var(--cth-command-border)",
 background: "var(--cth-command-panel)",
 }}>
 <button type="button" onClick={closePostModal} style={SECONDARY_BUTTON_STYLE}>
 Cancel
 </button>
 <button
 data-testid="save-post-btn"
 type="button"
 onClick={handleCreatePost}
 disabled={!canSavePost || savingPost}
 style={{
 ...PRIMARY_BUTTON_STYLE,
 opacity: (!canSavePost || savingPost) ? 0.4 : 1,
 }}
 >
 {savingPost ? <Loader2 size={14} className="animate-spin" /> : null}
 {modalSubmitLabel}
 </button>
 </div>
 </div>
 </div>
 ) : null}

 {showCampaignDrawer ? (
 <>
 <div
 onClick={() => setShowCampaignDrawer(false)}
 style={{
 position: "fixed", inset: 0, zIndex: 60,
 background: "rgba(13, 0, 16, 0.5)",
 }}
 />
 <div
 style={{
 position: "fixed", top: 0, right: 0,
 height: "100vh", width: 420, maxWidth: "100vw",
 background: "var(--cth-command-panel)",
 borderLeft: "1px solid var(--cth-command-border)",
 boxShadow: "-12px 0 32px rgba(13,0,16,0.18)",
 zIndex: 61,
 display: "flex", flexDirection: "column",
 fontFamily: SANS,
 }}
 >
 <div style={{
 padding: "18px 22px",
 borderBottom: "1px solid var(--cth-command-border)",
 display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
 }}>
 <div>
 <Eyebrow>Compose</Eyebrow>
 <h3 style={{
 margin: "4px 0 0",
 fontFamily: SERIF, fontSize: 20, fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}>
 From Campaign
 </h3>
 </div>
 <IconButton label="Close drawer" onClick={() => setShowCampaignDrawer(false)}>
 <X size={16} />
 </IconButton>
 </div>

 <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
 {!drawerSelectedCampaignId ? (
 drawerCampaignsLoading ? (
 <p style={{ color: "var(--cth-command-muted)", fontSize: 13, fontFamily: SANS }}>Loading campaigns…</p>
 ) : drawerCampaigns.length === 0 ? (
 <EmptyState
 icon={LayoutIcon}
 title="No campaigns yet"
 body="Create one in Campaign Builder to compose social posts from it."
 />
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
 {drawerCampaigns.map((c) => (
 <div
 key={c.id}
 style={{
 padding: "12px 14px",
 ...SOFT_PANEL_STYLE,
 display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
 }}
 >
 <div style={{ minWidth: 0, flex: 1 }}>
 <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: "var(--cth-command-ink)" }}>
 {c.name || "Untitled"}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)", textTransform: "capitalize" }}>
 {c.status || "draft"}
 </div>
 </div>
 <button
 type="button"
 onClick={() => selectDrawerCampaign(c)}
 style={{ ...PRIMARY_BUTTON_STYLE, padding: "6px 12px", fontSize: 12 }}
 >
 Use
 </button>
 </div>
 ))}
 </div>
 )
 ) : drawerLoading ? (
 <p style={{ color: "var(--cth-command-muted)", fontSize: 13, fontFamily: SANS }}>Loading campaign assets…</p>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
 <button
 type="button"
 onClick={() => { setDrawerSelectedCampaignId(null); setDrawerContent([]); setDrawerMedia([]); }}
 style={{
 alignSelf: "flex-start",
 background: "transparent", border: "none", padding: 0,
 fontFamily: SANS, fontSize: 12, fontWeight: 600,
 color: "var(--cth-command-muted)",
 cursor: "pointer",
 textDecoration: "underline",
 }}
 >
 ← Back to campaigns
 </button>

 <div>
 <Eyebrow>Pick Content</Eyebrow>
 {drawerContent.length === 0 ? (
 <p style={{ color: "var(--cth-command-muted)", fontSize: 12, fontFamily: SANS, margin: "8px 0 0" }}>
 No content for this campaign.
 </p>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
 {drawerContent.map((item) => {
 const isSel = drawerSelectedContentId === item.id;
 return (
 <button
 key={item.id}
 type="button"
 onClick={() => setDrawerSelectedContentId(isSel ? null : item.id)}
 style={{
 textAlign: "left",
 padding: "10px 12px",
 background: isSel ? "rgba(196,169,91,0.15)" : "var(--cth-command-panel-soft)",
 border: `1px solid ${isSel ? "var(--cth-command-gold)" : "var(--cth-command-border)"}`,
 borderRadius: 4,
 cursor: "pointer",
 fontFamily: SANS,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
 {isSel ? <Check size={12} color="var(--cth-command-purple)" /> : null}
 <span style={{ fontWeight: 600, fontSize: 13, color: "var(--cth-command-ink)" }}>
 {item.title || item.content_type || "Untitled"}
 </span>
 </div>
 <p style={{ margin: 0, fontSize: 11, color: "var(--cth-command-muted)", lineHeight: 1.4 }}>
 {(item.content || "").replace(/[#*_>`]/g, "").slice(0, 100)}
 </p>
 </button>
 );
 })}
 </div>
 )}
 </div>

 <div>
 <Eyebrow>Pick Media</Eyebrow>
 {drawerMedia.length === 0 ? (
 <p style={{ color: "var(--cth-command-muted)", fontSize: 12, fontFamily: SANS, margin: "8px 0 0" }}>
 No media for this campaign.
 </p>
 ) : (
 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
 {drawerMedia.map((m) => {
 const id = m.asset_id || m.id;
 const isSel = drawerSelectedMediaIds.includes(id);
 const url = m.preview_url || m.file_url || m.url || "";
 const isVideo = m.media_type === "video" || m.file_type?.startsWith?.("video");
 return (
 <button
 key={id}
 type="button"
 onClick={() => setDrawerSelectedMediaIds((prev) =>
 prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
 )}
 style={{
 padding: 0,
 background: "var(--cth-command-panel-soft)",
 border: `2px solid ${isSel ? "var(--cth-command-gold)" : "var(--cth-command-border)"}`,
 borderRadius: 4,
 cursor: "pointer",
 overflow: "hidden",
 aspectRatio: "1 / 1",
 position: "relative",
 }}
 >
 {url ? (
 isVideo ? (
 <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
 ) : (
 <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 )
 ) : null}
 {isSel ? (
 <div style={{
 position: "absolute", top: 4, right: 4,
 background: "var(--cth-command-purple)",
 color: "var(--cth-command-gold)",
 borderRadius: 3, padding: 2,
 }}>
 <Check size={10} />
 </div>
 ) : null}
 </button>
 );
 })}
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {drawerSelectedCampaignId ? (
 <div style={{ padding: "16px 22px", borderTop: "1px solid var(--cth-command-border)" }}>
 <button
 type="button"
 onClick={applyDrawerSelections}
 style={{ ...PRIMARY_BUTTON_STYLE, width: "100%", padding: "12px 16px" }}
 >
 Compose Post
 </button>
 </div>
 ) : null}
 </div>
 </>
 ) : null}

 <ConfirmModal confirm={confirm} busy={confirmBusy} onCancel={cancelConfirm} onConfirm={performConfirm} />
 <Toast toast={toast} />
 </DashboardLayout>
 );
}
