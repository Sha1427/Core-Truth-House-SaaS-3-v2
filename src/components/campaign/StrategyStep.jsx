import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Star,
  UsersRound,
} from "lucide-react";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import AvatarSelector from "./AvatarSelector";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const GOAL_OPTIONS = [
  { value: "offer_launch", label: "Offer Launch" },
  { value: "lead_generation", label: "Lead Generation" },
  { value: "audience_growth", label: "Audience Growth" },
  { value: "engagement", label: "Engagement" },
  { value: "sales_conversion", label: "Sales Conversion" },
  { value: "authority_building", label: "Authority Building" },
  { value: "re_engagement", label: "Re-Engagement" },
  { value: "brand_awareness", label: "Brand Awareness" },
];

const STAGE_LABELS = {
  unaware: "Unaware",
  problem_aware: "Problem Aware",
  solution_aware: "Solution Aware",
  product_aware: "Product Aware",
  most_aware: "Most Aware",
};

const SECTION_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 28,
  fontFamily: SANS,
};

const SECTION_HEADER_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const EYEBROW_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
};

const STEP_TITLE_STYLE = {
  fontFamily: SERIF,
  fontSize: 28,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "-0.005em",
  margin: 0,
  lineHeight: 1.2,
};

const STEP_INTRO_STYLE = {
  fontFamily: SANS,
  fontSize: 14,
  color: "var(--cth-command-muted)",
  margin: 0,
  lineHeight: 1.6,
  maxWidth: 620,
};

const FIELD_GROUP_STYLE = {
  display: "flex",
  flexDirection: "column",
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
  margin: "4px 0 0 0",
  lineHeight: 1.5,
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
  minHeight: 84,
  resize: "vertical",
  lineHeight: 1.55,
};

const SELECT_STYLE = {
  ...INPUT_STYLE,
  appearance: "none",
  cursor: "pointer",
  paddingRight: 36,
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%237a6a72' d='M6 8 0 0h12z'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

const PRIMARY_BUTTON_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
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
  textDecoration: "none",
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "9px 16px",
  fontFamily: SANS,
  fontSize: 12.5,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const SELECTOR_STATE_CARD_STYLE = {
  marginTop: 8,
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "20px 22px",
};

const SELECTED_CARD_STYLE = {
  ...SELECTOR_STATE_CARD_STYLE,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const SELECTED_LEFT_STYLE = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minWidth: 0,
  flex: 1,
};

const SELECTED_NAME_STYLE = {
  fontFamily: SERIF,
  fontSize: 20,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "-0.005em",
  margin: 0,
  lineHeight: 1.25,
};

const BADGES_ROW_STYLE = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
};

const STAGE_BADGE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--cth-command-gold)",
  color: "var(--cth-command-ink)",
  background: "transparent",
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const PRIMARY_PILL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 9px",
  borderRadius: 999,
  background: "var(--cth-command-gold)",
  color: "var(--cth-command-purple)",
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const INCOMPLETE_BADGE_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 9px",
  borderRadius: 999,
  background: "color-mix(in srgb, #B45309 14%, var(--cth-command-panel))",
  color: "#92400E",
  border: "1px solid color-mix(in srgb, #B45309 35%, var(--cth-command-border))",
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const PROBLEM_LINE_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: "var(--cth-command-muted)",
  margin: 0,
  lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const SKELETON_BAR = {
  borderRadius: 3,
  background: "var(--cth-command-panel-soft)",
};

function SelectorLoading() {
  return (
    <div style={SELECTOR_STATE_CARD_STYLE} aria-hidden="true">
      <div style={{ ...SKELETON_BAR, height: 12, width: "30%", marginBottom: 12 }} />
      <div style={{ ...SKELETON_BAR, height: 16, width: "60%", marginBottom: 10 }} />
      <div style={{ ...SKELETON_BAR, height: 11, width: "85%" }} />
    </div>
  );
}

