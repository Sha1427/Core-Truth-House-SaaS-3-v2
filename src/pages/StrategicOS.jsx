import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useAuth } from "@clerk/react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";
import { StrategicOSExportButton } from "../components/shared/StrategicOSExport";
import { OS_STEP_INPUTS, validateStepInputs } from "../lib/os-step-inputs";

const WORKFLOW_BASE = "/api/os-workflow";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
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
  fontSize: 24,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: "8px 0 0",
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
};

const SUBHEAD_STYLE = {
  fontFamily: SERIF,
  fontSize: 16,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.3,
};

const BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--cth-command-ink)",
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.55,
  color: "var(--cth-command-muted)",
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  display: "block",
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "var(--cth-command-ink)",
  margin: 0,
};

const INPUT_STYLE = {
  width: "100%",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 12px",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  minHeight: 92,
  padding: "10px 12px",
  lineHeight: 1.55,
  resize: "vertical",
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 4,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 14px",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const GENERATE_PAGE_BUTTON_STYLE = {
  background: "var(--cth-command-crimson)",
  color: "var(--cth-command-ivory)",
  border: "none",
  borderRadius: 4,
  padding: "12px 22px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const GENERATE_MODAL_BUTTON_STYLE = {
  background: "var(--cth-command-crimson)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 4,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const DESTRUCTIVE_BUTTON_STYLE = {
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
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const MODAL_OUTLINE_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

function Modal({ open, onClose, ariaLabel, children }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
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
        {children}
      </div>
    </div>
  );
}

function SidebarStatusIcon({ status }) {
  if (status === "complete") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" aria-label="Complete" role="img">
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
  if (status === "inProgress") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" aria-label="In progress" role="img">
        <circle cx="8" cy="8" r="6" stroke="var(--cth-command-gold)" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="2.5" fill="var(--cth-command-gold)" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-label="Not started" role="img">
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="rgba(248, 244, 242, 0.5)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function getStepStatus(step, inputs = {}) {
  const stepInputs = inputs || {};
  const missing = getRequiredMissing(step, stepInputs);
  if (missing.length === 0) return "complete";
  const hasAny = Object.values(stepInputs).some((v) => {
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return v != null && v !== "";
  });
  return hasAny ? "inProgress" : "notStarted";
}

function getStepNumber(step) {
  return Number(step.stepNumber || step.n || 0);
}

function getRequiredMissing(step, inputs = {}) {
  return validateStepInputs(getStepNumber(step), inputs || {});
}

function isStepComplete(step, inputs = {}) {
  return getRequiredMissing(step, inputs).length === 0;
}

