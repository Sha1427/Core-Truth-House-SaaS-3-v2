import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, X, Loader2 } from 'lucide-react';
import { useUser } from '../../hooks/useAuth';
import { useWorkspace } from '../../context/WorkspaceContext';

const API =
  import.meta?.env?.VITE_BACKEND_URL ||
  import.meta?.env?.VITE_API_BASE_URL ||
  'https://api.coretruthhouse.com';

function ExportModal({ onClose, userId, workspaceId, workspaceName }) {
  const [mode, setMode] = useState('download');
  const [status, setStatus] = useState('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling(jobId) {
    let attempts = 0;

    pollRef.current = setInterval(async () => {
      attempts += 1;

      if (attempts > 90) {
        clearInterval(pollRef.current);
        setStatus('error');
        setError('Export timed out. Try again.');
        return;
      }

      try {
        const res = await fetch(`${API}/api/export/guidelines/status/${encodeURIComponent(jobId)}`);
        const data = await res.json();

        if (data.status === 'done') {
          clearInterval(pollRef.current);
          setDownloadUrl(data.download_url ? `${API}${data.download_url}` : '');
          setStatus('ready');
        }

        if (data.status === 'error') {
          clearInterval(pollRef.current);
          setStatus('error');
          setError(data.error || 'Export failed.');
        }
      } catch {
        clearInterval(pollRef.current);
        setStatus('error');
        setError('Connection lost while generating the report.');
      }
    }, 1500);
  }

  async function handleExport() {
    setError('');

    if (mode === 'print') {
      window.open(
        `${API}/api/export/guidelines/print-preview?user_id=${encodeURIComponent(userId || 'default')}&workspace_id=${encodeURIComponent(workspaceId || '')}`,
        '_blank'
      );
      return;
    }

    setStatus('generating');

    try {
      const url = `${API}/api/export/guidelines/generate?user_id=${encodeURIComponent(userId || 'default')}&workspace_id=${encodeURIComponent(workspaceId || '')}`;
      const res = await fetch(url, { method: 'POST' });

      if (!res.ok) throw new Error('Export job failed to start.');

      const data = await res.json();

      if (data.job_id) {
        startPolling(data.job_id);
        return;
      }

      if (data.download_url) {
        setDownloadUrl(`${API}${data.download_url}`);
        setStatus('ready');
        return;
      }

      throw new Error('Export did not return a job id.');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'Export failed.');
    }
  }

  function handleDownload() {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${(workspaceName || 'brand').toLowerCase().replace(/\s+/g, '-')}-brand-foundation-report.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(20, 15, 43, 0.45)' }}>
      <div className="w-full max-w-2xl rounded-3xl border p-5 shadow-2xl" style={{ background: 'var(--cth-admin-panel)', borderColor: 'var(--cth-admin-border)' }}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="cth-kicker m-0">Brand Foundation</p>
            <h2 className="m-0 mt-1 text-xl font-bold cth-heading">Export Report</h2>
            <p className="m-0 mt-1 text-xs cth-muted">Choose how you want to use this report. Nothing exports until you pick an option.</p>
          </div>
          <button type="button" onClick={onClose} className="cth-button-secondary px-3 py-2">
            <X size={15} />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setMode('print')}
            className="rounded-2xl border p-4 text-left"
            style={{ borderColor: mode === 'print' ? 'var(--cth-admin-accent)' : 'var(--cth-admin-border)', background: 'var(--cth-admin-panel)' }}
          >
            <Eye size={18} className="cth-text-accent" />
            <p className="m-0 mt-2 text-sm font-bold cth-heading">Preview / Print</p>
            <p className="m-0 mt-1 text-xs cth-muted">Open the report in a new tab.</p>
          </button>

          <button
            type="button"
            onClick={() => setMode('download')}
            className="rounded-2xl border p-4 text-left"
            style={{ borderColor: mode === 'download' ? 'var(--cth-admin-accent)' : 'var(--cth-admin-border)', background: 'var(--cth-admin-panel)' }}
          >
            <Download size={18} className="cth-text-accent" />
            <p className="m-0 mt-2 text-sm font-bold cth-heading">Download PDF</p>
            <p className="m-0 mt-1 text-xs cth-muted">Generate and download the report.</p>
          </button>

          <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--cth-admin-border)', background: 'var(--cth-admin-panel-alt)' }}>
            <FileText size={18} className="cth-text-accent" />
            <p className="m-0 mt-2 text-sm font-bold cth-heading">Saved to Workspace Library</p>
            <p className="m-0 mt-1 text-xs cth-muted">A generated copy is saved to documents.</p>
          </div>
        </div>

        {status === 'generating' ? (
          <div className="mt-4 rounded-2xl border p-4 text-center" style={{ borderColor: 'var(--cth-admin-border)' }}>
            <Loader2 className="mx-auto animate-spin cth-text-accent" size={24} />
            <p className="m-0 mt-2 text-sm font-semibold cth-heading">Generating report...</p>
          </div>
        ) : null}

        {status === 'ready' ? (
          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'var(--cth-success)', background: 'color-mix(in srgb, var(--cth-success) 8%, var(--cth-admin-panel))' }}>
            <p className="m-0 text-sm font-semibold cth-heading">Your report is ready.</p>
            <p className="m-0 mt-1 text-xs cth-muted">A copy has been saved to your Workspace Library.</p>
            <button type="button" onClick={handleDownload} className="cth-button-primary mt-4 inline-flex items-center gap-2">
              <Download size={14} />
              Download PDF
            </button>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="mt-4 rounded-2xl border p-3 text-sm cth-text-danger" style={{ borderColor: 'var(--cth-danger)' }}>
            {error}
          </div>
        ) : null}

        <button type="button" onClick={handleExport} disabled={status === 'generating'} className="cth-button-primary mt-5 w-full justify-center">
          {status === 'generating' ? 'Exporting…' : mode === 'print' ? 'Preview / Print' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
}

export function BrandGuidelinesExportButton({ className = '', style = {} }) {
  const { user } = useUser();
  const { activeWorkspace, currentWorkspace } = useWorkspace();
  const workspace = activeWorkspace || currentWorkspace;
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="export-guidelines-btn"
        className={`cth-button-secondary inline-flex items-center gap-2 ${className}`}
        style={style}
      >
        <Download size={13} />
        Export Report
      </button>

      {open ? (
        <ExportModal
          onClose={() => setOpen(false)}
          userId={user?.id || 'default'}
          workspaceId={workspace?.id || workspace?.workspace_id || ''}
          workspaceName={workspace?.brand_name || workspace?.name || 'Your Brand'}
        />
      ) : null}
    </>
  );
}

export default BrandGuidelinesExportButton;
