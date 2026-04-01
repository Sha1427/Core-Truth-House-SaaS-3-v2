/**
 * BrandGuidelinesExport.jsx
 * One-click styled PDF export of brand guidelines.
 * Uses async job pattern: POST /api/export/guidelines/generate -> poll GET /api/export/guidelines/status/{jobId}
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useUser } from '../../hooks/useAuth';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Download, Loader2, CheckCircle, XCircle, X, FileText, Eye } from 'lucide-react';
import { useColors } from '../../context/ThemeContext';
import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL;

/* ── tiny step indicator ── */
function StepBar({ steps, current }) {
  return (
    <div className="flex gap-1 items-center w-full">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all" style={{
                width: done ? '100%' : active ? '60%' : '0%',
                background: done ? '#10B981' : '#E04E35',
                transition: 'width 0.6s ease',
              }} />
            </div>
            <p className="text-[9px] m-0" style={{ color: done ? '#10B981' : active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>{s}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ── preview card ── */
function PreviewCard({ src, label, onClick }) {
  return (
    <button onClick={onClick} className="relative group cursor-pointer bg-transparent border rounded-lg overflow-hidden flex-shrink-0" style={{ width: 110, height: 78, borderColor: 'rgba(255,255,255,0.08)' }}>
      {src ? (
        <img src={src} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(51,3,60,0.5)' }}>
          <FileText size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Eye size={14} style={{ color: 'white' }} />
      </div>
      {label && <p className="absolute bottom-0 left-0 right-0 text-[8px] text-center py-0.5 m-0" style={{ background: 'rgba(0,0,0,0.65)', color: 'rgba(255,255,255,0.6)' }}>{label}</p>}
    </button>
  );
}

/* ── modal ── */
function ExportModal({ onClose, userId, workspaceId, workspaceName }) {
  const colors = useColors();
  const [status, setStatus] = useState('idle');      // idle | generating | previewing | done | error
  const [step, setStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const jobIdRef = useRef(null);
  const STEPS = ['Fetching data', 'Rendering pages', 'Generating PDF', 'Finalizing'];

  const startExport = useCallback(async () => {
    setStatus('generating');
    setError(null);
    setStep(0);

    try {
      const res = await axios.post(`${API}/api/export/guidelines/generate`, null, {
        params: { user_id: userId, workspace_id: workspaceId },
      });

      if (res.data.job_id) {
        jobIdRef.current = res.data.job_id;
        setStep(1);
        startPolling(res.data.job_id);
      } else if (res.data.download_url) {
        // Synchronous response (fallback)
        setDownloadUrl(`${API}${res.data.download_url}`);
        setStep(3);
        setStatus('done');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start export.');
      setStatus('error');
    }
  }, [userId, workspaceId]);

  const startPolling = useCallback((jobId) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 40) {
        clearInterval(pollRef.current);
        setError('Export timed out. Try again.');
        setStatus('error');
        return;
      }
      try {
        const res = await axios.get(`${API}/api/export/guidelines/status/${jobId}`);
        const { status: jStatus, step: jStep, download_url, preview_url, error: jErr } = res.data;
        if (jStep !== undefined) setStep(jStep);
        if (jStatus === 'done') {
          clearInterval(pollRef.current);
          if (download_url) setDownloadUrl(`${API}${download_url}`);
          if (preview_url) setPreviewUrl(`${API}${preview_url}`);
          setStep(3);
          setStatus('done');
        } else if (jStatus === 'error') {
          clearInterval(pollRef.current);
          setError(jErr || 'Export failed.');
          setStatus('error');
        }
      } catch {
        // Retry silently
      }
    }, 1500);
  }, []);

  useEffect(() => { return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${(workspaceName || 'brand').toLowerCase().replace(/\s+/g, '-')}-brand-guidelines.pdf`;
      a.click();
    }
  };

  const handlePreview = () => {
    if (previewUrl) window.open(previewUrl, '_blank');
    else if (downloadUrl) window.open(downloadUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4" data-testid="export-modal">
      <div className="rounded-xl w-full max-w-[440px] overflow-hidden" style={{ background: '#1A0020', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(224,78,53,0.12)' }}>
              <FileText size={16} style={{ color: '#E04E35' }} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white m-0">Export Brand Guidelines</h3>
              <p className="text-[11px] m-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{workspaceName || 'Your Brand'}</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1" data-testid="close-export-modal">
            <X size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Idle state */}
          {status === 'idle' && (
            <>
              <div className="p-4 rounded-lg" style={{ background: 'rgba(51,3,60,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[12px] m-0" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Generate a professionally styled PDF of your complete brand guidelines — foundation, identity, colors, typography, and voice — all in one document.
                </p>
              </div>
              <button
                onClick={startExport}
                data-testid="start-export-btn"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-none text-white text-[13px] font-semibold cursor-pointer"
                style={{ background: '#E04E35' }}
              >
                <Download size={15} /> Generate PDF
              </button>
            </>
          )}

          {/* Generating */}
          {status === 'generating' && (
            <div className="py-4 flex flex-col items-center gap-4">
              <Loader2 size={32} className="animate-spin" style={{ color: '#E04E35' }} />
              <p className="text-[13px] text-white/70 m-0">Building your brand guidelines...</p>
              <div className="w-full px-2">
                <StepBar steps={STEPS} current={step} />
              </div>
            </div>
          )}

          {/* Done */}
          {status === 'done' && (
            <div className="flex flex-col gap-3 items-center py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <CheckCircle size={24} style={{ color: '#10B981' }} />
              </div>
              <p className="text-[14px] font-semibold text-white m-0">PDF Ready</p>
              <p className="text-[12px] m-0" style={{ color: 'rgba(255,255,255,0.4)' }}>Your brand guidelines are ready to download.</p>

              <div className="w-full flex gap-2 mt-1">
                <button
                  onClick={handlePreview}
                  data-testid="preview-export-btn"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-[12px] font-semibold cursor-pointer"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)' }}
                >
                  <Eye size={13} /> Preview
                </button>
                <button
                  onClick={handleDownload}
                  data-testid="download-export-btn"
                  className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-none text-[13px] font-semibold text-white cursor-pointer"
                  style={{ background: '#E04E35' }}
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col gap-3 py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <XCircle size={24} style={{ color: '#EF4444' }} />
              </div>
              <p className="text-[14px] font-semibold text-white m-0 text-center">
                {error?.toLowerCase().includes('playwright') || error?.toLowerCase().includes('chromium') || error?.toLowerCase().includes('browser')
                  ? 'PDF generator not configured'
                  : 'Export failed'}
              </p>
              <p className="text-[12px] text-white/40 m-0 text-center px-4">
                {error?.toLowerCase().includes('playwright') || error?.toLowerCase().includes('chromium') || error?.toLowerCase().includes('browser')
                  ? 'The styled PDF generator requires Playwright to be installed on the server.'
                  : error}
              </p>
              
              {/* Server fix hint for Playwright errors */}
              {(error?.toLowerCase().includes('playwright') || error?.toLowerCase().includes('chromium') || error?.toLowerCase().includes('browser')) && (
                <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider m-0 mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>Server fix (run once)</p>
                  <code className="text-[11px] block" style={{ color: '#fca5a5', fontFamily: 'monospace' }}>
                    playwright install chromium
                  </code>
                  <p className="text-[10px] m-0 mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Or for Railway/Docker: <code style={{ color: '#fca5a5' }}>playwright install --with-deps chromium</code>
                  </p>
                </div>
              )}

              {/* Fallback options */}
              <div className="mt-2 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider m-0 mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Use one of these now</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => window.open(`${API}/api/export/guidelines/print-preview?user_id=${userId}&workspace_id=${workspaceId}`, '_blank')}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-left"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
                  >
                    <span className="text-xl">🖨</span>
                    <div>
                      <p className="text-[12px] font-semibold text-white m-0">Print / Save as PDF</p>
                      <p className="text-[10px] m-0" style={{ color: 'rgba(255,255,255,0.4)' }}>Opens browser print dialog — works offline, no server needed</p>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={() => { setStatus('idle'); setError(null); }}
                className="mt-2 px-5 py-2 rounded-lg border text-[12px] text-white/60 cursor-pointer bg-transparent"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Exported button component ── */
export function BrandGuidelinesExportButton({ className = '', style = {} }) {
  const { user } = useUser();
  const { activeWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-testid="export-guidelines-btn"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium cursor-pointer bg-transparent transition-colors hover:bg-white/5 ${className}`}
        style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', ...style }}
      >
        <Download size={13} /> Export PDF
      </button>
      {open && (
        <ExportModal
          onClose={() => setOpen(false)}
          userId={user?.id || 'default'}
          workspaceId={activeWorkspace?.id}
          workspaceName={activeWorkspace?.brand_name || activeWorkspace?.name || 'Your Brand'}
        />
      )}
    </>
  );
}
