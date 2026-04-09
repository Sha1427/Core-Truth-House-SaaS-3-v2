import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUser } from '../hooks/useAuth';
import IdentityStudioAssets from '../components/shared/IdentityStudioAssets';

/**
 * IMPORTANT:
 * Replace this import with your real shared authenticated API client.
 * The page must NOT use raw axios + ?user_id=... anymore.
 *
 * Expected behavior of apiClient:
 * - sends Authorization header
 * - sends X-Workspace-ID header, or allows us to pass it in config.headers
 */
import apiClient from '../lib/apiClient';

const DEFAULT_COLORS = [
  { id: 'primary', role: 'primary', label: 'Primary', hex: '#AF0024' },
  { id: 'secondary', role: 'secondary', label: 'Secondary', hex: '#E04E35' },
  { id: 'accent', role: 'accent', label: 'Accent', hex: '#C7A09D' },
  { id: 'background', role: 'background', label: 'Background', hex: '#1c0828' },
  { id: 'text', role: 'text', label: 'Text', hex: '#F8F5FA' },
  { id: 'deep-ruby', role: 'custom', label: 'Deep Ruby', hex: '#763B5B' },
];

const DEFAULT_FONTS = [
  {
    id: 'display',
    role: 'display',
    label: 'Display',
    family: 'Playfair Display',
    weight: '700',
    style: 'normal',
    sizeRem: 3.5,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    preview: 'Where Serious Brands Are Built.',
  },
  {
    id: 'heading',
    role: 'heading',
    label: 'Heading',
    family: 'Cormorant Garamond',
    weight: '600',
    style: 'normal',
    sizeRem: 2,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    preview: 'The Brand Behind the Business',
  },
  {
    id: 'subhead',
    role: 'heading',
    label: 'Subhead',
    family: 'Cormorant Garamond',
    weight: '500',
    style: 'italic',
    sizeRem: 1.25,
    lineHeight: 1.4,
    letterSpacing: '0em',
    preview: 'Strategy before aesthetics. Always.',
  },
  {
    id: 'body',
    role: 'body',
    label: 'Body',
    family: 'DM Sans',
    weight: '400',
    style: 'normal',
    sizeRem: 1,
    lineHeight: 1.65,
    letterSpacing: '0.01em',
    preview: 'The founders who build the deepest brands start with truth.',
  },
  {
    id: 'caption',
    role: 'caption',
    label: 'Caption',
    family: 'DM Sans',
    weight: '300',
    style: 'normal',
    sizeRem: 0.75,
    lineHeight: 1.5,
    letterSpacing: '0.03em',
    preview: 'Updated moments ago — Core Truth House',
  },
];

const FONT_FAMILIES = [
  'Playfair Display',
  'Cormorant Garamond',
  'DM Sans',
  'Inter',
  'Lora',
  'Merriweather',
  'Montserrat',
  'Open Sans',
  'Poppins',
  'Raleway',
  'Roboto',
  'Roboto Slab',
  'Source Sans 3',
  'Source Serif 4',
  'Work Sans',
  'Libre Baskerville',
  'Crimson Text',
  'Nunito',
  'Oswald',
  'PT Serif',
  'Bitter',
  'Cardo',
  'EB Garamond',
  'Fira Sans',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Josefin Sans',
  'Karla',
  'Lato',
  'Manrope',
  'Noto Sans',
  'Noto Serif',
  'Outfit',
  'Sora',
  'Space Grotesk',
  'Spectral',
  'Vollkorn',
  'Archivo',
  'Bricolage Grotesque',
  'Lexend',
];

const FONT_WEIGHTS = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];

const FONT_ROLES = [
  { value: 'display', label: 'Display' },
  { value: 'heading', label: 'Heading' },
  { value: 'body', label: 'Body' },
  { value: 'caption', label: 'Caption' },
  { value: 'custom', label: 'Custom' },
];

const PRESET_PALETTES = [
  { name: 'Crimson Dark', colors: ['#1a0000', '#AF0024', '#E04E35', '#C7A09D', '#F8F5FA'] },
  { name: 'Ocean Depth', colors: ['#001824', '#003d5b', '#0891b2', '#7dd3fc', '#f0f9ff'] },
  { name: 'Forest Sage', colors: ['#0a1f0a', '#1a4a1a', '#4d7c0f', '#a3e635', '#f7fee7'] },
  { name: 'Royal Amethyst', colors: ['#0e001a', '#3b0764', '#7c3aed', '#c084fc', '#f5f3ff'] },
  { name: 'Gold Standard', colors: ['#1a1000', '#78350f', '#d97706', '#fcd34d', '#fffbeb'] },
];

