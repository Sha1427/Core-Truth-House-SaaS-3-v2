import React, { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import SelectionCard from "./SelectionCard";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const RETROSPECTIVE_STATUSES = new Set([
  "complete",
  "completed_won",
  "completed_lost",
  "completed_learning",
]);

const STATUS_OPTIONS = [
  {
    value: "completed_won",
    title: "Won",
    description: "Hit the goal. The campaign converted.",
  },
  {
    value: "completed_lost",
    title: "Lost",
    description: "Missed the goal. Worth knowing why.",
  },
  {
    value: "completed_learning",
    title: "Learning",
    description: "Mixed result. Insights mattered more than the metric.",
  },
];

function normalizeStatus(raw) {
  return raw === "complete" ? "completed_won" : raw;
}

const SECTION_CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 6,
  padding: "28px 28px 24px",
  marginTop: 24,
  fontFamily: SANS,
};

const HEADER_STYLE = { marginBottom: 24 };

const EYEBROW_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
  marginBottom: 6,
};

const TITLE_STYLE = {
  fontFamily: SERIF,
  fontSize: 24,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "-0.005em",
  margin: 0,
  lineHeight: 1.25,
};

const SUBTITLE_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: "var(--cth-command-muted)",
  margin: "8px 0 0",
  lineHeight: 1.55,
  maxWidth: 580,
};

const FIELD_GROUP_STYLE = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 24,
};

const FIELD_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const FIELD_HINT_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  color: "var(--cth-command-muted)",
  margin: "4px 0 0 0",
  lineHeight: 1.5,
};

const STATUS_GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginTop: 8,
};

const TEXTAREA_STYLE = {
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
  minHeight: 120,
  resize: "vertical",
  lineHeight: 1.55,
};

const FOOTER_STYLE = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 8,
};

const SAVE_BUTTON_STYLE = (disabled) => ({
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 999,
  padding: "11px 22px",
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

export default function RetrospectiveSection({ campaign, onUpdate }) {
  const [notes, setNotes] = useState(campaign?.retro_notes ?? "");
  const [status, setStatus] = useState(normalizeStatus(campaign?.status));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!campaign) return;
    setNotes(campaign.retro_notes ?? "");
    setStatus(normalizeStatus(campaign.status));
  }, [campaign?.id]);

  if (!campaign || !RETROSPECTIVE_STATUSES.has(campaign.status)) return null;

  const initialNotes = campaign.retro_notes ?? "";
  const initialStatus = normalizeStatus(campaign.status);
  const notesChanged = notes !== initialNotes;
  const statusChanged = status !== initialStatus;
  const hasChanges = notesChanged || statusChanged;

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {};
      if (notesChanged) payload.retro_notes = notes;
      if (statusChanged) payload.status = status;
      const res = await apiClient.patch(
        API_PATHS.campaigns.retrospective(campaign.id),
        payload
      );
      if (typeof onUpdate === "function") onUpdate(res);
      toast.success("Retrospective saved.");
    } catch (err) {
      toast.error(err?.message || "Failed to save retrospective.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section style={SECTION_CARD_STYLE}>
      <header style={HEADER_STYLE}>
        <p style={EYEBROW_STYLE}>Campaign</p>
        <h3 style={TITLE_STYLE}>Retrospective</h3>
        <p style={SUBTITLE_STYLE}>
          Lock in what happened. The status drives reporting; notes are for
          your team.
        </p>
      </header>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE}>Outcome</label>
        <div style={STATUS_GRID_STYLE}>
          {STATUS_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              selected={status === opt.value}
              title={opt.title}
              description={opt.description}
              onClick={() => setStatus(opt.value)}
              disabled={isSaving}
            />
          ))}
        </div>
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="retro-notes">
          Retro notes
        </label>
        <p style={FIELD_HINT_STYLE}>
          What worked, what didn't, what to repeat. Optional.
        </p>
        <textarea
          id="retro-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What we'd do differently next time…"
          style={TEXTAREA_STYLE}
          rows={5}
          disabled={isSaving}
        />
      </div>

      <div style={FOOTER_STYLE}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          style={SAVE_BUTTON_STYLE(!hasChanges || isSaving)}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {isSaving ? "Saving…" : "Save retrospective"}
        </button>
      </div>
    </section>
  );
}
