import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

import apiClient from "../../lib/apiClient";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PANEL_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const SOFT_PANEL_STYLE = {
  background: "var(--cth-command-panel-soft)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const INPUT_STYLE = {
  width: "100%",
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 12px",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
};

const PRIMARY_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 4,
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
};

const SECONDARY_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 4,
  background: "transparent",
  border: "1px solid var(--cth-command-border)",
  color: "var(--cth-command-ink)",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

const EYEBROW_STYLE = {
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
};

const EMPTY_FORM = {
  label: "",
  target_url: "",
};

function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function matchesContext(link, context = {}) {
  const metadata = link.metadata || {};

  if (context.campaign_id && link.campaign_id !== context.campaign_id && metadata.campaign_id !== context.campaign_id) {
    return false;
  }
  if (context.offer_id && link.offer_id !== context.offer_id && metadata.offer_id !== context.offer_id) {
    return false;
  }
  if (context.platform && link.platform !== context.platform && metadata.platform !== context.platform) {
    return false;
  }
  if (context.post_id && link.post_id !== context.post_id && metadata.post_id !== context.post_id) {
    return false;
  }

  return true;
}

function TrackingLinkRow({ link, onCopy, copying }) {
  const trackingUrl = link.tracking_url || link.trackingUrl || `/api/mail/r/${link.tracking_id}`;
  const isCopying = copying === trackingUrl;

  return (
    <article style={{ ...PANEL_STYLE, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
            <span style={{
              fontFamily: SANS, fontSize: 13, fontWeight: 600,
              color: "var(--cth-command-ink)",
            }}>
              {link.label || "Tracked link"}
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center",
              padding: "2px 8px", borderRadius: 999,
              background: "rgba(175,0,42,0.10)",
              border: "1px solid rgba(175,0,42,0.22)",
              color: "var(--cth-command-crimson)",
              fontFamily: SANS, fontSize: 10, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              {Number(link.click_count || 0)} clicks
            </span>
          </div>

          <p style={{
            margin: "6px 0 0",
            fontFamily: SANS, fontSize: 11, lineHeight: 1.5,
            color: "var(--cth-command-muted)",
            wordBreak: "break-all",
          }}>
            <span style={{ color: "var(--cth-command-ink)", fontWeight: 600 }}>Target:</span> {link.target_url}
          </p>
          <p style={{
            margin: "2px 0 0",
            fontFamily: SANS, fontSize: 11, lineHeight: 1.5,
            color: "var(--cth-command-muted)",
            wordBreak: "break-all",
          }}>
            <span style={{ color: "var(--cth-command-ink)", fontWeight: 600 }}>Tracking:</span> {trackingUrl}
          </p>
          <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 10, color: "var(--cth-command-muted)" }}>
            Created {formatDate(link.created_at)}
            {link.last_clicked_at ? ` · Last click ${formatDate(link.last_clicked_at)}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", flexShrink: 0, gap: 6, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onCopy(trackingUrl)}
            disabled={isCopying}
            style={{ ...SECONDARY_BUTTON_STYLE, opacity: isCopying ? 0.7 : 1 }}
          >
            <Copy size={12} /> {isCopying ? "Copying…" : "Copy"}
          </button>
          <a href={trackingUrl} target="_blank" rel="noreferrer" style={SECONDARY_BUTTON_STYLE}>
            <ExternalLink size={12} /> Test
          </a>
        </div>
      </div>
    </article>
  );
}

export default function TrackingLinkManager({
  title = "Tracking Links",
  subtitle = "Create, copy, and measure tracked links for this workspace.",
  defaultLabel = "",
  defaultUrl = "",
  context = {},
  compact = false,
  autoEnsure = true,
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    label: defaultLabel,
    target_url: defaultUrl,
  });
  const [trackingLinks, setTrackingLinks] = useState([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copying, setCopying] = useState("");
  const [autoPopulated, setAutoPopulated] = useState(false);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiClient.get("/api/mail/tracking-links");
      setTrackingLinks(normalizeList(data, "tracking_links"));
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to load tracking links.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      label: current.label || defaultLabel,
      target_url: current.target_url || defaultUrl,
    }));
  }, [defaultLabel, defaultUrl]);

  const visibleLinks = useMemo(() => {
    const scoped = trackingLinks.filter((link) => matchesContext(link, context));
    const term = query.trim().toLowerCase();

    if (!term) return scoped;

    return scoped.filter((link) =>
      [link.label, link.target_url, link.tracking_id, link.tracking_url, link.platform, link.offer_id, link.campaign_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [trackingLinks, context, query]);

  // Auto-populate the form from the first existing tracked link in this campaign/context
  // so the user sees what's already set up instead of a blank form.
  useEffect(() => {
    if (autoPopulated) return;
    if (!visibleLinks.length) return;
    const existing = visibleLinks[0];
    setForm((current) => {
      const labelEmpty = !current.label || current.label === defaultLabel;
      const urlEmpty = !current.target_url || current.target_url === defaultUrl;
      if (!labelEmpty && !urlEmpty) return current;
      return {
        label: labelEmpty ? (existing.label || current.label) : current.label,
        target_url: urlEmpty ? (existing.target_url || current.target_url) : current.target_url,
      };
    });
    setAutoPopulated(true);
  }, [visibleLinks, autoPopulated, defaultLabel, defaultUrl]);

  const buildTrackingPayload = useCallback((targetUrl, label) => {
    return {
      label: label || defaultLabel || "Tracked link",
      target_url: targetUrl,
      campaign_id: context.campaign_id || "",
      message_id: context.message_id || "",
      contact_id: context.contact_id || "",
      automation_id: context.automation_id || "",
      offer_id: context.offer_id || "",
      platform: context.platform || "",
      post_id: context.post_id || "",
      source_type: context.source_type || context.source || "manual",
      source_id:
        context.source_id ||
        context.campaign_id ||
        context.offer_id ||
        context.post_id ||
        context.message_id ||
        context.automation_id ||
        "",
      link_role: context.link_role || "primary_cta",
      provider: context.provider || "core_truth_house",
      metadata: {
        ...(context.metadata || {}),
        source: context.source || "tracking_link_manager",
        source_type: context.source_type || context.source || "manual",
        source_id:
          context.source_id ||
          context.campaign_id ||
          context.offer_id ||
          context.post_id ||
          context.message_id ||
          context.automation_id ||
          "",
        link_role: context.link_role || "primary_cta",
        campaign_id: context.campaign_id || "",
        offer_id: context.offer_id || "",
        platform: context.platform || "",
        post_id: context.post_id || "",
      },
    };
  }, [context, defaultLabel]);

  const ensureDefaultTrackedLink = useCallback(async () => {
    const targetUrl = String(defaultUrl || "").trim();
    if (!autoEnsure || !targetUrl) return;

    const sourceId =
      context.source_id ||
      context.campaign_id ||
      context.offer_id ||
      context.post_id ||
      context.message_id ||
      context.automation_id ||
      "";

    if (!sourceId) return;

    try {
      await apiClient.post("/api/mail/tracking-links/ensure", buildTrackingPayload(
        targetUrl,
        defaultLabel || "Tracked link"
      ));
      await loadLinks();
    } catch (err) {
      console.warn("Tracking link auto-sync failed:", err);
    }
  }, [autoEnsure, defaultUrl, defaultLabel, context, buildTrackingPayload, loadLinks]);

  useEffect(() => {
    ensureDefaultTrackedLink();
  }, [ensureDefaultTrackedLink]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");

    const targetUrl = form.target_url.trim();
    if (!targetUrl) {
      setError("Add a destination URL before creating a tracked link.");
      return;
    }

    setCreating(true);

    try {
      const payload = buildTrackingPayload(
        targetUrl,
        form.label.trim() || defaultLabel || "Tracked link"
      );

      const data = await apiClient.post("/api/mail/tracking-links/ensure", payload);
      const created = data?.tracking_link;

      setForm({ ...EMPTY_FORM, label: defaultLabel, target_url: defaultUrl });
      setNotice("Tracked link created.");
      await loadLinks();

      if (created?.tracking_url) {
        try {
          await navigator.clipboard.writeText(created.tracking_url);
          setNotice("Tracked link created and copied to clipboard.");
        } catch {
          // Clipboard may be blocked. Link still appears in list.
        }
      }
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to create tracking link.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (value) => {
    setNotice("");
    setError("");
    setCopying(value);

    try {
      await navigator.clipboard.writeText(value);
      setNotice("Tracking link copied to clipboard.");
    } catch {
      setError("Unable to copy automatically. Select and copy it manually.");
    } finally {
      setCopying("");
    }
  };

  return (
    <section style={{ ...PANEL_STYLE, padding: 14 }}>
      {(title || subtitle) ? (
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start",
          gap: 10, marginBottom: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            {title ? (
              <h2 style={{
                fontFamily: SERIF, fontSize: 15, fontWeight: 600,
                color: "var(--cth-command-ink)", margin: 0, lineHeight: 1.25,
              }}>
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)", margin: "4px 0 0" }}>
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={loadLinks}
            disabled={loading}
            style={{ ...SECONDARY_BUTTON_STYLE, opacity: loading ? 0.7 : 1 }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      ) : null}

      {notice ? (
        <div style={{
          marginBottom: 10, padding: "8px 12px",
          background: "rgba(34,135,90,0.10)",
          border: "1px solid rgba(34,135,90,0.28)",
          borderRadius: 4,
          fontFamily: SANS, fontSize: 12, fontWeight: 600,
          color: "#15803d",
        }}>
          {notice}
        </div>
      ) : null}

      {error ? (
        <div style={{
          marginBottom: 10, padding: "8px 12px",
          background: "rgba(175,0,42,0.08)",
          border: "1px solid var(--cth-command-crimson)",
          borderRadius: 4,
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: SANS, fontSize: 12, fontWeight: 600,
          color: "var(--cth-command-crimson)",
        }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          {error}
        </div>
      ) : null}

      <div style={compact
        ? { display: "grid", gap: 14 }
        : { display: "grid", gap: 14, gridTemplateColumns: "minmax(240px, 0.9fr) minmax(280px, 1.1fr)" }
      }>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
          <div>
            <label style={{ ...EYEBROW_STYLE, display: "block", marginBottom: 4 }}>
              Link label
            </label>
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Example: Book the diagnostic"
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={{ ...EYEBROW_STYLE, display: "block", marginBottom: 4 }}>
              Destination URL
            </label>
            <input
              name="target_url"
              value={form.target_url}
              onChange={handleChange}
              placeholder="https://coretruthhouse.com/brand-diagnostic"
              style={INPUT_STYLE}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            style={{ ...PRIMARY_BUTTON_STYLE, opacity: creating ? 0.7 : 1 }}
          >
            {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            {creating ? "Creating…" : "Create tracked link"}
          </button>
        </form>

        <div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search
              size={13}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--cth-command-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tracking links"
              style={{ ...INPUT_STYLE, paddingLeft: 30 }}
            />
          </div>

          {visibleLinks.length ? (
            <div style={{ display: "grid", gap: 8, maxHeight: 280, overflowY: "auto", paddingRight: 2 }}>
              {visibleLinks.map((link) => (
                <TrackingLinkRow
                  key={link.id || link.tracking_id}
                  link={link}
                  onCopy={handleCopy}
                  copying={copying}
                />
              ))}
            </div>
          ) : (
            <div style={{
              ...SOFT_PANEL_STYLE,
              borderStyle: "dashed",
              padding: "16px 14px",
              fontFamily: SANS, fontSize: 12, lineHeight: 1.5,
              color: "var(--cth-command-muted)",
              textAlign: "center",
            }}>
              No tracking links for this context yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
