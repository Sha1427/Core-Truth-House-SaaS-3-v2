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
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
};

const SUBHEAD_STYLE = {
  fontFamily: SERIF,
  fontSize: 18,
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
  padding: "10px 14px",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  padding: "10px 14px",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
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

const ICON_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-muted)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const CATEGORIES = [
  { id: "marketing", name: "Marketing", icon: Megaphone, accent: "var(--cth-command-crimson)" },
  { id: "sales", name: "Sales", icon: ShoppingCart, accent: "var(--cth-command-cinnabar)" },
  { id: "delivery", name: "Delivery", icon: Truck, accent: "var(--cth-command-purple)" },
  { id: "operations", name: "Operations", icon: Settings, accent: "var(--cth-command-gold)" },
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

function hasFormContent(formData) {
  if ((formData.name || "").trim()) return true;
  if ((formData.description || "").trim()) return true;
  if ((formData.prompt || "").trim()) return true;
  if (
    Array.isArray(formData.steps) &&
    formData.steps.some(
      (step) => (step.title || "").trim() || (step.description || "").trim()
    )
  ) {
    return true;
  }
  return false;
}

function hasMeaningfulSteps(steps) {
  if (!Array.isArray(steps)) return false;
  return steps.some(
    (step) => (step.title || "").trim() || (step.description || "").trim()
  );
}

function isFormDirtyVsOriginal(formData, editingSystem) {
  if ((formData.prompt || "").trim()) return true;

  const original = editingSystem || {
    name: "",
    description: "",
    category: "marketing",
    steps: [],
  };

  if ((formData.name || "").trim() !== (original.name || "").trim()) return true;
  if ((formData.description || "").trim() !== (original.description || "").trim()) return true;
  if ((formData.category || "marketing") !== (original.category || "marketing")) return true;

  const steps = formData.steps || [];
  const originalSteps = original.steps || [];

  if (!editingSystem) {
    return hasMeaningfulSteps(steps);
  }

  if (steps.length !== originalSteps.length) return true;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const orig = originalSteps[i] || { title: "", description: "" };
    if ((step.title || "").trim() !== (orig.title || "").trim()) return true;
    if ((step.description || "").trim() !== (orig.description || "").trim()) return true;
  }

  return false;
}

