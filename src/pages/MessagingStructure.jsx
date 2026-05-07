import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import { getNextStep } from "../config/brandCoreNextStep";
import apiClient from "../lib/apiClient";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

const FIELDS = [
  {
    id: "brandPromise",
    label: "Brand Promise",
    subtitle: "The transformation you deliver",
    placeholder:
      "Describe the specific outcome your client experiences because of working with you...",
    minLength: 20,
    maxLength: 400,
    why: "Your brand promise is not a tagline. It is the specific, felt transformation your client experiences because of you. It becomes the anchor for every offer, every piece of content, and every sales conversation.",
    tips: [
      "Start with the before and after: who they were vs who they become",
      "Make it specific enough that a client could hold you to it",
      "If you cannot measure or feel it, it is too vague",
    ],
    exampleSnippet:
      "Founders leave with a brand system that holds their business together and sells without them having to explain it every time.",
  },
  {
    id: "elevatorPitch",
    label: "Elevator Pitch",
    subtitle: "What you say when someone asks what you do",
    placeholder:
      "Write what you say out loud in 30 seconds when someone asks what you do...",
    minLength: 30,
    maxLength: 500,
    why: "You have 30 seconds. This is the version you say out loud. It should make someone say tell me more, not nod politely and change the subject.",
    tips: [
      "Lead with who you help and what problem you solve",
      "Include what makes your approach different",
      "End with the result they get, not the service you offer",
    ],
    exampleSnippet:
      "I build brand operating systems for solo founders who are consistent but not converting. Most people leave with scattered brand pieces. My clients leave with a connected system that sells.",
  },
  {
    id: "oneLiner",
    label: "One-Liner",
    subtitle: "The shortest possible version of what you do",
    placeholder: "One sentence. Subject, verb, result...",
    minLength: 10,
    maxLength: 200,
    why: "One sentence. Subject, verb, result. This goes in your bio, your email signature, your social profiles. It should be impossible to misunderstand.",
    tips: [
      "I help [specific person] do [specific thing] so they can [specific result]",
      "Cut every word that does not add meaning",
      "If a competitor could say the same thing, rewrite it",
    ],
    exampleSnippet:
      "I help serious founders stop guessing and start building brands that actually sell.",
  },
  {
    id: "coreMessage",
    label: "Core Message",
    subtitle: "The idea your brand keeps coming back to",
    placeholder:
      "The central idea your brand reinforces across every platform, offer, and piece of content...",
    minLength: 20,
    maxLength: 400,
    why: "Every strong brand has one central idea it reinforces constantly. This is the thread that ties your content, your offers, and your positioning together. Without it, your brand feels random even when it is consistent.",
    tips: [
      "It should feel like something you could say 100 times and never get tired of",
      "It should connect directly to your brand promise",
      "Test it: does every piece of content you create connect back to this?",
    ],
    exampleSnippet:
      "You do not need more random brand pieces. You need a connected system that makes your brand make sense, sell clearly, and stay consistent.",
  },
  {
    id: "proofPoints",
    label: "Proof Points",
    subtitle: "The evidence behind your claims",
    placeholder:
      "List the specific facts, results, credentials, or outcomes that make your positioning believable...",
    minLength: 30,
    maxLength: 600,
    why: "Proof points are the specific credible facts that make your positioning believable. Without them, your brand is just claims. With them, it becomes evidence.",
    tips: [
      "Use numbers where possible: years, clients, results",
      "Include transformation stories, not just credentials",
      "Specific proof beats impressive proof every time",
    ],
    exampleSnippet:
      "30 years of real business experience across multiple industries. Clients who previously had no consistent brand now have a system they run every week. Built Core Truth House from zero as a working proof of concept.",
  },
  {
    id: "callsToAction",
    label: "Calls to Action",
    subtitle: "The exact words you use to move people",
    placeholder:
      "List your primary CTAs with the exact wording you use across platforms...",
    minLength: 20,
    maxLength: 400,
    why: "Vague CTAs kill conversions. Your calls to action should be specific, benefit-forward, and consistent across all platforms. When people hear the same CTA repeatedly they begin to recognize and respond to it.",
    tips: [
      "Lead with the benefit not the action",
      "Use the same wording consistently across all platforms",
      "Have one primary CTA and one secondary CTA at most",
    ],
    exampleSnippet:
      "Start the Brand Diagnostic. Book the Brand Audit. Get the Foundation. Join the House.",
  },
];

