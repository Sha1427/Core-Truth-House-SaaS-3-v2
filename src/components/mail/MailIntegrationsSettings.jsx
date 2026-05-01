import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PlugZap, RefreshCw, Server, Settings, ShieldCheck } from "lucide-react";
import apiClient from "../../lib/apiClient";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const DEFAULT_INTEGRATIONS = [
  {
    id: "gmail",
    provider: "gmail",
    display_name: "Gmail",
    status: "not_connected",
    connection_type: "oauth",
    description: "Connect a Google mailbox for inbox sync, sent mail, and tracked follow-ups.",
  },
  {
    id: "microsoft",
    provider: "microsoft",
    display_name: "Microsoft 365 / Outlook",
    status: "not_connected",
    connection_type: "oauth",
    description: "Connect Outlook or Microsoft 365 for workspace email visibility.",
  },
  {
    id: "smtp_imap",
    provider: "smtp_imap",
    display_name: "SMTP / IMAP",
    status: "planned",
    connection_type: "server",
    description: "Connect a custom mailbox for sending and inbox sync when OAuth is not available.",
  },
  {
    id: "resend",
    provider: "resend",
    display_name: "Resend",
    status: "planned",
    connection_type: "api_key",
    description: "Connect transactional email for confirmations, system messages, and click events.",
  },
];

