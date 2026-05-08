import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import {
  ArrowRight,
  Bookmark,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Film,
  Image as ImageIcon,
  Layout,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Trash2,
  User,
  Video,
  Wand2,
} from "lucide-react";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 26,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 999,
  padding: "12px 22px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  textDecoration: "none",
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "11px 20px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const LOCKED_PLANS = new Set(["free", "audit", "foundation"]);

const CONTENT_TYPES_PHOTO = [
  { id: "founder-portrait", label: "Founder Portrait", icon: User },
  { id: "brand-editorial", label: "Brand Editorial", icon: Layout },
  { id: "behind-the-scenes", label: "Behind the Scenes", icon: Eye },
  { id: "offer-showcase", label: "Offer Showcase", icon: ShoppingBag },
  { id: "results-moment", label: "Results Moment", icon: Star },
  { id: "workspace-overview", label: "Workspace Overview", icon: Building2 },
];

const CONTENT_TYPES_VIDEO = [
  { id: "founder-talking-head", label: "Founder Talking Head", icon: Video },
  { id: "brand-cinematic", label: "Brand Cinematic", icon: Film },
  { id: "behind-the-scenes", label: "Behind the Scenes", icon: Eye },
  { id: "testimonial", label: "Testimonial", icon: MessageSquare },
  { id: "offer-walkthrough", label: "Offer Walkthrough", icon: ShoppingBag },
  { id: "day-in-the-life", label: "Day in the Life", icon: Sun },
];

const BRAND_VIBE_OPTIONS = [
  "Quiet authority",
  "Editorial luxury",
  "Strategic founder",
  "Legacy brand presence",
  "Modern minimal",
  "Warm approachable expert",
];

const SETTING_OPTIONS = [
  "Home office editorial",
  "Clean white studio",
  "Outdoor architectural space",
  "Urban professional environment",
  "Library or archive interior",
  "Luxury hotel or lounge",
];

const LIGHTING_OPTIONS = [
  "Natural soft window light",
  "Warm golden hour",
  "Clean overhead studio",
  "Moody directional side light",
  "Soft diffused overcast",
  "Dramatic backlit silhouette",
];

const COMPOSITION_OPTIONS = [
  "Close crop portrait",
  "Wide environmental shot",
  "Detail macro close-up",
  "Rule of thirds framing",
  "Centered architectural symmetry",
  "Over the shoulder candid",
];

const PHOTO_STYLE_FINISH_OPTIONS = [
  "Film grain warm tones",
  "Clean crisp sharp digital",
  "Muted editorial desaturated",
  "High contrast bold shadows",
  "Soft blush warm neutrals",
  "Cinematic wide color grade",
];

const PHOTO_OUTPUT_FORMAT_OPTIONS = [
  "Midjourney",
  "DALL-E",
  "Adobe Firefly",
  "Stable Diffusion",
  "Leonardo AI",
  "Nano Banana",
  "ChatGPT",
  "Seedance",
  "GPT Image 1",
];

const CAMERA_MOVEMENT_OPTIONS = [
  "Static locked off",
  "Slow push in dolly",
  "Handheld intimate",
  "Crane or drone aerial",
  "Whip pan energetic",
  "Slow motion cinematic",
];

const VIDEO_STYLE_FINISH_OPTIONS = [
  "Cinematic film look",
  "Clean bright brand video",
  "Moody editorial dark",
  "Warm documentary feel",
  "High contrast commercial",
  "Soft dreamy slow motion",
];

const VIDEO_OUTPUT_FORMAT_OPTIONS = [
  "Runway Gen-3",
  "Sora",
  "Kling AI",
  "Pika Labs",
  "Luma Dream Machine",
  "Veo 3",
  "Seedance",
  "Runway Gen 4",
  "WAN",
];

const PHOTO_DROPDOWNS = [
  { id: "brand_vibe", label: "Brand Vibe", options: BRAND_VIBE_OPTIONS },
  { id: "setting", label: "Setting", options: SETTING_OPTIONS },
  { id: "lighting", label: "Lighting", options: LIGHTING_OPTIONS },
  { id: "composition", label: "Composition", options: COMPOSITION_OPTIONS },
  { id: "style_finish", label: "Style Finish", options: PHOTO_STYLE_FINISH_OPTIONS },
  { id: "output_format", label: "Output Format", options: PHOTO_OUTPUT_FORMAT_OPTIONS },
];

