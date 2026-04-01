import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Loader2,
  Save,
  Zap,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useColors } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";
import { getStepInputConfig, validateStepInputs } from "../lib/os-step-inputs";

const STEPS = [
  { n: 1, name: "Strategic Brand and Market Analysis", desc: "Define your brand positioning and strategic foundation." },
  { n: 2, name: "Audience Psychology and Messaging Intelligence", desc: "Clarify pain points, desires, and messaging triggers." },
  { n: 3, name: "Authority Positioning and Differentiation System", desc: "Shape your category authority and point of difference." },
  { n: 4, name: "Competitor Content Breakdown and White Space", desc: "Study the market and identify openings." },
  { n: 5, name: "Conversion-Oriented Content Pillars", desc: "Build content pillars that move people to action." },
  { n: 6, name: "Platform-Specific Adaptation Engine", desc: "Translate strategy across channels and formats." },
  { n: 7, name: "30-Day Strategic Content Plan", desc: "Generate your execution plan." },
  { n: 8, name: "Hero Content Generator", desc: "Create a strategic content asset from your framework." },
  { n: 9, name: "Revenue Conversion Layer", desc: "Tie the system back to offer movement and revenue." },
];

function EmptyState({ colors, title, text, action }) {
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 14,
        padding: "20px",
      }}
    >
      <h3 style={{ margin: "0 0 8px", color: colors.textPrimary }}>{title}</h3>
      <p style={{ margin: "0 0 16px", color: colors.textMuted, lineHeight: 1.6 }}>{text}</p>
      {action}
    </div>
  );
}

