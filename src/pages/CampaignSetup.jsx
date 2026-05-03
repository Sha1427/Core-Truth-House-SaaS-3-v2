import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useUser } from "../hooks/useAuth";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import StrategyStep from "../components/campaign/StrategyStep";
import StructureStep from "../components/campaign/StructureStep";
import DistributionStep from "../components/campaign/DistributionStep";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const DRAFT_KEY = "cth.campaign-setup.draft";
const DRAFT_STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

const STEPS = [
  { num: 1, label: "Strategy" },
  { num: 2, label: "Structure" },
  { num: 3, label: "Distribution" },
];

// Wizard convention: form state may contain UI-only fields (campaign_kind,
// lead_magnet_name, lead_magnet_description) that survive step navigation
// but don't map to CampaignCreate. buildPayload() strips them and combines
// where needed. Add new UI-only fields to the destructure below when
// introducing them. See cleanup_wizard_ui_field_convention.md.
const INITIAL_FORM = {
  name: "",
  goal: "",
  avatar_id: "",
  emotional_hook: "",
  promise: "",
  offer_name: "",
  offer_description: "",
  transformation: "",
  price: null,
  urgency_trigger: "",
  cta_primary: "",
  funnel_destination: "",
  campaign_kind: "",
  lead_magnet_name: "",
  lead_magnet_description: "",
  platforms: [],
  duration_days: null,
  phase_timeline: [],
  start_date: "",
};

function buildPayload(form, userId, workspaceId) {
  const { campaign_kind, lead_magnet_name, lead_magnet_description, ...rest } =
    form;

  const lead_magnet_idea =
    campaign_kind === "lead_magnet"
      ? `${lead_magnet_name}: ${lead_magnet_description}`
      : "";

  const payload = {
    ...rest,
    lead_magnet_idea,
    user_id: userId,
    workspace_id: workspaceId,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === null) delete payload[key];
  });

  return payload;
}

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const BODY_WRAP_STYLE = {
  padding: "28px 24px 96px",
  maxWidth: 920,
  margin: "0 auto",
  fontFamily: SANS,
};

const PROGRESS_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 0,
  marginBottom: 40,
};

const PROGRESS_NODE_STYLE = (active, complete, clickable) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  background: "transparent",
  border: "none",
  padding: 4,
  cursor: clickable ? "pointer" : "default",
  opacity: clickable || active || complete ? 1 : 0.5,
  outline: "none",
  fontFamily: SANS,
});

const PROGRESS_CIRCLE_STYLE = (active, complete) => ({
  width: 36,
  height: 36,
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 600,
  border: complete
    ? "1px solid var(--cth-command-crimson)"
    : active
    ? "1px solid var(--cth-command-gold)"
    : "1px solid var(--cth-command-border)",
  background: complete
    ? "var(--cth-command-crimson)"
    : active
    ? "var(--cth-command-gold)"
    : "var(--cth-command-panel)",
  color: complete
    ? "#fff"
    : active
    ? "var(--cth-command-purple)"
    : "var(--cth-command-muted)",
  transition: "background-color 200ms ease, border-color 200ms ease",
});

const PROGRESS_LABEL_STYLE = (active) => ({
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: active ? 600 : 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: active ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
});

const PROGRESS_CONNECTOR_STYLE = (passed) => ({
  flex: 1,
  height: 1,
  background: passed
    ? "var(--cth-command-crimson)"
    : "var(--cth-command-border)",
  margin: "0 8px",
  marginBottom: 24,
  transition: "background-color 200ms ease",
});

const STEP_CONTAINER_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 6,
  padding: "32px 28px",
};

const FOOTER_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: 24,
};

const PRIMARY_BUTTON_STYLE = (disabled) => ({
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 999,
  padding: "12px 24px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: disabled ? "not-allowed" : "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  opacity: disabled ? 0.5 : 1,
});

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const TOPBAR_CANCEL_STYLE = {
  background: "transparent",
  color: "var(--cth-command-muted)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "8px 14px",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const PAGE_LOADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
};

const RESTORED_BANNER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 24,
  padding: "16px 20px",
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-gold)",
  borderRadius: 6,
  flexWrap: "wrap",
};

const BANNER_TEXT_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  minWidth: 0,
  flex: "1 1 320px",
};

const BANNER_HEADING_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--cth-command-purple)",
  margin: 0,
};

const BANNER_BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: "var(--cth-command-ink)",
  margin: 0,
  lineHeight: 1.55,
};

const BANNER_BUTTONS_STYLE = {
  display: "flex",
  gap: 10,
  flexShrink: 0,
};

