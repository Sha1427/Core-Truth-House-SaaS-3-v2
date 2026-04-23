import React, { useMemo, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
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

  const statusClass = status?.type === "success" ? "cth-text-success" : "cth-text-danger";
  const statusVar = status?.type === "success" ? "var(--cth-success)" : "var(--cth-danger)";

  return (
    <DashboardLayout>
      <TopBar
        title="Contact"
        subtitle="Reach out for support, questions, or partnership inquiries."
      />

      <div className="cth-page flex-1 overflow-auto px-4 py-5 md:px-7">
        <div className="mx-auto max-w-3xl">
          <div className="cth-card p-5 md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background: "rgba(224,78,53,0.12)",
                  color: "var(--cth-admin-accent)",
                }}
              >
                <Mail size={20} />
              </div>

              <div>
                <h3 className="m-0 text-lg font-semibold cth-heading">Send a message</h3>
                <p className="mt-1 mb-0 text-sm cth-muted">
                  Tell us what you need and we’ll route it to the right place.
                </p>
              </div>
            </div>

            {status ? (
              <div
                className={`cth-card mb-4 px-4 py-3 text-sm ${statusClass}`}
                style={{
                  background: `color-mix(in srgb, ${statusVar} 10%, var(--cth-admin-panel))`,
                  borderColor: `color-mix(in srgb, ${statusVar} 25%, var(--cth-admin-border))`,
                }}
              >
                {status.text}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="cth-label">Name</label>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="cth-input"
                  />
                </div>

                <div>
                  <label className="cth-label">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="cth-input"
                  />
                </div>
              </div>

              <div>
                <label className="cth-label">Business name</label>
                <input
                  value={form.businessName}
                  onChange={(event) => updateField("businessName", event.target.value)}
                  className="cth-input"
                />
              </div>

              <div>
                <label className="cth-label">Subject</label>
                <input
                  value={form.subject}
                  onChange={(event) => updateField("subject", event.target.value)}
                  className="cth-input"
                />
              </div>

              <div>
                <label className="cth-label">Message</label>
                <textarea
                  value={form.message}
                  rows={7}
                  onChange={(event) => updateField("message", event.target.value)}
                  className="cth-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="cth-button-primary inline-flex items-center justify-center gap-2"
                style={{
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