function normalizeList(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function StatusPill({ status }) {
  const isConnected = status === "connected";
  const isPlanned = status === "planned";

  let label = "Connect";
  let style = {
    background: "color-mix(in srgb, var(--cth-command-crimson) 8%, var(--cth-command-panel))",
    color: "var(--cth-command-crimson)",
    border: "1px solid color-mix(in srgb, var(--cth-command-crimson) 25%, var(--cth-command-border))",
  };

  if (isConnected) {
    label = "Connected";
    style = {
      background: "var(--cth-command-crimson)",
      color: "var(--cth-command-ivory)",
      border: "1px solid var(--cth-command-crimson)",
    };
  } else if (isPlanned) {
    label = "Planned";
    style = {
      background: "var(--cth-command-panel-soft)",
      color: "var(--cth-command-muted)",
      border: "1px solid var(--cth-command-border)",
    };
  }

  return (
    <span
      style={{
        ...style,
        borderRadius: 4,
        padding: "4px 10px",
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

function IntegrationCard({ integration, onSetup }) {
  const isConnected = integration.status === "connected";

  return (
    <article
      style={{
        backgroundColor: "var(--cth-command-panel)",
        border: "1px solid var(--cth-command-border)",
        borderRadius: 4,
        padding: 16,
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center"
            style={{
              borderRadius: 4,
              background: "color-mix(in srgb, var(--cth-command-gold) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--cth-command-gold) 32%, transparent)",
              color: "var(--cth-command-crimson)",
            }}
          >
            {integration.connection_type === "server" ? <Server size={18} /> : <PlugZap size={18} />}
          </div>
          <div>
            <h3
              style={{
                fontFamily: SERIF,
                fontSize: 15,
                fontWeight: 600,
                color: "var(--cth-command-ink)",
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              {integration.display_name}
            </h3>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 12,
                lineHeight: 1.55,
                color: "var(--cth-command-muted)",
                marginTop: 4,
                margin: "4px 0 0",
              }}
            >
              {integration.description}
            </p>
          </div>
        </div>

        <StatusPill status={integration.status} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2"
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: "var(--cth-command-muted)",
          }}
        >
          <ShieldCheck size={14} />
          Workspace-scoped
        </div>

        <button
          type="button"
          onClick={() => onSetup(integration)}
          className="inline-flex items-center gap-2"
          style={{
            background: "var(--cth-command-purple)",
            color: "var(--cth-command-gold)",
            border: "none",
            borderRadius: 4,
            padding: "8px 14px",
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: "pointer",
          }}
        >
          <Settings size={14} />
          {isConnected ? "Manage" : "Set up"}
        </button>
      </div>
    </article>
  );
}

export default function MailIntegrationsSettings() {
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const connectedCount = useMemo(
    () => integrations.filter((item) => item.status === "connected").length,
    [integrations]
  );

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const data = await apiClient.get("/api/mail/integrations");
      const saved = normalizeList(data, "integrations");

      if (saved.length) {
        const byProvider = new Map(DEFAULT_INTEGRATIONS.map((item) => [item.provider, item]));
        saved.forEach((item) => {
          byProvider.set(item.provider, {
            ...byProvider.get(item.provider),
            ...item,
          });
        });
        setIntegrations(Array.from(byProvider.values()));
      }
    } catch {
      setError("Unable to load mail integrations. This requires The Structure plan and above.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleSetupIntegration = async (integration) => {
    setError("");
    setNotice("");

    try {
      await apiClient.post("/api/mail/integrations", {
        provider: integration.provider,
        display_name: integration.display_name,
        status: integration.status === "connected" ? "connected" : "not_connected",
        connection_type: integration.connection_type,
        settings: {},
      });

      setNotice(`${integration.display_name} setup record saved. OAuth and credential wiring come next.`);
      await loadIntegrations();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Unable to save integration setup.");
    }
  };

  const eyebrowStyle = {
    fontFamily: SANS,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--cth-command-muted)",
    margin: 0,
  };

  const summaryCardStyle = {
    background: "var(--cth-command-panel-soft)",
    border: "1px solid var(--cth-command-border)",
    borderRadius: 4,
    padding: 16,
  };

  return (
    <section
      style={{
        background: "var(--cth-command-panel)",
        border: "1px solid var(--cth-command-border)",
        borderRadius: 4,
        padding: 20,
      }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            style={{
              ...eyebrowStyle,
              color: "var(--cth-command-crimson)",
              marginBottom: 8,
            }}
          >
            Structure plan and above
          </p>
          <h2
            style={{
              fontFamily: SERIF,
              fontSize: 22,
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              margin: 0,
              letterSpacing: "-0.005em",
              lineHeight: 1.25,
            }}
          >
            Mail Service Integrations
          </h2>
          <p
            style={{
              fontFamily: SANS,
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--cth-command-muted)",
              margin: "6px 0 0",
            }}
          >
            Connect Gmail, Microsoft 365, SMTP/IMAP, or Resend for workspace communication.
          </p>
        </div>

        <button
          type="button"
          onClick={loadIntegrations}
          className="inline-flex items-center gap-2"
          style={{
            background: "transparent",
            color: "var(--cth-command-ink)",
            border: "1px solid var(--cth-command-border)",
            borderRadius: 4,
            padding: "8px 14px",
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {notice ? (
        <div
          className="mb-4"
          style={{
            background: "color-mix(in srgb, var(--cth-status-success-bright) 10%, var(--cth-command-panel))",
            border: "1px solid color-mix(in srgb, var(--cth-status-success-bright) 35%, var(--cth-command-border))",
            borderRadius: 4,
            padding: "10px 14px",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--cth-status-success-bright)",
          }}
        >
          {notice}
        </div>
      ) : null}

      {error ? (
        <div
          className="mb-4"
          style={{
            background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
            border: "1px solid color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
            borderRadius: 4,
            padding: "10px 14px",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            color: "var(--cth-danger)",
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div style={summaryCardStyle}>
          <div style={eyebrowStyle}>Connected</div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 28,
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              marginTop: 8,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            {connectedCount}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={eyebrowStyle}>Providers</div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 28,
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              marginTop: 8,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            {integrations.length}
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div style={eyebrowStyle}>Security</div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--cth-command-ink)",
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Workspace scoped
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.provider || integration.id}
            integration={integration}
            onSetup={handleSetupIntegration}
          />
        ))}
      </div>

      <div
        className="mt-5"
        style={{
          background: "var(--cth-command-panel-soft)",
          border: "1px solid var(--cth-command-border)",
          borderRadius: 4,
          padding: 16,
          fontFamily: SANS,
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--cth-command-muted)",
        }}
      >
        <strong style={{ color: "var(--cth-command-ink)" }}>Security note:</strong> provider tokens should be encrypted on the backend, scoped to the workspace, and never exposed as raw credentials in the browser.
      </div>
    </section>
  );
}
