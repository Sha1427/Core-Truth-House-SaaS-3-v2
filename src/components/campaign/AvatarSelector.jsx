import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, RefreshCw, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";
import AvatarCard from "../audience/AvatarCard";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

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
  width: "min(680px, calc(100vw - 32px))",
  maxHeight: "min(82vh, 720px)",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 24px 64px rgba(51, 3, 60, 0.25)",
  outline: "none",
  fontFamily: SANS,
};

const HEADER_STYLE = {
  padding: "20px 24px 14px",
  borderBottom: "1px solid var(--cth-command-border)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const EYEBROW_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
  marginBottom: 4,
};

const TITLE_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  letterSpacing: "-0.005em",
  margin: 0,
  lineHeight: 1.2,
};

const SUBTITLE_STYLE = {
  fontFamily: SANS,
  fontSize: 12.5,
  color: "var(--cth-command-muted)",
  margin: "6px 0 0",
  lineHeight: 1.5,
};

const CLOSE_BUTTON_STYLE = {
  background: "transparent",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--cth-command-ink)",
  cursor: "pointer",
  flexShrink: 0,
};

const BODY_STYLE = {
  padding: "20px 24px 24px",
  overflowY: "auto",
  flex: 1,
};

const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 14,
};

const SKELETON_CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: 22,
  height: 188,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const SKELETON_BAR_BASE = {
  borderRadius: 3,
  background: "var(--cth-command-panel-soft)",
};

const STATE_CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "48px 24px",
  textAlign: "center",
};

const PRIMARY_LINK_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 999,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 12.5,
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

const SELECTED_RING_STYLE = {
  borderRadius: 6,
  padding: 2,
  background: "var(--cth-command-gold)",
};

function SkeletonGrid({ count = 4 }) {
  return (
    <div style={GRID_STYLE} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={SKELETON_CARD_STYLE}>
          <div style={{ ...SKELETON_BAR_BASE, height: 14, width: "55%" }} />
          <div style={{ ...SKELETON_BAR_BASE, height: 11, width: "30%" }} />
          <div style={{ flex: 1 }} />
          <div style={{ ...SKELETON_BAR_BASE, height: 11, width: "92%" }} />
          <div style={{ ...SKELETON_BAR_BASE, height: 11, width: "78%" }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={STATE_CARD_STYLE}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 999,
          background: "var(--cth-command-purple)",
          color: "var(--cth-command-gold)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <UsersRound size={22} />
      </div>
      <h3
        style={{
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          margin: 0,
          letterSpacing: "-0.005em",
        }}
      >
        No avatars defined yet
      </h3>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: "var(--cth-command-muted)",
          margin: "10px auto 22px",
          maxWidth: 360,
          lineHeight: 1.55,
        }}
      >
        Define an avatar in the Audience module — every campaign pulls from the
        avatar you select here.
      </p>
      <Link to="/audience" style={PRIMARY_LINK_STYLE}>
        <ArrowUpRight size={14} />
        Go to Audience
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div
      style={{
        ...STATE_CARD_STYLE,
        borderColor:
          "color-mix(in srgb, var(--cth-danger) 30%, var(--cth-command-border))",
        background:
          "color-mix(in srgb, var(--cth-danger) 6%, var(--cth-command-panel))",
      }}
    >
      <AlertCircle
        size={26}
        style={{ color: "var(--cth-danger)", marginBottom: 12 }}
      />
      <h3
        style={{
          fontFamily: SERIF,
          fontSize: 20,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          margin: 0,
        }}
      >
        We couldn't load your avatars.
      </h3>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: "var(--cth-command-muted)",
          margin: "10px auto 18px",
          maxWidth: 360,
        }}
      >
        Something went wrong reaching the audience service.
      </p>
      <button type="button" onClick={onRetry} style={SECONDARY_BUTTON_STYLE}>
        <RefreshCw size={13} />
        Retry
      </button>
    </div>
  );
}

export default function AvatarSelector({
  isOpen,
  onClose,
  onSelect,
  selectedAvatarId = null,
}) {
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

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
    if (!isOpen) return;
    loadAvatars();
  }, [isOpen, loadAvatars]);

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isLoading || avatars.length === 0) return;
    const firstCard = panelRef.current?.querySelector('[role="button"]');
    if (firstCard) firstCard.focus();
  }, [isOpen, isLoading, avatars.length]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), [role="button"]:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
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
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    (avatar) => {
      if (typeof onSelect === "function") onSelect(avatar);
      onClose();
    },
    [onSelect, onClose]
  );

  if (!isOpen) return null;

  return (
    <div style={BACKDROP_STYLE} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-selector-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={PANEL_STYLE}
      >
        <header style={HEADER_STYLE}>
          <div>
            <p style={EYEBROW_STYLE}>Audience</p>
            <h2 id="avatar-selector-title" style={TITLE_STYLE}>
              Select an avatar for this campaign
            </h2>
            <p style={SUBTITLE_STYLE}>
              Choose the avatar this campaign serves. The campaign captures a
              snapshot at create time, so future edits to the avatar won't
              change this campaign's data.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close avatar selector"
            style={CLOSE_BUTTON_STYLE}
          >
            <X size={16} />
          </button>
        </header>

        <div style={BODY_STYLE}>
          {error ? (
            <ErrorState onRetry={loadAvatars} />
          ) : isLoading ? (
            <SkeletonGrid />
          ) : avatars.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={GRID_STYLE}>
              {avatars.map((avatar) => {
                const isSelected = avatar.id === selectedAvatarId;
                const wrapperStyle = isSelected
                  ? SELECTED_RING_STYLE
                  : { padding: 2, background: "transparent" };
                return (
                  <div key={avatar.id} style={wrapperStyle}>
                    <AvatarCard
                      avatar={avatar}
                      onOpen={() => handleSelect(avatar)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
