import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import DeleteAvatarModal from "../components/audience/DeleteAvatarModal";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const STAGE_OPTIONS = [
  { value: "unaware", label: "Unaware (no awareness of the problem yet)" },
  { value: "problem_aware", label: "Problem Aware (knows the pain, not the solution)" },
  { value: "solution_aware", label: "Solution Aware (knows solutions exist)" },
  { value: "product_aware", label: "Product Aware (knows your product, comparing options)" },
  { value: "most_aware", label: "Most Aware (ready, just needs the offer)" },
];

const INITIAL_FORM = {
  name: "",
  stage: "problem_aware",
  core_fear: "",
  core_desire: "",
  primary_problem: "",
  emotional_trigger: "",
  description: "",
  surface_symptoms: [],
  where_they_are: [],
  objections: [],
  transformation_desired: "",
};

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const BODY_WRAP_STYLE = {
  padding: "28px 24px 96px",
  maxWidth: 880,
  margin: "0 auto",
  fontFamily: SANS,
};

const SECTION_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  marginBottom: 20,
  overflow: "hidden",
};

const SECTION_HEADER_STYLE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "20px 24px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: SANS,
};

const SECTION_TITLE_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
};

const SECTION_HINT_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  color: "var(--cth-command-muted)",
  margin: "4px 0 0 0",
};

const SECTION_BODY_STYLE = {
  padding: "0 24px 24px",
  borderTop: "1px solid var(--cth-command-border)",
};

const FIELD_GROUP_STYLE = {
  marginTop: 22,
};

const FIELD_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  display: "inline-block",
};

const REQUIRED_MARK_STYLE = {
  color: "var(--cth-command-crimson)",
  marginLeft: 2,
};

const FIELD_HINT_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  color: "var(--cth-command-muted)",
  margin: "4px 0 8px 0",
};

const FIELD_ERROR_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  color: "var(--cth-danger)",
  margin: "6px 0 0 0",
};

const INPUT_STYLE = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 4,
  border: "1px solid var(--cth-command-border)",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 14,
  marginTop: 8,
  outline: "none",
  boxSizing: "border-box",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  minHeight: 96,
  resize: "vertical",
  lineHeight: 1.55,
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 999,
  padding: "12px 24px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

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

const DESTRUCTIVE_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-danger)",
  border: "1px solid color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
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

const ACTIONS_ROW_STYLE = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginTop: 28,
  flexWrap: "wrap",
};

const INCOMPLETE_BANNER_STYLE = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "16px 18px",
  borderRadius: 4,
  background: "color-mix(in srgb, #B45309 10%, var(--cth-command-panel))",
  border: "1px solid color-mix(in srgb, #B45309 30%, var(--cth-command-border))",
  color: "#7A3E08",
  marginBottom: 20,
  fontFamily: SANS,
};

const PRIMARY_TOGGLE_ROW_STYLE = {
  ...FIELD_GROUP_STYLE,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "16px 0 0",
  borderTop: "1px dashed var(--cth-command-border)",
  flexWrap: "wrap",
};

const PRIMARY_PILL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
  borderRadius: 999,
  background: "var(--cth-command-gold)",
  color: "var(--cth-command-purple)",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const TAG_WRAP_STYLE = {
  ...INPUT_STYLE,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
  padding: "8px 10px",
  minHeight: 44,
};

const TAG_CHIP_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 4px 4px 10px",
  borderRadius: 999,
  background: "var(--cth-command-panel-soft)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
};

const TAG_REMOVE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  borderRadius: 999,
  border: "none",
  background: "transparent",
  color: "var(--cth-command-muted)",
  cursor: "pointer",
};

const TAG_INPUT_INLINE_STYLE = {
  flex: 1,
  minWidth: 120,
  border: "none",
  outline: "none",
  background: "transparent",
  fontFamily: SANS,
  fontSize: 14,
  color: "var(--cth-command-ink)",
  padding: "4px 4px",
};

function validate(form, requireCoreFear) {
  const errors = {};
  if (!form.name?.trim()) errors.name = "Name is required.";
  else if (form.name.length > 200) errors.name = "Name must be 200 characters or fewer.";
  if (!form.stage) errors.stage = "Stage is required.";
  if (!form.core_desire?.trim()) errors.core_desire = "Core desire is required.";
  if (!form.primary_problem?.trim()) errors.primary_problem = "Primary problem is required.";
  if (!form.emotional_trigger?.trim()) errors.emotional_trigger = "Emotional trigger is required.";
  if (requireCoreFear && !form.core_fear?.trim()) errors.core_fear = "Core fear is required.";
  return errors;
}

