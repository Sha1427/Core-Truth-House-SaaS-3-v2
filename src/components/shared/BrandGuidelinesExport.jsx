import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, X, Loader2 } from 'lucide-react';
import { useUser } from '../../hooks/useAuth';
import { useWorkspace } from '../../context/WorkspaceContext';
import apiClient from '../../lib/apiClient';

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const KICKER_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const HEADING_STYLE = {
  fontFamily: SERIF,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
};

const MUTED_STYLE = {
  fontFamily: SANS,
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const PRIMARY_BUTTON_STYLE = {
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
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

const SECONDARY_BUTTON_STYLE = {
  background: 'transparent',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: '8px 12px',
  fontFamily: SANS,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

async function authedFetchBlob(path) {
  const headers =
    typeof apiClient.getAuthHeaders === 'function'
      ? await apiClient.getAuthHeaders()
      : {};

  const url =
    path.startsWith('http') || path.startsWith('blob:')
      ? path
      : apiClient.buildApiUrl(path);

  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.blob();
}

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

  useEffect(() => {
    return () => {
      if (downloadUrl && downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  async function resolveReadyDownload(remotePath) {
    try {
      const blob = await authedFetchBlob(remotePath);
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'Failed to download report.');
    }
  }

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
        const data = await apiClient.get(`/api/export/guidelines/status/${encodeURIComponent(jobId)}`);

        if (data?.status === 'done') {
          clearInterval(pollRef.current);
          if (data?.download_url) {
            await resolveReadyDownload(data.download_url);
          } else {
            setStatus('error');
            setError('Export finished without a download URL.');
          }
        }

        if (data?.status === 'error') {
          clearInterval(pollRef.current);
          setStatus('error');
          setError(data?.error || 'Export failed.');
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
      setStatus('generating');
      try {
        const query = new URLSearchParams({
          user_id: userId || 'default',
          workspace_id: workspaceId || '',
        }).toString();
        const blob = await authedFetchBlob(`/api/export/guidelines/print-preview?${query}`);
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
        setStatus('idle');
      } catch (err) {
        setStatus('error');
        setError(err?.message || 'Preview failed.');
      }
      return;
    }

    setStatus('generating');

    try {
      const data = await apiClient.post('/api/export/guidelines/generate', null, {
        params: {
          user_id: userId || 'default',
          workspace_id: workspaceId || '',
        },
      });

      if (data?.job_id) {
        startPolling(data.job_id);
        return;
      }

      if (data?.download_url) {
        await resolveReadyDownload(data.download_url);
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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(13, 0, 16, 0.55)' }}
    >
      <div
        className="w-full max-w-2xl p-5 shadow-2xl"
        style={{
          background: 'var(--cth-command-panel)',
          borderRadius: 4,
          border: '1px solid var(--cth-command-border)',
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p style={KICKER_STYLE}>Brand Foundation</p>
            <h2 style={{ ...HEADING_STYLE, fontSize: 22, fontWeight: 600, marginTop: 6 }}>
              Export Report
            </h2>
            <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 6, lineHeight: 1.55 }}>
              Choose how you want to use this report. Nothing exports until you pick an option.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            style={SECONDARY_BUTTON_STYLE}
          >
            <X size={15} />
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setMode('print')}
            className="text-left"
            style={{
              background: 'var(--cth-command-panel)',
              borderRadius: 4,
              border: `1px solid ${mode === 'print' ? 'var(--cth-command-crimson)' : 'var(--cth-command-border)'}`,
              padding: 16,
              cursor: 'pointer',
            }}
          >
            <Eye size={18} style={{ color: 'var(--cth-command-crimson)' }} />
            <p style={{ ...HEADING_STYLE, fontSize: 14, fontWeight: 700, marginTop: 8 }}>
              Preview / Print
            </p>
            <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 4, lineHeight: 1.55 }}>
              Open the report in a new tab.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('download')}
            className="text-left"
            style={{
              background: 'var(--cth-command-panel)',
              borderRadius: 4,
              border: `1px solid ${mode === 'download' ? 'var(--cth-command-crimson)' : 'var(--cth-command-border)'}`,
              padding: 16,
              cursor: 'pointer',
            }}
          >
            <Download size={18} style={{ color: 'var(--cth-command-crimson)' }} />
            <p style={{ ...HEADING_STYLE, fontSize: 14, fontWeight: 700, marginTop: 8 }}>
              Download PDF
            </p>
            <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 4, lineHeight: 1.55 }}>
              Generate and download the report.
            </p>
          </button>

          <div
            style={{
              background: 'var(--cth-command-panel-soft)',
              borderRadius: 4,
              border: '1px solid var(--cth-command-border)',
              padding: 16,
            }}
          >
            <FileText size={18} style={{ color: 'var(--cth-command-crimson)' }} />
            <p style={{ ...HEADING_STYLE, fontSize: 14, fontWeight: 700, marginTop: 8 }}>
              Saved to Workspace Library
            </p>
            <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 4, lineHeight: 1.55 }}>
              A generated copy is saved to documents.
            </p>
          </div>
        </div>

        {status === 'generating' ? (
          <div
            className="mt-4 text-center"
            style={{
              border: '1px solid var(--cth-command-border)',
              background: 'var(--cth-command-panel-soft)',
              borderRadius: 4,
              padding: 16,
            }}
          >
            <Loader2
              className="mx-auto animate-spin"
              size={24}
              style={{ color: 'var(--cth-command-crimson)' }}
            />
            <p style={{ ...HEADING_STYLE, fontSize: 14, fontWeight: 600, marginTop: 8 }}>
              Generating report...
            </p>
          </div>
        ) : null}

        {status === 'ready' ? (
          <div
            className="mt-4"
            style={{
              border: '1px solid var(--cth-status-success-bright)',
              background: 'color-mix(in srgb, var(--cth-status-success-bright) 8%, var(--cth-command-panel))',
              borderRadius: 4,
              padding: 16,
            }}
          >
            <p style={{ ...HEADING_STYLE, fontSize: 14, fontWeight: 600 }}>
              Your report is ready.
            </p>
            <p style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 4, lineHeight: 1.55 }}>
              A copy has been saved to your Workspace Library.
            </p>
            <button type="button" onClick={handleDownload} className="mt-4" style={PRIMARY_BUTTON_STYLE}>
              <Download size={14} />
              Download PDF
            </button>
          </div>
        ) : null}

        {status === 'error' ? (
          <div
            className="mt-4"
            style={{
              border: '1px solid var(--cth-danger)',
              background: 'color-mix(in srgb, var(--cth-danger) 8%, var(--cth-command-panel))',
              borderRadius: 4,
              padding: 12,
              fontFamily: SANS,
              fontSize: 13,
              color: 'var(--cth-danger)',
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleExport}
          disabled={status === 'generating'}
          className="mt-5 w-full"
          style={{
            ...PRIMARY_BUTTON_STYLE,
            width: '100%',
            opacity: status === 'generating' ? 0.65 : 1,
            cursor: status === 'generating' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'generating' ? 'Exporting...' : mode === 'print' ? 'Preview / Print' : 'Generate Report'}
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
        className={`inline-flex items-center gap-2 ${className}`}
        style={{ ...SECONDARY_BUTTON_STYLE, ...style }}
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
