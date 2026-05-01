import React, { useCallback, useEffect, useMemo, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  Copy,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

import { useLocation } from "react-router-dom";
import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";
import { useWorkspace } from "../context/WorkspaceContext";
import API_PATHS from "../lib/apiPaths";

const CONTENT_TYPES = [
  {
    id: "instagram-caption",
    label: "Instagram Caption",
    description: "Hook, body, CTA, and on-brand tone.",
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is this post about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "Bold, warm, direct, luxurious..." },
      { id: "custom_instruction", label: "Extra instruction", type: "textarea", required: false, placeholder: "Anything specific to include?" },
    ],
  },
  {
    id: "reel-hook",
    label: "Reel Hook Set",
    description: "Five scroll-stopping opening lines.",
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is the Reel about?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "Direct, disruptive, emotional..." },
    ],
  },
  {
    id: "carousel-outline",
    label: "Carousel Outline",
    description: "Slide-by-slide structure for teaching or selling.",
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What is the carousel about?" },
      { id: "custom_instruction", label: "Extra instruction", type: "textarea", required: false, placeholder: "Audience, CTA, slide count, or angle..." },
    ],
  },
  {
    id: "email-newsletter",
    label: "Email Newsletter",
    description: "A full newsletter draft in your brand voice.",
    fields: [
      { id: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What should this email cover?" },
      { id: "offer", label: "Offer", type: "text", required: false, placeholder: "What are you leading people toward?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "Conversational, strategic, nurturing..." },
      { id: "custom_instruction", label: "Extra instruction", type: "textarea", required: false, placeholder: "Any specific CTA, story, or section?" },
    ],
  },
  {
    id: "sales-page",
    label: "Sales Page Copy",
    description: "Long-form copy built around clarity and conversion.",
    fields: [
      { id: "offer", label: "Offer", type: "textarea", required: true, placeholder: "What are you selling?" },
      { id: "topic", label: "Audience or problem", type: "textarea", required: true, placeholder: "Who is this for and what do they want?" },
      { id: "tone", label: "Tone", type: "text", required: false, placeholder: "Premium, direct, emotionally clear..." },
      { id: "custom_instruction", label: "Extra instruction", type: "textarea", required: false, placeholder: "Price point, CTA, objections, or proof points..." },
    ],
  },
];

const DEFAULT_FORM = {
  content_type: CONTENT_TYPES[0].id,
  topic: "",
  offer: "",
  tone: "",
  custom_instruction: "",
};

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.25,
};

const BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--cth-command-ink)",
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.55,
  color: "var(--cth-command-muted)",
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  display: "block",
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "var(--cth-command-ink)",
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: "100%",
  background: "var(--cth-command-panel)",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 12px",
  fontFamily: SANS,
  fontSize: 13,
  outline: "none",
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  padding: "10px 12px",
  lineHeight: 1.55,
  resize: "vertical",
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 4,
  padding: "10px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: "transparent",
  color: "var(--cth-command-ink)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 14px",
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const ERROR_CARD_STYLE = {
  ...CARD_STYLE,
  borderColor: "color-mix(in srgb, var(--cth-danger) 35%, var(--cth-command-border))",
  background: "color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))",
  color: "var(--cth-danger)",
  fontFamily: SANS,
  fontSize: 13,
  padding: "10px 14px",
};

function FieldRenderer({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
        rows={4}
        placeholder={field.placeholder}
        style={TEXTAREA_STYLE}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(field.id, event.target.value)}
      placeholder={field.placeholder}
      style={INPUT_STYLE}
    />
  );
}

