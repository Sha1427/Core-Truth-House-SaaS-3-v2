import { useEffect, useState } from "react";
import { X, ExternalLink, Loader2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../lib/apiClient";
import { useWorkspace } from "../../context/WorkspaceContext";

const SANS = '"DM Sans", system-ui, sans-serif';
const SERIF = '"Playfair Display", serif';

const PLATFORM_LABELS = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  facebook: "Facebook",
  tiktok: "TikTok",
  threads: "Threads",
  pinterest: "Pinterest",
  youtube: "YouTube",
  google_business: "Google Business",
};

const TYPE_PLATFORM_DEFAULTS = {
  "social-caption":         ["instagram"],
  "short-form-hook":        ["instagram", "tiktok"],
  "linkedin-post":          ["linkedin"],
  "twitter-thread":         ["twitter"],
  "tiktok-script":          ["tiktok"],
  "pinterest-description":  ["pinterest"],
  "carousel-outline":       ["instagram"],
  "email-newsletter":       [],
  "sales-page":             [],
  // legacy ids — saved items from before the rename
  "instagram-caption":      ["instagram"],
  "reel-hook":              ["instagram", "tiktok"],
};

export default function PublishDrawer({ item, onClose }) {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [scheduleMode, setScheduleMode] = useState("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const plan = activeWorkspace?.plan || "foundation";
  const canPublish = ["house", "estate"].includes(plan);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setSelectedPlatforms([]);
    setScheduleMode("now");
    apiClient.get("/api/social/zernio/connection")
      .then((res) => {
        setConnection(res.data);
        const suggested = TYPE_PLATFORM_DEFAULTS[item.content_type || item.format] || [];
        const available = (res.data?.connected_platforms || [])
          .map((entry) => (typeof entry === "string" ? entry : entry?.platform))
          .filter(Boolean);
        setSelectedPlatforms(suggested.filter((p) => available.includes(p)));
      })
      .catch(() => setConnection(null))
      .finally(() => setLoading(false));
  }, [item]);

  const togglePlatform = (p) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async () => {
    if (!selectedPlatforms.length) return;
    setSubmitting(true);
    try {
      let scheduledForIso = null;
      if (scheduleMode === "later" && scheduledDate && scheduledTime) {
        scheduledForIso = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const created = [];
      for (const platform of selectedPlatforms) {
        const res = await apiClient.post("/api/social/posts", {
          content: item.content || "",
          platform,
          scheduled_for: scheduledForIso,
          status: scheduleMode === "later" ? "scheduled" : "draft",
          content_item_id: item.id || item.asset_id || null,
          campaign_id: item.campaign_id || null,
        });
        const post = res?.data?.post;
        if (post?.id) created.push(post);
      }

      if (scheduleMode === "now") {
        for (const post of created) {
          await apiClient.post(`/api/social/posts/${post.id}/publish`);
        }
      }

      setToast(scheduleMode === "later" ? "Post scheduled." : "Post published.");
      setTimeout(() => { setToast(null); onClose(); }, 1800);
    } catch {
      setToast("Something went wrong. Try again.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const openInSMM = () => {
    onClose();
    navigate("/social-media-manager", {
      state: {
        prefillContent: item.content || "",
        prefillTitle: item.title || "",
        contentItemId: item.id || item.asset_id || null,
        campaignId: item.campaign_id || null,
      },
    });
  };

  if (!item) return null;

  const connectedPlatforms = (connection?.connected_platforms || []).map((entry) =>
    typeof entry === "string" ? entry : entry?.platform
  ).filter(Boolean);
  const isConnected = connectedPlatforms.length > 0;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(13,0,16,0.45)",
          zIndex: 200,
        }}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(480px, 100vw)",
        background: "var(--cth-command-panel)",
        borderLeft: "1px solid var(--cth-command-border)",
        zIndex: 201,
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--cth-command-border)",
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              margin: 0, fontSize: 11,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--cth-command-muted)",
              fontFamily: SANS,
            }}>
              Content Studio
            </p>
            <h2 style={{
              margin: "2px 0 0", fontSize: 20,
              fontFamily: SERIF,
              color: "var(--cth-command-ink)", fontWeight: 600,
            }}>
              Publish Content
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--cth-command-muted)", padding: 4,
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--cth-command-border)",
          flexShrink: 0,
        }}>
          <p style={{
            margin: "0 0 4px", fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--cth-command-muted)", fontFamily: SANS,
          }}>
            Content
          </p>
          {item.title && (
            <p style={{
              margin: "0 0 4px", fontSize: 14, fontWeight: 600,
              color: "var(--cth-command-ink)", fontFamily: SANS,
            }}>
              {item.title}
            </p>
          )}
          <p style={{
            margin: 0, fontSize: 13,
            color: "var(--cth-command-ink)", fontFamily: SANS,
            lineHeight: 1.6, opacity: 0.75,
          }}>
            {(item.content || "").slice(0, 140)}
            {(item.content || "").length > 140 ? "..." : ""}
          </p>
        </div>

        <div style={{ padding: "24px", flex: 1 }}>
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              color: "var(--cth-command-muted)",
            }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: 14, fontFamily: SANS }}>
                Checking connection...
              </span>
            </div>
          ) : !isConnected ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{
                fontSize: 15, color: "var(--cth-command-ink)",
                fontFamily: SANS, marginBottom: 8,
              }}>
                Your social accounts are not connected yet.
              </p>
              <p style={{
                fontSize: 13, color: "var(--cth-command-muted)",
                fontFamily: SANS, marginBottom: 24,
              }}>
                Connect them in Social Settings to start publishing.
              </p>
              <button onClick={openInSMM} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 4,
                background: "var(--cth-command-purple)",
                color: "var(--cth-command-gold)",
                border: "none", cursor: "pointer",
                fontSize: 13, fontFamily: SANS,
              }}>
                Go to Social Settings <ExternalLink size={14} />
              </button>
            </div>
          ) : !canPublish ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Lock size={32} style={{
                color: "var(--cth-command-muted)", marginBottom: 12,
              }} />
              <p style={{
                fontSize: 15, color: "var(--cth-command-ink)",
                fontFamily: SANS, marginBottom: 8,
              }}>
                Scheduling is available on House and above.
              </p>
              <a href="/tiers" style={{
                display: "inline-block", marginTop: 8,
                padding: "10px 18px", borderRadius: 4,
                background: "var(--cth-command-purple)",
                color: "var(--cth-command-gold)",
                fontSize: 13, fontFamily: SANS,
                textDecoration: "none",
              }}>
                Upgrade your plan
              </a>
              <div style={{ marginTop: 20 }}>
                <button onClick={openInSMM} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 12, color: "var(--cth-command-muted)",
                  fontFamily: SANS, textDecoration: "underline",
                }}>
                  Open in Social Manager instead
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{
                margin: "0 0 12px", fontSize: 12,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "var(--cth-command-muted)", fontFamily: SANS,
              }}>
                Select Platforms
              </p>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28,
              }}>
                {connectedPlatforms.map((p) => (
                  <button key={p} onClick={() => togglePlatform(p)} style={{
                    padding: "7px 14px", borderRadius: 4, cursor: "pointer",
                    fontSize: 13, fontFamily: SANS,
                    background: selectedPlatforms.includes(p)
                      ? "var(--cth-command-purple)"
                      : "var(--cth-command-panel-soft)",
                    color: selectedPlatforms.includes(p)
                      ? "var(--cth-command-gold)"
                      : "var(--cth-command-muted)",
                    border: `1px solid ${selectedPlatforms.includes(p)
                      ? "var(--cth-command-purple)"
                      : "var(--cth-command-border)"}`,
                    transition: "all 0.15s",
                  }}>
                    {PLATFORM_LABELS[p] || p}
                  </button>
                ))}
              </div>

              <p style={{
                margin: "0 0 10px", fontSize: 12,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "var(--cth-command-muted)", fontFamily: SANS,
              }}>
                When
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {["now", "later"].map((m) => (
                  <button key={m} onClick={() => setScheduleMode(m)} style={{
                    padding: "7px 16px", borderRadius: 4, cursor: "pointer",
                    fontSize: 13, fontFamily: SANS,
                    background: scheduleMode === m
                      ? "var(--cth-command-purple)"
                      : "var(--cth-command-panel-soft)",
                    color: scheduleMode === m
                      ? "var(--cth-command-gold)"
                      : "var(--cth-command-muted)",
                    border: `1px solid ${scheduleMode === m
                      ? "var(--cth-command-purple)"
                      : "var(--cth-command-border)"}`,
                  }}>
                    {m === "now" ? "Publish Now" : "Schedule for Later"}
                  </button>
                ))}
              </div>

              {scheduleMode === "later" && (
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 4,
                      border: "1px solid var(--cth-command-border)",
                      background: "var(--cth-command-panel-soft)",
                      color: "var(--cth-command-ink)",
                      fontFamily: SANS, fontSize: 13,
                    }}
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 4,
                      border: "1px solid var(--cth-command-border)",
                      background: "var(--cth-command-panel-soft)",
                      color: "var(--cth-command-ink)",
                      fontFamily: SANS, fontSize: 13,
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {!loading && isConnected && canPublish && (
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--cth-command-border)",
            display: "flex", gap: 10, flexShrink: 0,
          }}>
            <button
              onClick={handleSubmit}
              disabled={!selectedPlatforms.length || submitting}
              style={{
                flex: 1, padding: "11px 0", borderRadius: 4,
                background: selectedPlatforms.length && !submitting
                  ? "var(--cth-command-purple)"
                  : "var(--cth-command-border)",
                color: selectedPlatforms.length && !submitting
                  ? "var(--cth-command-gold)"
                  : "var(--cth-command-muted)",
                border: "none",
                cursor: selectedPlatforms.length && !submitting
                  ? "pointer" : "default",
                fontSize: 14, fontFamily: SANS, fontWeight: 600,
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {scheduleMode === "later" ? "Schedule Post" : "Publish Now"}
            </button>
            <button onClick={openInSMM} title="Open in Social Manager" style={{
              padding: "11px 14px", borderRadius: 4,
              background: "none",
              border: "1px solid var(--cth-command-border)",
              color: "var(--cth-command-muted)",
              cursor: "pointer", fontSize: 13,
              fontFamily: SANS,
            }}>
              <ExternalLink size={14} />
            </button>
          </div>
        )}

        {toast && (
          <div style={{
            position: "absolute", bottom: 80, left: "50%",
            transform: "translateX(-50%)",
            background: "var(--cth-command-purple)",
            color: "var(--cth-command-gold)",
            padding: "10px 20px", borderRadius: 4,
            fontSize: 13, fontFamily: SANS,
            whiteSpace: "nowrap", zIndex: 10,
          }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
