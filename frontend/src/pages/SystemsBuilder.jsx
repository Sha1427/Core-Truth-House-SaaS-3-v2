import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import {
  Cog,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  ChevronRight,
  Megaphone,
  ShoppingCart,
  Truck,
  Settings,
  AlertCircle,
  Wand2,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { id: "marketing", name: "Marketing", icon: Megaphone, accent: "from-rose-600 to-red-500" },
  { id: "sales", name: "Sales", icon: ShoppingCart, accent: "from-orange-600 to-amber-500" },
  { id: "delivery", name: "Delivery", icon: Truck, accent: "from-fuchsia-700 to-rose-500" },
  { id: "operations", name: "Operations", icon: Settings, accent: "from-stone-600 to-zinc-500" },
];

const EMPTY_FORM = {
  prompt: "",
  name: "",
  description: "",
  category: "marketing",
  steps: [{ title: "", description: "" }],
};

function normalizeStep(step = {}) {
  return {
    title: typeof step.title === "string" ? step.title : "",
    description: typeof step.description === "string" ? step.description : "",
  };
}

function normalizeSystem(item = {}) {
  return {
    id: item.id || item._id || "",
    name: typeof item.name === "string" ? item.name : "",
    description: typeof item.description === "string" ? item.description : "",
    category: typeof item.category === "string" ? item.category : "marketing",
    steps: Array.isArray(item.steps) ? item.steps.map(normalizeStep) : [],
    created_at: item.created_at || null,
    updated_at: item.updated_at || null,
  };
}

function getCategoryInfo(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId) || CATEGORIES[0];
}

function buildSystemPayload(formData) {
  return {
    name: String(formData.name || "").trim(),
    description: String(formData.description || "").trim(),
    category: String(formData.category || "marketing").trim(),
    steps: Array.isArray(formData.steps)
      ? formData.steps
          .map((step) => ({
            title: String(step.title || "").trim(),
            description: String(step.description || "").trim(),
          }))
          .filter((step) => step.title)
      : [],
  };
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function StepEditor({ index, step, onChange, onRemove, disableRemove = false }) {
  return (
    <div className="rounded-2xl border border-[var(--cth-app-border)] cth-card-muted p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] cth-muted">
          Step {index + 1}
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disableRemove}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-app-border)] px-2 py-1 text-xs cth-muted hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={14} />
          Remove
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium cth-heading">Step title</label>
        <input
          type="text"
          value={step.title}
          onChange={(event) => onChange(index, "title", event.target.value)}
          placeholder="Ex: Capture lead"
          className="w-full rounded-xl border border-[var(--cth-app-border)] var(--cth-app-panel) px-3 py-2.5 text-sm cth-heading outline-none placeholder:cth-heading/30 focus:border-[rgba(224,78,53,0.35)]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium cth-heading">Step description</label>
        <textarea
          value={step.description}
          onChange={(event) => onChange(index, "description", event.target.value)}
          rows={3}
          placeholder="Describe what happens at this stage..."
          className="w-full rounded-xl border border-[var(--cth-app-border)] var(--cth-app-panel) px-3 py-2.5 text-sm cth-heading outline-none placeholder:cth-heading/30 focus:border-[rgba(224,78,53,0.35)]"
        />
      </div>
    </div>
  );
}