export default function ContentStudio() {
  const location = useLocation();
  const campaignId = location.state?.campaignId || "";
  const contentItemId = location.state?.contentItemId || "";
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [libraryError, setLibraryError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { activeWorkspaceId } = useWorkspace();
  const [library, setLibrary] = useState([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [currentItemId, setCurrentItemId] = useState("");

  const selectedType = useMemo(() => {
    return CONTENT_TYPES.find((item) => item.id === form.content_type) || CONTENT_TYPES[0];
  }, [form.content_type]);

  const renderedHtml = useMemo(() => {
    if (!generatedContent) return "";
    return DOMPurify.sanitize(marked.parse(generatedContent));
  }, [generatedContent]);

  useEffect(() => {
    const state = location.state || {};
    if (!state || Object.keys(state).length === 0) return;

    setForm((prev) => ({
      ...prev,
      content_type:
        state.format === "Sales Page"
          ? "sales-page"
          : state.format === "Blog Post"
          ? "email-newsletter"
          : prev.content_type,
      topic: state.topic || prev.topic,
      offer: state.offer || prev.offer,
    }));
  }, [location.state]);

  const loadLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    setLibraryError("");

    try {
      const res = await apiClient.get(API_PATHS.persist.contentLibrary, {
        params: {
          workspace_id: activeWorkspaceId,
        },
      });
      setLibrary(res?.assets || []);
    } catch (error) {
      console.error("Failed to load content library", error);
      setLibraryError(error?.message || "Failed to load content library.");
    } finally {
      setLoadingLibrary(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const updateField = (fieldId, value) => {
    setForm((current) => ({
      ...current,
      [fieldId]: value,
    }));
  };

  const validate = () => {
    const missing = selectedType.fields.find(
      (field) => field.required && !String(form[field.id] || "").trim()
    );

    if (missing) {
      throw new Error(`${missing.label} is required.`);
    }
  };

  const handleGenerate = async () => {
    setGenerateError("");
    setSaveError("");
    setGeneratedContent("");

    try {
      validate();
      setGenerating(true);

      const payload = {
        content_type: form.content_type,
        topic: form.topic || undefined,
        offer: form.offer || undefined,
        tone: form.tone || undefined,
        custom_instruction: form.custom_instruction || undefined,
      };

      const res = await apiClient.post(API_PATHS.persist.contentGenerate, payload);
      const content = res?.content || "";

      setGeneratedContent(content);
      setGeneratedTitle(
        `${selectedType.label} · ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`
      );
    } catch (error) {
      console.error("Failed to generate content", error);
      setGenerateError(error?.message || "Failed to generate content.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent.trim()) return;

    setSaveError("");
    try {
      setSaving(true);

      await apiClient.post(API_PATHS.persist.contentSave, {
        id: currentItemId || undefined,
        campaign_id: campaignId || undefined,
        content_item_id: contentItemId || undefined,
        content_type: form.content_type,
        title: generatedTitle || selectedType.label,
        content: generatedContent,
        metadata: {
          topic: form.topic,
          offer: form.offer,
          tone: form.tone,
          custom_instruction: form.custom_instruction,
          campaign_id: campaignId,
          content_item_id: contentItemId,
        },
      });

      await loadLibrary();
    } catch (error) {
      console.error("Failed to save content", error);
      setSaveError(error?.message || "Failed to save content.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
    } catch (error) {
      console.error("Failed to copy content", error);
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Content Studio"
        subtitle="Generate, refine, and save content using your current brand system."
      />

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="content-studio-page"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[420px_1fr]">
          {/* Left: form */}
          <div style={{ ...CARD_STYLE, padding: 20 }}>
            <div className="mb-4">
              <label style={FIELD_LABEL_STYLE}>Content type</label>
              <select
                value={form.content_type}
                onChange={(event) => updateField("content_type", event.target.value)}
                style={INPUT_STYLE}
              >
                {CONTENT_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="mb-4"
              style={{
                ...CARD_STYLE,
                background: "var(--cth-command-panel-soft)",
                padding: 14,
              }}
            >
              <div style={{ ...BODY_STYLE, fontWeight: 600 }}>{selectedType.label}</div>
              <div style={{ ...MUTED_STYLE, marginTop: 4 }}>{selectedType.description}</div>
            </div>

            <div className="grid gap-3">
              {selectedType.fields.map((field) => (
                <div key={field.id}>
                  <label style={FIELD_LABEL_STYLE}>
                    {field.label}
                    {field.required ? (
                      <span style={{ color: "var(--cth-command-crimson)", marginLeft: 4 }}>*</span>
                    ) : null}
                  </label>
                  <FieldRenderer
                    field={field}
                    value={form[field.id] || ""}
                    onChange={updateField}
                  />
                </div>
              ))}
            </div>

            {generateError ? (
              <div className="mt-4" style={ERROR_CARD_STYLE}>
                {generateError}
              </div>
            ) : null}

            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="mt-4 w-full"
              style={{
                ...PRIMARY_CTA_STYLE,
                width: "100%",
                opacity: generating ? 0.65 : 1,
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {generating ? "Generating..." : "Generate Content"}
            </button>
          </div>

          {/* Right: output + library */}
          <div className="grid gap-5">
            {/* Generated Output */}
            <div style={{ ...CARD_STYLE, padding: 20 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 style={SECTION_HEADING_STYLE}>Generated Output</h3>
                  <p style={{ ...MUTED_STYLE, marginTop: 6 }}>
                    Generate content, then save it to your workspace library.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!generatedContent}
                    onClick={handleCopy}
                    style={{
                      ...SECONDARY_BUTTON_STYLE,
                      opacity: !generatedContent ? 0.55 : 1,
                      cursor: !generatedContent ? "not-allowed" : "pointer",
                    }}
                  >
                    <Copy size={14} />
                    Copy
                  </button>

                  <button
                    type="button"
                    disabled={!generatedContent || saving}
                    onClick={handleSave}
                    style={{
                      ...SECONDARY_BUTTON_STYLE,
                      opacity: !generatedContent || saving ? 0.55 : 1,
                      cursor: !generatedContent || saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              </div>

              {saveError ? (
                <div className="mb-4" style={ERROR_CARD_STYLE}>
                  {saveError}
                </div>
              ) : null}

              {!generatedContent ? (
                <div
                  style={{
                    ...CARD_STYLE,
                    background: "var(--cth-command-panel-soft)",
                    padding: 28,
                    textAlign: "center",
                    fontFamily: SANS,
                    fontSize: 13,
                    color: "var(--cth-command-muted)",
                  }}
                >
                  <Sparkles
                    size={20}
                    style={{ display: "block", margin: "0 auto 10px", color: "var(--cth-command-crimson)" }}
                  />
                  Your generated content will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={generatedContent}
                    onChange={(event) => setGeneratedContent(event.target.value)}
                    style={{ ...TEXTAREA_STYLE, minHeight: 320 }}
                  />
                  <div
                    style={{
                      ...CARD_STYLE,
                      background: "var(--cth-command-panel-soft)",
                      padding: 16,
                      fontFamily: SANS,
                      fontSize: 13,
                      lineHeight: 1.65,
                      color: "var(--cth-command-ink)",
                    }}
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                </div>
              )}
            </div>

            {/* Content Library */}
            <div style={{ ...CARD_STYLE, padding: 20 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 style={SECTION_HEADING_STYLE}>Content Library</h3>
                  <p style={{ ...MUTED_STYLE, marginTop: 6 }}>
                    Saved content assets for this workspace.
                  </p>
                </div>

                <button type="button" onClick={loadLibrary} style={SECONDARY_BUTTON_STYLE}>
                  {loadingLibrary ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Refresh
                </button>
              </div>

              {libraryError ? (
                <div className="mb-4" style={ERROR_CARD_STYLE}>
                  {libraryError}
                </div>
              ) : null}

              {loadingLibrary ? (
                <div className="flex min-h-[140px] items-center justify-center">
                  <Loader2
                    size={20}
                    className="animate-spin"
                    style={{ color: "var(--cth-command-crimson)" }}
                  />
                </div>
              ) : library.length === 0 ? (
                <div
                  style={{
                    ...CARD_STYLE,
                    background: "var(--cth-command-panel-soft)",
                    padding: 20,
                    fontFamily: SANS,
                    fontSize: 13,
                    color: "var(--cth-command-muted)",
                  }}
                >
                  No saved content yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {library.map((item) => (
                    <div
                      key={item.id || item.asset_id}
                      style={{
                        ...CARD_STYLE,
                        background: "var(--cth-command-panel-soft)",
                        padding: 16,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentItemId(item.id || item.asset_id || "");
                            setGeneratedTitle(item.title || "");
                            setGeneratedContent(item.content || "");
                            setForm((prev) => ({
                              ...prev,
                              content_type: item.content_type || prev.content_type,
                              topic: item.metadata?.topic || prev.topic,
                              offer: item.metadata?.offer || prev.offer,
                              tone: item.metadata?.tone || prev.tone,
                              custom_instruction: item.metadata?.custom_instruction || prev.custom_instruction,
                            }));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="flex-1 text-left"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: SERIF,
                              fontSize: 16,
                              fontWeight: 600,
                              color: "var(--cth-command-ink)",
                              letterSpacing: "-0.005em",
                              marginBottom: 4,
                            }}
                          >
                            {item.title || item.content_type || "Untitled"}
                          </div>
                          <div
                            style={{
                              ...SECTION_LABEL_STYLE,
                              fontSize: 10,
                              marginBottom: 8,
                            }}
                          >
                            {item.content_type || "generated"}
                          </div>
                          <div
                            className="line-clamp-3"
                            style={{
                              fontFamily: SANS,
                              fontSize: 13,
                              lineHeight: 1.55,
                              color: "var(--cth-command-muted)",
                            }}
                          >
                            {item.content || ""}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={async (event) => {
                            event.stopPropagation();
                            const itemId = item.id || item.asset_id;
                            if (!itemId) return;
                            if (!window.confirm("Delete this saved content item?")) return;

                            try {
                              await apiClient.delete(`${API_PATHS.persist.contentLibrary.replace('/library', '')}/${itemId}`);
                              if (currentItemId === itemId) {
                                setCurrentItemId("");
                                setGeneratedTitle("");
                                setGeneratedContent("");
                              }
                              await loadLibrary();
                            } catch (error) {
                              console.error("Failed to delete content", error);
                              setSaveError(error?.message || "Failed to delete content.");
                            }
                          }}
                          style={SECONDARY_BUTTON_STYLE}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
