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
];

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const res = await axios.get(`${API}/identity?user_id=${userId}`);

        if (Array.isArray(res.data?.colors) && res.data.colors.length > 0) {
          setColors(res.data.colors);
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
      if (!userId || !assetId) return;

      try {
        await axios.delete(`${API}/media/${assetId}`, {
          params: { user_id: userId },
        });

        setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
        setHasUnsaved(true);
      } catch (err) {
        console.error('Failed to delete asset:', err);
      }
    },
    [userId]
  );

  const handleSave = useCallback(async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      await axios.post(`${API}/identity/save?user_id=${userId}`, {
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
  }, [userId, colors, fonts, assets]);

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
            <div className="max-w-4xl mx-auto">
              {activeSection === 'colors' && (
                <div className="text-white/60">Colors UI here</div>
              )}

              {activeSection === 'typography' && (
                <div className="text-white/60">Typography UI here</div>
              )}

                           {activeSection === 'assets' && (
                <IdentityStudioAssets
                  workspaceId={currentWorkspace?.id || ''}
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
