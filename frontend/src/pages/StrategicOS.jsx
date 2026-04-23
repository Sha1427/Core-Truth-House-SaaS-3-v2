import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
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

function getStepNumber(step) {
  return Number(step.stepNumber || step.n || 0);
}

function getRequiredMissing(step, inputs = {}) {
  return validateStepInputs(getStepNumber(step), inputs || {});
}

function isStepComplete(step, inputs = {}) {
  return getRequiredMissing(step, inputs).length === 0;
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
  const commonClass = "mt-2";

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${commonClass} cth-textarea min-h-[92px]`}
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
        className={`${commonClass} cth-select`}
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
              className="flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-xs"
              style={{
                borderColor: checked ? "var(--cth-admin-accent)" : "var(--cth-admin-border)",
                background: checked
                  ? "color-mix(in srgb, var(--cth-admin-accent) 8%, var(--cth-admin-panel))"
                  : "var(--cth-admin-panel)",
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
              <span className="leading-relaxed cth-muted">{option.label || option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <input
      className={`${commonClass} cth-input`}
      value={value || ""}
      placeholder={field.placeholder || ""}
      maxLength={field.maxLength}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function StepCard({
  step,
  values,
  expanded,
  saving,
  onToggle,
  onChange,
}) {
  const stepNumber = getStepNumber(step);
  const missing = getRequiredMissing(step, values);
  const complete = missing.length === 0;

  return (
    <div
      className="cth-card overflow-hidden"
      style={{
        borderColor: complete
          ? "color-mix(in srgb, var(--cth-success) 35%, var(--cth-admin-border))"
          : expanded
          ? "var(--cth-admin-accent)"
          : "var(--cth-admin-border)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 border-0 bg-transparent p-4 text-left md:p-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{
              background: complete ? "rgba(16,185,129,0.14)" : "rgba(224,78,53,0.12)",
              color: complete ? "var(--cth-success)" : "var(--cth-admin-accent)",
            }}
          >
            {complete ? <CheckCircle2 size={18} /> : stepNumber}
          </div>

          <div className="min-w-0">
            <p className="cth-kicker m-0">Step {stepNumber}</p>
            <h3 className="m-0 mt-1 text-sm font-bold cth-heading">{step.stepName}</h3>
            <p className="m-0 mt-1 text-xs leading-relaxed cth-muted">{step.description}</p>
          </div>
        </div>

        {expanded ? <ChevronDown size={18} className="cth-muted" /> : <ChevronRight size={18} className="cth-muted" />}
      </button>

      {expanded ? (
        <div className="border-t p-4 md:p-5" style={{ borderColor: "var(--cth-admin-border)" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="cth-kicker m-0">Founder answers</p>
              <p className="m-0 mt-1 text-xs cth-muted">
                Editable forever. These save without using AI credits.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--cth-admin-border)" }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              <span className="cth-muted">{saving ? "Saving..." : "Autosaved"}</span>
            </div>
          </div>

          <div className="grid gap-4">
            {(step.fields || []).map((field, index) => {
              const value = values?.[field.id];

              return (
                <div key={field.id} className="strategic-os-question-field">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: "var(--cth-admin-accent)", color: "var(--cth-on-dark)" }}
                    >
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <label className="cth-label m-0">
                        {field.label}
                        {field.required ? <span className="cth-text-danger"> *</span> : null}
                      </label>

                      {field.helpText ? (
                        <p className="m-0 mt-1 text-xs leading-relaxed cth-muted">{field.helpText}</p>
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
            <div className="mt-4 rounded-2xl border p-3 text-xs cth-muted" style={{ borderColor: "var(--cth-admin-border)", background: "var(--cth-admin-panel-alt)" }}>
              Complete the required questions in this step to move the OS closer to report generation.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReportPanel({ report, status, version, onGenerate, generating, canGenerate, needsUpdate }) {
  const hasReport = Boolean(report);

  return (
    <div className="cth-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="cth-kicker m-0">Strategic OS report</p>
          <h2 className="m-0 mt-2 text-xl font-bold cth-heading">
            {hasReport ? `Report Version ${version || 1}` : "Generate your full Strategic OS report"}
          </h2>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-relaxed cth-muted">
            Your answers can change as the brand grows. AI credits are only used when you generate or update the full report.
          </p>
        </div>

        <button
          type="button"
          disabled={!canGenerate || generating}
          onClick={onGenerate}
          className="cth-button-primary"
          style={{ opacity: !canGenerate || generating ? 0.65 : 1 }}
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {hasReport ? "Generate Updated Report" : "Generate Strategic OS Report"}
        </button>
      </div>

      {needsUpdate ? (
        <div className="mt-4 rounded-2xl border p-3 text-sm" style={{ borderColor: "var(--cth-admin-accent)", background: "color-mix(in srgb, var(--cth-admin-accent) 8%, var(--cth-admin-panel))" }}>
          <p className="m-0 font-semibold cth-heading">Your answers changed.</p>
          <p className="m-0 mt-1 text-xs cth-muted">
            The saved report is now out of date. Regenerate only when you are ready to spend AI credits.
          </p>
        </div>
      ) : null}

      {!canGenerate ? (
        <div className="mt-4 rounded-2xl border p-3 text-sm cth-muted" style={{ borderColor: "var(--cth-admin-border)", background: "var(--cth-admin-panel-alt)" }}>
          Complete all required questions across the 9 steps to unlock report generation.
        </div>
      ) : null}

      {hasReport ? (
        <div
          className="cth-generated-output mt-5 rounded-2xl border p-5 text-sm"
          style={{ borderColor: "var(--cth-admin-border)", background: "var(--cth-admin-panel-alt)" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
        />
      ) : null}
    </div>
  );
}

export default function StrategicOS() {
  const { activeWorkspaceId } = useWorkspace();
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
    } catch (err) {
      console.error("Failed to generate Strategic OS report", err);
      setError(err?.message || "Failed to generate Strategic OS report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TopBar title="Strategic OS" subtitle="Loading your brand operating system..." />
        <div className="cth-page flex-1 overflow-auto px-4 py-5 md:px-7">
          <div className="cth-card mx-auto max-w-3xl p-5 text-center cth-muted">
            Loading Strategic OS...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Strategic OS"
        subtitle="A living questionnaire that turns founder answers into one final Strategic OS report."
        action={
          <button
            type="button"
            onClick={loadPage}
            className="cth-button-secondary text-xs"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      />

      <div className="cth-page flex-1 overflow-auto px-4 py-5 md:px-7" data-testid="strategic-os-page">
        <div className="mx-auto grid w-full max-w-6xl gap-5">
          {error ? (
            <div className="rounded-2xl border p-4 text-sm cth-text-danger" style={{ borderColor: "var(--cth-danger)" }}>
              <div className="flex items-start gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <div className="cth-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="cth-kicker m-0">Progress</p>
                <h2 className="m-0 mt-2 text-xl font-bold cth-heading">
                  {completion.completed} of {completion.total} steps complete
                </h2>
                <p className="m-0 mt-2 text-sm cth-muted">
                  No AI credits are used while answering. Credits are only used when generating the final report.
                </p>
              </div>

              <div className="rounded-2xl border px-4 py-3 text-right" style={{ borderColor: "var(--cth-admin-border)", background: "var(--cth-admin-panel-alt)" }}>
                <p className="m-0 text-2xl font-bold cth-heading">{completion.percent}%</p>
                <p className="m-0 text-xs cth-muted">Complete</p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--cth-admin-panel-alt)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${completion.percent}%`,
                  background: "var(--cth-admin-accent)",
                }}
              />
            </div>
          </div>

          <div className="grid gap-4">
            {OS_STEP_INPUTS.map((step) => {
              const stepNumber = getStepNumber(step);

              return (
                <StepCard
                  key={stepNumber}
                  step={step}
                  values={stepState[stepNumber]?.inputs || {}}
                  expanded={expandedStep === stepNumber}
                  saving={savingStep === stepNumber}
                  onToggle={() => setExpandedStep((current) => (current === stepNumber ? 0 : stepNumber))}
                  onChange={updateStepInput}
                />
              );
            })}
          </div>

          <ReportPanel
            report={workflow?.strategic_report || ""}
            status={workflow?.report_status || "not_started"}
            version={workflow?.report_version || 0}
            onGenerate={generateReport}
            generating={generatingReport || creatingWorkflow}
            canGenerate={completion.allComplete}
            needsUpdate={needsUpdate}
          />

            {workflow?.strategic_report ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="cth-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="cth-kicker m-0">Next step</p>
                    <p className="m-0 mt-1 text-sm cth-muted">Turn this strategy into workflows, systems, and execution steps your team can follow.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.location.assign("/systems-builder")}
                    className="cth-button-primary inline-flex shrink-0 items-center gap-2"
                  >
                    Open Structure
                  </button>
                </div>

                <div className="cth-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="cth-kicker m-0">Export</p>
                    <p className="m-0 mt-1 text-sm cth-muted">Preview, print, download, or save the latest report.</p>
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
            <div className="cth-card-muted rounded-2xl p-4 text-sm cth-muted">
              Complete all required questions to unlock the report generator.
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