function SelectorError({ onRetry }) {
  return (
    <div
      style={{
        ...SELECTOR_STATE_CARD_STYLE,
        borderColor:
          "color-mix(in srgb, var(--cth-danger) 30%, var(--cth-command-border))",
        background:
          "color-mix(in srgb, var(--cth-danger) 6%, var(--cth-command-panel))",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AlertCircle size={18} style={{ color: "var(--cth-danger)" }} />
        <span
          style={{
            fontFamily: SANS,
            fontSize: 13,
            color: "var(--cth-command-ink)",
          }}
        >
          We couldn't load your avatars.
        </span>
      </div>
      <button type="button" onClick={onRetry} style={SECONDARY_BUTTON_STYLE}>
        <RefreshCw size={13} />
        Retry
      </button>
    </div>
  );
}

function SelectorEmpty() {
  return (
    <div
      style={{
        ...SELECTOR_STATE_CARD_STYLE,
        textAlign: "center",
        padding: "32px 24px",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: "var(--cth-command-purple)",
          color: "var(--cth-command-gold)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <UsersRound size={20} />
      </div>
      <h4
        style={{
          fontFamily: SERIF,
          fontSize: 18,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          margin: 0,
          letterSpacing: "-0.005em",
        }}
      >
        No audience yet
      </h4>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: "var(--cth-command-muted)",
          margin: "8px auto 18px",
          maxWidth: 360,
          lineHeight: 1.55,
        }}
      >
        Create an avatar in the Audience module before launching this campaign.
        Every campaign pulls from a selected avatar.
      </p>
      <Link to="/audience" style={PRIMARY_BUTTON_STYLE}>
        <ArrowUpRight size={14} />
        Go to Audience
      </Link>
    </div>
  );
}

function SelectedAvatarCard({ avatar, onChange }) {
  const stageLabel = STAGE_LABELS[avatar.stage] || avatar.stage || "Unstaged";
  const isIncomplete = !avatar.core_fear || avatar.core_fear.trim() === "";
  const problemText =
    typeof avatar.primary_problem === "string" ? avatar.primary_problem.trim() : "";

  return (
    <div style={SELECTED_CARD_STYLE}>
      <div style={SELECTED_LEFT_STYLE}>
        <div style={BADGES_ROW_STYLE}>
          <span style={STAGE_BADGE_STYLE}>{stageLabel}</span>
          {avatar.is_primary && (
            <span style={PRIMARY_PILL_STYLE}>
              <Star size={10} fill="currentColor" stroke="currentColor" />
              Primary
            </span>
          )}
          {isIncomplete && (
            <span style={INCOMPLETE_BADGE_STYLE} title="Core fear is empty">
              <AlertTriangle size={10} />
              Incomplete
            </span>
          )}
        </div>
        <h4 style={SELECTED_NAME_STYLE}>{avatar.name || "Untitled avatar"}</h4>
        {problemText ? <p style={PROBLEM_LINE_STYLE}>{problemText}</p> : null}
      </div>
      <button type="button" onClick={onChange} style={SECONDARY_BUTTON_STYLE}>
        Change
      </button>
    </div>
  );
}

export default function StrategyStep({ value, onChange, onValidityChange }) {
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAvatars = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(API_PATHS.audience.avatars);
      const list = Array.isArray(data?.avatars) ? data.avatars : [];
      setAvatars(list);
    } catch (err) {
      setError(err);
      toast.error("Couldn't load avatars. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  useEffect(() => {
    if (avatars.length !== 1) return;
    if (value.avatar_id) return;
    onChange({ avatar_id: avatars[0].id });
  }, [avatars, value.avatar_id, onChange]);

  const isValid = Boolean(
    value.name &&
      value.name.trim() &&
      value.goal &&
      value.avatar_id &&
      value.emotional_hook &&
      value.emotional_hook.trim() &&
      value.promise &&
      value.promise.trim()
  );

  useEffect(() => {
    if (typeof onValidityChange === "function") onValidityChange(isValid);
  }, [isValid, onValidityChange]);

  const selectedAvatar = value.avatar_id
    ? avatars.find((a) => a.id === value.avatar_id) || null
    : null;

  const handleField = (key) => (e) => onChange({ [key]: e.target.value });

  const handleAvatarSelect = (avatar) => {
    setAvatars((prev) =>
      prev.some((a) => a.id === avatar.id) ? prev : [...prev, avatar]
    );
    onChange({ avatar_id: avatar.id });
  };

  const renderSelector = () => {
    if (isLoading) return <SelectorLoading />;
    if (error) return <SelectorError onRetry={loadAvatars} />;
    if (avatars.length === 0) return <SelectorEmpty />;
    if (selectedAvatar) {
      return (
        <SelectedAvatarCard
          avatar={selectedAvatar}
          onChange={() => setIsModalOpen(true)}
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        style={{ ...PRIMARY_BUTTON_STYLE, marginTop: 8 }}
      >
        <UsersRound size={14} />
        Select Audience
      </button>
    );
  };

  return (
    <section style={SECTION_STYLE}>
      <header style={SECTION_HEADER_STYLE}>
        <p style={EYEBROW_STYLE}>Step 1 — Strategy</p>
        <h2 style={STEP_TITLE_STYLE}>Anchor the campaign</h2>
        <p style={STEP_INTRO_STYLE}>
          Name the campaign, choose its goal, pick the avatar it serves, and
          write the hook + promise that everything else rolls up to.
        </p>
      </header>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="campaign-name">
          Campaign name
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <input
          id="campaign-name"
          type="text"
          maxLength={200}
          value={value.name || ""}
          onChange={handleField("name")}
          placeholder="e.g. Q3 Estate Launch"
          style={INPUT_STYLE}
        />
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="campaign-goal">
          Campaign goal
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <select
          id="campaign-goal"
          value={value.goal || ""}
          onChange={handleField("goal")}
          style={SELECT_STYLE}
        >
          <option value="">Choose a goal…</option>
          {GOAL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE}>
          Audience
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          The avatar this campaign serves. We capture a snapshot at create
          time, so future avatar edits won't drift this campaign.
        </p>
        {renderSelector()}
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="campaign-hook">
          Campaign hook
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          One or two sentences. The line that stops the scroll.
        </p>
        <textarea
          id="campaign-hook"
          value={value.emotional_hook || ""}
          onChange={handleField("emotional_hook")}
          placeholder="What single emotional truth does this campaign open with?"
          style={TEXTAREA_STYLE}
          rows={2}
        />
      </div>

      <div style={FIELD_GROUP_STYLE}>
        <label style={FIELD_LABEL_STYLE} htmlFor="campaign-promise">
          One-line promise
          <span style={REQUIRED_MARK_STYLE}>*</span>
        </label>
        <p style={FIELD_HINT_STYLE}>
          What changes for the audience by the end of this campaign? One
          sentence.
        </p>
        <input
          id="campaign-promise"
          type="text"
          value={value.promise || ""}
          onChange={handleField("promise")}
          placeholder="e.g. You'll have a documented brand operating system in 14 days."
          style={INPUT_STYLE}
        />
      </div>

      <AvatarSelector
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAvatarSelect}
        selectedAvatarId={value.avatar_id || null}
      />
    </section>
  );
}
