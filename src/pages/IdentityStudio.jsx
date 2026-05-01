import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUser } from '../hooks/useAuth';
import { BrandGuidelinesExportButton } from '../components/shared/BrandGuidelinesExport';
import IdentityStudioAssets from '../components/shared/IdentityStudioAssets';
import axios from 'axios';
import apiClient from "../lib/apiClient";

function isValidHex(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function isValidPartialHex(value) {
  if (!value) return true;
  return /^#?[0-9a-fA-F]{0,6}$/.test(String(value));
}

function isValidFullHex(value) {
  if (!value || typeof value !== 'string') return false;
  const stripped = value.trim();
  return /^#?[0-9a-fA-F]{3}$/.test(stripped) || /^#?[0-9a-fA-F]{6}$/.test(stripped);
}

function normalizeHex(value) {
  if (!value || typeof value !== 'string') return '';
  let v = value.trim().replace(/^#/, '').toUpperCase();
  if (v.length === 3) {
    v = v.split('').map((c) => c + c).join('');
  }
  return v.length === 6 ? `#${v}` : value;
}

function isCssVarReference(value) {
  return typeof value === 'string' && value.trim().startsWith('var(');
}

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const DEFAULT_COLORS = [
  { id: 'primary', role: 'primary', label: 'Primary', hex: 'var(--cth-brand-primary)' },
  { id: 'secondary', role: 'secondary', label: 'Secondary', hex: 'var(--cth-admin-accent)' },
  { id: 'accent', role: 'accent', label: 'Accent', hex: 'var(--cth-admin-muted)' },
  { id: 'background', role: 'background', label: 'Background', hex: 'var(--cth-surface-deep)' },
  { id: 'text', role: 'text', label: 'Text', hex: 'var(--cth-on-dark)' },
];

const DEFAULT_FONTS = [
  {
    id: 'primary',
    role: 'primary',
    label: 'Primary Font',
    family: 'Playfair Display',
    weight: '700',
    style: 'normal',
    sizeRem: 3.5,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    preview: 'Where Serious Brands Are Built.',
  },
  {
    id: 'secondary',
    role: 'secondary',
    label: 'Secondary Font',
    family: 'DM Sans',
    weight: '400',
    style: 'normal',
    sizeRem: 1.1,
    lineHeight: 1.65,
    letterSpacing: '0.01em',
    preview: 'The founders who build the deepest brands start with truth.',
  },
  {
    id: 'accent',
    role: 'accent',
    label: 'Accent Font',
    family: 'Cormorant Garamond',
    weight: '600',
    style: 'italic',
    sizeRem: 1.5,
    lineHeight: 1.3,
    letterSpacing: '0.01em',
    preview: 'Elegant accents create visual distinction.',
  },
];


const FONT_ROLE_OPTIONS = ['Primary Font', 'Secondary Font', 'Accent Font'];
const FONT_FAMILY_OPTIONS = [
  'Playfair Display',
  'DM Sans',
  'DM Sans',
  'Cormorant Garamond',
  'Georgia',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Montserrat',
  'Poppins',
  'Lora',
  'Merriweather',
];
const FONT_WEIGHT_OPTIONS = ['300', '400', '500', '600', '700', '800'];
const FONT_STYLE_OPTIONS = ['normal', 'italic'];

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";
const MONO = "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 24,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
  lineHeight: 1.2,
};

const SECTION_SUBTEXT_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  color: 'var(--cth-command-muted)',
  margin: '4px 0 0',
  lineHeight: 1.55,
};

const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
};

const FIELD_LABEL_STYLE = {
  display: 'block',
  fontFamily: SANS,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: '100%',
  background: 'var(--cth-command-panel)',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: '8px 12px',
  fontFamily: SANS,
  fontSize: 13,
  outline: 'none',
};

const PRIMARY_CTA_STYLE = {
  background: 'var(--cth-command-purple)',
  color: 'var(--cth-command-gold)',
  border: 'none',
  borderRadius: 4,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const SAVE_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-panel)',
  border: 'none',
  borderRadius: 4,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
};

const SAVE_BUTTON_DISABLED_STYLE = {
  ...SAVE_BUTTON_STYLE,
  background: 'var(--cth-command-panel-soft)',
  color: 'var(--cth-command-muted)',
  cursor: 'not-allowed',
};

