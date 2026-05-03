import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import apiClient from "../../lib/apiClient";
import { API_PATHS } from "../../lib/apiPaths";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const BACKDROP_STYLE = {
  position: "fixed",
  inset: 0,
  background: "rgba(51, 3, 60, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 1000,
};

const PANEL_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 6,
  width: "100%",
  maxWidth: 480,
  padding: "28px 28px 24px",
  fontFamily: SANS,
  boxShadow: "0 18px 48px rgba(51, 3, 60, 0.28)",
};

const HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 24,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.25,
};

const BODY_TEXT_STYLE = {
  fontFamily: SANS,
  fontSize: 14,
  lineHeight: 1.6,
  color: "var(--cth-command-muted)",
  margin: "12px 0 24px 0",
};

const BUTTON_ROW_STYLE = {
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

const DELETE_BUTTON_STYLE = {
  background: "var(--cth-command-crimson)",
  color: "#fff",
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

export default function DeleteAvatarModal({ avatar, onCancel, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelBtnRef = useRef(null);
  const deleteBtnRef = useRef(null);

  // Body scroll lock + initial focus on Cancel
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 0);
    return () => {
      document.body.style.overflow = previousOverflow;
      clearTimeout(focusTimer);
    };
  }, []);

  // Escape closes (when not mid-delete); Tab/Shift+Tab cycles between the two buttons.
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") {
        if (isDeleting) return;
        event.preventDefault();
        onCancel?.();
        return;
      }
      if (event.key === "Tab") {
        if (isDeleting) {
          event.preventDefault();
          return;
        }
        const active = document.activeElement;
        if (event.shiftKey) {
          if (active === cancelBtnRef.current) {
            event.preventDefault();
            deleteBtnRef.current?.focus();
          }
        } else if (active === deleteBtnRef.current) {
          event.preventDefault();
          cancelBtnRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel, isDeleting]);

  const handleBackdropClick = (event) => {
    if (isDeleting) return;
    if (event.target === event.currentTarget) {
      onCancel?.();
    }
  };

  const handleCancel = () => {
    if (isDeleting) return;
    onCancel?.();
  };

  const handleDelete = async () => {
    if (!avatar?.id || isDeleting) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(API_PATHS.audience.avatarById(avatar.id));
      onDeleted?.();
    } catch (err) {
      toast.error(err?.message || "Failed to delete avatar.");
      setIsDeleting(false);
    }
  };

  const displayName =
    typeof avatar?.name === "string" && avatar.name.trim()
      ? avatar.name.trim()
      : "this avatar";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-avatar-heading"
      aria-describedby="delete-avatar-body"
      aria-busy={isDeleting}
      onClick={handleBackdropClick}
      style={BACKDROP_STYLE}
    >
      <div onClick={(e) => e.stopPropagation()} style={PANEL_STYLE}>
        <h2 id="delete-avatar-heading" style={HEADING_STYLE}>
          {`Delete '${displayName}'?`}
        </h2>
        <p id="delete-avatar-body" style={BODY_TEXT_STYLE}>
          This cannot be undone. Linked campaigns will keep their original
          avatar definition but lose the live link.
        </p>
        <div style={BUTTON_ROW_STYLE}>
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            style={{
              ...CANCEL_BUTTON_STYLE,
              opacity: isDeleting ? 0.5 : 1,
              cursor: isDeleting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
          <button
            ref={deleteBtnRef}
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              ...DELETE_BUTTON_STYLE,
              opacity: isDeleting ? 0.75 : 1,
              cursor: isDeleting ? "wait" : "pointer",
            }}
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            {isDeleting ? "Deleting..." : "Delete Avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}
