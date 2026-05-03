import React from "react";

const SANS = "'DM Sans', sans-serif";

const SELECTION_CARD_STYLE = (selected, disabled) => ({
  background: "var(--cth-command-panel)",
  border: `1px solid ${
    selected ? "var(--cth-command-gold)" : "var(--cth-command-border)"
  }`,
  borderRadius: 4,
  padding: "16px 18px",
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  cursor: disabled ? "not-allowed" : "pointer",
  textAlign: "left",
  transition: "border-color 200ms ease, box-shadow 200ms ease",
  boxShadow: selected ? "0 0 0 2px var(--cth-command-gold)" : "none",
  fontFamily: SANS,
  width: "100%",
  outline: "none",
  opacity: disabled ? 0.6 : 1,
});

const SELECTION_DOT_STYLE = (selected) => ({
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 5,
  background: selected
    ? "var(--cth-command-crimson)"
    : "var(--cth-command-border)",
  flexShrink: 0,
});

const SELECTION_TITLE_STYLE = {
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  lineHeight: 1.35,
};

const SELECTION_DESC_STYLE = {
  fontFamily: SANS,
  fontSize: 12.5,
  color: "var(--cth-command-muted)",
  margin: "4px 0 0",
  lineHeight: 1.55,
};

export default function SelectionCard({
  selected,
  title,
  description,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={SELECTION_CARD_STYLE(selected, disabled)}
      aria-pressed={selected}
    >
      <span style={SELECTION_DOT_STYLE(selected)} />
      <div style={{ minWidth: 0 }}>
        <p style={SELECTION_TITLE_STYLE}>{title}</p>
        {description ? <p style={SELECTION_DESC_STYLE}>{description}</p> : null}
      </div>
    </button>
  );
}
