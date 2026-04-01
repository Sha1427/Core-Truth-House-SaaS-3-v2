import React, { useMemo, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useColors } from "../context/ThemeContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const INITIAL_FORM = {
  name: "",
  email: "",
  businessName: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const colors = useColors();

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const isValid = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.subject.trim() &&
      form.message.trim()
    );
  }, [form]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await apiClient.post(
        API_PATHS.contact.submit,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          businessName: form.businessName.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        },
        { workspace: false }
      );

      setStatus({
        type: "success",
        text: res?.message || "Your message has been sent.",
      });
      setForm(INITIAL_FORM);
    } catch (error) {
      console.error("Failed to submit contact form", error);
      setStatus({
        type: "error",
        text: error?.message || "Failed to submit your message.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Contact"
        subtitle="Reach out for support, questions, or partnership inquiries."
      />

      <div className="px-4 py-5 md:px-7">
        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl p-5 md:p-6"
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}15`,
            }}
          >
            <div className="mb-5 flex items-start gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: "rgba(224,78,53,0.12)" }}
              >
                <Mail size={20} style={{ color: colors.cinnabar }} />
              </div>

              <div>
                <h3 className="m-0 text-lg font-semibold text-white">Send a message</h3>
                <p className="mt-1 mb-0 text-sm text-white/60">
                  Tell us what you need and we’ll route it to the right place.
                </p>
              </div>
            </div>

            {status ? (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm"
                style={{
                  background:
                    status.type === "success"
                      ? "rgba(34,197,94,0.10)"
                      : "rgba(224,78,53,0.10)",
                  border:
                    status.type === "success"
                      ? "1px solid rgba(34,197,94,0.25)"
                      : "1px solid rgba(224,78,53,0.25)",
                  color: status.type === "success" ? "#22c55e" : "#E04E35",
                }}
              >
                {status.text}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/70">Name</label>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="w-full rounded-xl px-3 py-3 text-white"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="w-full rounded-xl px-3 py-3 text-white"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Business name</label>
                <input
                  value={form.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  className="w-full rounded-xl px-3 py-3 text-white"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Subject</label>
                <input
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  className="w-full rounded-xl px-3 py-3 text-white"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Message</label>
                <textarea
                  value={form.message}
                  rows={7}
                  onChange={(event) => updateField("message", event.target.value)}
                  className="w-full rounded-xl px-3 py-3 text-white"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-white font-semibold"
                style={{
                  background: "#E04E35",
                  opacity: !isValid || submitting ? 0.7 : 1,
                }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