const BANNER_DISMISS_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "8px 16px",
  fontFamily: SANS,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: "pointer",
};

const BANNER_START_FRESH_STYLE = {
  background: "var(--cth-command-crimson)",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "9px 17px",
  fontFamily: SANS,
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
};

function ProgressIndicator({ currentStep, stepValidity, onStepClick }) {
  return (
    <div style={PROGRESS_STYLE}>
      {STEPS.map((step, i) => {
        const isActive = currentStep === step.num;
        const isComplete = stepValidity[step.num] && currentStep > step.num;
        const canClick =
          step.num < currentStep ||
          (step.num > currentStep &&
            STEPS.slice(0, step.num - 1).every(
              (s) => stepValidity[s.num] === true
            ));

        return (
          <Fragment key={step.num}>
            <button
              type="button"
              onClick={() => canClick && onStepClick(step.num)}
              disabled={!canClick && !isActive}
              aria-current={isActive ? "step" : undefined}
              style={PROGRESS_NODE_STYLE(isActive, isComplete, canClick)}
            >
              <span style={PROGRESS_CIRCLE_STYLE(isActive, isComplete)}>
                {isComplete ? <Check size={16} /> : step.num}
              </span>
              <span style={PROGRESS_LABEL_STYLE(isActive)}>{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div style={PROGRESS_CONNECTOR_STYLE(stepValidity[step.num])} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

const MODAL_BACKDROP_STYLE = {
  position: "fixed",
  inset: 0,
  background: "rgba(51, 3, 60, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 1000,
};

const MODAL_PANEL_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 6,
  width: "100%",
  maxWidth: 460,
  padding: "28px 28px 24px",
  fontFamily: SANS,
  boxShadow: "0 18px 48px rgba(51, 3, 60, 0.28)",
};

const MODAL_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.25,
};

const MODAL_BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13.5,
  lineHeight: 1.6,
  color: "var(--cth-command-muted)",
  margin: "12px 0 24px 0",
};

const MODAL_BUTTON_ROW_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

const MODAL_CANCEL_BUTTON_STYLE = {
  ...SECONDARY_BUTTON_STYLE,
  padding: "10px 20px",
};

const MODAL_DISCARD_BUTTON_STYLE = {
  background: "var(--cth-command-crimson)",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "11px 22px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

function CancelModal({ onCancel, onConfirm }) {
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => cancelBtnRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const active = document.activeElement;
      if (e.shiftKey && active === cancelBtnRef.current) {
        e.preventDefault();
        confirmBtnRef.current?.focus();
      } else if (!e.shiftKey && active === confirmBtnRef.current) {
        e.preventDefault();
        cancelBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-campaign-heading"
      onClick={handleBackdrop}
      style={MODAL_BACKDROP_STYLE}
    >
      <div onClick={(e) => e.stopPropagation()} style={MODAL_PANEL_STYLE}>
        <h2 id="cancel-campaign-heading" style={MODAL_HEADING_STYLE}>
          Discard this campaign?
        </h2>
        <p style={MODAL_BODY_STYLE}>
          Unsaved changes will be lost. Your draft will be cleared.
        </p>
        <div style={MODAL_BUTTON_ROW_STYLE}>
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            style={MODAL_CANCEL_BUTTON_STYLE}
          >
            Keep editing
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            style={MODAL_DISCARD_BUTTON_STYLE}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CampaignSetup() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeWorkspaceId } = useWorkspace();

  const userId = user?.id || "";

  const [form, setForm] = useState(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidity, setStepValidity] = useState({
    1: false,
    2: false,
    3: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRestoredBanner, setShowRestoredBanner] = useState(false);

  const draftRestoredRef = useRef(false);

  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== "object" || !draft.form) return;

      // Discard drafts older than DRAFT_STALE_MS — silent (no banner, no toast).
      if (typeof draft.savedAt === "number" && Date.now() - draft.savedAt > DRAFT_STALE_MS) {
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
        return;
      }

      setForm((prev) => ({ ...prev, ...draft.form }));
      setShowRestoredBanner(true);
    } catch {
      // ignore unparsable drafts
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, savedAt: Date.now() }));
      } catch {
        // quota / private mode — silently ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [form]);

  const patchForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const setValid1 = useCallback(
    (v) =>
      setStepValidity((prev) => (prev[1] === v ? prev : { ...prev, 1: v })),
    []
  );
  const setValid2 = useCallback(
    (v) =>
      setStepValidity((prev) => (prev[2] === v ? prev : { ...prev, 2: v })),
    []
  );
  const setValid3 = useCallback(
    (v) =>
      setStepValidity((prev) => (prev[3] === v ? prev : { ...prev, 3: v })),
    []
  );

  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const goNext = () => {
    if (!stepValidity[currentStep]) return;
    setCurrentStep((s) => Math.min(3, s + 1));
  };

  const goToStep = (n) => {
    if (n === currentStep) return;
    if (n < currentStep) {
      setCurrentStep(n);
      return;
    }
    for (let i = 1; i < n; i++) {
      if (!stepValidity[i]) return;
    }
    setCurrentStep(n);
  };

  const handleCancelConfirm = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setShowCancelModal(false);
    navigate("/campaign-builder");
  };

  const handleStartFresh = () => {
    setForm(INITIAL_FORM);
    setCurrentStep(1);
    setStepValidity({ 1: false, 2: false, 3: false });
    setShowRestoredBanner(false);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const handleDismissBanner = () => {
    setShowRestoredBanner(false);
  };

  const handleCreate = async () => {
    if (!stepValidity[1] || !stepValidity[2] || !stepValidity[3]) return;
    if (!userId || !activeWorkspaceId) {
      toast.error("Missing user or workspace context.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = buildPayload(form, userId, activeWorkspaceId);
      const res = await apiClient.post("/api/campaigns", payload);
      const newId = res?.id;
      if (!newId) throw new Error("Create response missing campaign id.");
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      toast.success("Campaign created.");
      navigate(`/campaign-builder?id=${encodeURIComponent(newId)}`);
    } catch (err) {
      toast.error(err?.message || "Failed to create campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelAction = (
    <button
      type="button"
      onClick={() => setShowCancelModal(true)}
      style={TOPBAR_CANCEL_STYLE}
    >
      <X size={14} />
      Cancel
    </button>
  );

  if (!activeWorkspaceId) {
    return (
      <DashboardLayout>
        <TopBar
          title="Create Campaign"
          subtitle="Three steps: Strategy, Structure, Distribution."
          action={cancelAction}
        />
        <div style={PAGE_STYLE}>
          <div style={PAGE_LOADER_STYLE}>
            <Loader2
              size={28}
              className="animate-spin"
              style={{ color: "var(--cth-command-purple)" }}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Create Campaign"
        subtitle="Three steps: Strategy, Structure, Distribution."
        action={cancelAction}
      />
      <div style={PAGE_STYLE}>
        <div style={BODY_WRAP_STYLE}>
          {showRestoredBanner && (
            <div style={RESTORED_BANNER_STYLE}>
              <div style={BANNER_TEXT_STYLE}>
                <p style={BANNER_HEADING_STYLE}>Draft restored</p>
                <p style={BANNER_BODY_STYLE}>
                  We restored an unsaved draft from a previous session.
                  Review the fields before continuing, or start fresh to
                  discard the draft.
                </p>
              </div>
              <div style={BANNER_BUTTONS_STYLE}>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  style={BANNER_DISMISS_STYLE}
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={handleStartFresh}
                  style={BANNER_START_FRESH_STYLE}
                >
                  Start fresh
                </button>
              </div>
            </div>
          )}

          <ProgressIndicator
            currentStep={currentStep}
            stepValidity={stepValidity}
            onStepClick={goToStep}
          />

          <div style={STEP_CONTAINER_STYLE}>
            {currentStep === 1 && (
              <StrategyStep
                value={form}
                onChange={patchForm}
                onValidityChange={setValid1}
              />
            )}
            {currentStep === 2 && (
              <StructureStep
                value={form}
                onChange={patchForm}
                onValidityChange={setValid2}
              />
            )}
            {currentStep === 3 && (
              <DistributionStep
                value={form}
                onChange={patchForm}
                onValidityChange={setValid3}
              />
            )}
          </div>

          <div style={FOOTER_STYLE}>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={goBack}
                style={SECONDARY_BUTTON_STYLE}
              >
                <ArrowLeft size={14} />
                Back
              </button>
            ) : null}
            <div style={{ flex: 1 }} />
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!stepValidity[currentStep]}
                style={PRIMARY_BUTTON_STYLE(!stepValidity[currentStep])}
              >
                Next
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                disabled={!stepValidity[3] || isSubmitting}
                style={PRIMARY_BUTTON_STYLE(
                  !stepValidity[3] || isSubmitting
                )}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                {isSubmitting ? "Creating…" : "Create Campaign"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showCancelModal && (
        <CancelModal
          onCancel={() => setShowCancelModal(false)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </DashboardLayout>
  );
}
