import React, { useState } from "react";
import { AlertTriangle, Star } from "lucide-react";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const STAGE_LABELS = {
  unaware: "Unaware",
  problem_aware: "Problem Aware",
  solution_aware: "Solution Aware",
  product_aware: "Product Aware",
  most_aware: "Most Aware",
};

const BASE_CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: 22,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  minHeight: 188,
  transition:
    "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
  fontFamily: SANS,
  outline: "none",
};

const HOVER_STYLE = {
  borderColor: "var(--cth-command-gold)",
  boxShadow: "0 6px 20px rgba(51, 3, 60, 0.10)",
  transform: "translateY(-2px)",
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
  background:
    "color-mix(in srgb, #B45309 14%, var(--cth-command-panel))",
  color: "#92400E",
  border:
    "1px solid color-mix(in srgb, #B45309 35%, var(--cth-command-border))",
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const NAME_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "-0.005em",
  lineHeight: 1.2,
  margin: 0,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const PROBLEM_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.55,
  color: "var(--cth-command-muted)",
  margin: 0,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const PROBLEM_PLACEHOLDER_STYLE = {
  ...PROBLEM_STYLE,
  fontStyle: "italic",
  color: "var(--cth-command-muted)",
  opacity: 0.7,
};

export default function AvatarCard({ avatar, onOpen }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  if (!avatar) return null;

  const stageLabel = STAGE_LABELS[avatar.stage] || avatar.stage || "Unstaged";
  const isIncomplete = !avatar.core_fear || avatar.core_fear.trim() === "";
  const problemText =
    typeof avatar.primary_problem === "string"
      ? avatar.primary_problem.trim()
      : "";

  const handleClick = () => {
    if (typeof onOpen === "function") onOpen();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const cardStyle = {
    ...BASE_CARD_STYLE,
    ...((hovered || focused) ? HOVER_STYLE : null),
    ...(focused
      ? { boxShadow: "0 0 0 2px var(--cth-command-gold)" }
      : null),
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={cardStyle}
      aria-label={`Open avatar ${avatar.name || "Untitled"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span style={STAGE_BADGE_STYLE}>{stageLabel}</span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
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
      </div>

      <h3 style={NAME_STYLE}>{avatar.name || "Untitled avatar"}</h3>

      {problemText ? (
        <p style={PROBLEM_STYLE}>{problemText}</p>
      ) : (
        <p style={PROBLEM_PLACEHOLDER_STYLE}>No primary problem captured yet.</p>
      )}
    </div>
  );
}