const VIDEO_DROPDOWNS = [
  { id: "brand_vibe", label: "Brand Vibe", options: BRAND_VIBE_OPTIONS },
  { id: "setting", label: "Setting", options: SETTING_OPTIONS },
  { id: "camera_movement", label: "Camera Movement", options: CAMERA_MOVEMENT_OPTIONS },
  { id: "lighting", label: "Lighting", options: LIGHTING_OPTIONS },
  { id: "style_finish", label: "Style Finish", options: VIDEO_STYLE_FINISH_OPTIONS },
  { id: "output_format", label: "Output Format", options: VIDEO_OUTPUT_FORMAT_OPTIONS },
];

function getDropdownsForTab(tab) {
  return tab === "video" ? VIDEO_DROPDOWNS : PHOTO_DROPDOWNS;
}

function getContentTypesForTab(tab) {
  return tab === "video" ? CONTENT_TYPES_VIDEO : CONTENT_TYPES_PHOTO;
}

function findContentTypeLabel(tab, id) {
  if (!id) return "";
  const list = getContentTypesForTab(tab);
  return list.find((c) => c.id === id)?.label || id;
}

function pickRandom(options) {
  if (!options || options.length === 0) return "";
  const idx = Math.floor(Math.random() * options.length);
  return options[idx];
}

function LockedOverlay() {
  return (
    <div
      style={{
        ...PAGE_STYLE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "72px 24px",
      }}
    >
      <div
        style={{
          ...CARD_STYLE,
          maxWidth: 560,
          width: "100%",
          padding: "44px 36px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 999,
            background: "color-mix(in srgb, var(--cth-command-crimson) 12%, var(--cth-command-panel))",
            color: "var(--cth-command-crimson)",
            marginBottom: 22,
          }}
        >
          <Lock size={22} />
        </div>
        <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 12 }}>Structure Plan Required</p>
        <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 30, marginBottom: 14 }}>
          Prompt Generator
        </h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--cth-command-muted)",
            marginBottom: 28,
          }}
        >
          Generate brand-specific AI image and video prompts tailored to your
          voice, positioning, and audience. Available on The Structure plan and
          above.
        </p>
        <a href="/billing" style={PRIMARY_CTA_STYLE}>
          Upgrade to Structure
        </a>
      </div>
    </div>
  );
}

function TabPill({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        padding: "10px 22px",
        borderRadius: 999,
        cursor: "pointer",
        border: active
          ? "1px solid var(--cth-command-crimson)"
          : "1px solid var(--cth-command-border)",
        background: active
          ? "color-mix(in srgb, var(--cth-command-crimson) 8%, var(--cth-command-panel))"
          : "var(--cth-command-panel)",
        color: active ? "var(--cth-command-crimson)" : "var(--cth-command-ink)",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function ContentTypeCard({ type, selected, onSelect }) {
  const Icon = type.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(type.id)}
      style={{
        textAlign: "left",
        padding: "18px 16px",
        borderRadius: 6,
        background: selected
          ? "color-mix(in srgb, var(--cth-command-crimson) 6%, var(--cth-command-panel))"
          : "var(--cth-command-panel)",
        border: selected
          ? "2px solid var(--cth-command-crimson)"
          : "1px solid var(--cth-command-border)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 110,
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: selected
            ? "color-mix(in srgb, var(--cth-command-crimson) 14%, var(--cth-command-panel))"
            : "color-mix(in srgb, var(--cth-command-muted) 8%, var(--cth-command-panel))",
          color: selected ? "var(--cth-command-crimson)" : "var(--cth-command-muted)",
        }}
      >
        <Icon size={18} />
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 600,
          color: selected ? "var(--cth-command-crimson)" : "var(--cth-command-ink)",
        }}
      >
        {type.label}
      </div>
    </button>
  );
}

function ParameterDropdown({ id, label, options, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
      <select
        value={value || ""}
        onChange={(e) => onChange(id, e.target.value)}
        style={{
          ...CARD_STYLE,
          padding: "10px 12px",
          fontFamily: SANS,
          fontSize: 13,
          color: "var(--cth-command-ink)",
          appearance: "none",
          width: "100%",
          cursor: "pointer",
        }}
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 1000,
        padding: "10px 16px",
        borderRadius: 6,
        background: "var(--cth-command-ink)",
        color: "var(--cth-command-panel)",
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
      }}
    >
      {message}
    </div>
  );
}

function UsageBadge({ usage }) {
  if (!usage) return null;
  if (usage.unlimited) {
    return (
      <span
        style={{
          fontFamily: SANS,
          fontSize: 12,
          color: "var(--cth-command-muted)",
        }}
      >
        Unlimited prompts on your plan
      </span>
    );
  }
  const limit = usage.limit ?? 25;
  return (
    <span
      style={{
        fontFamily: SANS,
        fontSize: 12,
        color: "var(--cth-command-muted)",
      }}
    >
      {usage.used} of {limit} prompts used this month
    </span>
  );
}

