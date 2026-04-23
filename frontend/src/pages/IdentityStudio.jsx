import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUser } from '../hooks/useAuth';
import { BrandGuidelinesExportButton } from '../components/shared/BrandGuidelinesExport';
import IdentityStudioAssets from '../components/shared/IdentityStudioAssets';
import axios from 'axios';
import apiClient from "../lib/apiClient";

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
  'Inter',
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

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const res = await apiClient.get("/api/identity", { params: { user_id: userId } });

        if (Array.isArray(res?.colors) && res.colors.length > 0) {
          setColors(res.colors);
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
      } catch (err) {
        console.error('Failed to load identity studio data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

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
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, activeWorkspace, colors, fonts, assets]);

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
        <div className="flex items-center justify-center h-full min-h-screen cth-page">
          <div className="cth-muted">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-screen cth-page" data-testid="identity-studio-page">
        <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-[var(--cth-admin-border)] sticky top-0 z-10 cth-page/95 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-semibold cth-heading" >
              Identity Studio
            </h1>
            <p className="text-xs cth-muted mt-0.5">Define your brand&apos;s visual language</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg cth-card-muted">
              <div className="w-6 h-6 rounded-full border-2 border-[var(--cth-admin-accent)] flex items-center justify-center">
                <span className="text-[9px] font-bold cth-heading">{identityScore}%</span>
              </div>
              <span className="text-[10px] cth-muted">Score</span>
            </div>

            {hasUnsaved && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Unsaved
              </span>
            )}

            <BrandGuidelinesExportButton />

            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsaved}
              data-testid="save-btn"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                hasUnsaved ? 'bg-[var(--cth-admin-accent)] text-white' : 'cth-card-muted cth-muted cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <section className="rounded-2xl border border-[var(--cth-admin-border)] cth-card p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="cth-heading text-lg font-semibold">Brand Colors</h2>
                  <p className="text-sm cth-muted">Set the core palette for your brand system.</p>
                </div>
                <div className="text-xs cth-muted">{colorsLen} colors</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {colors.map((color, index) => (
                  <div
                    key={color.id || index}
                    className="rounded-[22px] border border-[var(--cth-admin-border)] cth-card-muted overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
                  >
                    <div
                      className="h-36 w-full"
                      style={{ background: color.hex || 'var(--cth-brand-primary)' }}
                    />

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] cth-muted mb-1">
                            {color.role || 'color'}
                          </p>
                          <input
                            value={color.label || ''}
                            onChange={(e) => {
                              const next = [...colors];
                              next[index] = { ...next[index], label: e.target.value };
                              setColors(next);
                              setHasUnsaved(true);
                            }}
                            className="w-full bg-transparent border-0 p-0 text-base font-semibold cth-heading focus:outline-none"
                            placeholder="Color label"
                          />
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(color.hex || '');
                            setCopiedHex(color.hex || '');
                            setTimeout(() => setCopiedHex(null), 1600);
                          }}
                          className="rounded-full border border-[var(--cth-admin-border)] cth-card-muted px-3 py-1 text-[11px] cth-text-accent"
                        >
                          Copy
                        </button>
                      </div>

                      <div className="rounded-2xl border border-[var(--cth-admin-border)] cth-card-muted px-3 py-3">
                        <label className="block text-[10px] uppercase tracking-[0.15em] cth-muted mb-1">
                          Hex value
                        </label>
                        <input
                          value={color.hex || ''}
                          onChange={(e) => {
                            const next = [...colors];
                            next[index] = { ...next[index], hex: e.target.value };
                            setColors(next);
                            setHasUnsaved(true);
                          }}
                          className="w-full bg-transparent border-0 p-0 text-sm cth-heading uppercase focus:outline-none"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--cth-admin-border)] cth-card p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="cth-heading text-lg font-semibold">Typography</h2>
                  <p className="text-sm cth-muted">Define your font system and preview it in context.</p>
                </div>
                <div className="text-xs cth-muted">{fontsLen} styles</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {fonts.map((font, index) => (
                  <div key={font.id || index} className="rounded-xl border border-[var(--cth-admin-border)] cth-card-muted p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] cth-muted mb-1">Role</label>
                        <select
                          value={font.label || ''}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], label: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          className="w-full rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                        >
                          {FONT_ROLE_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-surface-midnight)' }}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] cth-muted mb-1">Font family</label>
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
                          className="w-full rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                        >
                          {FONT_FAMILY_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-surface-midnight)' }}>{option}</option>
                          ))}
                          <option value="__custom__" style={{ color: 'var(--cth-surface-midnight)' }}>Custom font…</option>
                        </select>

                        <input
                          value={font.family || ''}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], family: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          className="w-full mt-2 rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                          placeholder="Type custom font family if not listed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] cth-muted mb-1">Weight</label>
                        <select
                          value={font.weight || '400'}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], weight: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          className="w-full rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                        >
                          {FONT_WEIGHT_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-surface-midnight)' }}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] cth-muted mb-1">Style</label>
                        <select
                          value={font.style || 'normal'}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], style: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          className="w-full rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                        >
                          {FONT_STYLE_OPTIONS.map((option) => (
                            <option key={option} value={option} style={{ color: 'var(--cth-surface-midnight)' }}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] cth-muted mb-1">Size (rem)</label>
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
                          className="w-full rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] cth-muted mb-1">Line height</label>
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
                          className="w-full rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] cth-muted mb-1">Preview text</label>
                        <input
                          value={font.preview || ''}
                          onChange={(e) => {
                            const next = [...fonts];
                            next[index] = { ...next[index], preview: e.target.value };
                            setFonts(next);
                            setHasUnsaved(true);
                          }}
                          className="w-full rounded-lg cth-card-muted border border-[var(--cth-admin-border)] px-3 py-2 text-sm cth-heading"
                          placeholder="Preview text"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--cth-admin-border)] cth-card p-4">
                      <p
                        className="cth-heading"
                        style={{
                          fontFamily: font.family || 'DM Sans',
                          fontWeight: font.weight || '400',
                          fontStyle: font.style || 'normal',
                          fontSize: `${font.sizeRem || 1.25}rem`,
                          lineHeight: font.lineHeight || 1.4,
                          letterSpacing: font.letterSpacing || '0',
                        }}
                      >
                        {font.preview || 'The quick brown fox jumps over the lazy dog.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--cth-admin-border)] cth-card p-5 md:p-6">
              <div className="mb-4">
                <h2 className="cth-heading text-lg font-semibold">Brand Assets</h2>
                <p className="text-sm cth-muted">Upload, organize, edit, and delete your logos, icons, and brand files.</p>
              </div>

              <IdentityStudioAssets
                workspaceId={activeWorkspace?.id || activeWorkspace?.workspace_id || ''}
                assets={assets}
                onAssetsChange={handleAssetsChange}
                onDeleteAsset={handleDeleteAsset}
              />
            </section>

            <section className="cth-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="cth-kicker m-0">Next step</p>
                <p className="m-0 mt-1 text-sm cth-muted">
                  Move into Content Studio and turn your colors, fonts, and assets into branded content.
                </p>
              </div>
              <a href="/content-studio" className="cth-button-primary inline-flex shrink-0 items-center gap-2">
                Open Content Studio
              </a>
            </section>
          </div>
        </div>

        {copiedHex && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500/90 cth-heading text-sm rounded-lg shadow-lg z-50">
            Copied {copiedHex}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function IdentityStudio() {
  return <IdentityStudioContent />;
}