function CollapsibleSection({ title, hint, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={SECTION_STYLE}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={SECTION_HEADER_STYLE}
        aria-expanded={open}
      >
        <div>
          <h2 style={SECTION_TITLE_STYLE}>{title}</h2>
          {hint && <p style={SECTION_HINT_STYLE}>{hint}</p>}
        </div>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && <div style={SECTION_BODY_STYLE}>{children}</div>}
    </section>
  );
}

function FieldGroup({ label, hint, error, required, children, meta }) {
  return (
    <div style={FIELD_GROUP_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <label style={FIELD_LABEL_STYLE}>
          {label}
          {required && <span style={REQUIRED_MARK_STYLE}>*</span>}
        </label>
        {meta && (
          <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
            {meta}
          </span>
        )}
      </div>
      {hint && <p style={FIELD_HINT_STYLE}>{hint}</p>}
      {children}
      {error && <p style={FIELD_ERROR_STYLE}>{error}</p>}
    </div>
  );
}

function TagInput({ label, hint, value, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const addTag = (text) => {
    const t = (text || "").trim();
    if (!t) return;
    if (tags.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...tags, t]);
    setDraft("");
  };

  const removeTag = (index) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <FieldGroup label={label} hint={hint}>
      <div style={TAG_WRAP_STYLE}>
        {tags.map((tag, i) => (
          <span key={`${tag}-${i}`} style={TAG_CHIP_STYLE}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              style={TAG_REMOVE_STYLE}
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && addTag(draft)}
          placeholder={tags.length === 0 ? placeholder : ""}
          style={TAG_INPUT_INLINE_STYLE}
        />
      </div>
    </FieldGroup>
  );
}

function PrimaryToggle({ isNew, isPrimary, isSaving, onSet }) {
  return (
    <div style={PRIMARY_TOGGLE_ROW_STYLE}>
      <div style={{ minWidth: 0 }}>
        <label style={FIELD_LABEL_STYLE}>Primary Avatar</label>
        <p style={{ ...FIELD_HINT_STYLE, margin: "4px 0 0 0" }}>
          {isNew
            ? "Will be promoted to primary right after the avatar is created."
            : isPrimary
            ? "This is the avatar most campaigns default to."
            : "Make this the avatar most campaigns default to."}
        </p>
      </div>
      {isPrimary ? (
        <span style={PRIMARY_PILL_STYLE}>
          <Star size={12} fill="currentColor" stroke="currentColor" />
          {isNew ? "Will be primary" : "Primary"}
        </span>
      ) : (
        <button
          type="button"
          onClick={onSet}
          disabled={isSaving}
          style={{
            ...SECONDARY_BUTTON_STYLE,
            opacity: isSaving ? 0.6 : 1,
            cursor: isSaving ? "wait" : "pointer",
          }}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
          Set as Primary
        </button>
      )}
    </div>
  );
}

function IncompleteBanner() {
  return (
    <div style={INCOMPLETE_BANNER_STYLE}>
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
          Complete this avatar
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>
          This avatar was migrated from earlier campaign data and is missing its
          core fear. Adding it sharpens every campaign and AI-generated asset
          that uses this avatar.
        </p>
      </div>
    </div>
  );
}

export default function AvatarEditor() {
  const navigate = useNavigate();
  const params = useParams();
  const routeId = params.id;
  const isNew = !routeId || routeId === "new";
  const draftKey = `cth.audience.draft.${isNew ? "new" : routeId}`;
  const { activeWorkspaceId } = useWorkspace();

  const [form, setForm] = useState(INITIAL_FORM);
  const [isPrimary, setIsPrimary] = useState(false);
  const [pendingPrimary, setPendingPrimary] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrimarySaving, setIsPrimarySaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const draftRestoredRef = useRef(false);
  const originalCoreFearWasEmptyRef = useRef(false);

  // Load existing avatar in edit mode
  useEffect(() => {
    if (isNew) {
      setIsLoading(false);
      return;
    }
    if (!activeWorkspaceId) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.get(API_PATHS.audience.avatarById(routeId));
        if (cancelled) return;
        const a = data?.avatar;
        if (!a) throw new Error("Avatar response missing.");
        setForm({
          name: a.name || "",
          stage: a.stage || "problem_aware",
          core_fear: a.core_fear || "",
          core_desire: a.core_desire || "",
          primary_problem: a.primary_problem || "",
          emotional_trigger: a.emotional_trigger || "",
          description: a.description || "",
          surface_symptoms: Array.isArray(a.surface_symptoms) ? a.surface_symptoms : [],
          where_they_are: Array.isArray(a.where_they_are) ? a.where_they_are : [],
          objections: Array.isArray(a.objections) ? a.objections : [],
          transformation_desired: a.transformation_desired || "",
        });
        setIsPrimary(!!a.is_primary);
        originalCoreFearWasEmptyRef.current = !(a.core_fear || "").trim();
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 404) {
          toast.error("Avatar not found.");
          navigate("/audience");
          return;
        }
        toast.error("Failed to load avatar. Try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routeId, isNew, activeWorkspaceId, navigate]);

  // Restore localStorage draft once after initial load resolves
  useEffect(() => {
    if (draftRestoredRef.current) return;
    if (isLoading) return;
    draftRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && typeof draft === "object") {
        setForm((prev) => ({ ...prev, ...draft }));
        toast.message("Restored unsaved draft.");
      }
    } catch {
      // ignore unparsable drafts
    }
  }, [draftKey, isLoading]);

  // Auto-save draft to localStorage every 10s
  useEffect(() => {
    if (isLoading) return;
    const interval = setInterval(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(form));
      } catch {
        // quota / private mode — silently ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [form, draftKey, isLoading]);

  const setField = useCallback(
    (key) => (val) => {
      setForm((prev) => ({ ...prev, [key]: val }));
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    },
    [],
  );

  const showIncompleteBanner = useMemo(
    () => !isNew && !form.core_fear?.trim(),
    [isNew, form.core_fear],
  );

  const handleSave = async () => {
    const requireCoreFear = isNew || !originalCoreFearWasEmptyRef.current;
    const validation = validate(form, requireCoreFear);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = { ...form };
      if (isNew) {
        const data = await apiClient.post(API_PATHS.audience.avatars, payload);
        const created = data?.avatar;
        if (!created?.id) throw new Error("Create response missing avatar id.");
        if (pendingPrimary) {
          try {
            await apiClient.post(API_PATHS.audience.setPrimary(created.id));
          } catch {
            toast.error("Avatar created, but failed to set as primary.");
          }
        }
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        toast.success("Avatar created.");
        navigate(`/audience/avatars/${created.id}`, { replace: true });
      } else {
        await apiClient.patch(API_PATHS.audience.avatarById(routeId), payload);
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        toast.success("Avatar saved.");
      }
    } catch (err) {
      if (err?.status === 403) {
        const detail = err?.payload?.detail || err?.message;
        toast.error(detail || "Avatar limit reached. Upgrade to add more.");
      } else if (err?.status === 400) {
        toast.error(err?.payload?.detail || err?.message || "Invalid avatar data.");
      } else {
        toast.error(err?.message || "Failed to save avatar.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPrimary = async () => {
    if (isNew) {
      setPendingPrimary((v) => !v);
      return;
    }
    if (isPrimary) return;
    setIsPrimarySaving(true);
    try {
      await apiClient.post(API_PATHS.audience.setPrimary(routeId));
      setIsPrimary(true);
      toast.success("Set as primary avatar.");
    } catch (err) {
      toast.error(err?.message || "Failed to set primary.");
    } finally {
      setIsPrimarySaving(false);
    }
  };

  const handleDeleted = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    toast.success("Avatar deleted.");
    navigate("/audience");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <TopBar title="Avatar" subtitle="Loading..." />
        <div style={PAGE_STYLE}>
          <div style={BODY_WRAP_STYLE}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                color: "var(--cth-command-muted)",
                padding: "120px 0",
                fontFamily: SANS,
              }}
            >
              <Loader2 size={18} className="animate-spin" />
              Loading avatar...
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopBar
        title={isNew ? "Create Avatar" : form.name || "Avatar"}
        subtitle={
          isNew
            ? "Define a person your brand serves so every campaign pulls from the same source."
            : "Edit this avatar to keep every connected campaign aligned."
        }
        action={
          <button
            type="button"
            onClick={() => navigate("/audience")}
            style={SECONDARY_BUTTON_STYLE}
          >
            <ArrowLeft size={14} />
            Back to Audience
          </button>
        }
      />

      <div style={PAGE_STYLE}>
        <div style={BODY_WRAP_STYLE}>
          {showIncompleteBanner && <IncompleteBanner />}

          <CollapsibleSection
            title="Identity"
            hint="Who they are at the surface."
            defaultOpen
          >
            <FieldGroup
              label="Name"
              required
              error={errors.name}
              meta={`${form.name.length}/200`}
            >
              <input
                type="text"
                value={form.name}
                maxLength={200}
                onChange={(e) => setField("name")(e.target.value)}
                placeholder="e.g., Founder Sarah"
                style={INPUT_STYLE}
              />
            </FieldGroup>

            <FieldGroup label="Awareness Stage" required error={errors.stage}>
              <select
                value={form.stage}
                onChange={(e) => setField("stage")(e.target.value)}
                style={INPUT_STYLE}
              >
                {STAGE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <PrimaryToggle
              isNew={isNew}
              isPrimary={isNew ? pendingPrimary : isPrimary}
              isSaving={isPrimarySaving}
              onSet={handleSetPrimary}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Psychology"
            hint="What drives them under the surface."
            defaultOpen
          >
            <FieldGroup
              label="Core Fear"
              required={isNew || !originalCoreFearWasEmptyRef.current}
              hint="The deepest worry they carry, even if they wouldn't say it out loud."
              error={errors.core_fear}
            >
              <textarea
                value={form.core_fear}
                onChange={(e) => setField("core_fear")(e.target.value)}
                placeholder="Being seen as a fraud after building everything in public."
                style={TEXTAREA_STYLE}
              />
            </FieldGroup>

            <FieldGroup
              label="Core Desire"
              required
              hint="The outcome they truly want, beneath the tactical wish list."
              error={errors.core_desire}
            >
              <textarea
                value={form.core_desire}
                onChange={(e) => setField("core_desire")(e.target.value)}
                placeholder="To build something durable that earns respect from people they respect."
                style={TEXTAREA_STYLE}
              />
            </FieldGroup>

            <FieldGroup
              label="Primary Problem"
              required
              hint="The specific problem your brand exists to solve for them."
              error={errors.primary_problem}
            >
              <textarea
                value={form.primary_problem}
                onChange={(e) => setField("primary_problem")(e.target.value)}
                placeholder="They keep launching content but the strategy underneath is incoherent."
                style={TEXTAREA_STYLE}
              />
            </FieldGroup>

            <FieldGroup
              label="Emotional Trigger"
              required
              hint="The moment or feeling that pushes them to finally take action."
              error={errors.emotional_trigger}
            >
              <textarea
                value={form.emotional_trigger}
                onChange={(e) => setField("emotional_trigger")(e.target.value)}
                placeholder="Watching a less-talented competitor get the recognition they expected."
                style={TEXTAREA_STYLE}
              />
            </FieldGroup>

            <FieldGroup
              label="Description"
              hint="Optional. Longer freeform notes about who this person really is."
            >
              <textarea
                value={form.description}
                onChange={(e) => setField("description")(e.target.value)}
                placeholder="Background, lifestyle, decision habits, anything that doesn't fit elsewhere."
                style={{ ...TEXTAREA_STYLE, minHeight: 120 }}
              />
            </FieldGroup>
          </CollapsibleSection>

          <CollapsibleSection
            title="Behavior"
            hint="What they do, where they go, and what holds them back."
            defaultOpen={false}
          >
            <TagInput
              label="Surface Symptoms"
              hint="The visible signs of the problem they'd describe out loud. Press Enter to add."
              value={form.surface_symptoms}
              onChange={setField("surface_symptoms")}
              placeholder="Inconsistent posting, low engagement, copy that feels off..."
            />

            <TagInput
              label="Where They Are"
              hint="Platforms, communities, and channels you can actually reach them in."
              value={form.where_they_are}
              onChange={setField("where_they_are")}
              placeholder="LinkedIn, founder Slack groups, niche newsletters..."
            />

            <TagInput
              label="Objections"
              hint="What they tell themselves to delay or refuse the offer."
              value={form.objections}
              onChange={setField("objections")}
              placeholder="Too expensive, too soon, can do it myself..."
            />

            <FieldGroup
              label="Transformation Desired"
              hint="The before-and-after picture from their point of view."
            >
              <textarea
                value={form.transformation_desired}
                onChange={(e) => setField("transformation_desired")(e.target.value)}
                placeholder="From scattered output and shaky positioning to a clear, repeatable system."
                style={TEXTAREA_STYLE}
              />
            </FieldGroup>
          </CollapsibleSection>

          <div style={ACTIONS_ROW_STYLE}>
            {!isNew && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={DESTRUCTIVE_BUTTON_STYLE}
              >
                <Trash2 size={14} />
                Delete Avatar
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => navigate("/audience")}
              style={SECONDARY_BUTTON_STYLE}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                ...PRIMARY_CTA_STYLE,
                opacity: isSaving ? 0.7 : 1,
                cursor: isSaving ? "wait" : "pointer",
              }}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {isNew ? "Create Avatar" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && !isNew && (
        <DeleteAvatarModal
          avatar={{ id: routeId, name: form.name }}
          onCancel={() => setShowDeleteModal(false)}
          onDeleted={handleDeleted}
        />
      )}
    </DashboardLayout>
  );
}