function hexToRgb(hex) {
  const safe = (hex || '#000000').replace('#', '');
  const r = parseInt(safe.slice(0, 2), 16) || 0;
  const g = parseInt(safe.slice(2, 4), 16) || 0;
  const b = parseInt(safe.slice(4, 6), 16) || 0;
  return `${r}, ${g}, ${b}`;
}

function getLuminance(hex) {
  const safe = (hex || '#000000').replace('#', '');
  const r = (parseInt(safe.slice(0, 2), 16) || 0) / 255;
  const g = (parseInt(safe.slice(2, 4), 16) || 0) / 255;
  const b = (parseInt(safe.slice(4, 6), 16) || 0) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastText(hex) {
  return getLuminance(hex) > 0.35 ? '#1c0828' : '#F8F5FA';
}

function contrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1) + 0.05;
  const l2 = getLuminance(hex2) + 0.05;
  return Math.max(l1, l2) / Math.min(l1, l2);
}

function normalizeColor(color, idx) {
  return {
    id: color?.id || `color-${idx}`,
    role: color?.role || 'custom',
    label: color?.label || color?.name || `Color ${idx + 1}`,
    hex: color?.hex || '#FFFFFF',
  };
}

function normalizeFont(font, idx) {
  return {
    id: font?.id || `font-${idx}`,
    role: font?.role || 'custom',
    label: font?.label || `Font ${idx + 1}`,
    family: font?.family || 'Inter',
    weight: String(font?.weight || '400'),
    style: font?.style || 'normal',
    sizeRem: Number(font?.sizeRem || 1),
    lineHeight: Number(font?.lineHeight || 1.5),
    letterSpacing: font?.letterSpacing || '0em',
    preview: font?.preview || 'The quick brown fox jumps over the lazy dog.',
  };
}

function normalizeAsset(asset, idx) {
  return {
    id: asset?.id || `asset-${idx}`,
    name: asset?.name || asset?.filename || 'Asset',
    type: asset?.type || 'logo',
    url: asset?.url || asset?.file_url || '',
    fileType: asset?.fileType || asset?.file_type || 'FILE',
    fileSize: asset?.fileSize || asset?.file_size || '',
  };
}

function buildWorkspaceHeaders(workspaceId) {
  return workspaceId ? { 'X-Workspace-ID': workspaceId } : {};
}