const EMPTY_DATA = {
  brandPromise: "",
  elevatorPitch: "",
  oneLiner: "",
  coreMessage: "",
  proofPoints: "",
  callsToAction: "",
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

function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMessagingResponse(response) {
  const messaging = response?.messaging_structure || response || {};
  return {
    brandPromise: messaging.brand_promise || messaging.brandPromise || "",
    elevatorPitch: messaging.elevator_pitch || messaging.elevatorPitch || "",
    oneLiner: messaging.one_liner || messaging.oneLiner || "",
    coreMessage: messaging.core_message || messaging.coreMessage || "",
    proofPoints: messaging.proof_points || messaging.proofPoints || "",
    callsToAction: messaging.calls_to_action || messaging.callsToAction || "",
  };
}

function buildMessagingPayload(updated) {
  return {
    brandPromise: updated.brandPromise || "",
    elevatorPitch: updated.elevatorPitch || "",
    oneLiner: updated.oneLiner || "",
    coreMessage: updated.coreMessage || "",
    proofPoints: updated.proofPoints || "",
    callsToAction: updated.callsToAction || "",
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

export default function MessagingStructure() {
  const { currentWorkspace } = useWorkspace();
  const { plan } = usePlan();

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";
  const nextStep = getNextStep("/messaging-structure", plan);
  const nextStepHref = nextStep?.upgradeTo ? "/billing" : nextStep?.href;
  const nextStepLabel = nextStep?.upgradeTo ? nextStep.ctaLabel : nextStep?.label;

  const [data, setData] = useState(EMPTY_DATA);
  const [activeField, setActiveField] = useState(FIELDS[0].id);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [pendingFieldSwitch, setPendingFieldSwitch] = useState(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);

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
    async function loadMessaging() {
      if (!workspaceId) {
        setIsLoading(false);
        setLoadError("No active workspace found.");
        return;
      }

      try {
        setIsLoading(true);
        setLoadError("");
        const response = await apiClient.get("/api/persist/messaging-structure");
        setData(normalizeMessagingResponse(response));
      } catch (error) {
        console.error("Failed to load messaging structure:", error);
        setLoadError(getErrorMessage(error, "Failed to load Messaging Structure."));
      } finally {
        setIsLoading(false);
      }
    }

    loadMessaging();
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

  const persistMessaging = useCallback(async (updated) => {
    const payload = buildMessagingPayload(updated);
    await apiClient.post("/api/persist/messaging-structure", payload);
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
            await persistMessaging(updated);
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
    [activeField, persistMessaging]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedPreview(null);
    setSaveError("");

    try {
      const response = await apiClient.post("/api/persist/messaging-structure/ai-assist", {
        field_id: activeField,
        current_value: activeValue || "",
        workspace_id: workspaceId,
      });

      const rawSuggestion = typeof response?.suggestion === "string" ? response.suggestion.trim() : "";
      const suggestion = stripMarkdown(rawSuggestion);
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
  }, [activeField, activeValue, workspaceId]);

  const handleAcceptGenerated = useCallback(() => {
    if (!generatedPreview) return;
    handleChange(generatedPreview);
    setGeneratedPreview(null);
  }, [generatedPreview, handleChange]);

  const performFieldSwitch = useCallback((fieldId) => {
    setActiveField(fieldId);
    setGeneratedPreview(null);
    setSaveError("");
    setSaveState("idle");
  }, []);

  const handleFieldSwitch = useCallback(
    (fieldId) => {
      if (generatedPreview && fieldId !== activeField) {
        setPendingFieldSwitch(fieldId);
        return;
      }
      performFieldSwitch(fieldId);
    },
    [generatedPreview, activeField, performFieldSwitch]
  );

  const confirmDiscardAndSwitch = useCallback(() => {
    if (pendingFieldSwitch) {
      performFieldSwitch(pendingFieldSwitch);
    }
    setPendingFieldSwitch(null);
  }, [pendingFieldSwitch, performFieldSwitch]);

  const cancelFieldSwitch = useCallback(() => {
    setPendingFieldSwitch(null);
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
            Loading Messaging Structure...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Messaging Structure"
        subtitle="Turn your positioning into the brand promise, pitch, one-liner, and core message your brand speaks from."
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
                  Messaging Score
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
                    ? "Complete and ready for Audience"
                    : `${FIELDS.length - completedCount} field${FIELDS.length - completedCount === 1 ? "" : "s"} remaining`}
                </div>
              </div>
            </div>
          </div>
        }
      />

      <div
        className="flex-1 overflow-auto"
        style={PAGE_STYLE}
        data-testid="messaging-structure-page"
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
              <div style={SECTION_LABEL_STYLE}>Messaging Elements</div>

              <button
                type="button"
                onClick={() => setViewAllOpen(true)}
                data-testid="view-all-messaging-btn"
                style={{
                  marginTop: 10,
                  background: "transparent",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  color: "var(--cth-command-muted)",
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                View All
              </button>

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
              {nextStep ? (
                <div
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ ...CARD_STYLE, padding: 24 }}
                >
                  <div>
                    <p style={SECTION_LABEL_STYLE}>
                      {nextStep.upgradeTo ? "Upgrade" : "Next Step"}
                    </p>
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
                      {nextStep.copy}
                    </p>
                  </div>
                  <a
                    href={nextStepHref}
                    className="inline-flex shrink-0 items-center gap-2"
                    style={PRIMARY_CTA_STYLE}
                  >
                    {nextStepLabel}
                    <ChevronRight size={14} />
                  </a>
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>

      {/* Unsaved AI Draft confirmation modal */}
      {pendingFieldSwitch ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unsaved AI Draft"
          onClick={cancelFieldSwitch}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(13, 0, 16, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              ...CARD_STYLE,
              width: "100%",
              maxWidth: 480,
              padding: 28,
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 600,
                color: "var(--cth-command-ink)",
                margin: 0,
                letterSpacing: "-0.005em",
                lineHeight: 1.25,
              }}
            >
              Unsaved AI Draft
            </h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: "var(--cth-command-muted)",
                margin: "12px 0 24px",
                lineHeight: 1.6,
              }}
            >
              You have an AI-generated draft that has not been accepted. Leaving this field will discard it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelFieldSwitch}
                data-testid="stay-and-review-btn"
                style={{
                  background: "transparent",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: "10px 18px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Stay and Review
              </button>
              <button
                type="button"
                onClick={confirmDiscardAndSwitch}
                data-testid="discard-and-continue-btn"
                style={{
                  background: "var(--cth-command-crimson)",
                  color: "var(--cth-command-ivory)",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px 18px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                Discard and Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* View All Messaging Elements drawer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          pointerEvents: viewAllOpen ? "auto" : "none",
          visibility: viewAllOpen ? "visible" : "hidden",
        }}
        aria-hidden={!viewAllOpen}
      >
        <div
          onClick={() => setViewAllOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(13, 0, 16, 0.4)",
            opacity: viewAllOpen ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        />
        <div
          role="dialog"
          aria-label="Messaging Elements"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 480,
            maxWidth: "100%",
            background: "var(--cth-command-panel)",
            borderLeft: "1px solid var(--cth-command-border)",
            boxShadow: "-12px 0 40px rgba(13,0,16,0.18)",
            transform: viewAllOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 240ms ease",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--cth-command-border)",
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 600,
                color: "var(--cth-command-ink)",
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              Messaging Elements
            </h2>
            <button
              type="button"
              onClick={() => setViewAllOpen(false)}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                color: "var(--cth-command-muted)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
            <div className="space-y-5">
              {FIELDS.map((field) => {
                const value = data[field.id] || "";
                const status = getCompletionStatus(value, field.minLength);
                const isEmpty = status === "empty";

                return (
                  <div key={field.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p style={SECTION_LABEL_STYLE}>{field.label}</p>
                      <StatusIcon status={status} />
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontFamily: SANS,
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: isEmpty ? "var(--cth-command-muted)" : "var(--cth-command-ink)",
                        fontStyle: isEmpty ? "italic" : "normal",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {isEmpty ? "Not started yet" : value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--cth-command-border)",
            }}
          >
            {completedCount === FIELDS.length && nextStep ? (
              <a
                href={nextStepHref}
                style={{
                  ...PRIMARY_CTA_STYLE,
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {nextStepLabel}
                <ChevronRight size={14} />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setViewAllOpen(false)}
                style={{
                  background: "transparent",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: "12px 22px",
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Keep Building
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
