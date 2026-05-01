import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { BrandGuidelinesExportButton } from "../components/shared/BrandGuidelinesExport";
import apiClient from "../lib/apiClient";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

const FIELDS = [
  {
    id: "mission",
    label: "Mission Statement",
    subtitle: "Why your brand exists",
    placeholder: "Describe the work your brand does and who it serves...",
    minLength: 20,
    maxLength: 300,
    why: 'Your mission is the operational heart of the brand. It answers "what do we do and for whom?" and becomes the filter for every product, content, and business decision.',
    tips: [
      "Start with a verb: Build, Help, Equip, Create, Enable",
      "Name what you do, not what you want to become",
      "Keep it short enough to remember. One sentence is ideal",
    ],
    exampleSnippet: "Build the strategy, systems, and content behind a brand that actually grows.",
  },
  {
    id: "vision",
    label: "Vision Statement",
    subtitle: "Where your brand is going",
    placeholder: "Describe the world your brand is working toward...",
    minLength: 30,
    maxLength: 500,
    why: "Your vision is the north star. It is the long-range destination that makes the mission worth doing.",
    tips: [
      "Describe a changed world, not a company milestone",
      "It should feel ambitious enough to outlast any one product",
      "Avoid timelines. Vision is directional, not scheduled",
    ],
    exampleSnippet: "A world where every serious founder stops guessing and starts building on a foundation of truth.",
  },
  {
    id: "coreValues",
    label: "Core Values",
    subtitle: "What your brand stands for",
    placeholder: "List your core values and what each one means in practice...",
    minLength: 30,
    maxLength: 600,
    why: "Values are the operating standards behind every decision, every hire, and every piece of content.",
    tips: [
      "Aim for 3 to 5 values. More than 5 becomes noise",
      "Give each value a short explanation, not just a word",
      "If a competitor could claim the same value, it is not specific enough",
    ],
    exampleSnippet: "Strategy before aesthetics. Systems before scale. Foundation before visibility. Truth before trend.",
  },
  {
    id: "tagline",
    label: "Tagline",
    subtitle: "Your memorable phrase",
    placeholder: "The one line that captures your brand positioning...",
    minLength: 5,
    maxLength: 100,
    why: "A tagline is a positioning shortcut. It should say something true and specific enough to stick.",
    tips: [
      "Test it: could a competitor claim this? If yes, rewrite it",
      "Say something true, not aspirational or generic",
      "The best taglines are specific enough to exclude someone",
    ],
    exampleSnippet: "Where serious brands are built.",
  },
  {
    id: "positioning",
    label: "Positioning Statement",
    subtitle: "Your unique place in the market",
    placeholder:
      "For [audience] who [problem], [brand] is the [category] that [differentiator]. Unlike [alternatives], [brand] [key difference].",
    minLength: 50,
    maxLength: 600,
    why: "Positioning is the strategic decision about what corner of the market you own.",
    tips: [
      "Name the specific type of person this is for, not everyone",
      "Name your category clearly, even if it is new",
      "Name one specific competitor or alternative you are replacing",
    ],
    exampleSnippet:
      "For serious founders who are tired of building backwards, Core Truth House OS is the brand operating system that puts strategy first.",
  },
  {
    id: "brandStory",
    label: "Brand Story",
    subtitle: "Your origin narrative",
    placeholder: "The problem you saw, why you were the one to solve it, and what changed because of it...",
    minLength: 100,
    maxLength: 2000,
    why: "Your brand story is not a biography. It should position the customer as the hero and your brand as the guide.",
    tips: [
      "Open with the problem, not with you",
      "Show what you saw that others missed",
      "End with what becomes possible, not your credentials",
    ],
    exampleSnippet:
      "Most founders do not have a brand problem. They have a sequence problem. We built Core Truth House OS because the tool that should have existed did not.",
  },
  {
    id: "toneOfVoice",
    label: "Tone of Voice",
    subtitle: "How your brand speaks",
    placeholder: "Describe your brand voice with 3 to 5 descriptors and what each means in practice...",
    minLength: 30,
    maxLength: 600,
    why: "Voice is the consistent personality behind everything the brand says.",
    tips: [
      'Use descriptor pairs like "Direct but not cold. Warm but not casual."',
      "Include what you are not. Contrast sharpens the voice",
      "Think of a person your brand would sound like, then describe them",
    ],
    exampleSnippet:
      "Authoritative. Calm. Specific. Never loud. The brand speaks like a trusted strategist, not a hype coach.",
  },
];

