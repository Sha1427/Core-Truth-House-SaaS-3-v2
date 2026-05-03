import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowUpRight,
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import { API_PATHS } from "../lib/apiPaths";
import AvatarCard from "../components/audience/AvatarCard";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

// TODO: Replace with centralized tier-resolution. Backend currently uses a
// placeholder limit of 5 across all tiers; when billing centralizes the
// tier-name -> limit mapping, read the real limit from the user's plan.
const PLACEHOLDER_LIMIT = 5;

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const BODY_WRAP_STYLE = {
  padding: "28px 24px 96px",
  maxWidth: 1240,
  margin: "0 auto",
  fontFamily: SANS,
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 999,
  padding: "12px 22px",
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

const UPGRADE_CTA_STYLE = {
  ...PRIMARY_CTA_STYLE,
  background: "var(--cth-command-crimson)",
  color: "#fff",
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

const TIER_PILL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid var(--cth-command-border)",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-muted)",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

function parseLimitFromError(message) {
  if (typeof message !== "string") return null;
  const match = message.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return null;
  return { used: Number(match[1]), limit: Number(match[2]) };
}

function SkeletonCard() {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: 22,
        height: 188,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          height: 14,
          width: "55%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
      <div
        style={{
          height: 11,
          width: "30%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
      <div style={{ flex: 1 }} />
      <div
        style={{
          height: 11,
          width: "92%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
      <div
        style={{
          height: 11,
          width: "78%",
          borderRadius: 3,
          background: "var(--cth-command-panel-soft)",
        }}
      />
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: "72px 28px",
        textAlign: "center",
        background:
          "linear-gradient(160deg, var(--cth-command-panel) 0%, color-mix(in srgb, var(--cth-command-gold) 6%, var(--cth-command-panel)) 100%)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "var(--cth-command-purple)",
          color: "var(--cth-command-gold)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 22,
        }}
      >
        <UsersRound size={26} />
      </div>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 34,
          fontWeight: 600,
          color: "var(--cth-command-ink)",
          letterSpacing: "-0.01em",
          margin: 0,
          lineHeight: 1.15,
        }}
      >
        Define your first audience.
      </h2>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 14,
          color: "var(--cth-command-muted)",
          margin: "14px auto 28px",
          maxWidth: 520,
          lineHeight: 1.6,
        }}
      >
        Avatars are the people your brand serves. Every campaign, asset, and
        AI-generated piece pulls from the avatar you select, so the more honest
        your avatar, the sharper your output.
      </p>
      <button type="button" onClick={onCreate} style={PRIMARY_CTA_STYLE}>
        <Plus size={16} />
        Create Your First Avatar
      </button>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: "56px 28px",
        textAlign: "center",
        borderColor:
          "color-mix(in srgb, var(--cth-danger) 30%, var(--cth-command-border))",
        background:
          "color-mix(in srgb, var(--cth-danger) 6%, var(--cth-command-panel))",
      }}
    >
      <AlertCircle
        size={28}
        style={{ color: "var(--cth-danger)", marginBottom: 14 }}
      />
      <h3
        style={{
          fontFamily: SERIF,
          fontSize: 22,
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
          margin: "10px auto 22px",
          maxWidth: 440,
        }}
      >
        Something went wrong reaching the audience service. Try again — if it
        keeps happening, let us know.
      </p>
      <button type="button" onClick={onRetry} style={SECONDARY_BUTTON_STYLE}>
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

export default function Audience() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();

  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(PLACEHOLDER_LIMIT);

  const loadAvatars = useCallback(async () => {
    if (!activeWorkspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(API_PATHS.audience.avatars);
      const list = Array.isArray(data?.avatars) ? data.avatars : [];
      setAvatars(list);
    } catch (err) {
      const parsed = parseLimitFromError(err?.message);
      if (parsed) setLimit(parsed.limit);
      setError(err);
      toast.error("Couldn't load avatars. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const used = avatars.length;
  const atLimit = used >= limit;

  const handleCreate = () => navigate("/audience/avatars/new");
  const handleUpgrade = () => navigate("/billing");
  const handleOpen = (id) => navigate(`/audience/avatars/${id}`);

  const headerAction = atLimit ? (
    <button type="button" onClick={handleUpgrade} style={UPGRADE_CTA_STYLE}>
      <ArrowUpRight size={16} />
      Upgrade to add more avatars
    </button>
  ) : (
    <button type="button" onClick={handleCreate} style={PRIMARY_CTA_STYLE}>
      <Plus size={16} />
      Create New Avatar
    </button>
  );

  return (
    <DashboardLayout>
      <TopBar
        title="Audience"
        subtitle="Define the people you serve. Avatars feed into every campaign and AI-generated asset."
        action={headerAction}
      />

      <div style={PAGE_STYLE}>
        <div style={BODY_WRAP_STYLE}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <span style={TIER_PILL_STYLE}>
              <UsersRound size={13} style={{ color: "var(--cth-command-gold)" }} />
              {used} of {limit} avatars used
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <ErrorState onRetry={loadAvatars} />
          ) : avatars.length === 0 ? (
            <EmptyState onCreate={handleCreate} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {avatars.map((avatar) => (
                <AvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  onOpen={() => handleOpen(avatar.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