function SystemCard({ system, onEdit, onDelete, onOpen }) {
  const category = getCategoryInfo(system.category);
  const Icon = category.icon;

  return (
    <div className="rounded-3xl border border-[var(--cth-app-border)] cth-card p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3 min-w-0">
          <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${category.accent} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white`}>
            <Icon size={13} />
            {category.name}
          </div>

          <div>
            <h3 className="text-lg font-semibold cth-heading">{system.name || "Untitled system"}</h3>
            <p className="mt-1 text-sm cth-muted">
              {system.description || "No description added yet."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(system)}
            className="rounded-xl border p-2 cth-muted hover:opacity-80" style={{ borderColor: "var(--cth-app-border)" }}
            aria-label={`Edit ${system.name}`}
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(system)}
            className="rounded-xl border p-2 cth-muted hover:opacity-80" style={{ borderColor: "var(--cth-app-border)" }}
            aria-label={`Delete ${system.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[var(--cth-app-border)] cth-card-muted px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] cth-muted">Steps</div>
          <div className="mt-1 text-sm font-medium cth-heading">{system.steps.length}</div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(system)}
          className="cth-button-primary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
        >
          View
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function SystemsBuilder() {
  const { currentWorkspace } = useWorkspace();

  const workspaceId =
    currentWorkspace?.id ||
    currentWorkspace?.workspace_id ||
    "";

  const [systems, setSystems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [viewingSystem, setViewingSystem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingFullSystem, setIsGeneratingFullSystem] = useState(false);
  const [generationError, setGenerationError] = useState("");

  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      setError("No active workspace found.");
      return;
    }

    loadSystems();
  }, [workspaceId]);

  async function loadSystems() {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.get("/api/systems");
      const items = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : [];
      setSystems(items.map(normalizeSystem));
    } catch (err) {
      console.error("Failed to load systems:", err);
      setError(getErrorMessage(err, "Failed to load systems."));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData(EMPTY_FORM);
    setEditingSystem(null);
    setGenerationError("");
  }

  function handleOpenModal(system = null) {
    setError("");
    setSuccessMessage("");
    setGenerationError("");

    if (system) {
      setEditingSystem(system);
      setFormData({
        prompt: "",
        name: system.name || "",
        description: system.description || "",
        category: system.category || "marketing",
        steps: system.steps?.length ? system.steps.map(normalizeStep) : [{ title: "", description: "" }],
      });
    } else {
      resetForm();
    }

    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    resetForm();
  }

  function handleAddStep() {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { title: "", description: "" }],
    }));
  }

  function handleRemoveStep(index) {
    setFormData((prev) => {
      if (prev.steps.length <= 1) return prev;
      return {
        ...prev,
        steps: prev.steps.filter((_, stepIndex) => stepIndex !== index),
      };
    });
  }

  function handleStepChange(index, field, value) {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step
      ),
    }));
  }

  async function handleGenerateSteps() {
    const name = String(formData.name || "").trim();
    const description = String(formData.description || "").trim();
    const category = String(formData.category || "marketing").trim();

    if (!name) {
      setGenerationError("Add a system name first so AI has something specific to build from.");
      return;
    }

    try {
      setIsGeneratingSteps(true);
      setGenerationError("");

      const response = await apiClient.post("/api/systems/generate-steps", {
        name,
        description,
        category,
      });

      const steps = Array.isArray(response?.steps) ? response.steps.map(normalizeStep).filter((step) => step.title) : [];

      if (!steps.length) {
        setGenerationError("No AI step suggestions were returned.");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        steps,
      }));
    } catch (err) {
      console.error("Failed to generate steps:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate steps."));
    } finally {
      setIsGeneratingSteps(false);
    }
  }

  async function handleGenerateFullSystem() {
    const prompt = String(formData.prompt || "").trim();

    if (!prompt) {
      setGenerationError("Describe the kind of system you want first.");
      return;
    }

    try {
      setIsGeneratingFullSystem(true);
      setGenerationError("");

      const response = await apiClient.post("/api/systems/generate-system", {
        prompt,
      });

      const generated = response?.system || {};
      const steps = Array.isArray(generated?.steps)
        ? generated.steps.map(normalizeStep).filter((step) => step.title)
        : [];

      setFormData((prev) => ({
        ...prev,
        name: typeof generated?.name === "string" ? generated.name : prev.name,
        description: typeof generated?.description === "string" ? generated.description : prev.description,
        category: typeof generated?.category === "string" ? generated.category : prev.category,
        steps: steps.length ? steps : prev.steps,
      }));
    } catch (err) {
      console.error("Failed to generate full system:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate full system."));
    } finally {
      setIsGeneratingFullSystem(false);
    }
  }

  async function handleSaveSystem() {
    const payload = buildSystemPayload(formData);

    if (!payload.name) {
      setError("System name is required.");
      return;
    }

    if (!payload.steps.length) {
      setError("Add at least one step with a title.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (editingSystem?.id) {
        await apiClient.put(`/api/systems/${editingSystem.id}`, payload);
        setSuccessMessage("System updated.");
      } else {
        await apiClient.post("/api/systems", payload);
        setSuccessMessage("System created.");
      }

      await loadSystems();
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save system:", err);
      setError(getErrorMessage(err, "Failed to save system."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSystem(system) {
    const systemId = system?.id;
    if (!systemId) return;

    const confirmed = window.confirm(`Delete "${system.name || "this system"}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(systemId);
      setError("");
      setSuccessMessage("");

      await apiClient.delete(`/api/systems/${systemId}`);
      setSystems((prev) => prev.filter((item) => item.id !== systemId));
      setSuccessMessage("System deleted.");
      if (viewingSystem?.id === systemId) {
        setViewingSystem(null);
      }
    } catch (err) {
      console.error("Failed to delete system:", err);
      setError(getErrorMessage(err, "Failed to delete system."));
    } finally {
      setDeletingId("");
    }
  }

  const filteredSystems = useMemo(() => {
    if (selectedCategory === "all") return systems;
    return systems.filter((system) => system.category === selectedCategory);
  }, [systems, selectedCategory]);

  const totalSteps = useMemo(() => {
    return systems.reduce((sum, system) => sum + system.steps.length, 0);
  }, [systems]);

  return (
    <DashboardLayout>
      <TopBar
        title="Structure"
        subtitle="Build the repeatable operating systems behind how your brand runs."
      />

      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--cth-app-border)] cth-card p-5">
              <div className="text-xs uppercase tracking-[0.18em] cth-muted">Active workspace</div>
              <div className="mt-2 text-base font-semibold cth-heading">
                {currentWorkspace?.name || "Current workspace"}
              </div>
              <div className="mt-1 text-sm cth-muted">
                {workspaceId || "No workspace id found"}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--cth-app-border)] cth-card p-5">
              <div className="text-xs uppercase tracking-[0.18em] cth-muted">Systems</div>
              <div className="mt-2 text-3xl font-semibold cth-heading">{systems.length}</div>
              <div className="mt-1 text-sm cth-muted">Documented repeatable workflows</div>
            </div>

            <div className="rounded-3xl border border-[var(--cth-app-border)] cth-card p-5">
              <div className="text-xs uppercase tracking-[0.18em] cth-muted">Steps mapped</div>
              <div className="mt-2 text-3xl font-semibold cth-heading">{totalSteps}</div>
              <div className="mt-1 text-sm cth-muted">Operational actions across your systems</div>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div className="text-sm">{error}</div>
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === "all"
                    ? "cth-button-primary"
                    : "border border-[var(--cth-app-border)] cth-card-muted cth-muted hover:opacity-80"
                }`}
              >
                All
              </button>

              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                const active = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "cth-button-primary"
                        : "border border-[var(--cth-app-border)] cth-card-muted cth-muted hover:opacity-80"
                    }`}
                  >
                    <Icon size={15} />
                    {category.name}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="cth-button-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              <Plus size={16} />
              New System
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-[var(--cth-app-border)] cth-card">
              <div className="inline-flex items-center gap-3 cth-muted">
                <Loader2 size={18} className="animate-spin" />
                Loading systems...
              </div>
            </div>
          ) : filteredSystems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--cth-app-border)] cth-card p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl cth-card-muted">
                <Cog size={22} className="cth-muted" />
              </div>
              <h3 className="mt-4 text-lg font-semibold cth-heading">No systems documented yet</h3>
              <p className="mt-2 text-sm cth-muted">
                Start with the repeatable workflows that keep your brand moving, like lead handling,
                offer delivery, onboarding, or content production.
              </p>
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="cth-button-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                <Plus size={16} />
                Create your first system
              </button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredSystems.map((system) => (
                <div key={system.id || system.name}>
                  <SystemCard
                    system={system}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteSystem}
                    onOpen={setViewingSystem}
                  />
                </div>
              ))}
            </div>
          )}

          {viewingSystem ? (
            <div className="rounded-3xl border border-[var(--cth-app-border)] cth-card p-6">
              <div className="flex flex-col gap-4 border-b border-[var(--cth-app-border)] pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] cth-muted">System detail</div>
                  <h3 className="mt-2 text-2xl font-semibold cth-heading">{viewingSystem.name}</h3>
                  <p className="mt-2 max-w-3xl text-sm cth-muted">
                    {viewingSystem.description || "No description added yet."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(viewingSystem)}
                    className="rounded-2xl border border-[var(--cth-app-border)] px-4 py-2 text-sm font-semibold cth-heading hover:opacity-80"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingSystem(null)}
                    className="rounded-2xl border border-[var(--cth-app-border)] px-4 py-2 text-sm font-semibold cth-heading hover:opacity-80"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {viewingSystem.steps.length ? (
                  viewingSystem.steps.map((step, index) => (
                    <div
                      key={`${viewingSystem.id || viewingSystem.name}-step-${index}`}
                      className="rounded-2xl border cth-card-muted p-4" style={{ borderColor: "var(--cth-app-border)" }}
                    >
                      <div className="text-xs uppercase tracking-[0.18em] cth-muted">
                        Step {index + 1}
                      </div>
                      <div className="mt-2 text-base font-semibold cth-heading">
                        {step.title || `Step ${index + 1}`}
                      </div>
                      <div className="mt-2 text-sm cth-muted">
                        {step.description || "No description added."}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--cth-app-border)] p-5 text-sm cth-muted">
                    No steps documented for this system yet.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border cth-card shadow-2xl" style={{ borderColor: "var(--cth-app-border)" }}>
            <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "var(--cth-app-border)" }}>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] cth-muted">
                  {editingSystem ? "Edit system" : "New system"}
                </div>
                <h3 className="mt-2 text-xl font-semibold cth-heading">
                  {editingSystem ? "Update your system" : "Create a repeatable system"}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border p-2 cth-muted hover:opacity-80" style={{ borderColor: "var(--cth-app-border)" }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto px-6 py-5 space-y-5">
              {generationError ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  {generationError}
                </div>
              ) : null}

              <div className="rounded-2xl border cth-card-muted p-4 space-y-4" style={{ borderColor: "var(--cth-app-border)" }}>
                <div>
                  <div className="text-sm font-medium cth-heading">Generate Full System with AI</div>
                  <div className="mt-1 text-xs cth-muted">
                    Describe the system you want, and AI will draft the name, description, category, and steps.
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={formData.prompt}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, prompt: event.target.value }))
                  }
                  placeholder="Example: Create a lead nurture system that moves new inquiries from first contact to booked consultation."
                  className="cth-textarea w-full rounded-2xl px-4 py-3 text-sm"
                />

                <button
                  type="button"
                  onClick={handleGenerateFullSystem}
                  disabled={isGeneratingFullSystem}
                  className="cth-button-secondary inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGeneratingFullSystem ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating full system...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate full system
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium cth-heading">System name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ex: Lead nurture workflow"
                  className="cth-textarea w-full rounded-2xl px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium cth-heading">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="What this system is for and why it matters..."
                  className="cth-textarea w-full rounded-2xl px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium cth-heading">Category</label>
                <select
                  value={formData.category}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className="cth-select w-full rounded-2xl px-4 py-3 text-sm"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border cth-card-muted p-4" style={{ borderColor: "var(--cth-app-border)" }}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-medium cth-heading">Generate Steps with AI</div>
                    <div className="mt-1 text-xs cth-muted">
                      Already have the system name and description? Generate just the operational steps.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSteps}
                    disabled={isGeneratingSteps}
                    className="inline-flex items-center gap-2 rounded-2xl border border-[var(--cth-app-border)] px-4 py-2.5 text-sm font-semibold cth-heading hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGeneratingSteps ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={16} />
                        Generate steps
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium cth-heading">Steps</div>
                    <div className="text-xs cth-muted">
                      Outline the sequence so this becomes a repeatable operating system.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="cth-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                  >
                    <Plus size={14} />
                    Add step
                  </button>
                </div>

                {formData.steps.map((step, index) => (
                  <StepEditor
                    key={`step-${index}`}
                    index={index}
                    step={step}
                    onChange={handleStepChange}
                    onRemove={handleRemoveStep}
                    disableRemove={formData.steps.length <= 1}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t px-6 py-5" style={{ borderColor: "var(--cth-app-border)" }}>
              <button
                type="button"
                onClick={handleCloseModal}
                className="cth-button-secondary rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveSystem}
                disabled={saving}
                className="cth-button-primary inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {editingSystem ? "Save changes" : "Create system"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}