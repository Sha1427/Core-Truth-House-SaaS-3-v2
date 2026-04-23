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

function FieldRenderer({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(field.id, event.target.value)}
        rows={4}
        placeholder={field.placeholder}
        className="cth-textarea"
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(field.id, event.target.value)}
      placeholder={field.placeholder}
      className="cth-input"
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

      <div className="cth-page flex-1 overflow-auto px-4 py-5 md:px-7">
        <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <div className="cth-card p-4">
            <div className="mb-4">
              <label className="cth-label">Content type</label>
              <select
                value={form.content_type}
                onChange={(event) => updateField("content_type", event.target.value)}
                className="cth-select"
              >
                {CONTENT_TYPES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cth-card-muted mb-4 p-3">
              <div className="mb-1 text-sm font-semibold cth-heading">{selectedType.label}</div>
              <div className="text-sm cth-muted">{selectedType.description}</div>
            </div>

            <div className="grid gap-3">
              {selectedType.fields.map((field) => (
                <div key={field.id}>
                  <label className="cth-label">
                    {field.label}
                    {field.required ? <span className="ml-1 cth-text-accent">*</span> : null}
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
              <div
                className="cth-card mt-4 px-3 py-3 text-sm cth-text-danger"
                style={{
                  background: "color-mix(in srgb, var(--cth-danger) 10%, var(--cth-app-panel))",
                  borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-app-border))",
                }}
              >
                {generateError}
              </div>
            ) : null}

            <button
              type="button"
              disabled={generating}
              onClick={handleGenerate}
              className="cth-button-primary mt-4 inline-flex w-full items-center justify-center gap-2"
              style={{ opacity: generating ? 0.7 : 1 }}
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              {generating ? "Generating..." : "Generate Content"}
            </button>
          </div>

          <div className="grid gap-5">
            <div className="cth-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-lg font-semibold cth-heading">Generated Output</h3>
                  <p className="mt-1 mb-0 text-sm cth-muted">
                    Generate content, then save it to your workspace library.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!generatedContent}
                    onClick={handleCopy}
                    className="cth-button-secondary inline-flex items-center gap-2"
                  >
                    <Copy size={15} />
                    Copy
                  </button>

                  <button
                    type="button"
                    disabled={!generatedContent || saving}
                    onClick={handleSave}
                    className="cth-button-secondary inline-flex items-center gap-2"
                    style={{ opacity: !generatedContent || saving ? 0.7 : 1 }}
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Save
                  </button>
                </div>
              </div>

              {saveError ? (
                <div
                  className="cth-card mb-4 px-3 py-3 text-sm cth-text-danger"
                  style={{
                    background: "color-mix(in srgb, var(--cth-danger) 10%, var(--cth-app-panel))",
                    borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-app-border))",
                  }}
                >
                  {saveError}
                </div>
              ) : null}

              {!generatedContent ? (
                <div className="cth-card-muted rounded-xl p-6 text-center cth-muted">
                  <Sparkles size={18} className="mx-auto mb-3 cth-text-accent" />
                  Your generated content will appear here.
                </div>
              ) : (
                  <div className="space-y-3">
                    <textarea
                      value={generatedContent}
                      onChange={(event) => setGeneratedContent(event.target.value)}
                      className="cth-input min-h-[320px] w-full resize-y"
                    />
                    <div
                      className="cth-card-muted max-w-none rounded-xl p-4 text-sm leading-relaxed cth-body"
                      dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                  </div>
                )}
            </div>

            <div className="cth-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="m-0 text-lg font-semibold cth-heading">Content Library</h3>
                  <p className="mt-1 mb-0 text-sm cth-muted">
                    Saved content assets for this workspace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadLibrary}
                  className="cth-button-secondary inline-flex items-center gap-2"
                >
                  {loadingLibrary ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  Refresh
                </button>
              </div>

              {libraryError ? (
                <div
                  className="cth-card mb-4 px-3 py-3 text-sm cth-text-danger"
                  style={{
                    background: "color-mix(in srgb, var(--cth-danger) 10%, var(--cth-app-panel))",
                    borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-app-border))",
                  }}
                >
                  {libraryError}
                </div>
              ) : null}

              {loadingLibrary ? (
                <div className="flex min-h-[140px] items-center justify-center">
                  <Loader2 size={20} className="animate-spin cth-text-accent" />
                </div>
              ) : library.length === 0 ? (
                <div className="cth-card-muted rounded-xl p-5 cth-muted">
                  No saved content yet.
                </div>
              ) : (
                <div className="grid gap-3">
                  {library.map((item) => (
                      <div
                        key={item.id || item.asset_id}
                        className="cth-card-muted rounded-xl p-4"
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
                          >
                            <div className="mb-1 font-medium cth-heading">
                              {item.title || item.content_type || "Untitled"}
                            </div>
                            <div className="mb-2 text-xs uppercase tracking-wide cth-muted">
                              {item.content_type || "generated"}
                            </div>
                            <div className="line-clamp-3 text-sm cth-muted">
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
                            className="cth-button-secondary"
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
