import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import SelectionCard from "./SelectionCard";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const TARGET_LABELS = {
  brief: { title: "Regenerate Brief", thingNoun: "brief" },
  hooks: { title: "Regenerate Hooks", thingNoun: "hooks" },
};

const BACKDROP_STYLE = {
  position: "fixed",
  inset: 0,
  background: "rgba(51, 3, 60, 0.55)",
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 1000,
};

const PANEL_STYLE = {
  background: "var(--cth-command-blush)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 6,
  width: "min(540px, calc(100vw - 32px))",
  maxHeight: "min(82vh, 700px)",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 24px 64px rgba(51, 3, 60, 0.25)",
  outline: "none",
  fontFamily: SANS,
};

const HEADER_STYLE = {
  padding: "24px 28px 16px",
  borderBottom: "1px solid var(--cth-command-border)",
};

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
  fontSize: 22,
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
};

const BODY_STYLE = {
  padding: "20px 28px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  overflowY: "auto",
};

const FOOTER_STYLE = {
  padding: "16px 28px 22px",
  borderTop: "1px solid var(--cth-command-border)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

const CANCEL_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 999,
  padding: "10px 20px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const CONFIRM_BUTTON_STYLE = {
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
};

export default function RegenerateModal({
  isOpen,
  onClose,
  onConfirm,
  target,
  isProcessing,
}) {
  const [selectedMode, setSelectedMode] = useState("preserve");
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedMode("preserve");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector(
        "button:not([disabled])"
      );
      if (first) first.focus();
      else panelRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      clearTimeout(t);
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") {
        if (isProcessing) return;
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      if (isProcessing) {
        e.preventDefault();
        return;
      }
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll("button:not([disabled])");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, isProcessing, onClose]);

  const handleBackdrop = (e) => {
    if (isProcessing) return;
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = () => {
    if (isProcessing) return;
    if (typeof onConfirm === "function") onConfirm(selectedMode);
  };

  if (!isOpen) return null;

  const labels = TARGET_LABELS[target] || TARGET_LABELS.brief;

  return (
    <div role="presentation" onClick={handleBackdrop} style={BACKDROP_STYLE}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="regenerate-modal-title"
        aria-busy={isProcessing}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={PANEL_STYLE}
      >
        <header style={HEADER_STYLE}>
          <p style={EYEBROW_STYLE}>Campaign</p>
          <h2 id="regenerate-modal-title" style={TITLE_STYLE}>
            {labels.title}
          </h2>
          <p style={SUBTITLE_STYLE}>
            Pick how the new {labels.thingNoun} should be generated. The
            campaign saves a snapshot of the avatar at create time — you can
            regenerate from that snapshot or pull the avatar's current state.
          </p>
        </header>

        <div style={BODY_STYLE}>
          <SelectionCard
            selected={selectedMode === "preserve"}
            title="Use original audience data (recommended)"
            description="Generate using the avatar data captured when this campaign was created. Best when you want a true regeneration of the original direction."
            onClick={() => setSelectedMode("preserve")}
            disabled={isProcessing}
          />
          <SelectionCard
            selected={selectedMode === "refresh"}
            title="Refresh from current audience"
            description="Pull the latest version of the linked avatar and overwrite the saved snapshot. Use after editing the avatar in the Audience module."
            onClick={() => setSelectedMode("refresh")}
            disabled={isProcessing}
          />
        </div>

        <footer style={FOOTER_STYLE}>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              ...CANCEL_BUTTON_STYLE,
              opacity: isProcessing ? 0.5 : 1,
              cursor: isProcessing ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            style={{
              ...CONFIRM_BUTTON_STYLE,
              opacity: isProcessing ? 0.75 : 1,
              cursor: isProcessing ? "wait" : "pointer",
            }}
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : null}
            {isProcessing ? "Regenerating…" : "Regenerate"}
          </button>
        </footer>
      </div>
    </div>
  );
}
