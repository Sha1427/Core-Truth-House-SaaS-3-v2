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
  Lock,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

const STAGES = [
  {
    id: "awareness",
    number: 1,
    label: "Awareness",
    subtitle: "How strangers discover you",
    description:
      "The first moment someone encounters your brand. They do not know you yet. What brings them into your world?",
    fields: [
      {
        id: "discovery_channel",
        label: "Primary discovery channel",
        type: "select",
        options: [
          "Social Media",
          "Search/SEO",
          "Referral",
          "Podcast",
          "Speaking",
          "Paid Ads",
          "Content/Blog",
          "Community",
          "Word of Mouth",
          "Other",
        ],
      },
      {
        id: "first_touchpoint",
        label: "What they see first",
        type: "text",
        placeholder:
          "The first piece of content, post, or touchpoint they encounter",
      },
      {
        id: "pattern_interrupt",
        label: "What makes them stop scrolling",
        type: "text",
        placeholder: "The hook or pattern interrupt",
      },
    ],
    narrative: {
      label: "Describe the awareness experience",
      placeholder:
        "What does a stranger experience when they first encounter your brand? What are they feeling, thinking, and looking for at this stage?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "education",
    number: 2,
    label: "Education",
    subtitle: "How they learn what you do",
    description:
      "They noticed you. Now they are trying to understand if you are relevant to them.",
    fields: [
      {
        id: "education_content_type",
        label: "Primary education content type",
        type: "select",
        options: [
          "Blog posts",
          "Video content",
          "Social media posts",
          "Email newsletter",
          "Podcast episodes",
          "Free guide or resource",
          "Webinar or training",
          "Other",
        ],
      },
      {
        id: "key_question",
        label: "Key question they are asking",
        type: "text",
        placeholder: "The main question they want answered",
      },
      {
        id: "education_where",
        label: "Where education happens",
        type: "text",
        placeholder: "Platform or channel where they consume",
      },
    ],
    narrative: {
      label: "Describe the education experience",
      placeholder:
        "How does your ideal client learn about your approach and method? What content moves them from curious to interested?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "trustBuilding",
    number: 3,
    label: "Trust Building",
    subtitle: "How they decide you are credible",
    description:
      "They understand what you do. Now they are evaluating whether to believe you.",
    fields: [
      {
        id: "trust_signal",
        label: "Primary trust signal",
        type: "select",
        options: [
          "Client testimonials",
          "Case studies",
          "Social proof numbers",
          "Credentials or awards",
          "Behind the scenes content",
          "Consistent content",
          "Free value or samples",
          "Media mentions",
          "Other",
        ],
      },
      {
        id: "biggest_objection",
        label: "Biggest objection at this stage",
        type: "text",
        placeholder: "What they are skeptical about",
      },
      {
        id: "skeptic_to_believer",
        label: "What converts skeptic to believer",
        type: "text",
        placeholder: "The moment trust tips",
      },
    ],
    narrative: {
      label: "Describe the trust-building experience",
      placeholder:
        "What does your ideal client need to see, hear, or experience before they trust you enough to take the next step?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "leadMagnet",
    number: 4,
    label: "Lead Magnet or Diagnostic",
    subtitle: "Your free entry point",
    description:
      "The first action they take with you. Low risk, high value. The bridge between interest and commitment.",
    fields: [
      {
        id: "lead_magnet_type",
        label: "Lead magnet type",
        type: "select",
        options: [
          "Free diagnostic or assessment",
          "Free guide or PDF",
          "Free training or webinar",
          "Free consultation or call",
          "Free trial or demo",
          "Quiz or scorecard",
          "Email course",
          "Community access",
          "Other",
        ],
      },
      {
        id: "lead_magnet_name",
        label: "Lead magnet name or title",
        type: "text",
        placeholder: "What it is called",
      },
      {
        id: "primary_cta",
        label: "Primary CTA text",
        type: "text",
        placeholder: "The exact words you use to invite them",
      },
    ],
    narrative: {
      label: "Describe the lead magnet experience",
      placeholder:
        "What does your ideal client receive from your free entry point? What transformation or insight does it deliver? What do they feel after completing it?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "offerRecommendation",
    number: 5,
    label: "Offer Recommendation",
    subtitle: "How they find the right offer",
    description:
      "They took the free step. Now they are evaluating your paid offer. What moves them from interested to ready to buy?",
    fields: [
      {
        id: "offer_presentation",
        label: "How offer is presented",
        type: "select",
        options: [
          "Sales page",
          "Direct message or DM",
          "Sales call",
          "Email sequence",
          "Application",
          "Checkout page",
          "Proposal",
          "Other",
        ],
      },
      {
        id: "primary_offer",
        label: "Primary offer at this stage",
        type: "text",
        placeholder: "Name and price of the main offer",
      },
      {
        id: "deciding_factor",
        label: "The deciding factor",
        type: "text",
        placeholder: "What makes them say yes",
      },
    ],
    narrative: {
      label: "Describe the offer recommendation experience",
      placeholder:
        "How does your ideal client discover and evaluate your core offer? What questions do they ask? What makes them decide to buy?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "purchase",
    number: 6,
    label: "Purchase",
    subtitle: "The moment they buy",
    description:
      "They decided. Now they need the transaction to feel as good as the decision.",
    fields: [
      {
        id: "purchase_method",
        label: "Purchase method",
        type: "select",
        options: [
          "Online checkout",
          "Invoice",
          "Application and payment",
          "Stripe link",
          "Discovery call then invoice",
          "In-person payment",
          "Other",
        ],
      },
      {
        id: "immediate_delivery",
        label: "What they receive immediately after purchase",
        type: "text",
        placeholder: "The first thing they get",
      },
      {
        id: "decision_confirmation",
        label: "How they feel confirmed in their decision",
        type: "text",
        placeholder: "What validates the purchase was right",
      },
    ],
    narrative: {
      label: "Describe the purchase experience",
      placeholder:
        "What happens the moment someone buys? What is the immediate experience? What confirmation, welcome, or first touchpoint reassures them they made the right decision?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "onboarding",
    number: 7,
    label: "Onboarding",
    subtitle: "How you welcome and activate new clients",
    description:
      "They paid. Now the real relationship begins. Onboarding sets the tone for everything that follows.",
    fields: [
      {
        id: "onboarding_format",
        label: "Onboarding format",
        type: "select",
        options: [
          "Welcome email sequence",
          "Onboarding call",
          "Welcome video",
          "Onboarding document or guide",
          "Community or portal access",
          "Project kickoff meeting",
          "Other",
        ],
      },
      {
        id: "first_win",
        label: "First win delivered",
        type: "text",
        placeholder: "The first result or milestone they hit",
      },
      {
        id: "time_to_value",
        label: "Time to first value",
        type: "text",
        placeholder: "How long until they feel the benefit",
      },
    ],
    narrative: {
      label: "Describe the onboarding experience",
      placeholder:
        "Walk through the onboarding experience from the client's perspective. What happens in the first 24 hours, first week, first month? What makes them feel they are in good hands?",
      minLength: 30,
      maxLength: 600,
    },
  },
  {
    id: "retentionReferral",
    number: 8,
    label: "Retention and Referral",
    subtitle: "How clients stay and bring others",
    description:
      "The client got results. Now what keeps them, upgrades them, and turns them into advocates?",
    fields: [
      {
        id: "retention_mechanism",
        label: "Primary retention mechanism",
        type: "select",
        options: [
          "Ongoing results and check-ins",
          "Community membership",
          "Subscription or retainer",
          "Upgrade path to next offer",
          "Content that keeps them engaged",
          "Loyalty rewards or exclusives",
          "Other",
        ],
      },
      {
        id: "upgrade_path",
        label: "How clients upgrade or continue",
        type: "text",
        placeholder: "The path from one offer to the next",
      },
      {
        id: "referral_trigger",
        label: "How referrals happen",
        type: "text",
        placeholder: "What prompts clients to recommend you",
      },
    ],
    narrative: {
      label: "Describe the retention and referral experience",
      placeholder:
        "What keeps your best clients engaged after the initial offer is complete? How do they naturally move to the next level? What makes them tell others about you?",
      minLength: 30,
      maxLength: 600,
    },
  },
];

function buildEmptyData() {
  const out = {};
  for (const stage of STAGES) {
    const stageObj = { narrative: "" };
    for (const field of stage.fields) {
      stageObj[field.id] = "";
    }
    out[stage.id] = stageObj;
  }
  return out;
}

const EMPTY_DATA = buildEmptyData();

function normalizeResponse(response) {
  const source = response && typeof response === "object" ? response : {};
  const out = buildEmptyData();
  for (const stage of STAGES) {
    const incoming = source[stage.id];
    if (incoming && typeof incoming === "object") {
      out[stage.id].narrative =
        typeof incoming.narrative === "string" ? incoming.narrative : "";
      for (const field of stage.fields) {
        const val = incoming[field.id];
        out[stage.id][field.id] = typeof val === "string" ? val : "";
      }
    }
  }
  return out;
}

function buildPayload(data) {
  const out = {};
  for (const stage of STAGES) {
    const stageObj = { narrative: data[stage.id]?.narrative || "" };
    for (const field of stage.fields) {
      stageObj[field.id] = data[stage.id]?.[field.id] || "";
    }
    out[stage.id] = stageObj;
  }
  return out;
}

function getStageStatus(stageData, stage) {
  const narrative = (stageData?.narrative || "").trim();
  const structuredFilled = stage.fields.some(
    (field) => (stageData?.[field.id] || "").trim().length > 0
  );
  const hasNarrative = narrative.length >= stage.narrative.minLength;
  if (hasNarrative && structuredFilled) return "complete";
  if (narrative.length > 0 || structuredFilled) return "draft";
  return "empty";
}

function getScore(data) {
  const scores = STAGES.map((stage) => {
    const status = getStageStatus(data[stage.id], stage);
    if (status === "complete") return 1;
    if (status === "draft") return 0.5;
    return 0;
  });
  return Math.round((scores.reduce((s, v) => s + v, 0) / STAGES.length) * 100);
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

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const LOCKED_PLANS = new Set(["free", "audit", "foundation"]);

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

const INPUT_STYLE = {
  width: "100%",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 14,
  lineHeight: 1.5,
  padding: "10px 12px",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  outline: "none",
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

function StatusDot({ status }) {
  let fill = "var(--cth-command-muted)";
  if (status === "complete") fill = "var(--cth-status-success-bright)";
  else if (status === "draft") fill = "var(--cth-command-gold)";
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: 999,
        background: fill,
      }}
    />
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

function LockedView() {
  return (
    <DashboardLayout>
      <TopBar
        title="Customer Journey"
        subtitle="Map how your ideal client moves from stranger to buyer to advocate."
      />
      <div className="flex-1 overflow-auto" style={PAGE_STYLE}>
        <div className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
          <div style={{ ...CARD_STYLE, padding: 40, textAlign: "center" }}>
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center"
              style={{
                borderRadius: 999,
                background: "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)",
                color: "var(--cth-command-crimson)",
              }}
            >
              <Lock size={22} />
            </div>
            <p style={{ ...SECTION_LABEL_STYLE, marginTop: 18 }}>Structure Plan Required</p>
            <h2 style={{ ...FIELD_HEADING_STYLE, marginTop: 8 }}>Customer Journey</h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                lineHeight: 1.65,
                color: "var(--cth-command-muted)",
                margin: "14px auto 24px",
                maxWidth: 520,
              }}
            >
              Map how your ideal client moves from stranger to buyer to advocate.
              Define the touchpoints, content, and calls to action at every stage.
              Available on The Structure plan and above.
            </p>
            <a
              href="/billing"
              className="inline-flex items-center gap-2"
              style={PRIMARY_CTA_STYLE}
            >
              Upgrade to Structure
              <ChevronRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function CustomerJourney() {
  const { currentWorkspace } = useWorkspace();
  const { plan } = usePlan();

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || "";
  const normalizedPlan = String(plan || "free").toLowerCase();
  const isLocked = LOCKED_PLANS.has(normalizedPlan);

  const nextStep = getNextStep("/customer-journey", plan);
  const nextStepHref = nextStep?.upgradeTo ? "/billing" : nextStep?.href;
  const nextStepLabel = nextStep?.upgradeTo ? nextStep.ctaLabel : nextStep?.label;

  const [data, setData] = useState(EMPTY_DATA);
  const [activeStageId, setActiveStageId] = useState(STAGES[0].id);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [pendingStageSwitch, setPendingStageSwitch] = useState(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const saveTimeout = useRef(null);
  const narrativeRef = useRef(null);

  const activeStage = useMemo(
    () => STAGES.find((stage) => stage.id === activeStageId) || STAGES[0],
    [activeStageId]
  );
  const activeData = data[activeStage.id] || { narrative: "" };
  const activeStatus = getStageStatus(activeData, activeStage);
  const score = getScore(data);
  const completedCount = STAGES.filter(
    (stage) => getStageStatus(data[stage.id], stage) === "complete"
  ).length;

  useEffect(() => {
    async function load() {
      if (isLocked) {
        setIsLoading(false);
        return;
      }
      if (!workspaceId) {
        setIsLoading(false);
        setLoadError("No active workspace found.");
        return;
      }
      try {
        setIsLoading(true);
        setLoadError("");
        const response = await apiClient.get("/api/persist/customer-journey");
        setData(normalizeResponse(response));
      } catch (error) {
        console.error("Failed to load customer journey:", error);
        setLoadError(getErrorMessage(error, "Failed to load Customer Journey."));
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [workspaceId, isLocked]);

  useEffect(() => {
    if (narrativeRef.current) {
      narrativeRef.current.style.height = "auto";
      narrativeRef.current.style.height = `${Math.max(220, narrativeRef.current.scrollHeight)}px`;
    }
  }, [activeData.narrative, activeStage.id]);

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const persist = useCallback(async (updated) => {
    const payload = buildPayload(updated);
    await apiClient.post("/api/persist/customer-journey", payload);
  }, []);

  const scheduleSave = useCallback(
    (updated) => {
      setSaveState("saving");
      setSaveError("");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await persist(updated);
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
    },
    [persist]
  );

  const handleNarrativeChange = useCallback(
    (value) => {
      setData((prev) => {
        const updated = {
          ...prev,
          [activeStage.id]: { ...prev[activeStage.id], narrative: value },
        };
        setGeneratedPreview(null);
        scheduleSave(updated);
        return updated;
      });
    },
    [activeStage.id, scheduleSave]
  );

  const handleFieldChange = useCallback(
    (fieldId, value) => {
      setData((prev) => {
        const updated = {
          ...prev,
          [activeStage.id]: { ...prev[activeStage.id], [fieldId]: value },
        };
        setGeneratedPreview(null);
        scheduleSave(updated);
        return updated;
      });
    },
    [activeStage.id, scheduleSave]
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGeneratedPreview(null);
    setSaveError("");
    try {
      const structuredInputs = {};
      for (const field of activeStage.fields) {
        structuredInputs[field.id] = activeData[field.id] || "";
      }
      const response = await apiClient.post(
        "/api/persist/customer-journey/ai-assist",
        {
          stage_id: activeStage.id,
          structured_inputs: structuredInputs,
          narrative: activeData.narrative || "",
          workspace_id: workspaceId,
        }
      );

      const narrative = stripMarkdown(
        typeof response?.narrative === "string" ? response.narrative.trim() : ""
      );
      const structuredRaw =
        response?.structured && typeof response.structured === "object"
          ? response.structured
          : {};
      const structured = {};
      for (const field of activeStage.fields) {
        const value = structuredRaw[field.id];
        structured[field.id] = typeof value === "string" ? stripMarkdown(value) : "";
      }

      if (!narrative && !Object.values(structured).some((v) => v)) {
        setSaveError("No AI draft was returned.");
      } else {
        setGeneratedPreview({ narrative, structured });
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setSaveError(getErrorMessage(error, "AI generation failed."));
    } finally {
      setIsGenerating(false);
    }
  }, [activeStage, activeData, workspaceId]);

  const handleAcceptGenerated = useCallback(() => {
    if (!generatedPreview) return;
    setData((prev) => {
      const stageData = { ...prev[activeStage.id] };
      if (generatedPreview.narrative) {
        stageData.narrative = generatedPreview.narrative;
      }
      for (const field of activeStage.fields) {
        const suggestion = generatedPreview.structured?.[field.id];
        if (typeof suggestion === "string" && suggestion.trim()) {
          stageData[field.id] = suggestion;
        }
      }
      const updated = { ...prev, [activeStage.id]: stageData };
      scheduleSave(updated);
      return updated;
    });
    setGeneratedPreview(null);
  }, [generatedPreview, activeStage, scheduleSave]);

  const performStageSwitch = useCallback((stageId) => {
    setActiveStageId(stageId);
    setGeneratedPreview(null);
    setSaveError("");
    setSaveState("idle");
  }, []);

  const handleStageSwitch = useCallback(
    (stageId) => {
      if (generatedPreview && stageId !== activeStage.id) {
        setPendingStageSwitch(stageId);
        return;
      }
      performStageSwitch(stageId);
    },
    [generatedPreview, activeStage.id, performStageSwitch]
  );

  const confirmDiscardAndSwitch = useCallback(() => {
    if (pendingStageSwitch) {
      performStageSwitch(pendingStageSwitch);
    }
    setPendingStageSwitch(null);
  }, [pendingStageSwitch, performStageSwitch]);

  const cancelStageSwitch = useCallback(() => {
    setPendingStageSwitch(null);
  }, []);

  const stageIndex = STAGES.findIndex((stage) => stage.id === activeStage.id);
  const prevStage = stageIndex > 0 ? STAGES[stageIndex - 1] : null;
  const nextStageNav = stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : null;

  if (isLocked) {
    return <LockedView />;
  }

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
            Loading Customer Journey...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const narrativeLength = (activeData.narrative || "").length;

  return (
    <DashboardLayout>
      <TopBar
        title="Customer Journey"
        subtitle="Map how your ideal client moves from stranger to buyer to advocate across all 8 stages."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2" style={CARD_STYLE}>
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
                  Journey Score
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    color: "var(--cth-command-muted)",
                    marginTop: 2,
                  }}
                >
                  {completedCount}/{STAGES.length} stages complete
                </div>
              </div>
            </div>
          </div>
        }
      />

      <div
        className="flex-1 overflow-auto"
        style={PAGE_STYLE}
        data-testid="customer-journey-page"
      >
        {loadError ? (
          <div className="mx-auto mt-5 max-w-7xl px-4 md:px-8" style={{ fontFamily: SANS }}>
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
          <aside className="hidden w-72 shrink-0 md:block">
            <div className="sticky top-0 px-5 py-6">
              <div style={SECTION_LABEL_STYLE}>Journey Stages</div>

              <button
                type="button"
                onClick={() => setViewAllOpen(true)}
                data-testid="view-all-journey-btn"
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
                {STAGES.map((stage) => {
                  const status = getStageStatus(data[stage.id], stage);
                  const isActive = activeStage.id === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleStageSwitch(stage.id)}
                      data-testid={`stage-nav-${stage.id}`}
                      className="w-full px-4 py-3 text-left transition"
                      style={{
                        ...CARD_STYLE,
                        borderColor: isActive
                          ? "var(--cth-command-crimson)"
                          : "var(--cth-command-border)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            style={{
                              fontFamily: SANS,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: "0.12em",
                              color: "var(--cth-command-muted)",
                            }}
                          >
                            {String(stage.number).padStart(2, "0")}
                          </span>
                          <div
                            style={{
                              fontFamily: SANS,
                              fontSize: 13,
                              fontWeight: isActive ? 600 : 500,
                              color: "var(--cth-command-ink)",
                            }}
                          >
                            {stage.label}
                          </div>
                        </div>
                        <StatusDot status={status} />
                      </div>
                      <div
                        style={{
                          fontFamily: SANS,
                          fontSize: 11,
                          lineHeight: 1.5,
                          color: "var(--cth-command-muted)",
                          marginTop: 6,
                        }}
                      >
                        {stage.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 px-4 py-5 md:px-8 md:py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <div style={{ ...CARD_STYLE, padding: 28 }}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: 4,
                        background:
                          "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)",
                        color: "var(--cth-command-crimson)",
                        fontFamily: SANS,
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {String(activeStage.number).padStart(2, "0")}
                    </div>
                    <div>
                      <h2 style={FIELD_HEADING_STYLE}>{activeStage.label}</h2>
                      <p
                        style={{
                          fontFamily: SANS,
                          fontSize: 13,
                          color: "var(--cth-command-muted)",
                          margin: "4px 0 0",
                        }}
                      >
                        {activeStage.subtitle}
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

                <div style={{ ...CARD_STYLE, padding: 16, marginTop: 20 }}>
                  <p style={SECTION_LABEL_STYLE}>What this stage is</p>
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: "var(--cth-command-ink)",
                      margin: "8px 0 0",
                    }}
                  >
                    {activeStage.description}
                  </p>
                </div>

                {/* Structured fields */}
                <div className="mt-6">
                  <p style={SECTION_LABEL_STYLE}>Stage Details</p>
                  <div className="mt-3 space-y-4">
                    {activeStage.fields.map((field) => {
                      const value = activeData[field.id] || "";
                      return (
                        <div key={field.id}>
                          <label
                            style={{
                              display: "block",
                              fontFamily: SANS,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--cth-command-ink)",
                              marginBottom: 6,
                            }}
                          >
                            {field.label}
                          </label>
                          {field.type === "select" ? (
                            <select
                              value={value}
                              onChange={(event) => handleFieldChange(field.id, event.target.value)}
                              data-testid={`field-${activeStage.id}-${field.id}`}
                              style={INPUT_STYLE}
                            >
                              <option value="">Select...</option>
                              {field.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={value}
                              onChange={(event) => handleFieldChange(field.id, event.target.value)}
                              placeholder={field.placeholder}
                              data-testid={`field-${activeStage.id}-${field.id}`}
                              style={INPUT_STYLE}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Narrative */}
                <div className="mt-6">
                  <p style={SECTION_LABEL_STYLE}>Your Narrative</p>
                  <label
                    style={{
                      display: "block",
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--cth-command-ink)",
                      margin: "10px 0 8px",
                    }}
                  >
                    {activeStage.narrative.label}
                  </label>
                  <div className="relative" style={{ ...CARD_STYLE, overflow: "hidden" }}>
                    <textarea
                      ref={narrativeRef}
                      value={activeData.narrative || ""}
                      onChange={(event) => handleNarrativeChange(event.target.value)}
                      placeholder={activeStage.narrative.placeholder}
                      data-testid={`narrative-${activeStage.id}`}
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
                      maxLength={activeStage.narrative.maxLength}
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
                      {narrativeLength}/{activeStage.narrative.maxLength}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    data-testid="generate-stage-strategy-btn"
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
                        Generate Stage Strategy
                      </>
                    )}
                  </button>
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
                      AI Stage Strategy
                    </div>

                    {Object.values(generatedPreview.structured || {}).some((v) => v) ? (
                      <div className="mt-3 space-y-2">
                        <p style={SECTION_LABEL_STYLE}>Suggested stage details</p>
                        {activeStage.fields.map((field) => {
                          const suggestion = generatedPreview.structured?.[field.id] || "";
                          if (!suggestion) return null;
                          return (
                            <div key={field.id}>
                              <span
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "var(--cth-command-ink)",
                                }}
                              >
                                {field.label}:
                              </span>{" "}
                              <span
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 13,
                                  color: "var(--cth-command-ink)",
                                }}
                              >
                                {suggestion}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {generatedPreview.narrative ? (
                      <div className="mt-3">
                        <p style={SECTION_LABEL_STYLE}>Suggested narrative</p>
                        <p
                          style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: SANS,
                            fontSize: 14,
                            lineHeight: 1.65,
                            color: "var(--cth-command-ink)",
                            margin: "8px 0 0",
                          }}
                        >
                          {generatedPreview.narrative}
                        </p>
                      </div>
                    ) : null}

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

                {/* Stage navigation */}
                <div
                  className="mt-6 flex items-center justify-between pt-5"
                  style={{ borderTop: "1px solid var(--cth-command-border)" }}
                >
                  <button
                    onClick={() => prevStage && handleStageSwitch(prevStage.id)}
                    disabled={!prevStage}
                    data-testid="prev-stage-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "none",
                      cursor: prevStage ? "pointer" : "default",
                      opacity: prevStage ? 1 : 0.25,
                      fontFamily: SANS,
                      fontSize: 13,
                      color: "var(--cth-command-muted)",
                      padding: 0,
                    }}
                  >
                    <ChevronLeft size={16} />
                    {prevStage?.label || "Previous"}
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
                    {stageIndex + 1} of {STAGES.length}
                  </span>

                  <button
                    onClick={() => nextStageNav && handleStageSwitch(nextStageNav.id)}
                    disabled={!nextStageNav}
                    data-testid="next-stage-btn"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: "none",
                      border: "none",
                      cursor: nextStageNav ? "pointer" : "default",
                      opacity: nextStageNav ? 1 : 0.25,
                      fontFamily: SANS,
                      fontSize: 13,
                      color: "var(--cth-command-muted)",
                      padding: 0,
                    }}
                  >
                    {nextStageNav?.label || "Next"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

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

      {/* Unsaved AI Draft confirmation */}
      {pendingStageSwitch ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unsaved AI Draft"
          onClick={cancelStageSwitch}
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
            style={{ ...CARD_STYLE, width: "100%", maxWidth: 480, padding: 28 }}
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
              You have an AI-generated draft that has not been accepted. Leaving this stage will discard it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelStageSwitch}
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

      {/* View All drawer */}
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
          aria-label="Customer Journey Stages"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 520,
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
              Customer Journey
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
            <div className="space-y-6">
              {STAGES.map((stage) => {
                const stageData = data[stage.id] || { narrative: "" };
                const status = getStageStatus(stageData, stage);
                const narrative = (stageData.narrative || "").trim();
                return (
                  <div key={stage.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            fontFamily: SANS,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "var(--cth-command-muted)",
                          }}
                        >
                          {String(stage.number).padStart(2, "0")}
                        </span>
                        <p style={SECTION_LABEL_STYLE}>{stage.label}</p>
                      </div>
                      <StatusDot status={status} />
                    </div>
                    <div className="mt-3 space-y-1">
                      {stage.fields.map((field) => {
                        const value = (stageData[field.id] || "").trim();
                        return (
                          <div
                            key={field.id}
                            style={{
                              fontFamily: SANS,
                              fontSize: 12,
                              color: value ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
                              fontStyle: value ? "normal" : "italic",
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{field.label}:</span>{" "}
                            {value || "Not set"}
                          </div>
                        );
                      })}
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        fontFamily: SANS,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: narrative ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
                        fontStyle: narrative ? "normal" : "italic",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {narrative || "No narrative yet"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--cth-command-border)" }}>
            {completedCount === STAGES.length && nextStep ? (
              <a
                href={nextStepHref}
                style={{ ...PRIMARY_CTA_STYLE, width: "100%", justifyContent: "center" }}
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