function stripInlineMarkdown(text) {
  return String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*])\*([^*\s][^*]*[^*\s]|[^*\s])\*(?!\*)/g, "$1$2")
    .replace(/(^|[^_])_([^_\s][^_]*[^_\s]|[^_\s])_(?!_)/g, "$1$2")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseReportToSections(text) {
  if (!text) return [];

  const lines = String(text).split("\n");
  const rawSections = [];
  let current = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (/^#{1,3}\s+/.test(trimmed)) {
      if (current) rawSections.push(current);
      const heading = stripInlineMarkdown(trimmed.replace(/^#{1,3}\s+/, ""));
      current = { heading, lines: [] };
    } else {
      if (!current) {
        current = { heading: "Overview", lines: [] };
      }
      current.lines.push(trimmed);
    }
  }
  if (current) rawSections.push(current);

  return rawSections.map((section) => {
    const blocks = [];
    let listBuf = null;
    let paraBuf = [];

    const flushPara = () => {
      if (paraBuf.length > 0) {
        blocks.push({ type: "paragraph", text: stripInlineMarkdown(paraBuf.join(" ")) });
        paraBuf = [];
      }
    };
    const flushList = () => {
      if (listBuf && listBuf.length > 0) {
        blocks.push({ type: "list", items: listBuf.map(stripInlineMarkdown) });
        listBuf = null;
      }
    };

    for (const line of section.lines) {
      if (line === "") {
        flushPara();
        flushList();
      } else if (/^[-•*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        flushPara();
        if (!listBuf) listBuf = [];
        listBuf.push(line.replace(/^[-•*]\s+/, "").replace(/^\d+\.\s+/, ""));
      } else if (/^---+$/.test(line)) {
        flushPara();
        flushList();
      } else {
        flushList();
        paraBuf.push(line);
      }
    }
    flushPara();
    flushList();

    return { heading: section.heading, blocks };
  });
}

function formatGeneratedDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeInputs(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function stableStringify(value) {
  return JSON.stringify(value || {}, Object.keys(value || {}).sort());
}

function buildAnswersHash(stepState) {
  const payload = OS_STEP_INPUTS.map((step) => {
    const stepNumber = getStepNumber(step);
    return {
      step_number: stepNumber,
      step_inputs: normalizeInputs(stepState?.[stepNumber]?.inputs),
    };
  });

  return stableStringify(payload);
}

function renderMarkdown(markdown = "") {
  return DOMPurify.sanitize(marked.parse(String(markdown || "")));
}

function StepField({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <textarea
        style={{ ...TEXTAREA_STYLE, marginTop: 8 }}
        value={value || ""}
        placeholder={field.placeholder || ""}
        maxLength={field.maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        style={{ ...INPUT_STYLE, marginTop: 8 }}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an option</option>
        {(field.options || []).map((option) => {
          const optionValue = option.value || option;
          return (
            <option key={optionValue} value={optionValue}>
              {option.label || option}
            </option>
          );
        })}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];

    return (
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {(field.options || []).map((option) => {
          const optionValue = option.value || option;
          const checked = selected.includes(optionValue);

          return (
            <label
              key={optionValue}
              className="flex cursor-pointer items-start gap-2 px-3 py-2"
              style={{
                background: checked
                  ? "color-mix(in srgb, var(--cth-command-crimson) 8%, var(--cth-command-panel))"
                  : "var(--cth-command-panel)",
                border: `1px solid ${checked ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
                borderRadius: 4,
                fontFamily: SANS,
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, optionValue]
                    : selected.filter((item) => item !== optionValue);
                  onChange(next);
                }}
              />
              <span style={{ color: "var(--cth-command-ink)", lineHeight: 1.55 }}>
                {option.label || option}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <input
      style={{ ...INPUT_STYLE, marginTop: 8 }}
      value={value || ""}
      placeholder={field.placeholder || ""}
      maxLength={field.maxLength}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function StepCard({ id, step, values, expanded, saving, onToggle, onChange }) {
  const stepNumber = getStepNumber(step);
  const missing = getRequiredMissing(step, values);
  const complete = missing.length === 0;

  return (
    <div
      id={id}
      style={{
        ...CARD_STYLE,
        overflow: "hidden",
        scrollMarginTop: 16,
        borderColor: complete
          ? "var(--cth-status-success-bright)"
          : expanded
          ? "var(--cth-command-crimson)"
          : "var(--cth-command-border)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
        style={{
          background: "transparent",
          border: "none",
          padding: "16px 20px",
          cursor: "pointer",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center"
            style={{
              borderRadius: 4,
              background: complete
                ? "color-mix(in srgb, var(--cth-status-success-bright) 14%, transparent)"
                : "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)",
              color: complete
                ? "var(--cth-status-success-bright)"
                : "var(--cth-command-crimson)",
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {complete ? <CheckCircle2 size={18} /> : stepNumber}
          </div>

          <div className="min-w-0">
            <p style={SECTION_LABEL_STYLE}>Step {stepNumber}</p>
            <h3 style={{ ...SUBHEAD_STYLE, marginTop: 4 }}>{step.stepName}</h3>
            <p style={{ ...MUTED_STYLE, marginTop: 4 }}>{step.description}</p>
          </div>
        </div>

        {expanded ? (
          <ChevronDown size={18} style={{ color: "var(--cth-command-muted)" }} />
        ) : (
          <ChevronRight size={18} style={{ color: "var(--cth-command-muted)" }} />
        )}
      </button>

      {expanded ? (
        <div
          className="md:p-5"
          style={{
            borderTop: "1px solid var(--cth-command-border)",
            padding: 16,
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p style={SECTION_LABEL_STYLE}>Founder answers</p>
              <p style={{ ...MUTED_STYLE, marginTop: 4 }}>
                Editable forever. These save without using AI credits.
              </p>
            </div>

            <div
              className="inline-flex items-center gap-2"
              style={{
                border: "1px solid var(--cth-command-border)",
                borderRadius: 4,
                padding: "6px 12px",
                fontFamily: SANS,
                fontSize: 11,
                color: "var(--cth-command-muted)",
              }}
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              <span>{saving ? "Saving..." : "Autosaved"}</span>
            </div>
          </div>

          <div className="grid gap-4">
            {(step.fields || []).map((field, index) => {
              const value = values?.[field.id];

              return (
                <div key={field.id} className="strategic-os-question-field">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                      style={{
                        borderRadius: 4,
                        background: "var(--cth-command-crimson)",
                        color: "var(--cth-command-panel)",
                        fontFamily: SANS,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <label style={FIELD_LABEL_STYLE}>
                        {field.label}
                        {field.required ? (
                          <span style={{ color: "var(--cth-command-crimson)" }}> *</span>
                        ) : null}
                      </label>

                      {field.helpText ? (
                        <p style={{ ...MUTED_STYLE, marginTop: 4 }}>{field.helpText}</p>
                      ) : null}

                      <StepField
                        field={field}
                        value={value}
                        onChange={(nextValue) => onChange(stepNumber, field.id, nextValue)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!complete ? (
            <div
              className="mt-4"
              style={{
                ...CARD_STYLE,
                background: "var(--cth-command-panel-soft)",
                padding: 12,
                fontFamily: SANS,
                fontSize: 12,
                color: "var(--cth-command-muted)",
              }}
            >
              Complete the required questions in this step to move the OS closer to report generation.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReportPanel({ id, report, status, version, onGenerate, generating, canGenerate, needsUpdate, onViewReport }) {
  const hasReport = Boolean(report);

  return (
    <div id={id} style={{ ...CARD_STYLE, padding: 24, scrollMarginTop: 16 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p style={SECTION_LABEL_STYLE}>Strategic OS Report</p>
          <h2 style={SECTION_HEADING_STYLE}>
            {hasReport ? `Report Version ${version || 1}` : "Generate your full Strategic OS report"}
          </h2>
          <p style={{ ...MUTED_STYLE, marginTop: 12, maxWidth: 640 }}>
            Your answers can change as the brand grows. AI credits are only used when you generate or update the full report.
          </p>
        </div>

        <button
          type="button"
          disabled={!canGenerate || generating}
          onClick={onGenerate}
          style={{
            ...GENERATE_PAGE_BUTTON_STYLE,
            opacity: !canGenerate || generating ? 0.6 : 1,
            cursor: !canGenerate || generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {hasReport ? "Generate Updated Report" : "Generate Strategic OS Report"}
        </button>
      </div>

      {needsUpdate ? (
        <div
          className="mt-4"
          style={{
            ...CARD_STYLE,
            borderColor: "var(--cth-command-crimson)",
            background: "color-mix(in srgb, var(--cth-command-crimson) 8%, var(--cth-command-panel))",
            padding: 14,
          }}
        >
          <p style={{ ...BODY_STYLE, fontWeight: 600 }}>Your answers changed.</p>
          <p style={{ ...MUTED_STYLE, marginTop: 4 }}>
            The saved report is now out of date. Regenerate only when you are ready to spend AI credits.
          </p>
        </div>
      ) : null}

      {!canGenerate ? (
        <div
          className="mt-4"
          style={{
            ...CARD_STYLE,
            background: "var(--cth-command-panel-soft)",
            padding: 14,
            fontFamily: SANS,
            fontSize: 13,
            color: "var(--cth-command-muted)",
          }}
        >
          Complete all required questions across the 9 steps to unlock report generation.
        </div>
      ) : null}

      {hasReport ? (
        <div
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          style={{
            ...CARD_STYLE,
            background: "var(--cth-command-panel-soft)",
            padding: 20,
          }}
        >
          <div>
            <p style={SECTION_LABEL_STYLE}>Report Ready</p>
            <p style={{ ...BODY_STYLE, marginTop: 6, maxWidth: 480 }}>
              Open the structured report in a focused side panel.
            </p>
          </div>
          <button
            type="button"
            onClick={onViewReport}
            data-testid="view-full-report-btn"
            className="shrink-0"
            style={PRIMARY_CTA_STYLE}
          >
            View Full Report
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function StrategicOS() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [workflowId, setWorkflowId] = useState("");
  const [workflow, setWorkflow] = useState(null);
  const [expandedStep, setExpandedStep] = useState(1);
  const [stepState, setStepState] = useState({});
  const [savingStep, setSavingStep] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState("");
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  const [confirmRefreshOpen, setConfirmRefreshOpen] = useState(false);
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);

  const saveTimers = useRef({});

  const hydrateStepState = useCallback((workflowDoc) => {
    const nextState = {};

    OS_STEP_INPUTS.forEach((step) => {
      const stepNumber = getStepNumber(step);
      const backendStep = (workflowDoc?.steps || []).find(
        (item) => Number(item.step_number || item.n) === stepNumber
      );

      nextState[stepNumber] = {
        inputs: normalizeInputs(
          backendStep?.step_inputs ||
            backendStep?.inputs ||
            backendStep?.founder_answers ||
            backendStep?.answers ||
            {}
        ),
      };
    });

    setStepState(nextState);
  }, []);

  const loadWorkflow = useCallback(
    async (id) => {
      if (!id) return;

      const query = new URLSearchParams({
        user_id: userId || "default",
        ...(activeWorkspaceId ? { workspace_id: activeWorkspaceId } : {}),
      }).toString();

      const res = await apiClient.get(`${API_PATHS.osWorkflow.workflowById(id)}?${query}`);

      setWorkflow(res);
      setWorkflowId(id);
      hydrateStepState(res);
    },
    [activeWorkspaceId, hydrateStepState, userId]
  );

  const findExistingWorkflowId = useCallback((payload) => {
    if (!payload) return "";
    if (typeof payload.workflow_id === "string" && payload.workflow_id) return payload.workflow_id;
    if (typeof payload.active_workflow_id === "string" && payload.active_workflow_id) return payload.active_workflow_id;
    if (Array.isArray(payload.workflows) && payload.workflows.length > 0) return payload.workflows[0]?.id || "";
    return "";
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const sharedParams = {
        params: {
          user_id: userId,
          workspace_id: activeWorkspaceId,
        },
      };

      const [readinessRes, workflowsRes] = await Promise.all([
        apiClient.get(API_PATHS.osWorkflow.readiness, sharedParams),
        userId
          ? apiClient.get(WORKFLOW_BASE, {
              params: {
                user_id: userId,
                workspace_id: activeWorkspaceId,
              },
            })
          : Promise.resolve({ workflows: [] }),
      ]);

      const existingWorkflowId =
        findExistingWorkflowId(readinessRes) || findExistingWorkflowId(workflowsRes);

      if (existingWorkflowId) {
        await loadWorkflow(existingWorkflowId);
      } else {
        setWorkflow(null);
        setWorkflowId("");
        hydrateStepState(null);
      }
    } catch (err) {
      console.error("Failed to load Strategic OS", err);
      setError(err?.message || "Unable to load Strategic OS.");
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, findExistingWorkflowId, hydrateStepState, loadWorkflow, userId]);

  useEffect(() => {
    loadPage();

    return () => {
      Object.values(saveTimers.current || {}).forEach((timer) => clearTimeout(timer));
    };
  }, [loadPage]);

  const ensureWorkflow = async () => {
    if (workflowId) return workflowId;

    if (!userId) {
      throw new Error("You must be signed in to create a Strategic OS workflow.");
    }

    setCreatingWorkflow(true);

    try {
      const res = await apiClient.post(WORKFLOW_BASE, {
        user_id: userId,
        workspace_id: activeWorkspaceId || undefined,
        workflow_type: "FULL_OS",
      });

      const createdId = res?.workflow?.id || res?.id || "";
      if (!createdId) {
        throw new Error("Workflow was created, but no workflow id was returned.");
      }

      setWorkflowId(createdId);
      await loadWorkflow(createdId);
      return createdId;
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const saveStepAnswers = async (targetWorkflowId, stepNumber, inputs) => {
    setSavingStep(stepNumber);

    try {
      const res = await apiClient.post(`${WORKFLOW_BASE}/${targetWorkflowId}/step/${stepNumber}/answers`, {
        user_id: userId,
        workspace_id: activeWorkspaceId || undefined,
        step_inputs: inputs,
      });

      setWorkflow((current) => ({
        ...(current || {}),
        answers_hash: res?.answers_hash || current?.answers_hash,
        report_status: res?.report_status || current?.report_status,
      }));
    } catch (err) {
      console.error(`Failed to autosave Strategic OS step ${stepNumber}`, err);
      setError(err?.message || `Failed to save Step ${stepNumber}.`);
    } finally {
      setSavingStep(null);
    }
  };

  const updateStepInput = async (stepNumber, fieldId, value) => {
    setError("");

    let nextInputs = {};

    setStepState((current) => {
      nextInputs = {
        ...(current[stepNumber]?.inputs || {}),
        [fieldId]: value,
      };

      return {
        ...current,
        [stepNumber]: {
          ...current[stepNumber],
          inputs: nextInputs,
        },
      };
    });

    const targetWorkflowId = await ensureWorkflow();

    if (saveTimers.current[stepNumber]) {
      clearTimeout(saveTimers.current[stepNumber]);
    }

    saveTimers.current[stepNumber] = setTimeout(() => {
      saveStepAnswers(targetWorkflowId, stepNumber, nextInputs);
    }, 700);
  };

  const completion = useMemo(() => {
    const completed = OS_STEP_INPUTS.filter((step) =>
      isStepComplete(step, stepState[getStepNumber(step)]?.inputs || {})
    ).length;

    return {
      completed,
      total: OS_STEP_INPUTS.length,
      percent: Math.round((completed / OS_STEP_INPUTS.length) * 100),
      allComplete: completed === OS_STEP_INPUTS.length,
    };
  }, [stepState]);

  const localAnswersHash = useMemo(() => buildAnswersHash(stepState), [stepState]);
  const lastGeneratedHash = workflow?.last_generated_answers_hash || "";
  const hasReport = Boolean(workflow?.strategic_report);
  const needsUpdate = Boolean(hasReport && lastGeneratedHash && localAnswersHash !== lastGeneratedHash);

  const completedStepsForExport = useMemo(() => {
    return Object.fromEntries(
      OS_STEP_INPUTS.map((step) => {
        const stepNumber = getStepNumber(step);
        return [
          stepNumber,
          {
            inputs: stepState[stepNumber]?.inputs || {},
            completed: isStepComplete(step, stepState[stepNumber]?.inputs || {}),
          },
        ];
      })
    );
  }, [stepState]);

  const generateReport = async () => {
    setError("");
    setGeneratingReport(true);

    try {
      if (!completion.allComplete) {
        throw new Error("Complete all required questions before generating the Strategic OS report.");
      }

      const targetWorkflowId = await ensureWorkflow();

      for (const step of OS_STEP_INPUTS) {
        const stepNumber = getStepNumber(step);
        await saveStepAnswers(targetWorkflowId, stepNumber, stepState[stepNumber]?.inputs || {});
      }

      const res = await apiClient.post(`${WORKFLOW_BASE}/${targetWorkflowId}/report/generate`, {
        user_id: userId,
        workspace_id: activeWorkspaceId || undefined,
        answers_hash: localAnswersHash,
        force: true,
      });

      setWorkflow((current) => ({
        ...(current || {}),
        strategic_report: res?.report || "",
        report_status: res?.report_status || "current",
        report_version: res?.report_version || (current?.report_version || 0) + 1,
        last_generated_answers_hash: res?.answers_hash || localAnswersHash,
        answers_hash: res?.answers_hash || localAnswersHash,
      }));

      await loadWorkflow(targetWorkflowId);
      setReportDrawerOpen(true);
    } catch (err) {
      console.error("Failed to generate Strategic OS report", err);
      setError(err?.message || "Failed to generate Strategic OS report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const jumpToStep = (stepNumber) => {
    setExpandedStep(stepNumber);
    requestAnimationFrame(() => {
      const el = document.getElementById(`step-card-${stepNumber}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const jumpToReport = () => {
    requestAnimationFrame(() => {
      const el = document.getElementById("report-panel");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const requestGenerate = () => {
    setConfirmGenerateOpen(true);
  };

  const performGenerate = async () => {
    setConfirmGenerateOpen(false);
    await generateReport();
  };

  const requestRefresh = () => {
    setConfirmRefreshOpen(true);
  };

  const performRefresh = async () => {
    setConfirmRefreshOpen(false);
    await loadPage();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TopBar title="Strategic OS" subtitle="Loading your brand operating system..." />
        <div className="flex-1 overflow-auto px-4 py-7 md:px-8" style={PAGE_STYLE}>
          <div
            style={{
              ...CARD_STYLE,
              maxWidth: 768,
              margin: "0 auto",
              padding: 20,
              textAlign: "center",
              fontFamily: SANS,
              color: "var(--cth-command-muted)",
            }}
          >
            Loading Strategic OS...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sidebar = (
    <aside
      className="hidden md:flex"
      style={{
        width: 260,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        overflowY: "auto",
        background: "var(--cth-command-purple)",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "24px 20px 12px" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--cth-command-gold)",
          }}
        >
          Strategic OS
        </div>

        <div
          style={{
            marginTop: 14,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--cth-command-ivory)",
          }}
        >
          {completion.completed} of {completion.total} complete
        </div>

        <div
          style={{
            marginTop: 8,
            height: 4,
            borderRadius: 999,
            background: "color-mix(in srgb, var(--cth-command-ivory) 14%, transparent)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completion.percent}%`,
              background: "var(--cth-command-crimson)",
              transition: "width 240ms ease",
            }}
          />
        </div>
      </div>

      <div style={{ padding: "16px 20px 6px" }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--cth-command-gold)",
            opacity: 0.7,
          }}
        >
          Steps
        </div>
      </div>

      <nav style={{ padding: "0 0 12px" }}>
        {OS_STEP_INPUTS.map((step) => {
          const stepNumber = getStepNumber(step);
          const status = getStepStatus(step, stepState[stepNumber]?.inputs || {});
          const active = expandedStep === stepNumber;

          return (
            <button
              key={stepNumber}
              type="button"
              onClick={() => jumpToStep(stepNumber)}
              data-testid={`sidebar-step-${stepNumber}`}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: active ? "rgba(175, 0, 42, 0.2)" : "transparent",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                borderLeft: `3px solid ${active ? "var(--cth-command-crimson)" : "transparent"}`,
                padding: "10px 17px",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: SANS,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background:
                    status === "complete"
                      ? "color-mix(in srgb, var(--cth-status-success-bright) 22%, transparent)"
                      : "color-mix(in srgb, var(--cth-command-ivory) 14%, transparent)",
                  color:
                    status === "complete"
                      ? "var(--cth-status-success-bright)"
                      : "var(--cth-command-ivory)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {stepNumber}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  color: active
                    ? "var(--cth-command-ivory)"
                    : "color-mix(in srgb, var(--cth-command-ivory) 78%, var(--cth-command-purple))",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: "0.01em",
                }}
              >
                {step.stepName}
              </div>

              <div style={{ flexShrink: 0 }}>
                <SidebarStatusIcon status={status} />
              </div>
            </button>
          );
        })}
      </nav>

      {hasReport ? (
        <div style={{ padding: "8px 20px 12px" }}>
          <button
            type="button"
            onClick={() => setReportDrawerOpen(true)}
            data-testid="sidebar-view-report-btn"
            style={{
              width: "100%",
              background: "transparent",
              color: "var(--cth-command-gold)",
              border: "1px solid var(--cth-command-gold)",
              borderRadius: 4,
              padding: "8px 12px",
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            View Report
          </button>
        </div>
      ) : null}

      {needsUpdate ? (
        <div style={{ padding: "0 20px 16px" }}>
          <div
            style={{
              background: "var(--cth-command-crimson)",
              color: "var(--cth-command-ivory)",
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "8px 12px",
              borderRadius: 4,
              textAlign: "center",
            }}
          >
            Answers Changed
          </div>
        </div>
      ) : null}
    </aside>
  );

  return (
    <DashboardLayout>
      <TopBar
        title="Strategic OS"
        subtitle="A living questionnaire that turns founder answers into one final Strategic OS report."
        action={
          <button
            type="button"
            onClick={requestRefresh}
            style={SECONDARY_BUTTON_STYLE}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      <div
        className="flex-1 overflow-auto"
        style={PAGE_STYLE}
        data-testid="strategic-os-page"
      >
        <div className="flex">
          {sidebar}

          <main className="min-w-0 flex-1 px-4 py-7 md:px-8">
            <div className="mx-auto grid w-full max-w-5xl gap-5">
          {error ? (
            <div
              style={{
                ...CARD_STYLE,
                borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                padding: 16,
                color: "var(--cth-danger)",
                fontFamily: SANS,
                fontSize: 13,
              }}
            >
              <div className="flex items-start gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          {/* Progress card */}
          <div style={{ ...CARD_STYLE, padding: 24 }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p style={SECTION_LABEL_STYLE}>Progress</p>
                <h2 style={SECTION_HEADING_STYLE}>
                  {completion.completed} of {completion.total} steps complete
                </h2>
                <p style={{ ...MUTED_STYLE, marginTop: 12, maxWidth: 600 }}>
                  No AI credits are used while answering. Credits are only used when generating the final report.
                </p>
              </div>

              <div
                style={{
                  ...CARD_STYLE,
                  background: "var(--cth-command-panel-soft)",
                  padding: "14px 20px",
                  textAlign: "right",
                }}
              >
                <p
                  style={{
                    fontFamily: SERIF,
                    fontSize: 28,
                    fontWeight: 600,
                    color: "var(--cth-command-ink)",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {completion.percent}%
                </p>
                <p
                  style={{
                    ...SECTION_LABEL_STYLE,
                    marginTop: 6,
                    fontSize: 10,
                  }}
                >
                  Complete
                </p>
              </div>
            </div>

            <div
              className="mt-5 h-2 overflow-hidden rounded-full"
              style={{ background: "var(--cth-command-blush)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${completion.percent}%`,
                  background: "var(--cth-command-crimson)",
                }}
              />
            </div>
          </div>

          {/* Step cards */}
          <div className="grid gap-4">
            {OS_STEP_INPUTS.map((step) => {
              const stepNumber = getStepNumber(step);

              return (
                <StepCard
                  id={`step-card-${stepNumber}`}
                  key={stepNumber}
                  step={step}
                  values={stepState[stepNumber]?.inputs || {}}
                  expanded={expandedStep === stepNumber}
                  saving={savingStep === stepNumber}
                  onToggle={() =>
                    setExpandedStep((current) => (current === stepNumber ? 0 : stepNumber))
                  }
                  onChange={updateStepInput}
                />
              );
            })}
          </div>

          <ReportPanel
            id="report-panel"
            report={workflow?.strategic_report || ""}
            status={workflow?.report_status || "not_started"}
            version={workflow?.report_version || 0}
            onGenerate={requestGenerate}
            generating={generatingReport || creatingWorkflow}
            canGenerate={completion.allComplete}
            needsUpdate={needsUpdate}
            onViewReport={() => setReportDrawerOpen(true)}
          />

          {workflow?.strategic_report ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ ...CARD_STYLE, padding: 20 }}
              >
                <div>
                  <p style={SECTION_LABEL_STYLE}>Next Step</p>
                  <p style={{ ...BODY_STYLE, marginTop: 6, maxWidth: 320 }}>
                    Turn this strategy into workflows, systems, and execution steps your team can follow.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.assign("/systems-builder")}
                  className="shrink-0"
                  style={PRIMARY_CTA_STYLE}
                >
                  Open Structure
                </button>
              </div>

              <div
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ ...CARD_STYLE, padding: 20 }}
              >
                <div>
                  <p style={SECTION_LABEL_STYLE}>Export</p>
                  <p style={{ ...BODY_STYLE, marginTop: 6, maxWidth: 320 }}>
                    Preview, print, download, or save the latest report.
                  </p>
                </div>
                <StrategicOSExportButton
                  completedSteps={completedStepsForExport}
                  variant="primary"
                  label="Export Report"
                />
              </div>
            </div>
          ) : null}

          {!completion.allComplete ? (
            <div
              style={{
                ...CARD_STYLE,
                background: "var(--cth-command-panel-soft)",
                padding: 16,
                fontFamily: SANS,
                fontSize: 13,
                color: "var(--cth-command-muted)",
              }}
            >
              Complete all required questions to unlock the report generator.
            </div>
          ) : null}
            </div>
          </main>
        </div>
      </div>

      {/* Confirm: Generate Report */}
      <Modal
        open={confirmGenerateOpen}
        onClose={() => setConfirmGenerateOpen(false)}
        ariaLabel="Generate Strategic OS Report"
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
          Generate Strategic OS Report
        </h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: "var(--cth-command-muted)",
            margin: "12px 0 0",
            lineHeight: 1.6,
          }}
        >
          This will use AI credits and generate your full Strategic OS report. This action cannot be undone.
        </p>
        {needsUpdate ? (
          <p
            style={{
              fontFamily: SANS,
              fontSize: 14,
              color: "var(--cth-command-muted)",
              margin: "10px 0 0",
              lineHeight: 1.6,
            }}
          >
            Your answers have changed since the last report. A new version will be generated.
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmGenerateOpen(false)}
            style={MODAL_OUTLINE_BUTTON_STYLE}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={performGenerate}
            data-testid="confirm-generate-btn"
            style={GENERATE_MODAL_BUTTON_STYLE}
          >
            <Sparkles size={14} />
            Generate Report
          </button>
        </div>
      </Modal>

      {/* Confirm: Refresh */}
      <Modal
        open={confirmRefreshOpen}
        onClose={() => setConfirmRefreshOpen(false)}
        ariaLabel="Refresh Strategic OS"
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
          Refresh Strategic OS
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
          This will reload your data. Any changes made in the last few seconds that have not yet autosaved may be lost.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmRefreshOpen(false)}
            style={MODAL_OUTLINE_BUTTON_STYLE}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={performRefresh}
            data-testid="confirm-refresh-btn"
            style={DESTRUCTIVE_BUTTON_STYLE}
          >
            Refresh Anyway
          </button>
        </div>
      </Modal>

      {/* Report Drawer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          pointerEvents: reportDrawerOpen ? "auto" : "none",
          visibility: reportDrawerOpen ? "visible" : "hidden",
        }}
        aria-hidden={!reportDrawerOpen}
      >
        <div
          onClick={() => setReportDrawerOpen(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(13, 0, 16, 0.5)",
            opacity: reportDrawerOpen ? 1 : 0,
            transition: "opacity 220ms ease",
          }}
        />
        <div
          role="dialog"
          aria-label="Strategic OS Report"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: 640,
            maxWidth: "90vw",
            background: "var(--cth-command-panel)",
            borderLeft: "1px solid var(--cth-command-border)",
            zIndex: 51,
            display: "flex",
            flexDirection: "column",
            transform: reportDrawerOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 300ms ease",
            boxShadow: "-12px 0 40px rgba(13, 0, 16, 0.18)",
          }}
        >
          {/* Drawer header */}
          <div
            className="flex items-start justify-between"
            style={{
              padding: 24,
              borderBottom: "1px solid var(--cth-command-border)",
              gap: 16,
            }}
          >
            <div>
              <p style={SECTION_LABEL_STYLE}>Strategic OS Report</p>
              <h2
                style={{
                  ...SECTION_HEADING_STYLE,
                  marginTop: 4,
                }}
              >
                {workflow?.report_version
                  ? `Report Version ${workflow.report_version}`
                  : "Latest Report"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setReportDrawerOpen(false)}
              aria-label="Close report drawer"
              data-testid="close-report-drawer-btn"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                color: "var(--cth-command-muted)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--cth-command-crimson)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--cth-command-muted)";
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 24,
            }}
          >
            {/* Report header block */}
            <div style={{ marginBottom: 32 }}>
              <p style={SECTION_LABEL_STYLE}>Strategic OS Report</p>
              {(activeWorkspace?.brand_name || activeWorkspace?.name) ? (
                <h1
                  style={{
                    fontFamily: SERIF,
                    fontSize: 28,
                    fontWeight: 600,
                    color: "var(--cth-command-ink)",
                    margin: "8px 0 0",
                    letterSpacing: "-0.005em",
                    lineHeight: 1.2,
                  }}
                >
                  {activeWorkspace?.brand_name || activeWorkspace?.name}
                </h1>
              ) : null}
              {(() => {
                const date = formatGeneratedDate(
                  workflow?.report_generated_at ||
                    workflow?.updated_at ||
                    workflow?.created_at ||
                    ""
                );
                return date ? (
                  <p
                    style={{
                      fontFamily: SANS,
                      fontSize: 13,
                      color: "var(--cth-command-muted)",
                      margin: "8px 0 0",
                      lineHeight: 1.55,
                    }}
                  >
                    Generated {date}
                  </p>
                ) : null;
              })()}
              <div
                style={{
                  borderTop: "2px solid var(--cth-command-crimson)",
                  marginTop: 16,
                }}
              />
            </div>

            {/* Structured sections */}
            {parseReportToSections(workflow?.strategic_report || "").map(
              (section, sectionIndex) => (
                <div
                  key={`${section.heading}-${sectionIndex}`}
                  style={{
                    background: "var(--cth-command-panel)",
                    border: "1px solid var(--cth-command-border)",
                    borderRadius: 4,
                    padding: 24,
                    marginBottom: 16,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: SERIF,
                      fontSize: 22,
                      fontWeight: 600,
                      color: "var(--cth-command-ink)",
                      margin: 0,
                      marginBottom: 12,
                      letterSpacing: "-0.005em",
                      lineHeight: 1.25,
                    }}
                  >
                    {section.heading}
                  </h2>
                  <div
                    style={{
                      borderTop: "1px solid var(--cth-command-border)",
                      marginBottom: 20,
                    }}
                  />

                  {section.blocks.map((block, blockIndex) => {
                    const key = `${sectionIndex}-${blockIndex}`;
                    if (block.type === "list") {
                      return (
                        <ul
                          key={key}
                          style={{
                            paddingLeft: 0,
                            margin: "0 0 12px",
                            listStyle: "none",
                          }}
                        >
                          {block.items.map((item, itemIndex) => (
                            <li
                              key={`${key}-${itemIndex}`}
                              style={{
                                paddingLeft: 20,
                                position: "relative",
                                fontFamily: SANS,
                                fontSize: 15,
                                color: "var(--cth-command-ink)",
                                lineHeight: 1.8,
                                marginBottom: 6,
                              }}
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  position: "absolute",
                                  left: 4,
                                  top: 0,
                                  color: "var(--cth-command-crimson)",
                                  fontSize: 18,
                                  lineHeight: 1.6,
                                  fontWeight: 700,
                                }}
                              >
                                •
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p
                        key={key}
                        style={{
                          fontFamily: SANS,
                          fontSize: 15,
                          color: "var(--cth-command-ink)",
                          lineHeight: 1.8,
                          margin: "0 0 12px",
                        }}
                      >
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              )
            )}

            {!workflow?.strategic_report ? (
              <div
                style={{
                  background: "var(--cth-command-panel-soft)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: 24,
                  fontFamily: SANS,
                  fontSize: 14,
                  color: "var(--cth-command-muted)",
                }}
              >
                No report has been generated yet. Complete all 9 steps and click Generate Report to create one.
              </div>
            ) : null}
          </div>

          {/* Drawer footer */}
          <div
            className="flex flex-wrap items-center justify-between gap-3"
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--cth-command-border)",
            }}
          >
            <StrategicOSExportButton
              completedSteps={completedStepsForExport}
              variant="primary"
              label="Export Report"
            />
            <button
              type="button"
              onClick={() => window.location.assign("/systems-builder")}
              style={PRIMARY_CTA_STYLE}
            >
              Open Structure
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
