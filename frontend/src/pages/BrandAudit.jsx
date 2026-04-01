import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUser } from '../hooks/useAuth';
import { BrandGuidelinesExportButton } from '../components/shared/BrandGuidelinesExport';
import IdentityStudioAssets from '../components/shared/IdentityStudioAssets';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const DEFAULT_COLORS = [
  { id: 'primary', role: 'primary', label: 'Primary', hex: '#AF0024' },
  { id: 'secondary', role: 'secondary', label: 'Secondary', hex: '#E04E35' },
  { id: 'accent', role: 'accent', label: 'Accent', hex: '#C7A09D' },
  { id: 'background', role: 'background', label: 'Background', hex: '#1c0828' },
  { id: 'text', role: 'text', label: 'Text', hex: '#F8F5FA' },
  { id: 'deep-ruby', role: 'custom', label: 'Deep Ruby', hex: '#763B5B' },
];

const DEFAULT_FONTS = [
  { id: 'display', role: 'display', label: 'Display', family: 'Playfair Display', weight: '700', style: 'normal', sizeRem: 3.5, lineHeight: 1.1, letterSpacing: '-0.02em', preview: 'Where Serious Brands Are Built.' },
  { id: 'heading', role: 'heading', label: 'Heading', family: 'Cormorant Garamond', weight: '600', style: 'normal', sizeRem: 2, lineHeight: 1.25, letterSpacing: '-0.01em', preview: 'The Brand Behind the Business' },
  { id: 'subhead', role: 'heading', label: 'Subhead', family: 'Cormorant Garamond', weight: '500', style: 'italic', sizeRem: 1.25, lineHeight: 1.4, letterSpacing: '0em', preview: 'Strategy before aesthetics. Always.' },
  { id: 'body', role: 'body', label: 'Body', family: 'DM Sans', weight: '400', style: 'normal', sizeRem: 1, lineHeight: 1.65, letterSpacing: '0.01em', preview: 'The founders who build the deepest brands start with truth.' },
  { id: 'caption', role: 'caption', label: 'Caption', family: 'DM Sans', weight: '300', style: 'normal', sizeRem: 0.75, lineHeight: 1.5, letterSpacing: '0.03em', preview: 'Updated 3 minutes ago — Core Truth House OS' },
  { id: 'label', role: 'caption', label: 'Label', family: 'DM Sans', weight: '600', style: 'normal', sizeRem: 0.7, lineHeight: 1.2, letterSpacing: '0.15em', preview: 'BRAND OPERATING SYSTEM' },
];