function SavedPromptCard({ item, expanded, onToggle, onCopy, onDelete }) {
  const isVideo = String(item.tab || "").toLowerCase() === "video";
  const text = item.prompt_text || "";
  const preview = text.length > 140 ? `${text.slice(0, 140).trim()}…` : text;
  return (
    <div style={{ ...CARD_STYLE, padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "3px 9px",
            borderRadius: 999,
            background: isVideo
              ? "color-mix(in srgb, var(--cth-command-purple) 14%, var(--cth-command-panel))"
              : "color-mix(in srgb, var(--cth-command-crimson) 12%, var(--cth-command-panel))",
            color: isVideo ? "var(--cth-command-purple)" : "var(--cth-command-crimson)",
          }}
        >
          {isVideo ? "Video" : "Photo"}
        </span>
        {item.content_type ? (
          <span style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-ink)", fontWeight: 600 }}>
            {findContentTypeLabel(item.tab, item.content_type)}
          </span>
        ) : null}
        {item.output_format ? (
          <span
            style={{
              fontFamily: SANS,
              fontSize: 11,
              color: "var(--cth-command-muted)",
              padding: "3px 8px",
              border: "1px solid var(--cth-command-border)",
              borderRadius: 999,
            }}
          >
            {item.output_format}
          </span>
        ) : null}
      </div>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          lineHeight: 1.55,
          color: "var(--cth-command-ink)",
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {expanded ? text : preview}
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        {text.length > 140 ? (
          <button
            type="button"
            onClick={onToggle}
            style={{
              ...SECONDARY_BUTTON_STYLE,
              padding: "6px 12px",
              fontSize: 12,
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Collapse" : "Expand"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onCopy}
          style={{ ...SECONDARY_BUTTON_STYLE, padding: "6px 12px", fontSize: 12 }}
        >
          <Copy size={14} />
          Copy
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{
            ...SECONDARY_BUTTON_STYLE,
            padding: "6px 12px",
            fontSize: 12,
            color: "var(--cth-danger)",
            borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
          }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}

const EMPTY_PARAMS = {
  brand_vibe: "",
  setting: "",
  lighting: "",
  composition: "",
  camera_movement: "",
  style_finish: "",
  output_format: "",
};

export default function PromptGenerator() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const { plan } = usePlan();

  const workspaceId = activeWorkspace?.id || activeWorkspace?.workspace_id || "";

  const [tab, setTab] = useState("photo");
  const [contentType, setContentType] = useState(null);
  const [params, setParams] = useState(EMPTY_PARAMS);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [usage, setUsage] = useState(null);
  const [saved, setSaved] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [expandedSavedId, setExpandedSavedId] = useState(null);
  const [toast, setToast] = useState("");

  const isLocked = LOCKED_PLANS.has(String(plan || "").toLowerCase());

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const dropdowns = useMemo(() => getDropdownsForTab(tab), [tab]);
  const contentTypes = useMemo(() => getContentTypesForTab(tab), [tab]);

  const relevantDropdownIds = useMemo(() => dropdowns.map((d) => d.id), [dropdowns]);
  const filledParamCount = useMemo(
    () =>
      relevantDropdownIds.reduce(
        (count, id) => (params[id] && params[id].trim() !== "" ? count + 1 : count),
        0,
      ),
    [params, relevantDropdownIds],
  );

  const canGenerate = !!contentType && filledParamCount >= 3 && !isGenerating;

  const handleTabChange = useCallback((nextTab) => {
    setTab(nextTab);
    setContentType(null);
    setParams(EMPTY_PARAMS);
    setGeneratedPrompt("");
    setGenerationError("");
  }, []);

  const handleParamChange = useCallback((id, value) => {
    setParams((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleRandomize = useCallback(() => {
    const next = { ...EMPTY_PARAMS };
    dropdowns.forEach((d) => {
      next[d.id] = pickRandom(d.options);
    });
    setParams(next);
  }, [dropdowns]);

  const handleReset = useCallback(() => {
    setContentType(null);
    setParams(EMPTY_PARAMS);
    setGeneratedPrompt("");
    setGenerationError("");
  }, []);

  const fetchUsage = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await apiClient.get("/api/prompt-generator/usage", {
        params: { workspace_id: workspaceId, plan: plan || "structure" },
      });
      setUsage(data);
    } catch (err) {
      console.warn("[PromptGenerator] Failed to load usage", err);
    }
  }, [workspaceId, plan]);

  const fetchSaved = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoadingSaved(true);
    try {
      const data = await apiClient.get("/api/prompt-generator/saved", {
        params: { workspace_id: workspaceId },
      });
      const items = Array.isArray(data?.items) ? data.items : [];
      setSaved(items);
    } catch (err) {
      console.warn("[PromptGenerator] Failed to load saved prompts", err);
      setSaved([]);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isLocked) return;
    fetchUsage();
    fetchSaved();
  }, [isLocked, fetchUsage, fetchSaved]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !workspaceId) return;
    setIsGenerating(true);
    setGenerationError("");
    setGeneratedPrompt("");
    try {
      const body = {
        tab,
        content_type: findContentTypeLabel(tab, contentType),
        brand_vibe: params.brand_vibe,
        setting: params.setting,
        lighting: params.lighting,
        style_finish: params.style_finish,
        output_format: params.output_format,
        workspace_id: workspaceId,
      };
      if (tab === "photo") {
        body.composition = params.composition;
      } else {
        body.camera_movement = params.camera_movement;
      }

      const data = await apiClient.post("/api/prompt-generator/generate", body);
      const promptText = String(data?.prompt || "").trim();
      if (!promptText) {
        throw new Error("Empty prompt returned.");
      }
      setGeneratedPrompt(promptText);
      if (typeof data?.used === "number") {
        setUsage((prev) => (prev ? { ...prev, used: data.used } : prev));
      } else {
        fetchUsage();
      }
    } catch (err) {
      const msg =
        (err && err.message) ||
        "Could not generate a prompt right now. Please try again.";
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, workspaceId, tab, contentType, params, fetchUsage]);

  const handleCopyGenerated = useCallback(async () => {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      showToast("Copied!");
    } catch {
      showToast("Copy failed");
    }
  }, [generatedPrompt, showToast]);

  const handleSendToMediaStudio = useCallback(() => {
    if (!generatedPrompt) return;
    navigate("/media-studio", { state: { incomingPrompt: generatedPrompt } });
  }, [generatedPrompt, navigate]);

  const handleSavePrompt = useCallback(async () => {
    if (!generatedPrompt || !workspaceId) return;
    try {
      const body = {
        tab,
        content_type: findContentTypeLabel(tab, contentType),
        output_format: params.output_format,
        prompt_text: generatedPrompt,
        workspace_id: workspaceId,
      };
      const data = await apiClient.post("/api/prompt-generator/save", body);
      if (data?.saved) {
        showToast("Saved!");
        fetchSaved();
      } else {
        showToast("Save failed");
      }
    } catch (err) {
      console.warn("[PromptGenerator] Save failed", err);
      showToast("Save failed");
    }
  }, [generatedPrompt, workspaceId, tab, contentType, params.output_format, showToast, fetchSaved]);

  const handleCopySaved = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text || "");
        showToast("Copied!");
      } catch {
        showToast("Copy failed");
      }
    },
    [showToast],
  );

  const handleDeleteSaved = useCallback(
    async (id) => {
      if (!id || !workspaceId) return;
      try {
        await apiClient.delete(`/api/prompt-generator/saved/${id}`, {
          params: { workspace_id: workspaceId },
        });
        showToast("Deleted");
        setSaved((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        console.warn("[PromptGenerator] Delete failed", err);
        showToast("Delete failed");
      }
    },
    [workspaceId, showToast],
  );

  if (isLocked) {
    return (
      <DashboardLayout>
        <TopBar
          title="Prompt Generator"
          subtitle="Generate brand-specific AI image and video prompts."
        />
        <div className="flex-1 overflow-auto" style={PAGE_STYLE}>
          <LockedOverlay />
        </div>
      </DashboardLayout>
    );
  }

  const tabContentTypes = contentTypes;
  const generationHint =
    "Select a content type and at least 3 parameters to generate your prompt.";
  const charCount = generatedPrompt.length;

  return (
    <DashboardLayout>
      <TopBar
        title="Prompt Generator"
        subtitle="Brand-specific AI prompts for image and video generation."
        action={<UsageBadge usage={usage} />}
      />
      <div className="flex-1 overflow-auto" style={PAGE_STYLE} data-testid="prompt-generator-page">
        <Toast message={toast} />

        <div className="mx-auto max-w-6xl px-4 md:px-8 py-6">
          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <TabPill active={tab === "photo"} onClick={() => handleTabChange("photo")}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <ImageIcon size={14} />
                Photo Prompts
              </span>
            </TabPill>
            <TabPill active={tab === "video"} onClick={() => handleTabChange("video")}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Video size={14} />
                Video Prompts
              </span>
            </TabPill>
          </div>

          {/* Content type selection */}
          <div style={{ ...CARD_STYLE, padding: 22, marginBottom: 22 }}>
            <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 6 }}>Step 1</p>
            <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22, marginBottom: 16 }}>
              Choose your content type
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {tabContentTypes.map((type) => (
                <ContentTypeCard
                  key={type.id}
                  type={type}
                  selected={contentType === type.id}
                  onSelect={setContentType}
                />
              ))}
            </div>
          </div>

          {/* Parameters */}
          {contentType ? (
            <div style={{ ...CARD_STYLE, padding: 22, marginBottom: 22 }}>
              <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 6 }}>Step 2</p>
              <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22, marginBottom: 16 }}>
                Set your creative parameters
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {dropdowns.map((d) => (
                  <ParameterDropdown
                    key={d.id}
                    id={d.id}
                    label={d.label}
                    options={d.options}
                    value={params[d.id]}
                    onChange={handleParamChange}
                  />
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 22,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={handleRandomize}
                  style={SECONDARY_BUTTON_STYLE}
                >
                  <RefreshCw size={14} />
                  Randomize All
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  style={SECONDARY_BUTTON_STYLE}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                style={{
                  ...PRIMARY_CTA_STYLE,
                  width: "100%",
                  marginTop: 16,
                  padding: "14px 22px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  opacity: canGenerate ? 1 : 0.55,
                  cursor: canGenerate ? "pointer" : "not-allowed",
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Generate Prompt
                  </>
                )}
              </button>
              {!canGenerate && !isGenerating ? (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    color: "var(--cth-command-muted)",
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  {generationHint}
                </p>
              ) : null}
              {generationError ? (
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: "var(--cth-danger)",
                    marginTop: 12,
                  }}
                >
                  {generationError}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Output card */}
          {generatedPrompt ? (
            <div
              style={{
                ...CARD_STYLE,
                padding: 22,
                marginBottom: 22,
                borderLeft: "4px solid var(--cth-command-crimson)",
              }}
            >
              <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 6 }}>Generated</p>
              <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22, marginBottom: 14 }}>
                Your prompt
              </h2>
              <textarea
                readOnly
                value={generatedPrompt}
                style={{
                  ...CARD_STYLE,
                  width: "100%",
                  minHeight: 180,
                  padding: 14,
                  fontFamily: "'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "var(--cth-command-ink)",
                  resize: "vertical",
                }}
              />
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: "var(--cth-command-muted)",
                  marginTop: 6,
                }}
              >
                {charCount} characters
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 14,
                }}
              >
                <button
                  type="button"
                  onClick={handleCopyGenerated}
                  style={SECONDARY_BUTTON_STYLE}
                >
                  <Copy size={14} />
                  Copy to Clipboard
                </button>
                <button
                  type="button"
                  onClick={handleSendToMediaStudio}
                  style={{
                    ...PRIMARY_CTA_STYLE,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 18px",
                  }}
                >
                  <ArrowRight size={14} />
                  Send to Media Studio
                </button>
                <button
                  type="button"
                  onClick={handleSavePrompt}
                  style={SECONDARY_BUTTON_STYLE}
                >
                  <Bookmark size={14} />
                  Save Prompt
                </button>
              </div>
            </div>
          ) : null}

          {/* Saved prompts */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
              <p style={SECTION_LABEL_STYLE}>Library</p>
              <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Saved Prompts</h2>
            </div>
            {isLoadingSaved ? (
              <div
                style={{
                  ...CARD_STYLE,
                  padding: 18,
                  fontFamily: SANS,
                  color: "var(--cth-command-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                Loading saved prompts…
              </div>
            ) : saved.length === 0 ? (
              <div
                style={{
                  ...CARD_STYLE,
                  padding: 22,
                  fontFamily: SANS,
                  color: "var(--cth-command-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Sparkles size={16} />
                No saved prompts yet. Generate and save your first prompt above.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {saved.map((item) => (
                  <SavedPromptCard
                    key={item.id}
                    item={item}
                    expanded={expandedSavedId === item.id}
                    onToggle={() =>
                      setExpandedSavedId((prev) => (prev === item.id ? null : item.id))
                    }
                    onCopy={() => handleCopySaved(item.prompt_text)}
                    onDelete={() => handleDeleteSaved(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