function StepInputs({ stepNumber, values, onChange }) {
  const config = getStepInputConfig(stepNumber) || [];
  if (!config.length) return null;

  return (
    <div className="grid gap-3">
      {config.map((field) => {
        const fieldValue = values?.[field.id] ?? "";

        if (field.type === "textarea") {
          return (
            <div key={field.id}>
              <label className="mb-1 block text-sm text-white/70">{field.label}</label>
              <textarea
                value={fieldValue}
                rows={4}
                onChange={(event) => onChange(field.id, event.target.value)}
                className="w-full rounded-xl px-3 py-2 text-white"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
          );
        }

        if (field.type === "select" && Array.isArray(field.options)) {
          return (
            <div key={field.id}>
              <label className="mb-1 block text-sm text-white/70">{field.label}</label>
              <select
                value={fieldValue}
                onChange={(event) => onChange(field.id, event.target.value)}
                className="w-full rounded-xl px-3 py-2 text-white"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <option value="">Select an option</option>
                {field.options.map((option) => (
                  <option key={option.value || option} value={option.value || option}>
                    {option.label || option}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={field.id}>
            <label className="mb-1 block text-sm text-white/70">{field.label}</label>
            <input
              value={fieldValue}
              onChange={(event) => onChange(field.id, event.target.value)}
              className="w-full rounded-xl px-3 py-2 text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function StepCard({
  step,
  stepState,
  expanded,
  onToggle,
  onInputChange,
  onGenerate,
  onEditStart,
  onEditChange,
  onEditSave,
  busy,
  editing,
  colors,
}) {
  const renderedHtml = stepState?.content
    ? DOMPurify.sanitize(marked.parse(stepState.content))
    : "";

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ color: colors.textPrimary, fontWeight: 700 }}>
            Step {step.n}. {step.name}
          </div>
          <div style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{step.desc}</div>
        </div>

        <div className="flex items-center gap-3">
          {stepState?.status === "completed" ? (
            <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
          ) : null}
          {expanded ? (
            <ChevronDown size={18} style={{ color: colors.textMuted }} />
          ) : (
            <ChevronRight size={18} style={{ color: colors.textMuted }} />
          )}
        </div>
      </button>

      {expanded ? (
        <div style={{ padding: "0 18px 18px" }}>
          <div className="mb-4">
            <StepInputs
              stepNumber={step.n}
              values={stepState?.inputs || {}}
              onChange={onInputChange}
            />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onGenerate}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white font-semibold"
              style={{ background: "#E04E35", opacity: busy ? 0.7 : 1 }}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {stepState?.content ? "Regenerate Step" : "Generate Step"}
            </button>

            {stepState?.content && !editing ? (
              <button
                type="button"
                onClick={onEditStart}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <Edit3 size={16} />
                Edit
              </button>
            ) : null}
          </div>

          {editing ? (
            <div>
              <textarea
                value={stepState?.draftContent || ""}
                onChange={(event) => onEditChange(event.target.value)}
                rows={14}
                className="w-full rounded-xl px-3 py-3 text-white"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={onEditSave}
                className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white font-semibold"
                style={{ background: "#33033C", opacity: busy ? 0.7 : 1 }}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Step
              </button>
            </div>
          ) : stepState?.content ? (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                color: colors.textMuted,
              }}
            >
              This step has not been generated yet.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function StrategicOS() {
  const colors = useColors();
  const { activeWorkspaceId } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const [brandMemory, setBrandMemory] = useState(null);
  const [workflowId, setWorkflowId] = useState("");
  const [workflow, setWorkflow] = useState(null);
  const [expandedStep, setExpandedStep] = useState(1);
  const [stepState, setStepState] = useState({});
  const [busyStep, setBusyStep] = useState(null);
  const [error, setError] = useState("");

  const stepsById = useMemo(() => {
    const map = {};
    (workflow?.steps || []).forEach((step) => {
      map[step.step_number || step.n] = step;
    });
    return map;
  }, [workflow]);

  const hydrateStepState = useCallback((workflowDoc) => {
    const nextState = {};
    STEPS.forEach((step) => {
      const backendStep = (workflowDoc?.steps || []).find(
        (item) => Number(item.step_number || item.n) === step.n
      );

      nextState[step.n] = {
        inputs: backendStep?.inputs || {},
        content: backendStep?.content || "",
        status: backendStep?.status || "pending",
        editing: false,
        draftContent: backendStep?.content || "",
      };
    });
    setStepState(nextState);
  }, []);

  const loadWorkflow = useCallback(async (id) => {
    if (!id) return;

    const res = await apiClient.get(API_PATHS.osWorkflow.workflowById(id));
    setWorkflow(res);
    setWorkflowId(id);
    hydrateStepState(res);
  }, [hydrateStepState]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [readinessRes, brandMemoryRes] = await Promise.all([
        apiClient.get(API_PATHS.osWorkflow.readiness),
        apiClient.get(API_PATHS.osWorkflow.brandMemory),
      ]);

      setReadiness(readinessRes || null);
      setBrandMemory(brandMemoryRes || null);

      const existingWorkflowId =
        readinessRes?.workflow_id ||
        readinessRes?.active_workflow_id ||
        "";

      if (existingWorkflowId) {
        await loadWorkflow(existingWorkflowId);
      }
    } catch (err) {
      console.error("Failed to load Strategic OS", err);
      setError(err?.message || "Unable to load Strategic OS.");
    } finally {
      setLoading(false);
    }
  }, [loadWorkflow]);

  useEffect(() => {
    loadPage();
  }, [loadPage, activeWorkspaceId]);

  const updateStepInput = (stepNum, fieldId, value) => {
    setStepState((current) => ({
      ...current,
      [stepNum]: {
        ...current[stepNum],
        inputs: {
          ...(current[stepNum]?.inputs || {}),
          [fieldId]: value,
        },
      },
    }));
  };

  const ensureWorkflow = async () => {
    if (workflowId) return workflowId;

    setCreatingWorkflow(true);
    try {
      const payload = {
        workspace_id: activeWorkspaceId || undefined,
      };

      const res = await apiClient.post(API_PATHS.osWorkflow.workflow, payload);
      const createdId = res?.workflow_id || res?.id;

      if (!createdId) {
        throw new Error("Workflow was created, but no workflow id was returned.");
      }

      await loadWorkflow(createdId);
      return createdId;
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const handleGenerate = async (stepNum) => {
    setError("");
    setBusyStep(stepNum);

    try {
      const inputs = stepState?.[stepNum]?.inputs || {};
      const validation = validateStepInputs(stepNum, inputs);

      if (validation && validation.valid === false) {
        throw new Error(validation.message || "Please complete the required step fields.");
      }

      const ensuredWorkflowId = await ensureWorkflow();

      const res = await apiClient.post(
        API_PATHS.osWorkflow.generateStep(ensuredWorkflowId, stepNum),
        { inputs }
      );

      setStepState((current) => ({
        ...current,
        [stepNum]: {
          ...current[stepNum],
          content: res?.content || res?.step?.content || "",
          draftContent: res?.content || res?.step?.content || "",
          status: "completed",
          editing: false,
        },
      }));

      await loadWorkflow(ensuredWorkflowId);
    } catch (err) {
      console.error(`Failed to generate step ${stepNum}`, err);
      setError(err?.message || `Failed to generate step ${stepNum}.`);
    } finally {
      setBusyStep(null);
    }
  };

  const handleEditStart = (stepNum) => {
    setStepState((current) => ({
      ...current,
      [stepNum]: {
        ...current[stepNum],
        editing: true,
        draftContent: current[stepNum]?.content || "",
      },
    }));
  };

  const handleEditChange = (stepNum, value) => {
    setStepState((current) => ({
      ...current,
      [stepNum]: {
        ...current[stepNum],
        draftContent: value,
      },
    }));
  };

  const handleEditSave = async (stepNum) => {
    if (!workflowId) return;

    setBusyStep(stepNum);
    setError("");

    try {
      const content = stepState?.[stepNum]?.draftContent || "";
      const res = await apiClient.put(
        API_PATHS.osWorkflow.editStep(workflowId, stepNum),
        { content }
      );

      setStepState((current) => ({
        ...current,
        [stepNum]: {
          ...current[stepNum],
          content: res?.content || content,
          draftContent: res?.content || content,
          editing: false,
          status: "completed",
        },
      }));

      await loadWorkflow(workflowId);
    } catch (err) {
      console.error(`Failed to save step ${stepNum}`, err);
      setError(err?.message || `Failed to save step ${stepNum}.`);
    } finally {
      setBusyStep(null);
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Strategic OS"
        subtitle="Build your strategic operating system one step at a time."
      />

      <div className="px-4 py-5 md:px-7">
        {error ? (
          <div
            className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2"
            style={{
              background: "rgba(224,78,53,0.10)",
              border: "1px solid rgba(224,78,53,0.25)",
              color: "#E04E35",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: colors.cinnabar }} />
          </div>
        ) : !brandMemory ? (
          <EmptyState
            colors={colors}
            title="Brand Memory required"
            text="Strategic OS works best when your Brand Memory is available first. Complete that layer, then return here."
          />
        ) : (
          <div className="grid gap-5">
            <div
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.tuscany}15`,
                borderRadius: 14,
                padding: "18px",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-white/50">Workflow Status</div>
                  <div className="mt-1 text-white font-semibold">
                    {workflowId ? "Active workflow" : "No workflow started yet"}
                  </div>
                </div>

                <div className="text-sm text-white/60">
                  {readiness?.message || "Your Strategic OS is ready to build."}
                </div>
              </div>

              {!workflowId ? (
                <button
                  type="button"
                  disabled={creatingWorkflow}
                  onClick={ensureWorkflow}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white font-semibold"
                  style={{ background: "#33033C", opacity: creatingWorkflow ? 0.7 : 1 }}
                >
                  {creatingWorkflow ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                  Start Strategic OS
                </button>
              ) : null}
            </div>

            {STEPS.map((step) => (
              <StepCard
                key={step.n}
                step={step}
                stepState={stepState[step.n] || {}}
                expanded={expandedStep === step.n}
                onToggle={() => setExpandedStep((current) => (current === step.n ? 0 : step.n))}
                onInputChange={(fieldId, value) => updateStepInput(step.n, fieldId, value)}
                onGenerate={() => handleGenerate(step.n)}
                onEditStart={() => handleEditStart(step.n)}
                onEditChange={(value) => handleEditChange(step.n, value)}
                onEditSave={() => handleEditSave(step.n)}
                busy={busyStep === step.n}
                editing={Boolean(stepState?.[step.n]?.editing)}
                colors={colors}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