const FONT_FAMILIES = [
  'Playfair Display', 'Cormorant Garamond', 'DM Sans', 'Inter', 'Lora',
  'Merriweather', 'Montserrat', 'Open Sans', 'Poppins', 'Raleway',
  'Roboto', 'Roboto Slab', 'Source Sans 3', 'Source Serif 4', 'Work Sans',
  'Libre Baskerville', 'Crimson Text', 'Nunito', 'Oswald', 'PT Serif',
  'Bitter', 'Cardo', 'EB Garamond', 'Fira Sans', 'IBM Plex Sans',
  'IBM Plex Serif', 'Josefin Sans', 'Karla', 'Lato', 'Manrope',
  'Noto Sans', 'Noto Serif', 'Outfit', 'Sora', 'Space Grotesk',
  'Spectral', 'Vollkorn', 'Archivo', 'Bricolage Grotesque', 'Lexend',
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
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function getLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
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

function IdentityStudioContent() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useUser();
  const userId = user?.id;

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
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  useEffect(() => {
    const families = [...new Set(fonts.map((f) => f.family))].filter(Boolean);
    if (families.length === 0) return;

    const id = 'identity-studio-gfonts';
    let link = document.getElementById(id);
    const href = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, '+')}:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600`).join('&')}&display=swap`;

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

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const res = await axios.get(`${API}/identity?user_id=${userId}`);

        if (Array.isArray(res.data?.colors) && res.data.colors.length > 0) {
          const normalizedColors = res.data.colors.map((c, idx) => ({
            id: c.id || `color-${idx}`,
            role: c.role || 'custom',
            label: c.label || c.name || 'Color',
            hex: c.hex || '#FFFFFF',
          }));
          setColors(normalizedColors);
        }

        if (Array.isArray(res.data?.fonts) && res.data.fonts.length > 0) {
          setFonts(res.data.fonts);
        }

        if (Array.isArray(res.data?.assets)) {
          const normalizedAssets = res.data.assets.map((a, idx) => ({
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
        console.error('Failed to load identity:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleCopy = useCallback(async (hex) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 2000);
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
      { id: `custom-${Date.now()}`, role: 'custom', label: 'Custom Color', hex: '#5B21B6' },
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

  const removeFont = useCallback((fontId) => {
    setFonts((prev) => prev.filter((f) => f.id !== fontId));
    if (editingFont === fontId) setEditingFont(null);
    setHasUnsaved(true);
  }, [editingFont]);

  const handleSave = useCallback(async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      await axios.post(`${API}/identity/save?user_id=${userId}`, { colors, fonts, assets });
      setHasUnsaved(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [colors, fonts, assets, userId]);

  const handleExportKit = useCallback(() => {
    if (!userId) return;
    window.open(`${API}/export/brand-guidelines-styled?user_id=${userId}`, '_blank');
  }, [userId]);

  const colorsLen = colors?.length || 0;
  const fontsLen = fonts?.length || 0;
  const assetsLen = assets?.length || 0;

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
          <div className="text-white/40">Loading...</div>
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
            <p className="text-xs text-white/40 mt-0.5">Define your brand&apos;s visual language</p>
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

            <BrandGuidelinesExportButton />
            <button
              onClick={handleExportKit}
              data-testid="export-btn"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white"
            >
              Export
            </button>
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

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex md:flex-col md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.07] p-3 md:p-4 bg-[#1c0828]">
            <div className="flex md:flex-col gap-1 md:space-y-1 overflow-x-auto md:overflow-x-visible">
              {[
                { id: 'colors', label: 'Colors', count: colorsLen },
                { id: 'typography', label: 'Typography', count: fontsLen },
                { id: 'assets', label: 'Assets', count: assetsLen },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  data-testid={`nav-${s.id}`}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm ${
                    activeSection === s.id ? 'bg-[#E04E35]/15 text-white' : 'text-white/60 hover:bg-white/[0.03]'
                  }`}
                >
                  {s.label} ({s.count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              {activeSection === 'colors' && (
                <div>
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {PRESET_PALETTES.map((p, i) => (
                      <button
                        key={p.name}
                        onClick={() => applyPreset(i)}
                        data-testid={`preset-${i}`}
                        className={`flex-shrink-0 p-2 rounded-lg border ${
                          selectedPreset === i ? 'border-[#E04E35]' : 'border-white/[0.07]'
                        }`}
                      >
                        <div className="flex gap-0.5 mb-1">
                          {p.colors.map((c, j) => (
                            <div key={j} className="w-5 h-5 rounded" style={{ background: c }} />
                          ))}
                        </div>
                        <p className="text-[9px] text-white/50">{p.name}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {Array.isArray(colors) &&
                      colors.map((color) => {
                        const textColor = getContrastText(color.hex);
                        const ratio = contrastRatio(color.hex, '#AF0024').toFixed(1);

                        return (
                          <div key={color.id} className="rounded-xl border border-white/[0.07] overflow-hidden group">
                            <div
                              className="h-20 relative cursor-pointer"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteColor(color.id);
                                }}
                                data-testid={`delete-color-${color.id}`}
                                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500/30 opacity-0 group-hover:opacity-100 text-white text-xs hover:bg-red-500/60 transition-all"
                              >
                                ×
                              </button>
                            </div>

                            <div className="p-2 bg-white/[0.02]">
                              <div className="flex items-center gap-1.5 mb-1">
                                <input
                                  type="text"
                                  value={color.label}
                                  onChange={(e) => handleEditColorLabel(color.id, e.target.value)}
                                  data-testid={`label-input-${color.id}`}
                                  className="text-[10px] font-semibold text-white truncate bg-transparent border-none focus:outline-none focus:underline w-full"
                                  placeholder="Color name"
                                />
                                <input
                                  type="color"
                                  value={color.hex}
                                  onChange={(e) => handleEditColor(color.id, e.target.value)}
                                  className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100 flex-shrink-0"
                                  title="Color picker"
                                />
                              </div>

                              <input
                                type="text"
                                value={color.hex.toUpperCase()}
                                onChange={(e) => {
                                  let val = e.target.value.trim();
                                  if (!val.startsWith('#')) val = '#' + val;
                                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                    handleEditColor(color.id, val);
                                  }
                                }}
                                onBlur={(e) => {
                                  let val = e.target.value.trim();
                                  if (!val.startsWith('#')) val = '#' + val;
                                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                    handleEditColor(color.id, val);
                                  }
                                }}
                                data-testid={`hex-input-${color.id}`}
                                className="text-[10px] text-white/60 font-mono bg-transparent border border-white/10 rounded px-1.5 py-0.5 w-20 focus:border-[#E04E35]/40 focus:outline-none"
                                placeholder="#FFFFFF"
                              />

                              <p className="text-[9px] text-white/25 mt-0.5">RGB {hexToRgb(color.hex)}</p>
                              <p className={`text-[8px] mt-1 ${parseFloat(ratio) >= 4.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {ratio}:1 contrast
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={handleAddColor}
                    data-testid="add-color-btn"
                    className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-sm text-white/40 hover:text-white/60"
                  >
                    + Add Color
                  </button>
                </div>
              )}

              {activeSection === 'typography' && (
                <div className="space-y-3">
                  {Array.isArray(fonts) &&
                    fonts.map((font) => (
                      <div key={font.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-6 h-6 rounded bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-white/40" style={{ fontFamily: font.family }}>Aa</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white/70">{font.label}</p>
                              <p className="text-[9px] text-white/30">{font.family} · {font.weight} · {font.sizeRem}rem</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingFont(editingFont === font.id ? null : font.id)}
                              data-testid={`edit-font-${font.id}`}
                              className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${
                                editingFont === font.id
                                  ? 'border-[#E04E35]/40 bg-[#E04E35]/10 text-[#E04E35]'
                                  : 'border-white/[0.08] text-white/35 hover:text-white/60'
                              }`}
                            >
                              {editingFont === font.id ? 'Done' : 'Edit'}
                            </button>
                            <button
                              onClick={() => removeFont(font.id)}
                              data-testid={`remove-font-${font.id}`}
                              className="text-white/20 hover:text-red-400 text-sm transition-colors px-1"
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div
                          className="px-4 pb-3 text-white/85"
                          style={{
                            fontFamily: font.family,
                            fontWeight: font.weight,
                            fontStyle: font.style,
                            fontSize: `${Math.min(font.sizeRem, 1.75)}rem`,
                            lineHeight: font.lineHeight,
                          }}
                        >
                          {font.preview}
                        </div>

                        {editingFont === font.id && (
                          <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] space-y-3 bg-white/[0.01]">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Label</label>
                                <input
                                  value={font.label}
                                  onChange={(e) => updateFont(font.id, 'label', e.target.value)}
                                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E04E35]/40"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Role</label>
                                <select
                                  value={font.role}
                                  onChange={(e) => updateFont(font.id, 'role', e.target.value)}
                                  className="w-full bg-[#1A0020] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white/60 focus:outline-none focus:border-[#E04E35]/40"
                                >
                                  {FONT_ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="relative">
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Font Family</label>
                              <input
                                value={editingFont === font.id && fontSearch !== '' ? fontSearch : font.family}
                                onChange={(e) => {
                                  setFontSearch(e.target.value);
                                  setShowFontDropdown(true);
                                }}
                                onFocus={() => {
                                  setFontSearch('');
                                  setShowFontDropdown(true);
                                }}
                                onBlur={() => setTimeout(() => setShowFontDropdown(false), 200)}
                                data-testid={`font-family-input-${font.id}`}
                                placeholder="Search fonts..."
                                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E04E35]/40"
                              />
                              {showFontDropdown && editingFont === font.id && (
                                <div className="absolute z-30 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto bg-[#1A0020] border border-white/[0.12] rounded-lg shadow-xl">
                                  {FONT_FAMILIES.filter((f) => f.toLowerCase().includes((fontSearch || '').toLowerCase())).map((fam) => (
                                    <button
                                      key={fam}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        updateFont(font.id, 'family', fam);
                                        setFontSearch('');
                                        setShowFontDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                        font.family === fam ? 'text-[#E04E35] bg-[#E04E35]/10' : 'text-white/55 hover:bg-white/[0.06]'
                                      }`}
                                      style={{ fontFamily: fam }}
                                    >
                                      {fam}
                                    </button>
                                  ))}
                                  {FONT_FAMILIES.filter((f) => f.toLowerCase().includes((fontSearch || '').toLowerCase())).length === 0 && fontSearch && (
                                    <button
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        updateFont(font.id, 'family', fontSearch);
                                        setFontSearch('');
                                        setShowFontDropdown(false);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs text-[#E04E35]"
                                    >
                                      Use custom: "{fontSearch}"
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Weight</label>
                                <select
                                  value={font.weight}
                                  onChange={(e) => updateFont(font.id, 'weight', e.target.value)}
                                  className="w-full bg-[#1A0020] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white/60 focus:outline-none"
                                >
                                  {FONT_WEIGHTS.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Style</label>
                                <select
                                  value={font.style}
                                  onChange={(e) => updateFont(font.id, 'style', e.target.value)}
                                  className="w-full bg-[#1A0020] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white/60 focus:outline-none"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="italic">Italic</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Size (rem)</label>
                                <input
                                  type="number"
                                  step="0.125"
                                  min="0.5"
                                  max="6"
                                  value={font.sizeRem}
                                  onChange={(e) => updateFont(font.id, 'sizeRem', parseFloat(e.target.value) || 1)}
                                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E04E35]/40"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Line Height</label>
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0.8"
                                  max="3"
                                  value={font.lineHeight}
                                  onChange={(e) => updateFont(font.id, 'lineHeight', parseFloat(e.target.value) || 1.5)}
                                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E04E35]/40"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Letter Spacing</label>
                                <input
                                  value={font.letterSpacing}
                                  onChange={(e) => updateFont(font.id, 'letterSpacing', e.target.value)}
                                  placeholder="e.g. -0.02em"
                                  className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E04E35]/40"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-semibold uppercase tracking-widest text-white/30 block mb-1">Preview Text</label>
                              <input
                                value={font.preview}
                                onChange={(e) => updateFont(font.id, 'preview', e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E04E35]/40"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                  <button
                    onClick={addFont}
                    data-testid="add-font-btn"
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-white/40 hover:text-white/60 hover:border-white/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="text-lg leading-none">+</span>
                    <span className="text-sm">Add font</span>
                  </button>
                </div>
              )}

              {activeSection === 'assets' && (
                <IdentityStudioAssets
                  workspaceId={currentWorkspace?.id || ''}
                  onAssetsChange={setAssets}
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
