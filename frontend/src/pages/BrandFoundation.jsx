import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { BrandGuidelinesExportButton } from "../components/shared/BrandGuidelinesExport";
import apiClient from "../lib/apiClient";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
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

function ScoreRing({ score }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const stroke = score === 100 ? "var(--cth-status-success-bright)" : score >= 60 ? "var(--cth-admin-accent)" : "var(--cth-admin-muted)";

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--cth-app-border)" strokeWidth="4" />
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
        <span className="text-xs font-bold cth-heading">{score}%</span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
        <CheckCircle2 size={12} />
        Complete
      </span>
    );
  }

  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
        <Loader2 size={12} />
        In progress
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full cth-card-muted px-2.5 py-1 text-[11px] font-medium cth-muted">
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
        <div className="flex min-h-screen items-center justify-center cth-page">
          <div className="inline-flex items-center gap-3 cth-muted">
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
              <div className="cth-card-muted flex items-center gap-3 rounded-2xl px-4 py-2">
                <ScoreRing score={score} />
                <div>
                  <div className="text-xs font-medium cth-heading">Foundation Score</div>
                  <div className="mt-1 text-[11px] cth-muted">
                    {score === 100 ? "Complete and ready for Strategic OS" : `${7 - completedCount} fields remaining`}
                  </div>
                </div>
              </div>
              <BrandGuidelinesExportButton />
            </div>
          }
        />

        <div className="cth-page flex-1 overflow-auto" data-testid="brand-foundation-page">
        <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
          <aside className="hidden w-72 shrink-0 border-r md:block" style={{ borderColor: "var(--cth-app-border)" }}>
            <div className="sticky top-0 p-5">
              <div className="text-[11px] uppercase tracking-[0.2em] cth-muted">
                Foundation Elements
              </div>

              <div className="mt-4 space-y-1.5">
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
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-[rgba(224,78,53,0.28)] bg-[rgba(224,78,53,0.08)]"
                          : "border-transparent bg-transparent hover:border-[var(--cth-app-border)] hover:bg-[var(--cth-app-panel-alt)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className={`text-sm font-medium ${isActive ? "cth-heading" : "cth-body"}`}>
                          {field.label}
                        </div>
                        <StatusPill status={status} />
                      </div>

                      <div className="mt-2 text-[11px] leading-relaxed cth-muted">
                        {snippet || field.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border cth-card-muted p-4" style={{ borderColor: "var(--cth-app-border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] cth-muted">Score</span>
                  <span className="text-sm font-semibold cth-heading">{score}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--cth-app-border)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${score}%`,
                      background: score === 100 ? "var(--cth-status-success-bright)" : "var(--cth-admin-accent)",
                    }}
                  />
                </div>
                {score === 100 ? (
                  <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Ready
                    </div>
                    <div className="mt-1 text-xs leading-relaxed cth-muted">
                      Your foundation is strong enough to move into Strategic OS.
                    </div>
                    <a
                      href="/strategic-os"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      Launch Strategic OS
                      <ChevronRight size={12} />
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-3xl border cth-card p-5 md:p-6" style={{ borderColor: "var(--cth-app-border)" }}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--cth-accent)]/12 text-[var(--cth-accent)]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold cth-heading">{activeConfig.label}</h2>
                      <p className="mt-1 text-sm cth-muted">{activeConfig.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <StatusPill status={activeStatus} />

                    <div className="text-[11px] cth-muted">
                      {saveState === "saving" && "Saving..."}
                      {saveState === "saved" && "Saved"}
                      {saveState === "idle" && lastSavedAt
                        ? `Last saved ${lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                        : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border cth-card-muted p-4" style={{ borderColor: "var(--cth-app-border)" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] cth-muted">
                    Why this matters
                  </div>
                  <p className="mt-2 text-sm leading-relaxed cth-body">{activeConfig.why}</p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {activeConfig.tips.map((tip, index) => (
                    <div
                      key={`${activeConfig.id}-tip-${index}`}
                      className="rounded-2xl border cth-card-muted p-4" style={{ borderColor: "var(--cth-app-border)" }}
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] cth-muted">
                        Tip {index + 1}
                      </div>
                      <div className="mt-2 text-sm leading-relaxed cth-muted">{tip}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium cth-heading">
                    Write your {activeConfig.label.toLowerCase()}
                  </label>

                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={activeValue}
                      onChange={(event) => handleChange(event.target.value)}
                      placeholder={
                        activeStatus === "empty"
                          ? `${activeConfig.placeholder}

Example: "${activeConfig.exampleSnippet}"`
                          : activeConfig.placeholder
                      }
                      data-testid={`input-${activeField}`}
                      className="cth-textarea w-full resize-none rounded-2xl px-4 py-4 text-sm leading-relaxed"
                      style={{ minHeight: 220 }}
                      maxLength={activeConfig.maxLength}
                    />
                    <div className="absolute bottom-3 right-4 text-[10px] cth-muted">
                      {activeValue.length}/{activeConfig.maxLength}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    data-testid="generate-ai-btn"
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isGenerating
                        ? "cursor-not-allowed bg-[rgba(224,78,53,0.20)] cth-muted"
                        : "bg-[var(--cth-app-accent)] text-white hover:opacity-90"
                    }`}
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
                    <button
                      onClick={() => handleChange("")}
                      className="cth-button-secondary rounded-2xl px-4 py-3 text-sm font-medium"
                    >
                      Clear field
                    </button>
                  ) : null}
                </div>

                {generatedPreview ? (
                  <div
                    className="mt-5 rounded-2xl border border-[color:rgba(224,78,53,0.20)] bg-[var(--cth-accent)]/[0.08] p-4"
                    data-testid="generated-preview"
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color-mix(in srgb, var(--cth-admin-accent) 70%, white)]">
                      <Sparkles size={12} />
                      AI Draft
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed cth-body">
                      {generatedPreview}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={handleAcceptGenerated}
                        data-testid="accept-generated-btn"
                        className="cth-button-primary rounded-2xl px-4 py-2.5 text-sm font-semibold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={handleGenerate}
                        className="cth-button-secondary rounded-2xl px-4 py-2.5 text-sm font-medium"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => setGeneratedPreview(null)}
                        className="rounded-2xl px-4 py-2.5 text-sm font-medium cth-muted hover:opacity-80"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex items-center justify-between border-t pt-5" style={{ borderColor: "var(--cth-app-border)" }}>
                  <button
                    onClick={() => prevField && handleFieldSwitch(prevField.id)}
                    disabled={!prevField}
                    data-testid="prev-field-btn"
                    className="inline-flex items-center gap-2 text-sm cth-muted transition hover:opacity-80 disabled:opacity-25"
                  >
                    <ChevronLeft size={16} />
                    {prevField?.label || "Previous"}
                  </button>

                  <span className="text-[11px] uppercase tracking-[0.2em] cth-muted">
                    {fieldIndex + 1} of {FIELDS.length}
                  </span>

                  <button
                    onClick={() => nextField && handleFieldSwitch(nextField.id)}
                    disabled={!nextField}
                    data-testid="next-field-btn"
                    className="inline-flex items-center gap-2 text-sm cth-muted transition hover:opacity-80 disabled:opacity-25"
                  >
                    {nextField?.label || "Next"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
                <div className="cth-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="cth-kicker m-0">Next step</p>
                    <p className="m-0 mt-1 text-sm cth-muted">
                      Move into Strategic OS and turn your foundation into positioning, content pillars, offers, and execution.
                    </p>
                  </div>
                  <a href="/strategic-os" className="cth-button-primary inline-flex shrink-0 items-center gap-2">
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