const NEXT_STEP_PILL_STYLE = {
  ...PRIMARY_CTA_STYLE,
  borderRadius: 999,
  padding: '12px 22px',
};

function IdentityStudioContent() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useUser();
  const userId = user?.id;

  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [fonts, setFonts] = useState(DEFAULT_FONTS);
  const [assets, setAssets] = useState([]);
  const [copiedHex, setCopiedHex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [draftRecovery, setDraftRecovery] = useState(null);
  const [hexErrors, setHexErrors] = useState({});

  const originalColorsRef = useRef(null);
  const lastValidHexRef = useRef({});
  const errorTimersRef = useRef({});

  const workspaceId =
    activeWorkspace?.id || activeWorkspace?.workspace_id || '';
  const draftKey = `cth-identity-draft-${workspaceId || 'default'}`;

  useEffect(() => {
    if (!hasUnsaved) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  useEffect(() => {
    if (isLoading || !hasUnsaved) return undefined;
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            colors,
            fonts,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        // private mode / quota — skip silently
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [colors, fonts, hasUnsaved, isLoading, draftKey]);

  useEffect(() => {
    if (!userId) {
      const fallback = setTimeout(() => setIsLoading(false), 3000);
      return () => clearTimeout(fallback);
    }

    const loadData = async () => {
      try {
        const res = await apiClient.get("/api/identity", { params: { user_id: userId } });

        let nextColors = null;
        if (Array.isArray(res?.colors) && res.colors.length > 0) {
          setColors(res.colors);
          nextColors = res.colors;
        }

        if (Array.isArray(res?.fonts) && res.fonts.length > 0) {
          setFonts(res.fonts);
        }

        if (Array.isArray(res?.assets)) {
          const normalizedAssets = res.assets.map((a, idx) => ({
            id: a.id || `asset-${idx}`,
            name: a.name || a.filename || 'Asset',
            type: a.type || 'logo',
            url: a.url || a.file_url || '',
            fileType: a.fileType || a.file_type || 'FILE',
            fileSize: a.fileSize || a.file_size || '',
          }));
          setAssets(normalizedAssets);
        }

        if (originalColorsRef.current === null) {
          const baseline = nextColors || DEFAULT_COLORS;
          originalColorsRef.current = baseline.map((c) => ({ ...c }));
          baseline.forEach((c, i) => {
            if (typeof c?.hex === 'string' && c.hex.length > 0) {
              lastValidHexRef.current[i] = c.hex;
            }
          });
        }

        try {
          const draftRaw = localStorage.getItem(draftKey);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (
              draft &&
              Array.isArray(draft.colors) &&
              Array.isArray(draft.fonts) &&
              draft.colors.length > 0
            ) {
              setDraftRecovery(draft);
            }
          }
        } catch (e) {
          // ignore corrupt draft
        }
      } catch (err) {
        console.error('Failed to load identity studio data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, draftKey]);

  const handleAssetsChange = useCallback((nextAssets) => {
    setAssets(Array.isArray(nextAssets) ? nextAssets : []);
    setHasUnsaved(true);
  }, []);

  const handleDeleteAsset = useCallback(
    async (assetId) => {
      if (!assetId) return;

      try {
        await axios.delete(`${API}/media-upload/assets/${assetId}`);
        setAssets((prev) =>
          prev.filter((asset) => (asset.asset_id || asset.id) !== assetId)
        );
        setHasUnsaved(true);
      } catch (err) {
        console.error('Failed to delete asset:', err);
        throw err;
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      await apiClient.post("/api/identity/save", {
        workspace_id: activeWorkspace?.id || activeWorkspace?.workspace_id || '',
        colors,
        fonts,
        assets,
      });
      setHasUnsaved(false);
      setSaveToastVisible(true);
      setTimeout(() => setSaveToastVisible(false), 2500);
      try {
        localStorage.removeItem(draftKey);
      } catch (e) {
        // ignore
      }
      setDraftRecovery(null);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, activeWorkspace, colors, fonts, assets, draftKey]);

  const handleResetColor = useCallback(
    (index) => {
      const original = originalColorsRef.current && originalColorsRef.current[index];
      if (!original) return;
      setColors((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], hex: original.hex };
        return next;
      });
      if (typeof original.hex === 'string' && original.hex.length > 0) {
        lastValidHexRef.current[index] = original.hex;
      }
      setHexErrors((prev) => {
        if (!(index in prev)) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setHasUnsaved(true);
    },
    []
  );

  const handleRestoreDraft = useCallback(() => {
    if (!draftRecovery) return;
    if (Array.isArray(draftRecovery.colors)) setColors(draftRecovery.colors);
    if (Array.isArray(draftRecovery.fonts)) setFonts(draftRecovery.fonts);
    setHasUnsaved(true);
    setDraftRecovery(null);
  }, [draftRecovery]);

  const handleDiscardDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {
      // ignore
    }
    setDraftRecovery(null);
  }, [draftKey]);

  const showHexErrorBriefly = useCallback((index) => {
    setHexErrors((prev) => ({ ...prev, [index]: true }));
    if (errorTimersRef.current[index]) {
      clearTimeout(errorTimersRef.current[index]);
    }
    errorTimersRef.current[index] = setTimeout(() => {
      setHexErrors((prev) => {
        if (!(index in prev)) return prev;
        const next = { ...prev };
        delete next[index];
        return next;
      });
      delete errorTimersRef.current[index];
    }, 2000);
  }, []);

  const handleHexChange = useCallback(
    (index, raw) => {
      setColors((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], hex: raw };
        return next;
      });
      setHasUnsaved(true);

      if (raw === '' || isValidPartialHex(raw)) {
        if (errorTimersRef.current[index]) {
          clearTimeout(errorTimersRef.current[index]);
          delete errorTimersRef.current[index];
        }
        setHexErrors((prev) => {
          if (!(index in prev)) return prev;
          const next = { ...prev };
          delete next[index];
          return next;
        });
      } else {
        setHexErrors((prev) => ({ ...prev, [index]: true }));
      }
    },
    []
  );

  const handleHexBlur = useCallback(
    (index) => {
      const current = colors[index]?.hex || '';

      if (isValidFullHex(current)) {
        const normalized = normalizeHex(current);
        setColors((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hex: normalized };
          return next;
        });
        lastValidHexRef.current[index] = normalized;
        if (errorTimersRef.current[index]) {
          clearTimeout(errorTimersRef.current[index]);
          delete errorTimersRef.current[index];
        }
        setHexErrors((p) => {
          if (!(index in p)) return p;
          const r = { ...p };
          delete r[index];
          return r;
        });
        return;
      }

      if (current === '') {
        return;
      }

      const lastValid = lastValidHexRef.current[index];
      if (lastValid !== undefined) {
        setColors((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], hex: lastValid };
          return next;
        });
      }
      showHexErrorBriefly(index);
    },
    [colors, showHexErrorBriefly]
  );

  useEffect(() => {
    return () => {
      Object.values(errorTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const colorsLen = colors.length;
  const fontsLen = fonts.length;
  const assetsLen = assets.length;

  const identityScore =
    Math.round(
      (colorsLen >= 5 ? 40 : (colorsLen / 5) * 40) +
      (fontsLen >= 4 ? 40 : (fontsLen / 4) * 40) +
      (assetsLen >= 1 ? 20 : 0)
    ) || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div
          className="flex items-center justify-center"
          style={PAGE_STYLE}
        >
          <div
            style={{
              fontFamily: SANS,
              color: 'var(--cth-command-muted)',
              padding: '120px 24px',
            }}
          >
            Loading...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="flex flex-col"
        style={PAGE_STYLE}
        data-testid="identity-studio-page"
      >
        {/* Topbar */}
        <div
          className="flex items-center justify-between pl-14 pr-4 py-4 md:px-8 md:py-5 sticky top-0 z-10 backdrop-blur-sm"
          style={{
            background: 'color-mix(in srgb, var(--cth-command-blush) 92%, transparent)',
            borderBottom: '1px solid var(--cth-command-border)',
          }}
        >
          <div>
            <h1 style={{ ...SECTION_HEADING_STYLE, fontSize: 22 }}>Identity Studio</h1>
            <p style={SECTION_SUBTEXT_STYLE}>Define your brand&apos;s visual language</p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5"
              style={CARD_STYLE}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ border: '2px solid var(--cth-command-crimson)' }}
              >
                <span
                  style={{
                    fontFamily: SERIF,
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--cth-command-ink)',
                  }}
                >
                  {identityScore}%
                </span>
              </div>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--cth-command-muted)',
                }}
              >
                Score
              </span>
            </div>

            {hasUnsaved && (
              <span
                className="flex items-center gap-1.5"
                style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--cth-warning)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--cth-warning)' }}
                />
                Unsaved
              </span>
            )}

            <BrandGuidelinesExportButton style={PRIMARY_CTA_STYLE} />

            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsaved}
              data-testid="save-btn"
              style={hasUnsaved && !isSaving ? SAVE_BUTTON_STYLE : SAVE_BUTTON_DISABLED_STYLE}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {draftRecovery ? (
              <div
                data-testid="identity-draft-recovery-banner"
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  background: 'var(--cth-command-panel-soft)',
                  border: '1px solid var(--cth-command-gold)',
                  borderRadius: 4,
                  padding: '12px 20px',
                }}
              >
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: 'var(--cth-command-ink)',
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  You have unsaved changes from a previous session.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="restore-draft-btn"
                    onClick={handleRestoreDraft}
                    style={{
                      background: 'var(--cth-command-purple)',
                      color: 'var(--cth-command-gold)',
                      border: 'none',
                      borderRadius: 4,
                      padding: '8px 14px',
                      fontFamily: SANS,
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                    }}
                  >
                    Restore Draft
                  </button>
                  <button
                    type="button"
                    data-testid="discard-draft-btn"
                    onClick={handleDiscardDraft}
                    style={{
                      background: 'transparent',
                      color: 'var(--cth-command-ink)',
                      border: '1px solid var(--cth-command-border)',
                      borderRadius: 4,
                      padding: '8px 14px',
                      fontFamily: SANS,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Discard Draft
                  </button>
                </div>
              </div>
            ) : null}

            {/* Brand Colors */}
            <section style={{ ...CARD_STYLE, padding: 28 }}>
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <h2 style={SECTION_HEADING_STYLE}>Brand Colors</h2>
                  <p style={SECTION_SUBTEXT_STYLE}>
                    Set the core palette for your brand system.
                  </p>
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--cth-command-muted)',
                  }}
                >
                  {colorsLen} colors
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {colors.map((color, index) => {
                  const lastValid = lastValidHexRef.current[index];
                  const currentHex = color.hex;
                  const isHexValid = isValidFullHex(currentHex);
                  const isCssVar = isCssVarReference(currentHex);
                  const swatchBackground = isHexValid
                    ? normalizeHex(currentHex)
                    : isCssVar
                    ? currentHex
                    : lastValid || currentHex || 'var(--cth-brand-primary)';
                  const pickerValue = isValidHex(swatchBackground) ? swatchBackground : '#000000';
                  const original =
                    originalColorsRef.current && originalColorsRef.current[index];
                  const showReset = Boolean(
                    original && (original.hex || '') !== (currentHex || '')
                  );
                  const hasError = Boolean(hexErrors[index]);

                  return (
                    <div
                      key={color.id || index}
                      style={{ ...CARD_STYLE, overflow: 'hidden' }}
                    >
                      {/* Color swatch — 64px tall, click to open native picker */}
                      <div
                        className="group w-full relative"
                        style={{
                          height: 64,
                          background: swatchBackground,
                        }}
                      >
                        <input
                          type="color"
                          value={pickerValue}
                          onChange={(e) => {
                            const picked = (e.target.value || '').toUpperCase();
                            setColors((prev) => {
                              const next = [...prev];
                              next[index] = { ...next[index], hex: picked };
                              return next;
                            });
                            if (isValidHex(picked)) {
                              lastValidHexRef.current[index] = picked;
                            }
                            setHasUnsaved(true);
                            setHexErrors((prev) => {
                              if (!(index in prev)) return prev;
                              const next = { ...prev };
                              delete next[index];
                              return next;
                            });
                          }}
                          aria-label={`Pick color for ${color.label || color.role || 'swatch'}`}
                          title="Click to change color"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer',
                            border: 'none',
                            padding: 0,
                            background: 'transparent',
                          }}
                        />
                        <div
                          aria-hidden="true"
                          className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            fontFamily: SANS,
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            color: 'var(--cth-command-ivory)',
                            background: 'rgba(13, 0, 16, 0.45)',
                            padding: '4px 8px',
                            borderRadius: 4,
                          }}
                        >
                          Click to change
                        </div>
                      </div>

                      <div style={{ padding: 16 }}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={SECTION_LABEL_STYLE}>{color.role || 'color'}</p>
                            <input
                              value={color.label || ''}
                              onChange={(e) => {
                                const next = [...colors];
                                next[index] = { ...next[index], label: e.target.value };
                                setColors(next);
                                setHasUnsaved(true);
                              }}
                              className="w-full bg-transparent border-0 p-0 focus:outline-none"
                              style={{
                                fontFamily: SERIF,
                                fontSize: 18,
                                fontWeight: 600,
                                color: 'var(--cth-command-ink)',
                                marginTop: 6,
                                letterSpacing: '-0.005em',
                              }}
                              placeholder="Color label"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {showReset ? (
                              <button
                                type="button"
                                onClick={() => handleResetColor(index)}
                                data-testid={`color-reset-${index}`}
                                className="hover:underline"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--cth-command-muted)',
                                  fontFamily: SANS,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                Reset
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(color.hex || '');
                                setCopiedHex(color.hex || '');
                                setTimeout(() => setCopiedHex(null), 1600);
                              }}
                              style={{
                                background: 'transparent',
                                color: 'var(--cth-command-crimson)',
                                border: '1px solid var(--cth-command-border)',
                                borderRadius: 4,
                                padding: '5px 10px',
                                fontFamily: SANS,
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>

                        <div
                          style={{
                            ...CARD_STYLE,
                            padding: '10px 12px',
                            background: 'var(--cth-command-panel-soft)',
                            borderColor: hasError
                              ? 'var(--cth-command-crimson)'
                              : 'var(--cth-command-border)',
                          }}
                        >
                          <label style={FIELD_LABEL_STYLE}>Hex value</label>
                          <input
                            value={color.hex || ''}
                            onChange={(e) => handleHexChange(index, e.target.value)}
                            onBlur={() => handleHexBlur(index)}
                            className="w-full bg-transparent border-0 p-0 focus:outline-none"
                            style={{
                              fontFamily: MONO,
                              fontSize: 13,
                              color: 'var(--cth-command-ink)',
                              textTransform: 'uppercase',
                            }}
                            placeholder="#000000"
                          />
                        </div>
                        {hasError ? (
                          <p
                            style={{
                              fontFamily: SANS,
                              fontSize: 11,
                              fontWeight: 500,
                              color: 'var(--cth-command-crimson)',
                              margin: '6px 0 0',
                              letterSpacing: '0.02em',
                            }}
                          >
                            Enter a valid hex color (e.g. #AF0024)
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Typography */}
            <section style={{ ...CARD_STYLE, padding: 28 }}>
              <div className="flex items-start justify-between mb-5 gap-4">
                <div>
                  <h2 style={SECTION_HEADING_STYLE}>Typography</h2>
                  <p style={SECTION_SUBTEXT_STYLE}>
                    Define your font system and preview it in context.
                  </p>
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--cth-command-muted)',
                  }}
                >
                  {fontsLen} styles
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {fonts.map((font, index) => (
                  <div key={font.id || index} style={{ ...CARD_STYLE, padding: 16 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label style={FIELD_LABEL_STYLE}>Role</label>
                        <select
                          value={font.label || ''}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], label: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={INPUT_STYLE}
                        >
                          {FONT_ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-command-ink)' }}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={FIELD_LABEL_STYLE}>Font family</label>
                        <select
                          value={FONT_FAMILY_OPTIONS.includes(font.family || '') ? (font.family || '') : '__custom__'}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = {
                              ...next[index],
                              family: e.target.value === '__custom__' ? '' : e.target.value,
                            };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={INPUT_STYLE}
                        >
                          {FONT_FAMILY_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-command-ink)' }}>{option}</option>
                          ))}
                          <option value="__custom__" style={{ color: 'var(--cth-command-ink)' }}>Custom font…</option>
                        </select>

                        <input
                          value={font.family || ''}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], family: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={{ ...INPUT_STYLE, marginTop: 8 }}
                          placeholder="Type custom font family if not listed"
                        />
                      </div>

                      <div>
                        <label style={FIELD_LABEL_STYLE}>Weight</label>
                        <select
                          value={font.weight || '400'}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], weight: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={INPUT_STYLE}
                        >
                          {FONT_WEIGHT_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-command-ink)' }}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={FIELD_LABEL_STYLE}>Style</label>
                        <select
                          value={font.style || 'normal'}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], style: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={INPUT_STYLE}
                        >
                          {FONT_STYLE_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-command-ink)' }}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={FIELD_LABEL_STYLE}>Size (rem)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={font.sizeRem || 1}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], sizeRem: parseFloat(e.target.value || '1') };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={INPUT_STYLE}
                        />
                      </div>

                      <div>
                        <label style={FIELD_LABEL_STYLE}>Line height</label>
                        <input
                          type="number"
                          step="0.05"
                          value={font.lineHeight || 1.4}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], lineHeight: parseFloat(e.target.value || '1.4') };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={INPUT_STYLE}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label style={FIELD_LABEL_STYLE}>Preview text</label>
                        <input
                          value={font.preview || ''}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], preview: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          style={INPUT_STYLE}
                          placeholder="Preview text"
                        />
                      </div>
                    </div>

                    <div style={{ ...CARD_STYLE, padding: 16, background: 'var(--cth-command-panel-soft)' }}>
                      <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 8 }}>Preview</p>
                      <p
                        style={{
                          fontFamily: font.family || 'DM Sans',
                          fontWeight: font.weight || '400',
                          fontStyle: font.style || 'normal',
                          fontSize: `${font.sizeRem || 1.25}rem`,
                          lineHeight: font.lineHeight || 1.4,
                          letterSpacing: font.letterSpacing || '0',
                          color: 'var(--cth-command-ink)',
                          margin: 0,
                        }}
                      >
                        {font.preview || 'The quick brown fox jumps over the lazy dog.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Brand Assets */}
            <section style={{ ...CARD_STYLE, padding: 28 }}>
              <div className="mb-5">
                <h2 style={SECTION_HEADING_STYLE}>Brand Assets</h2>
                <p style={SECTION_SUBTEXT_STYLE}>
                  Upload, organize, edit, and delete your logos, icons, and brand files.
                </p>
              </div>

              <IdentityStudioAssets
                workspaceId={activeWorkspace?.id || activeWorkspace?.workspace_id || ''}
                assets={assets}
                onAssetsChange={handleAssetsChange}
                onDeleteAsset={handleDeleteAsset}
              />
            </section>

            {/* Next Step */}
            <section
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ ...CARD_STYLE, padding: 24 }}
            >
              <div>
                <p style={SECTION_LABEL_STYLE}>Next Step</p>
                <p
                  style={{
                    fontFamily: SANS,
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: 'var(--cth-command-ink)',
                    margin: '8px 0 0',
                    maxWidth: 620,
                  }}
                >
                  Move into Content Studio and turn your colors, fonts, and assets into branded content.
                </p>
              </div>
              <a
                href="/content-studio"
                className="shrink-0"
                style={NEXT_STEP_PILL_STYLE}
              >
                Open Content Studio
              </a>
            </section>
          </div>
        </div>

        {copiedHex && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
            style={{
              background: 'var(--cth-command-purple)',
              color: 'var(--cth-command-gold)',
              padding: '10px 18px',
              borderRadius: 4,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              boxShadow: '0 12px 30px rgba(20,15,43,0.20)',
            }}
          >
            Copied {copiedHex}
          </div>
        )}

        {saveToastVisible && (
          <div
            data-testid="identity-save-toast"
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
              background: 'var(--cth-command-purple)',
              color: 'var(--cth-command-gold)',
              padding: '12px 20px',
              borderRadius: 4,
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.04em',
              boxShadow: '0 12px 30px rgba(20,15,43,0.20)',
            }}
          >
            Identity saved
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function IdentityStudio() {
  return <IdentityStudioContent />;
}