const FIELD_MAP = {
  mission: "mission",
  vision: "vision",
  coreValues: "values",
  tagline: "tagline",
  positioning: "positioning",
  brandStory: "story",
  toneOfVoice: "tone_of_voice",
};

const EMPTY_DATA = {
  mission: "",
  vision: "",
  coreValues: "",
  tagline: "",
  positioning: "",
  brandStory: "",
  toneOfVoice: "",
};

function getCompletionStatus(value, minLength) {
  const strVal = value ? String(value) : "";
  if (!strVal || strVal.trim().length === 0) return "empty";
  if (strVal.trim().length < minLength) return "draft";
  return "complete";
}

function getScoreFromData(data) {
  const scores = FIELDS.map((field) => {
    const val = data[field.id] || "";
    const status = getCompletionStatus(val, field.minLength);
    if (status === "complete") return 1;
    if (status === "draft") return 0.5;
    return 0;
  });

  return Math.round((scores.reduce((sum, value) => sum + value, 0) / FIELDS.length) * 100);
}

function getSnippet(value) {
  const strVal = value ? String(value) : "";
  if (!strVal || strVal.trim().length === 0) return "";
  return strVal.length > 72 ? `${strVal.substring(0, 72).trim()}...` : strVal;
}

function normalizeFoundationResponse(response) {
  const foundation = response?.foundation || response || {};
  return {
    mission: foundation.mission || "",
    vision: foundation.vision || "",
    coreValues: Array.isArray(foundation.values)
      ? foundation.values.join("\n")
      : foundation.coreValues || foundation.values || "",
    tagline: foundation.tagline || "",
    positioning: foundation.positioning || "",
    brandStory: foundation.story || foundation.brandStory || "",
    toneOfVoice: foundation.tone_of_voice || foundation.toneOfVoice || "",
  };
}

function buildFoundationPayload(updated) {
  return {
    mission: updated.mission,
    vision: updated.vision,
    values: updated.coreValues
      ? updated.coreValues
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean)
      : [],
    tagline: updated.tagline,
    positioning: updated.positioning,
    story: updated.brandStory,
    tone_of_voice: updated.toneOfVoice,
  };
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

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

const FIELD_HEADING_STYLE = {
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
};

function ScoreRing({ score }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const stroke = score === 100 ? "var(--cth-status-success-bright)" : "var(--cth-command-crimson)";

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--cth-command-border)" strokeWidth="4" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: "var(--cth-command-ink)" }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "complete") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Complete" role="img">
        <path
          d="M3 8.5 L6.5 12 L13 5"
          stroke="var(--cth-command-crimson)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "draft") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-label="In progress" role="img">
        <circle cx="8" cy="8" r="6" stroke="var(--cth-command-gold)" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="2.5" fill="var(--cth-command-gold)" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-label="Not started" role="img">
      <circle cx="8" cy="8" r="6" stroke="var(--cth-command-muted)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function StatusPill({ status }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-500">
        <CheckCircle2 size={12} />
        Complete
      </span>
    );
  }

  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-500">
        <Loader2 size={12} />
        In progress
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: "var(--cth-command-panel-soft)", color: "var(--cth-command-muted)" }}
    >
      <FileText size={12} />
      Not started
    </span>
  );
}