function IdentityStudioContent() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useUser();

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || '';
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [fonts, setFonts] = useState(DEFAULT_FONTS);
  const [assets, setAssets] = useState([]);
  const [activeSection, setActiveSection] = useState('colors');
  const [copiedHex, setCopiedHex] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFont, setEditingFont] = useState(null);
  const [fontSearch, setFontSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const families = [...new Set(fonts.map((f) => f.family).filter(Boolean))];
    if (families.length === 0) return;

    const id = 'identity-studio-gfonts';
    let link = document.getElementById(id);
    const href = `https://fonts.googleapis.com/css2?${families
      .map(
        (f) =>
          `family=${f.replace(/ /g, '+')}:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700`
      )
      .join('&')}&display=swap`;

    if (link) {
      link.href = href;
    } else {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, [fonts]);

  const loadIdentity = useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false);
      setError('No workspace selected.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.get('/identity', {
        headers: buildWorkspaceHeaders(workspaceId),
      });

      const data = res?.data || {};

      if (Array.isArray(data.colors) && data.colors.length > 0) {
        setColors(data.colors.map(normalizeColor));
      } else {
        setColors(DEFAULT_COLORS);
      }

      if (Array.isArray(data.fonts) && data.fonts.length > 0) {
        setFonts(data.fonts.map(normalizeFont));
      } else {
        setFonts(DEFAULT_FONTS);
      }

      if (Array.isArray(data.assets)) {
        setAssets(data.assets.map(normalizeAsset));
      } else {
        setAssets([]);
      }
    } catch (err) {
      console.error('Failed to load Identity Studio:', err);
      setError('Identity Studio could not load. Check the identity endpoint and workspace headers.');
      setColors(DEFAULT_COLORS);
      setFonts(DEFAULT_FONTS);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadIdentity();
  }, [loadIdentity]);

  const handleCopy = useCallback(async (hex) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      window.setTimeout(() => setCopiedHex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const handleEditColor = useCallback((id, hex) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, hex } : c)));
    setSelectedPreset(null);
    setHasUnsaved(true);
  }, []);

  const handleEditColorLabel = useCallback((id, label) => {
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
    setSelectedPreset(null);
    setHasUnsaved(true);
  }, []);

  const handleDeleteColor = useCallback((id) => {
    setColors((prev) => prev.filter((c) => c.id !== id));
    setSelectedPreset(null);
    setHasUnsaved(true);
  }, []);

  const handleAddColor = useCallback(() => {
    setColors((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        role: 'custom',
        label: 'Custom Color',
        hex: '#5B21B6',
      },
    ]);
    setSelectedPreset(null);
    setHasUnsaved(true);
  }, []);

  const applyPreset = useCallback((idx) => {
    const preset = PRESET_PALETTES[idx];
    const roles = ['background', 'primary', 'secondary', 'accent', 'text'];

    setColors(
      roles.map((role, i) => ({
        id: role,
        role,
        label: role.charAt(0).toUpperCase() + role.slice(1),
        hex: preset.colors[i],
      }))
    );
    setSelectedPreset(idx);
    setHasUnsaved(true);
  }, []);

  const addFont = useCallback(() => {
    const newFont = {
      id: `font-${Date.now()}`,
      role: 'custom',
      label: 'New Font',
      family: 'Inter',
      weight: '400',
      style: 'normal',
      sizeRem: 1,
      lineHeight: 1.5,
      letterSpacing: '0em',
      preview: 'The quick brown fox jumps over the lazy dog.',
    };

    setFonts((prev) => [...prev, newFont]);
    setEditingFont(newFont.id);
    setHasUnsaved(true);
  }, []);

  const updateFont = useCallback((fontId, key, value) => {
    setFonts((prev) => prev.map((f) => (f.id === fontId ? { ...f, [key]: value } : f)));
    setHasUnsaved(true);
  }, []);

  const removeFont = useCallback(
    (fontId) => {
      setFonts((prev) => prev.filter((f) => f.id !== fontId));
      if (editingFont === fontId) setEditingFont(null);
      setHasUnsaved(true);
    },
    [editingFont]
  );

  const handleAssetsChange = useCallback((nextAssets) => {
    setAssets(Array.isArray(nextAssets) ? nextAssets : []);
    setHasUnsaved(true);
  }, []);

  const handleDeleteAsset = useCallback(
    async (assetId) => {
      if (!assetId || !workspaceId) return;

      try {
        await apiClient.delete(`/media/${assetId}`, {
          headers: buildWorkspaceHeaders(workspaceId),
        });
        setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
        setHasUnsaved(true);
      } catch (err) {
        console.error('Failed to delete asset:', err);
        setError('Asset delete failed.');
      }
    },
    [workspaceId]
  );

  const handleSave = useCallback(async () => {
    if (!workspaceId) return;

    setIsSaving(true);
    setError('');

    try {
      await apiClient.post(
        '/identity/save',
        { colors, fonts, assets },
        { headers: buildWorkspaceHeaders(workspaceId) }
      );
      setHasUnsaved(false);
    } catch (err) {
      console.error('Identity save failed:', err);
      setError('Save failed.');
    } finally {
      setIsSaving(false);
    }
  }, [workspaceId, colors, fonts, assets]);

  const filteredFontFamilies = useMemo(() => {
    const q = fontSearch.trim().toLowerCase();
    if (!q) return FONT_FAMILIES;
    return FONT_FAMILIES.filter((f) => f.toLowerCase().includes(q));
  }, [fontSearch]);

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
        <div className="flex items-center justify-center h-full min-h-screen bg-[#1c0828]">
          <div className="text-white/40">Loading Identity Studio...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-screen bg-[#1c0828]" data-testid="identity-studio-page">
        <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-white/[0.07] sticky top-0 z-10 bg-[#1c0828]/95 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Identity Studio
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              Define your brand&apos;s visual language
            </p>
            {workspaceId ? (
              <p className="text-[10px] text-white/25 mt-1">Workspace: {workspaceId}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05]">
              <div className="w-6 h-6 rounded-full border-2 border-[#E04E35] flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{identityScore}%</span>
              </div>
              <span className="text-[10px] text-white/50">Score</span>
            </div>

            {hasUnsaved && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Unsaved
              </span>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsaved}
              data-testid="save-btn"
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                hasUnsaved ? 'bg-[#E04E35] text-white' : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mx-4 md:mx-8 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex md:flex-col md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.07] p-3 md:p-4 bg-[#1c0828]">
            <div className="flex md:flex-col gap-1 md:space-y-1 overflow-x-auto md:overflow-x-visible">
              {[
                { id: 'colors', label: 'Colors', count: colorsLen },
                { id: 'typography', label: 'Typography', count: fontsLen },
                { id: 'assets', label: 'Assets', count: assetsLen },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                    activeSection === section.id
                      ? 'bg-[#E04E35]/15 text-white'
                      : 'text-white/60 hover:bg-white/[0.03]'
                  }`}
                >
                  {section.label} ({section.count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              {activeSection === 'colors' && (
                <div>
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {PRESET_PALETTES.map((preset, i) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(i)}
                        className={`flex-shrink-0 p-2 rounded-lg border ${
                          selectedPreset === i ? 'border-[#E04E35]' : 'border-white/[0.07]'
                        }`}
                      >
                        <div className="flex gap-0.5 mb-1">
                          {preset.colors.map((c, j) => (
                            <div key={j} className="w-5 h-5 rounded" style={{ background: c }} />
                          ))}
                        </div>
                        <p className="text-[9px] text-white/50">{preset.name}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                    {colors.map((color) => {
                      const textColor = getContrastText(color.hex);
                      const ratio = contrastRatio(color.hex, '#AF0024').toFixed(1);

                      return (
                        <div key={color.id} className="rounded-xl border border-white/[0.07] overflow-hidden group">
                          <div
                            className="h-24 relative cursor-pointer"
                            style={{ background: color.hex }}
                            onClick={() => handleCopy(color.hex)}
                          >
                            <span
                              className="absolute top-2 left-2 text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                              style={{ background: `${textColor}18`, color: textColor }}
                            >
                              {color.role}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteColor(color.id);
                              }}
                              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500/30 opacity-0 group-hover:opacity-100 text-white text-xs hover:bg-red-500/60 transition-all"
                            >
                              ×
                            </button>
                          </div>

                          <div className="p-3 bg-white/[0.02]">
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="text"
                                value={color.label}
                                onChange={(e) => handleEditColorLabel(color.id, e.target.value)}
                                className="text-xs font-semibold text-white bg-transparent border-none focus:outline-none w-full"
                              />
                              <input
                                type="color"
                                value={color.hex}
                                onChange={(e) => handleEditColor(color.id, e.target.value)}
                                className="w-5 h-5 cursor-pointer bg-transparent"
                                title="Color picker"
                              />
                            </div>

                            <input
                              type="text"
                              value={color.hex.toUpperCase()}
                              onChange={(e) => {
                                let val = e.target.value.trim();
                                if (!val.startsWith('#')) val = `#${val}`;
                                if (/^#[0-9A-Fa-f]{6}$/.test(val)) handleEditColor(color.id, val);
                              }}
                              className="text-[11px] text-white/70 font-mono bg-transparent border border-white/10 rounded px-2 py-1 w-full focus:border-[#E04E35]/40 focus:outline-none"
                            />

                            <p className="text-[10px] text-white/25 mt-2">RGB {hexToRgb(color.hex)}</p>
                            <p className={`text-[10px] mt-1 ${parseFloat(ratio) >= 4.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {ratio}:1 contrast
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleAddColor}
                    className="w-full py-3 border-2 border-dashed border-white/10 rounded-lg text-sm text-white/40 hover:text-white/60"
                  >
                    + Add Color
                  </button>
                </div>
              )}

              {activeSection === 'typography' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-white/30 block mb-2">
                      Search font family
                    </label>
                    <input
                      type="text"
                      value={fontSearch}
                      onChange={(e) => setFontSearch(e.target.value)}
                      placeholder="Search fonts..."
                      className="w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                    />
                  </div>

                  {fonts.map((font) => (
                    <div key={font.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                      <div className="flex items-center justify-between p-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/80">{font.label}</p>
                          <p className="text-[10px] text-white/35">
                            {font.family} · {font.weight} · {font.sizeRem}rem
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingFont(editingFont === font.id ? null : font.id)}
                            className={`text-[10px] px-2.5 py-1 rounded-md border ${
                              editingFont === font.id
                                ? 'border-[#E04E35]/40 bg-[#E04E35]/10 text-[#E04E35]'
                                : 'border-white/[0.08] text-white/35 hover:text-white/60'
                            }`}
                          >
                            {editingFont === font.id ? 'Done' : 'Edit'}
                          </button>

                          <button
                            onClick={() => removeFont(font.id)}
                            className="text-white/20 hover:text-red-400 text-sm transition-colors px-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      <div
                        className="px-4 pb-4 text-white/85"
                        style={{
                          fontFamily: font.family,
                          fontWeight: font.weight,
                          fontStyle: font.style,
                          fontSize: `${Math.min(font.sizeRem, 1.75)}rem`,
                          lineHeight: font.lineHeight,
                          letterSpacing: font.letterSpacing,
                        }}
                      >
                        {font.preview}
                      </div>

                      {editingFont === font.id && (
                        <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] space-y-3 bg-white/[0.01]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Label
                              </label>
                              <input
                                value={font.label}
                                onChange={(e) => updateFont(font.id, 'label', e.target.value)}
                                className="w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Role
                              </label>
                              <select
                                value={font.role}
                                onChange={(e) => updateFont(font.id, 'role', e.target.value)}
                                className="w-full rounded-lg bg-[#1c0828] border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              >
                                {FONT_ROLES.map((r) => (
                                  <option key={r.value} value={r.value}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Family
                              </label>
                              <select
                                value={font.family}
                                onChange={(e) => updateFont(font.id, 'family', e.target.value)}
                                className="w-full rounded-lg bg-[#1c0828] border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              >
                                {filteredFontFamilies.map((family) => (
                                  <option key={family} value={family}>
                                    {family}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Weight
                              </label>
                              <select
                                value={font.weight}
                                onChange={(e) => updateFont(font.id, 'weight', e.target.value)}
                                className="w-full rounded-lg bg-[#1c0828] border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              >
                                {FONT_WEIGHTS.map((weight) => (
                                  <option key={weight} value={weight}>
                                    {weight}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Size (rem)
                              </label>
                              <input
                                type="number"
                                step="0.05"
                                value={font.sizeRem}
                                onChange={(e) => updateFont(font.id, 'sizeRem', Number(e.target.value))}
                                className="w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Line height
                              </label>
                              <input
                                type="number"
                                step="0.05"
                                value={font.lineHeight}
                                onChange={(e) => updateFont(font.id, 'lineHeight', Number(e.target.value))}
                                className="w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Style
                              </label>
                              <select
                                value={font.style}
                                onChange={(e) => updateFont(font.id, 'style', e.target.value)}
                                className="w-full rounded-lg bg-[#1c0828] border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              >
                                <option value="normal">Normal</option>
                                <option value="italic">Italic</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                                Letter spacing
                              </label>
                              <input
                                value={font.letterSpacing}
                                onChange={(e) => updateFont(font.id, 'letterSpacing', e.target.value)}
                                className="w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">
                              Preview
                            </label>
                            <textarea
                              value={font.preview}
                              onChange={(e) => updateFont(font.id, 'preview', e.target.value)}
                              rows={3}
                              className="w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-white focus:border-[#E04E35]/40 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addFont}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-white/40 hover:text-white/60 hover:border-white/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="text-lg leading-none">+</span>
                    <span className="text-sm">Add font</span>
                  </button>
                </div>
              )}

              {activeSection === 'assets' && (
                <IdentityStudioAssets
                  workspaceId={workspaceId}
                  assets={assets}
                  onAssetsChange={handleAssetsChange}
                  onDeleteAsset={handleDeleteAsset}
                />
              )}
            </div>
          </div>
        </div>

        {copiedHex && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-500/90 text-white text-sm rounded-lg shadow-lg z-50">
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
