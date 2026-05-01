import React from "react";

export default function CampaignContextBanner({ campaignId, campaignName, onClear, label = "Composing for campaign:" }) {
  if (!campaignId) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 20px",
        background: "var(--cth-command-panel-soft, #f4eee5)",
        borderBottom: "1px solid var(--cth-command-gold, #C4A95B)",
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontSize: 13,
        color: "var(--cth-command-ink, #2a1a25)",
      }}
    >
      <span>
        {label}{" "}
        <strong style={{ color: "var(--cth-command-purple, #33033C)" }}>
          {campaignName || campaignId}
        </strong>
      </span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear campaign context"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--cth-command-muted, #7a6a72)",
          fontSize: 16,
          lineHeight: 1,
          padding: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}