export default function BrandFoundation() {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";

  const [data, setData] = useState(EMPTY_DATA);
  const [activeField, setActiveField] = useState(FIELDS[0].id);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);

  const saveTimeout = useRef(null);
  const textareaRef = useRef(null);

  const activeConfig = useMemo(
    () => FIELDS.find((field) => field.id === activeField) || FIELDS[0],
    [activeField]
  );

  const activeValue = data[activeField] || "";
  const activeStatus = getCompletionStatus(activeValue, activeConfig.minLength);
  const score = getScoreFromData(data);
  const completedCount = FIELDS.filter(
    (field) => getCompletionStatus(data[field.id] || "", field.minLength) === "complete"
  ).length;

  useEffect(() => {
    async function loadFoundation() {
      if (!workspaceId) {
        setIsLoading(false);
        setLoadError("No active workspace found.");
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        const response = await apiClient.get("/api/persist/brand-foundation");
        setData(normalizeFoundationResponse(response));
      } catch (error) {
        console.error("Failed to load foundation:", error);
        setLoadError(getErrorMessage(error, "Failed to load Foundation."));
      } finally {
        setIsLoading(false);
      }
    }

    loadFoundation();
  }, [workspaceId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(220, textareaRef.current.scrollHeight)}px`;
    }
  }, [activeValue, activeField]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const persistFoundation = useCallback(async (updated) => {
    const payload = buildFoundationPayload(updated);
    await apiClient.post("/api/persist/brand-foundation", payload);
  }, []);

  const handleChange = useCallback(
    (value) => {
      setData((prev) => {
        const updated = { ...prev, [activeField]: value };
        setSaveState("saving");
        setSaveError("");
        setGeneratedPreview(null);

        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
          try {
            await persistFoundation(updated);
            setSaveState("saved");
            setLastSavedAt(new Date());
            setTimeout(() => {
              setSaveState((current) => (current === "saved" ? "idle" : current));
            }, 1800);
          } catch (error) {
            console.error("Save failed:", error);
            setSaveState("idle");
            setSaveError(getErrorMessage(error, "Save failed."));
          }
        }, 700);

        return updated;
      });
    },
    [activeField, persistFoundation]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedPreview(null);
    setSaveError("");

    try {
      const apiField = FIELD_MAP[activeField];
      const response = await apiClient.post("/api/persist/brand-foundation/ai-assist", {
        field: apiField,
        current_data: {
          mission: data.mission || "",
          vision: data.vision || "",
          values: data.coreValues || "",
          tagline: data.tagline || "",
          positioning: data.positioning || "",
          story: data.brandStory || "",
          tone_of_voice: data.toneOfVoice || "",
          active_field_label: activeConfig.label,
          active_field_value: activeValue || "",
        },
      });

      const suggestion = typeof response?.suggestion === "string" ? response.suggestion.trim() : "";
      if (suggestion) {
        setGeneratedPreview(suggestion);
      } else {
        setSaveError("No AI draft was returned.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setSaveError(getErrorMessage(error, "AI generation failed."));
    } finally {
      setIsGenerating(false);
    }
  }, [activeField, activeConfig.label, activeValue, data.mission]);

  const handleAcceptGenerated = useCallback(() => {
    if (!generatedPreview) return;
    handleChange(generatedPreview);
    setGeneratedPreview(null);
  }, [generatedPreview, handleChange]);

  const handleFieldSwitch = useCallback((fieldId) => {
    setActiveField(fieldId);
    setGeneratedPreview(null);
    setSaveError("");
    setSaveState("idle");
  }, []);

  const fieldIndex = FIELDS.findIndex((field) => field.id === activeField);
  const prevField = fieldIndex > 0 ? FIELDS[fieldIndex - 1] : null;
  const nextField = fieldIndex < FIELDS.length - 1 ? FIELDS[fieldIndex + 1] : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center" style={PAGE_STYLE}>
          <div
            style={{
              fontFamily: SANS,
              color: "var(--cth-command-muted)",
              padding: "120px 24px",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Loader2 size={18} className="animate-spin" />
            Loading Brand Foundation...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Brand Foundation"
        subtitle="Define the core truth your brand is built on so every strategy, offer, and content decision pulls from the same source of truth."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-3 px-4 py-2"
              style={CARD_STYLE}
            >
              <ScoreRing score={score} />
              <div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--cth-command-ink)",
                  }}
                >
                  Foundation Score
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    color: "var(--cth-command-muted)",
                    marginTop: 2,
                  }}
                >
                  {score === 100
                    ? "Complete and ready for Strategic OS"
                    : `${7 - completedCount} fields remaining`}
                </div>
              </div>
            </div>
            <BrandGuidelinesExportButton />
          </div>
        }
      />

      <div
        className="flex-1 overflow-auto"
        style={PAGE_STYLE}
        data-testid="brand-foundation-page"
      >
        {loadError ? (
          <div
            className="mx-auto mt-5 max-w-7xl px-4 md:px-8"
            style={{ fontFamily: SANS }}
          >
            <div
              style={{
                ...CARD_STYLE,
                borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                color: "var(--cth-danger)",
                padding: "12px 16px",
                fontSize: 13,
              }}
            >
              {loadError}
            </div>
          </div>
        ) : null}

        <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
          {/* Left sidebar */}
          <aside className="hidden w-72 shrink-0 md:block">
            <div className="sticky top-0 px-5 py-6">
              <div style={SECTION_LABEL_STYLE}>Foundation Elements</div>

              <div className="mt-4 space-y-2">
                {FIELDS.map((field) => {
                  const value = data[field.id] || "";
                  const status = getCompletionStatus(value, field.minLength);
                  const isActive = activeField === field.id;
                  const snippet = getSnippet(value);

                  return (
                    <button
                      key={field.id}
                      onClick={() => handleFieldSwitch(field.id)}
                      data-testid={`field-nav-${field.id}`}
                      className="w-full px-4 py-3 text-left transition"
                      style={{
                        ...CARD_STYLE,
                        borderColor: isActive
                          ? "var(--cth-command-crimson)"
                          : "var(--cth-command-border)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div
                          style={{
                            fontFamily: SANS,
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 500,
                            color: "var(--cth-command-ink)",
                          }}
                        >
                          {field.label}
                        </div>
                        <StatusIcon status={status} />
                      </div>

                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 11,
                          lineHeight: 1.5,
                          color: "var(--cth-command-muted)",
                          marginTop: 8,
                        }}
                      >
                        {snippet || field.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ ...CARD_STYLE, padding: 16, marginTop: 20 }}>
                <div className="flex items-center justify-between">
                  <span style={SECTION_LABEL_STYLE}>Score</span>
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--cth-command-ink)",
                    }}
                  >
                    {score}%
                  </span>
                </div>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full"
                  style={{ background: "var(--cth-command-blush)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${score}%`,
                      background: "var(--cth-command-crimson)",
                    }}
                  />
                </div>
                {score === 100 ? (
                  <div
                    className="mt-4 p-3"
                    style={{
                      borderRadius: 4,
                      border: "1px solid var(--cth-status-success-bright)",
                      background: "color-mix(in srgb, var(--cth-status-success-bright) 8%, transparent)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--cth-status-success-bright)",
                      }}
                    >
                      Ready
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: "var(--cth-command-muted)",
                        marginTop: 4,
                      }}
                    >
                      Your foundation is strong enough to move into Strategic OS.
                    </div>
                    <a
                      href="/strategic-os"
                      className="mt-3 inline-flex items-center gap-1.5"
                      style={{
                        fontFamily: SANS,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--cth-command-crimson)",
                        textDecoration: "none",
                      }}
                    >
                      Launch Strategic OS
                      <ChevronRight size={12} />
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          {/* Right content area */}
          <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Active field card */}
              <div style={{ ...CARD_STYLE, padding: 28 }}>
                {/* Field header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: 4,
                        background:
                          "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)",
                        color: "var(--cth-command-crimson)",
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <h2 style={FIELD_HEADING_STYLE}>{activeConfig.label}</h2>
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: 13,
                          color: "var(--cth-command-muted)",
                          margin: "4px 0 0",
                        }}
                      >
                        {activeConfig.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill status={activeStatus} />
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        color: "var(--cth-command-muted)",
                      }}
                    >
                      {saveState === "saving" && "Saving..."}
                      {saveState === "saved" && "Saved"}
                      {saveState === "idle" && lastSavedAt
                        ? `Last saved ${lastSavedAt.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}`
                        : ""}
                    </div>
                  </div>
                </div>

                {/* Why this matters */}
                <div style={{ ...CARD_STYLE, padding: 16, marginTop: 20 }}>
                  <p style={SECTION_LABEL_STYLE}>Why this matters</p>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--cth-command-ink)",
                      margin: "8px 0 0",
                    }}
                  >
                    {activeConfig.why}
                  </p>
                </div>

                {/* Tip cards */}
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {activeConfig.tips.map((tip, index) => (
                    <div
                      key={`${activeConfig.id}-tip-${index}`}
                      style={{ ...CARD_STYLE, padding: 16 }}
                    >
                      <p style={SECTION_LABEL_STYLE}>Tip {index + 1}</p>
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: 13,
                          lineHeight: 1.65,
                          color: "var(--cth-command-ink)",
                          margin: "8px 0 0",
                        }}
                      >
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Textarea */}
                <div className="mt-5">
                  <label
                    style={{
                      display: "block",
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--cth-command-ink)",
                      marginBottom: 8,
                    }}
                  >
                    Write your {activeConfig.label.toLowerCase()}
                  </label>

                  <div className="relative" style={{ ...CARD_STYLE, overflow: "hidden" }}>
                    <textarea
                      ref={textareaRef}
                      value={activeValue}
                      onChange={(event) => handleChange(event.target.value)}
                      placeholder={
                        activeStatus === "empty"
                          ? `${activeConfig.placeholder}\n\nExample: "${activeConfig.exampleSnippet}"`
                          : activeConfig.placeholder
                      }
                      data-testid={`input-${activeField}`}
                      className="w-full resize-none"
                      style={{
                        minHeight: 220,
                        background: "var(--cth-command-panel)",
                        color: "var(--cth-command-ink)",
                        fontFamily: SANS,
                        fontSize: 14,
                        lineHeight: 1.65,
                        padding: "18px 18px 36px",
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        display: "block",
                      }}
                      maxLength={activeConfig.maxLength}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 12,
                        right: 16,
                        fontFamily: SANS,
                        fontSize: 10,
                        color: "var(--cth-command-muted)",
                      }}
                    >
                      {activeValue.length}/{activeConfig.maxLength}
                    </div>
                  </div>
                </div>

                {/* Generate AI / Clear */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    data-testid="generate-ai-btn"
                    className="inline-flex items-center gap-2"
                    style={{
                      ...PRIMARY_CTA_STYLE,
                      opacity: isGenerating ? 0.65 : 1,
                      cursor: isGenerating ? "not-allowed" : "pointer",
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Generate with AI
                      </>
                    )}
                  </button>

                  {activeValue ? (
                    <button onClick={() => handleChange("")} style={SECONDARY_BUTTON_STYLE}>
                      Clear field
                    </button>
                  ) : null}
                </div>

                {saveError ? (
                  <div
                    style={{
                      marginTop: 16,
                      padding: "10px 14px",
                      borderRadius: 4,
                      border:
                        "1px solid color-mix(in srgb, var(--cth-danger) 25%, var(--cth-command-border))",
                      background:
                        "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                      color: "var(--cth-danger)",
                      fontFamily: SANS,
                      fontSize: 13,
                    }}
                  >
                    {saveError}
                  </div>
                ) : null}

                {/* Generated preview */}
                {generatedPreview ? (
                  <div
                    className="mt-5"
                    style={{
                      ...CARD_STYLE,
                      borderColor: "var(--cth-command-crimson)",
                      background:
                        "color-mix(in srgb, var(--cth-command-crimson) 6%, var(--cth-command-panel))",
                      padding: 16,
                    }}
                    data-testid="generated-preview"
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--cth-command-crimson)",
                      }}
                    >
                      <Sparkles size={12} />
                      AI Draft
                    </div>

                    <p
                      style={{
                        whiteSpace: "pre-wrap",
                        fontFamily: SANS,
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: "var(--cth-command-ink)",
                        margin: "12px 0 0",
                      }}
                    >
                      {generatedPreview}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={handleAcceptGenerated}
                        data-testid="accept-generated-btn"
                        style={{
                          background: "var(--cth-command-crimson)",
                          color: "var(--cth-command-panel)",
                          border: "none",
                          borderRadius: 999,
                          padding: "10px 18px",
                          fontFamily: SANS,
                          fontSize: 13,
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          cursor: "pointer",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleGenerate}
                        style={{ ...SECONDARY_BUTTON_STYLE, padding: "10px 18px" }}
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => setGeneratedPreview(null)}
                        style={{
                          background: "transparent",
                          color: "var(--cth-command-muted)",
                          border: "none",
                          borderRadius: 999,
                          padding: "10px 18px",
                          fontFamily: SANS,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Field navigation */}
                <div
                  className="mt-6 flex items-center justify-between pt-5"
                  style={{ borderTop: "1px solid var(--cth-command-border)" }}
                >
                  <button
                    onClick={() => prevField && handleFieldSwitch(prevField.id)}
                    disabled={!prevField}
                    data-testid="prev-field-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "none",
                      cursor: prevField ? "pointer" : "default",
                      opacity: prevField ? 1 : 0.25,
                      fontFamily: SANS,
                      fontSize: 13,
                      color: "var(--cth-command-muted)",
                      padding: 0,
                    }}
                  >
                    <ChevronLeft size={16} />
                    {prevField?.label || "Previous"}
                  </button>

                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--cth-command-muted)",
                    }}
                  >
                    {fieldIndex + 1} of {FIELDS.length}
                  </span>

                  <button
                    onClick={() => nextField && handleFieldSwitch(nextField.id)}
                    disabled={!nextField}
                    data-testid="next-field-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "none",
                      cursor: nextField ? "pointer" : "default",
                      opacity: nextField ? 1 : 0.25,
                      fontFamily: SANS,
                      fontSize: 13,
                      color: "var(--cth-command-muted)",
                      padding: 0,
                    }}
                  >
                    {nextField?.label || "Next"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Next Step banner */}
              <div
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ ...CARD_STYLE, padding: 24 }}
              >
                <div>
                  <p style={SECTION_LABEL_STYLE}>Next Step</p>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--cth-command-ink)",
                      margin: "8px 0 0",
                      maxWidth: 620,
                    }}
                  >
                    Move into Strategic OS and turn your foundation into positioning, content pillars, offers, and execution.
                  </p>
                </div>
                <a
                  href="/strategic-os"
                  className="inline-flex shrink-0 items-center gap-2"
                  style={PRIMARY_CTA_STYLE}
                >
                  Open Strategic OS
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
