import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Users, Mail, Phone, Building2 } from "lucide-react";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useColors } from "../context/ThemeContext";
import apiClient from "../lib/apiClient";

function StatCard({ label, value, Icon, colors }) {
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Icon size={18} style={{ color: colors.cinnabar }} />
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: colors.textPrimary,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 12,
          color: colors.textMuted,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function EmptyState({ colors, hasSearch }) {
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 16,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <Users size={30} style={{ color: colors.cinnabar, marginBottom: 12 }} />
      <h3 style={{ margin: "0 0 8px", color: colors.textPrimary }}>
        {hasSearch ? "No matching contacts" : "No contacts yet"}
      </h3>
      <p style={{ margin: 0, color: colors.textMuted, fontSize: 14 }}>
        {hasSearch
          ? "Try a different search term."
          : "Contacts will appear here as they are created in your workspace."}
      </p>
    </div>
  );
}

function ContactRow({ contact, colors }) {
  const name =
    contact.name ||
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unnamed Contact";

  const email = contact.email || "No email";
  const phone = contact.phone || "No phone";
  const business =
    contact.business_name ||
    contact.company ||
    contact.organization ||
    "No business";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1.2fr 1fr 1.2fr",
        gap: 16,
        padding: "14px 16px",
        borderBottom: `1px solid ${colors.tuscany}12`,
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: colors.textPrimary }}>{name}</div>
        <div style={{ fontSize: 12, color: colors.textMuted }}>
          {contact.role || contact.title || "Contact"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: colors.textMuted,
          fontSize: 13,
        }}
      >
        <Mail size={14} />
        <span>{email}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: colors.textMuted,
          fontSize: 13,
        }}
      >
        <Phone size={14} />
        <span>{phone}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: colors.textMuted,
          fontSize: 13,
        }}
      >
        <Building2 size={14} />
        <span>{business}</span>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const colors = useColors();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadContacts() {
      setLoading(true);
      setError("");

      try {
        const data = await apiClient.get("/api/crm/contacts");
        const items =
          data?.contacts ||
          data?.items ||
          data?.data ||
          [];

        if (isMounted) {
          setContacts(Array.isArray(items) ? items : []);
        }
      } catch (err) {
        console.error("Failed to load contacts", err);
        if (isMounted) {
          setContacts([]);
          setError(err?.message || "Unable to load contacts.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadContacts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return contacts;

    return contacts.filter((contact) => {
      const haystack = [
        contact.name,
        contact.first_name,
        contact.last_name,
        contact.email,
        contact.phone,
        contact.business_name,
        contact.company,
        contact.organization,
        contact.role,
        contact.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [contacts, query]);

  const totalContacts = contacts.length;
  const contactsWithEmail = contacts.filter((item) => item.email).length;
  const contactsWithPhone = contacts.filter((item) => item.phone).length;

  return (
    <DashboardLayout>
      <TopBar
        title="Contacts"
        subtitle="View and search the contacts stored in your workspace."
      />

      <div style={{ padding: "20px 24px 32px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <StatCard
            label="Total Contacts"
            value={totalContacts}
            Icon={Users}
            colors={colors}
          />
          <StatCard
            label="With Email"
            value={contactsWithEmail}
            Icon={Mail}
            colors={colors}
          />
          <StatCard
            label="With Phone"
            value={contactsWithPhone}
            Icon={Phone}
            colors={colors}
          />
        </div>

        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.tuscany}15`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: `1px solid ${colors.tuscany}12`,
            }}
          >
            <div
              style={{
                position: "relative",
                maxWidth: 420,
              }}
            >
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.textMuted,
                }}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search contacts by name, email, phone, or business"
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 38px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.04)",
                  color: colors.textPrimary,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {loading ? (
            <div
              style={{
                minHeight: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader2
                className="animate-spin"
                size={24}
                style={{ color: colors.cinnabar }}
              />
            </div>
          ) : error ? (
            <div
              style={{
                margin: 16,
                padding: "14px 16px",
                borderRadius: 12,
                background: "rgba(224,78,53,0.10)",
                border: "1px solid rgba(224,78,53,0.25)",
                color: colors.cinnabar,
              }}
            >
              {error}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: 16 }}>
              <EmptyState colors={colors} hasSearch={Boolean(query.trim())} />
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1.2fr 1fr 1.2fr",
                  gap: 16,
                  padding: "12px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: colors.textMuted,
                  borderBottom: `1px solid ${colors.tuscany}12`,
                }}
              >
                <div>Name</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Business</div>
              </div>

              <div>
                {filteredContacts.map((contact, index) => (
                  <ContactRow
                    key={contact.id || contact.contact_id || contact.email || index}
                    contact={contact}
                    colors={colors}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