function StepEditor({ index, step, onChange, onRemove, disableRemove = false }) {
  return (
    <div style={{ ...CARD_STYLE, background: "var(--cth-command-panel-soft)", padding: 16 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <p style={SECTION_LABEL_STYLE}>Step {index + 1}</p>
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={disableRemove}
          aria-label={`Remove step ${index + 1}`}
          style={{
            background: "transparent",
            border: "none",
            color: disableRemove ? "var(--cth-command-muted)" : "var(--cth-command-crimson)",
            cursor: disableRemove ? "not-allowed" : "pointer",
            opacity: disableRemove ? 0.4 : 1,
            padding: 4,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label style={FIELD_LABEL_STYLE}>Step title</label>
          <input
            type="text"
            value={step.title || ""}
            onChange={(event) => onChange(index, "title", event.target.value)}
            placeholder="Short, action-oriented title"
            style={{ ...INPUT_STYLE, marginTop: 6 }}
          />
        </div>

        <div>
          <label style={FIELD_LABEL_STYLE}>Step description</label>
          <textarea
            rows={3}
            value={step.description || ""}
            onChange={(event) => onChange(index, "description", event.target.value)}
            placeholder="What happens at this step and why"
            style={{ ...TEXTAREA_STYLE, marginTop: 6 }}
          />
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, subtitle, accent }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: accent,
            display: "inline-block",
          }}
        />
        <p style={{ ...SECTION_LABEL_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>
          {label}
        </p>
      </div>
      <p
        style={{
          fontFamily: SERIF,
          fontSize: 32,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          lineHeight: 1,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </p>
      {subtitle ? (
        <p style={{ ...MUTED_STYLE, fontSize: 11 }}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function CategoryBadge({ category }) {
  const Icon = category.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        background: "color-mix(in srgb, " + category.accent + " 12%, transparent)",
        color: category.accent,
        borderRadius: 4,
        padding: "4px 10px",
        fontFamily: SANS,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      <Icon size={12} />
      {category.name}
    </span>
  );
}

function SystemCard({ system, onEdit, onDelete, onOpen }) {
  const category = getCategoryInfo(system.category);

  return (
    <div style={{ ...CARD_STYLE, padding: 24 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3 min-w-0 flex-1">
          <CategoryBadge category={category} />
          <div>
            <h3 style={SUBHEAD_STYLE}>{system.name || "Untitled system"}</h3>
            <p style={{ ...MUTED_STYLE, marginTop: 6, fontSize: 13 }}>
              {system.description || "No description added yet."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(system)}
            aria-label={`Edit ${system.name}`}
            style={ICON_BUTTON_STYLE}
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(system)}
            aria-label={`Delete ${system.name}`}
            style={{
              ...ICON_BUTTON_STYLE,
              color: "var(--cth-command-crimson)",
              borderColor: "color-mix(in srgb, var(--cth-command-crimson) 35%, var(--cth-command-border))",
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div
        className="mt-5 flex items-center justify-between"
        style={{
          ...CARD_STYLE,
          background: "var(--cth-command-panel-soft)",
          padding: "12px 16px",
        }}
      >
        <div>
          <p style={{ ...SECTION_LABEL_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>
            Steps
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              margin: "4px 0 0",
              lineHeight: 1,
            }}
          >
            {system.steps.length}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpen(system)}
          style={{ ...PRIMARY_CTA_STYLE, padding: "8px 14px", fontSize: 12 }}
        >
          View
          <ChevronRight size={14} />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showModal, setShowModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [viewingSystem, setViewingSystem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [isGeneratingFullSystem, setIsGeneratingFullSystem] = useState(false);
  const [generationError, setGenerationError] = useState("");

  // Confirmation modal states
  const [pendingDeleteSystem, setPendingDeleteSystem] = useState(null);
  const [confirmReplaceFullOpen, setConfirmReplaceFullOpen] = useState(false);
  const [confirmReplaceStepsOpen, setConfirmReplaceStepsOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

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

  function handleCloseModalImmediate() {
    setShowModal(false);
    resetForm();
    setGenerationError("");
  }

  function handleCloseModal() {
    if (isFormDirtyVsOriginal(formData, editingSystem)) {
      setConfirmDiscardOpen(true);
      return;
    }
    handleCloseModalImmediate();
  }

  function handleAddStep() {
    setFormData((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), { title: "", description: "" }],
    }));
  }

  function handleStepChange(index, field, value) {
    setFormData((prev) => {
      const steps = [...(prev.steps || [])];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, steps };
    });
  }

  function handleRemoveStep(index) {
    setFormData((prev) => {
      const steps = [...(prev.steps || [])];
      steps.splice(index, 1);
      return {
        ...prev,
        steps: steps.length ? steps : [{ title: "", description: "" }],
      };
    });
  }

  async function runGenerateSteps() {
    setIsGeneratingSteps(true);
    setGenerationError("");

    try {
      const response = await apiClient.post("/api/systems/generate-steps", {
        name: formData.name,
        description: formData.description,
        category: formData.category,
      });

      const generated = Array.isArray(response?.steps) ? response.steps : [];
      const normalized = generated.length
        ? generated.map(normalizeStep)
        : [{ title: "", description: "" }];

      setFormData((prev) => ({ ...prev, steps: normalized }));
    } catch (err) {
      console.error("Failed to generate steps:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate steps."));
    } finally {
      setIsGeneratingSteps(false);
    }
  }

  async function runGenerateFullSystem() {
    setIsGeneratingFullSystem(true);
    setGenerationError("");

    try {
      const response = await apiClient.post("/api/systems/generate-system", {
        prompt: formData.prompt,
      });

      const result = response || {};
      setFormData((prev) => ({
        ...prev,
        name: result.name || prev.name,
        description: result.description || prev.description,
        category: result.category || prev.category,
        steps: Array.isArray(result.steps) && result.steps.length
          ? result.steps.map(normalizeStep)
          : prev.steps,
      }));
    } catch (err) {
      console.error("Failed to generate full system:", err);
      setGenerationError(getErrorMessage(err, "Failed to generate system."));
    } finally {
      setIsGeneratingFullSystem(false);
    }
  }

  function handleGenerateSteps() {
    if (hasMeaningfulSteps(formData.steps)) {
      setConfirmReplaceStepsOpen(true);
      return;
    }
    runGenerateSteps();
  }

  function handleGenerateFullSystem() {
    const hasContent =
      (formData.name || "").trim() ||
      (formData.description || "").trim() ||
      hasMeaningfulSteps(formData.steps);

    if (hasContent) {
      setConfirmReplaceFullOpen(true);
      return;
    }
    runGenerateFullSystem();
  }

  async function handleSaveSystem() {
    setError("");
    setSuccessMessage("");
    setGenerationError("");
    setSaving(true);

    try {
      const payload = buildSystemPayload(formData);

      if (!payload.name) {
        setGenerationError("System name is required.");
        setSaving(false);
        return;
      }

      if (editingSystem?.id) {
        await apiClient.put(`/api/systems/${editingSystem.id}`, payload);
        setSuccessMessage("System updated.");
      } else {
        await apiClient.post("/api/systems", payload);
        setSuccessMessage("System created.");
      }

      setShowModal(false);
      resetForm();
      setSearchQuery("");
      await loadSystems();
    } catch (err) {
      console.error("Failed to save system:", err);
      setError(getErrorMessage(err, "Failed to save system."));
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteSystem(system) {
    setPendingDeleteSystem(system);
  }

  async function performDelete() {
    const system = pendingDeleteSystem;
    setPendingDeleteSystem(null);
    if (!system) return;

    const systemId = system.id;
    if (!systemId) return;

    setDeletingId(systemId);
    setError("");
    setSuccessMessage("");

    try {
      await apiClient.delete(`/api/systems/${systemId}`);
      setSuccessMessage("System deleted.");
      if (viewingSystem?.id === systemId) setViewingSystem(null);
      await loadSystems();
    } catch (err) {
      console.error("Failed to delete system:", err);
      setError(getErrorMessage(err, "Failed to delete system."));
    } finally {
      setDeletingId("");
    }
  }

  const filteredSystems = useMemo(() => {
    let list =
      selectedCategory === "all"
        ? systems
        : systems.filter((system) => system.category === selectedCategory);

    const term = searchQuery.trim().toLowerCase();
    if (term) {
      list = list.filter((system) =>
        (system.name || "").toLowerCase().includes(term)
      );
    }

    const sorted = [...list];
    switch (sortOrder) {
      case "oldest":
        sorted.sort((a, b) =>
          String(a.created_at || "").localeCompare(String(b.created_at || ""))
        );
        break;
      case "name-asc":
        sorted.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );
        break;
      case "name-desc":
        sorted.sort((a, b) =>
          String(b.name || "").localeCompare(String(a.name || ""))
        );
        break;
      case "category":
        sorted.sort((a, b) =>
          String(a.category || "").localeCompare(String(b.category || ""))
        );
        break;
      case "newest":
      default:
        sorted.sort((a, b) =>
          String(b.created_at || "").localeCompare(String(a.created_at || ""))
        );
        break;
    }

    return sorted;
  }, [systems, selectedCategory, searchQuery, sortOrder]);

  const totalSteps = useMemo(() => {
    return systems.reduce((sum, system) => sum + system.steps.length, 0);
  }, [systems]);

  const categoryFilterStyle = (active) =>
    active
      ? {
          background: "var(--cth-command-purple)",
          color: "var(--cth-command-gold)",
          border: "1px solid var(--cth-command-purple)",
          borderRadius: 4,
          padding: "8px 14px",
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.04em",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }
      : {
          background: "transparent",
          color: "var(--cth-command-muted)",
          border: "1px solid var(--cth-command-border)",
          borderRadius: 4,
          padding: "8px 14px",
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        };

  const isAllFilter = selectedCategory === "all";
  const activeCategoryName = isAllFilter
    ? ""
    : getCategoryInfo(selectedCategory).name;

  return (
    <DashboardLayout>
      <TopBar
        title="Structure"
        subtitle="Build the repeatable operating systems behind how your brand runs."
      />

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="systems-builder-page"
      >
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Stats row */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatTile
              label="Active Workspace"
              value={currentWorkspace?.name || "Workspace"}
              subtitle={workspaceId || "No workspace id found"}
              accent="var(--cth-command-crimson)"
            />
            <StatTile
              label="Systems"
              value={systems.length}
              subtitle="Documented repeatable workflows"
              accent="var(--cth-command-crimson)"
            />
            <StatTile
              label="Steps Mapped"
              value={totalSteps}
              subtitle="Operational actions across your systems"
              accent="var(--cth-command-crimson)"
            />
          </div>

          {/* Error / Success banners */}
          {error ? (
            <div
              className="flex items-start gap-3"
              style={{
                ...CARD_STYLE,
                borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                padding: 14,
                color: "var(--cth-danger)",
                fontFamily: SANS,
                fontSize: 13,
              }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>{error}</div>
            </div>
          ) : null}

          {successMessage ? (
            <div
              style={{
                ...CARD_STYLE,
                borderColor: "color-mix(in srgb, var(--cth-status-success-bright) 35%, var(--cth-command-border))",
                background: "color-mix(in srgb, var(--cth-status-success-bright) 8%, var(--cth-command-panel))",
                padding: 14,
                fontFamily: SANS,
                fontSize: 13,
                color: "var(--cth-status-success-bright)",
                fontWeight: 500,
              }}
            >
              {successMessage}
            </div>
          ) : null}

          {/* Filter + new button row */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                style={categoryFilterStyle(selectedCategory === "all")}
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
                    style={categoryFilterStyle(active)}
                  >
                    <Icon size={13} />
                    {category.name}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search systems..."
                data-testid="systems-search-input"
                style={{
                  background: "var(--cth-command-panel)",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: "8px 12px",
                  fontFamily: SANS,
                  fontSize: 13,
                  outline: "none",
                  width: 220,
                }}
              />

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                data-testid="systems-sort-select"
                style={{
                  background: "var(--cth-command-panel)",
                  color: "var(--cth-command-ink)",
                  border: "1px solid var(--cth-command-border)",
                  borderRadius: 4,
                  padding: "8px 12px",
                  fontFamily: SANS,
                  fontSize: 13,
                  outline: "none",
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="category">Category</option>
              </select>

              <button
                type="button"
                onClick={() => handleOpenModal()}
                data-testid="new-system-btn"
                style={PRIMARY_CTA_STYLE}
              >
                <Plus size={14} />
                New System
              </button>
            </div>
          </div>

          {/* List states */}
          {loading ? (
            <div
              className="flex items-center justify-center"
              style={{ ...CARD_STYLE, minHeight: 240 }}
            >
              <div
                className="inline-flex items-center gap-3"
                style={{ fontFamily: SANS, color: "var(--cth-command-muted)" }}
              >
                <Loader2
                  size={18}
                  className="animate-spin"
                  style={{ color: "var(--cth-command-crimson)" }}
                />
                Loading systems...
              </div>
            </div>
          ) : filteredSystems.length === 0 ? (
            <div
              style={{
                ...CARD_STYLE,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div
                className="mx-auto flex items-center justify-center"
                style={{
                  ...CARD_STYLE,
                  background: "var(--cth-command-panel-soft)",
                  width: 56,
                  height: 56,
                }}
              >
                <Cog size={22} style={{ color: "var(--cth-command-muted)" }} />
              </div>
              <h3 style={{ ...SECTION_HEADING_STYLE, fontSize: 22, marginTop: 16 }}>
                {searchQuery.trim()
                  ? `No systems matching "${searchQuery.trim()}"`
                  : isAllFilter
                  ? "No systems documented yet"
                  : `No ${activeCategoryName} systems yet`}
              </h3>
              <p
                style={{
                  ...MUTED_STYLE,
                  fontSize: 13,
                  margin: "8px auto 0",
                  maxWidth: 480,
                  lineHeight: 1.6,
                }}
              >
                {searchQuery.trim()
                  ? "Try a different search term or clear the search to see all systems."
                  : isAllFilter
                  ? "Start with the repeatable workflows that keep your brand moving, like lead handling, offer delivery, onboarding, or content production."
                  : `Create your first ${activeCategoryName.toLowerCase()} system to document how this area of your brand runs.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!isAllFilter) {
                    handleOpenModal();
                    setFormData((prev) => ({ ...prev, category: selectedCategory }));
                    return;
                  }
                  handleOpenModal();
                }}
                style={{ ...PRIMARY_CTA_STYLE, marginTop: 20 }}
              >
                <Plus size={14} />
                {isAllFilter
                  ? "Create your first system"
                  : `Create ${activeCategoryName.toLowerCase()} system`}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredSystems.map((system) => (
                <SystemCard
                  key={system.id || system.name}
                  system={system}
                  onEdit={handleOpenModal}
                  onDelete={handleDeleteSystem}
                  onOpen={setViewingSystem}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System detail drawer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          pointerEvents: viewingSystem ? "auto" : "none",
          visibility: viewingSystem ? "visible" : "hidden",
        }}
        aria-hidden={!viewingSystem}
      >
        <div
          onClick={() => setViewingSystem(null)}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(13, 0, 16, 0.5)",
            opacity: viewingSystem ? 1 : 0,
            transition: "opacity 220ms ease",
          }}
        />
        <div
          role="dialog"
          aria-label="System detail"
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: 520,
            maxWidth: "92vw",
            background: "var(--cth-command-panel)",
            borderLeft: "1px solid var(--cth-command-border)",
            zIndex: 51,
            display: "flex",
            flexDirection: "column",
            transform: viewingSystem ? "translateX(0)" : "translateX(100%)",
            transition: "transform 280ms ease",
            boxShadow: "-12px 0 40px rgba(13, 0, 16, 0.18)",
          }}
        >
          {viewingSystem ? (
            <>
              <div
                className="flex items-start justify-between gap-4"
                style={{
                  padding: 24,
                  borderBottom: "1px solid var(--cth-command-border)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <p style={SECTION_LABEL_STYLE}>System Detail</p>
                  <h2 style={{ ...SECTION_HEADING_STYLE, marginTop: 6 }}>
                    {viewingSystem.name}
                  </h2>
                  <div style={{ marginTop: 10 }}>
                    <CategoryBadge category={getCategoryInfo(viewingSystem.category)} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingSystem(null)}
                  aria-label="Close drawer"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 6,
                    color: "var(--cth-command-muted)",
                    display: "inline-flex",
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
                <p style={SECTION_LABEL_STYLE}>Description</p>
                <p
                  style={{
                    ...BODY_STYLE,
                    fontSize: 14,
                    lineHeight: 1.7,
                    marginTop: 8,
                  }}
                >
                  {viewingSystem.description || "No description added yet."}
                </p>

                <div style={{ marginTop: 28 }}>
                  <p style={SECTION_LABEL_STYLE}>
                    Steps ({viewingSystem.steps.length})
                  </p>

                  <div className="mt-3 space-y-3">
                    {viewingSystem.steps.length ? (
                      viewingSystem.steps.map((step, index) => (
                        <div
                          key={`${viewingSystem.id || viewingSystem.name}-step-${index}`}
                          style={{
                            ...CARD_STYLE,
                            background: "var(--cth-command-panel-soft)",
                            padding: 16,
                          }}
                        >
                          <p style={{ ...SECTION_LABEL_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>
                            Step {index + 1}
                          </p>
                          <p
                            style={{
                              fontFamily: SERIF,
                              fontSize: 15,
                              fontWeight: 600,
                              color: "var(--cth-command-ink)",
                              margin: "6px 0 0",
                              letterSpacing: "-0.005em",
                            }}
                          >
                            {step.title || `Step ${index + 1}`}
                          </p>
                          <p style={{ ...BODY_STYLE, marginTop: 8, fontSize: 13, lineHeight: 1.65 }}>
                            {step.description || "No description added."}
                          </p>
                        </div>
                      ))
                    ) : (
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
                        No steps documented for this system yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-3"
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid var(--cth-command-border)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewingSystem(null)}
                  style={SECONDARY_BUTTON_STYLE}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const system = viewingSystem;
                    setViewingSystem(null);
                    handleOpenModal(system);
                  }}
                  style={PRIMARY_CTA_STYLE}
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Create / edit modal */}
      {showModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingSystem ? "Edit System" : "New System"}
          onClick={handleCloseModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
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
              maxWidth: 680,
              maxHeight: "calc(100vh - 48px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="flex items-start justify-between gap-4"
              style={{
                padding: 24,
                borderBottom: "1px solid var(--cth-command-border)",
              }}
            >
              <div>
                <p style={SECTION_LABEL_STYLE}>
                  {editingSystem ? "Edit System" : "New System"}
                </p>
                <h3 style={{ ...SECTION_HEADING_STYLE, marginTop: 6 }}>
                  {editingSystem ? "Update your system" : "Create a repeatable system"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Close modal"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 6,
                  color: "var(--cth-command-muted)",
                  display: "inline-flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="flex-1 overflow-auto space-y-5"
              style={{ padding: 24 }}
            >
              {generationError ? (
                <div
                  style={{
                    ...CARD_STYLE,
                    borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
                    background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
                    padding: 12,
                    fontFamily: SANS,
                    fontSize: 13,
                    color: "var(--cth-danger)",
                  }}
                >
                  {generationError}
                </div>
              ) : null}

              {/* AI Generate Full System */}
              <div
                style={{
                  ...CARD_STYLE,
                  background: "var(--cth-command-panel-soft)",
                  padding: 16,
                }}
              >
                <p style={SECTION_LABEL_STYLE}>Generate Full System with AI</p>
                <p style={{ ...MUTED_STYLE, marginTop: 6, fontSize: 12 }}>
                  Describe the system you want, and AI will draft the name, description, category, and steps.
                </p>

                <textarea
                  rows={3}
                  value={formData.prompt}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, prompt: event.target.value }))
                  }
                  placeholder="Example: Create a lead nurture system that moves new inquiries from first contact to booked consultation."
                  style={{ ...TEXTAREA_STYLE, marginTop: 12 }}
                />

                <button
                  type="button"
                  onClick={handleGenerateFullSystem}
                  disabled={isGeneratingFullSystem}
                  style={{
                    ...PRIMARY_CTA_STYLE,
                    marginTop: 12,
                    opacity: isGeneratingFullSystem ? 0.65 : 1,
                    cursor: isGeneratingFullSystem ? "not-allowed" : "pointer",
                  }}
                >
                  {isGeneratingFullSystem ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating full system...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate full system
                    </>
                  )}
                </button>
              </div>

              <div>
                <label style={FIELD_LABEL_STYLE}>System name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Ex: Lead nurture workflow"
                  style={{ ...INPUT_STYLE, marginTop: 6 }}
                />
              </div>

              <div>
                <label style={FIELD_LABEL_STYLE}>Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="What this system is for and why it matters..."
                  style={{ ...TEXTAREA_STYLE, marginTop: 6 }}
                />
              </div>

              <div>
                <label style={FIELD_LABEL_STYLE}>Category</label>
                <select
                  value={formData.category}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, category: event.target.value }))
                  }
                  style={{ ...INPUT_STYLE, marginTop: 6 }}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* AI Generate Steps */}
              <div
                style={{
                  ...CARD_STYLE,
                  background: "var(--cth-command-panel-soft)",
                  padding: 16,
                }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p style={SECTION_LABEL_STYLE}>Generate Steps with AI</p>
                    <p style={{ ...MUTED_STYLE, marginTop: 6, fontSize: 12 }}>
                      Already have a name and description? Generate just the operational steps.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSteps}
                    disabled={isGeneratingSteps}
                    style={{
                      ...SECONDARY_BUTTON_STYLE,
                      opacity: isGeneratingSteps ? 0.65 : 1,
                      cursor: isGeneratingSteps ? "not-allowed" : "pointer",
                    }}
                  >
                    {isGeneratingSteps ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 size={14} />
                        Generate steps
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <div>
                    <p style={SECTION_LABEL_STYLE}>Steps</p>
                    <p style={{ ...MUTED_STYLE, marginTop: 4, fontSize: 12 }}>
                      Outline the sequence so this becomes a repeatable operating system.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddStep}
                    style={{ ...SECONDARY_BUTTON_STYLE, padding: "8px 14px", fontSize: 12 }}
                  >
                    <Plus size={14} />
                    Add step
                  </button>
                </div>

                <div className="space-y-3">
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
            </div>

            <div
              className="flex items-center justify-end gap-3"
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--cth-command-border)",
              }}
            >
              <button
                type="button"
                onClick={handleCloseModal}
                style={SECONDARY_BUTTON_STYLE}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSystem}
                disabled={saving}
                data-testid="save-system-btn"
                style={{
                  ...PRIMARY_CTA_STYLE,
                  opacity: saving ? 0.65 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {editingSystem ? "Save changes" : "Create system"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm: Delete System */}
      {pendingDeleteSystem ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete System"
          onClick={() => setPendingDeleteSystem(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
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
            <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Delete System</h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: "var(--cth-command-muted)",
                margin: "12px 0 0",
                lineHeight: 1.6,
              }}
            >
              This will permanently delete this system and all its steps. This cannot be undone.
            </p>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--cth-command-muted)",
                margin: "8px 0 24px",
                wordBreak: "break-word",
              }}
            >
              {pendingDeleteSystem.name || "Untitled system"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteSystem(null)}
                style={SECONDARY_BUTTON_STYLE}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performDelete}
                data-testid="confirm-delete-system-btn"
                style={DESTRUCTIVE_BUTTON_STYLE}
              >
                Delete System
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm: Replace Full System */}
      {confirmReplaceFullOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Replace Current Draft"
          onClick={() => setConfirmReplaceFullOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
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
            <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Replace Current Draft</h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: "var(--cth-command-muted)",
                margin: "12px 0 24px",
                lineHeight: 1.6,
              }}
            >
              Generating a full system will replace your current name, description, category, and all steps. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmReplaceFullOpen(false)}
                style={SECONDARY_BUTTON_STYLE}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReplaceFullOpen(false);
                  runGenerateFullSystem();
                }}
                style={PRIMARY_CTA_STYLE}
              >
                <Sparkles size={14} />
                Generate Anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm: Replace Steps */}
      {confirmReplaceStepsOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Replace Current Steps"
          onClick={() => setConfirmReplaceStepsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
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
            <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Replace Current Steps</h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: "var(--cth-command-muted)",
                margin: "12px 0 24px",
                lineHeight: 1.6,
              }}
            >
              Generating new steps will replace all your current steps. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmReplaceStepsOpen(false)}
                style={SECONDARY_BUTTON_STYLE}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmReplaceStepsOpen(false);
                  runGenerateSteps();
                }}
                style={PRIMARY_CTA_STYLE}
              >
                <Wand2 size={14} />
                Generate Steps
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm: Discard Changes */}
      {confirmDiscardOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Discard Changes"
          onClick={() => setConfirmDiscardOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
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
            <h2 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Discard Changes</h2>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 14,
                color: "var(--cth-command-muted)",
                margin: "12px 0 24px",
                lineHeight: 1.6,
              }}
            >
              You have unsaved changes that will be lost if you close this.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDiscardOpen(false)}
                style={SECONDARY_BUTTON_STYLE}
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscardOpen(false);
                  handleCloseModalImmediate();
                }}
                style={DESTRUCTIVE_BUTTON_STYLE}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
