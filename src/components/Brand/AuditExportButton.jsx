import React, { useState } from 'react';
import { Download, Eye, FileText, X } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export function AuditExportButton({ auditId = '', variant = 'secondary' }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('download');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function runExport(selectedMode = mode) {
    if (!auditId || busy) return;
    setBusy(true);
    setError('');

    try {
      const startData = await apiClient.get('/api/export/brand-audit-styled', {
        params: { audit_id: auditId },
      });

      const jobId = startData?.job_id;
      if (!jobId) throw new Error('Export job did not return a job id.');

      let statusData = null;

      for (let attempt = 0; attempt < 90; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        statusData = await apiClient.get('/api/export/brand-audit/status', {
          params: { job_id: jobId },
        });

        if (statusData?.status === 'error') {
          throw new Error(statusData?.error || 'PDF export failed.');
        }

        if (statusData?.status === 'ready' && statusData?.download_url) break;
      }

      if (!statusData?.download_url) {
        throw new Error(`PDF was not ready. Last status: ${statusData?.status || 'unknown'}`);
      }

      const headers =
        typeof apiClient.getAuthHeaders === 'function'
          ? await apiClient.getAuthHeaders()
          : {};

      const downloadUrl = apiClient.buildApiUrl(`/api/export/brand-audit/download/${encodeURIComponent(jobId)}`);
      const pdfRes = await fetch(downloadUrl, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!pdfRes.ok || !(pdfRes.headers.get('content-type') || '').includes('application/pdf')) {
        throw new Error('Export returned a non-PDF response.');
      }

      const blob = await pdfRes.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (selectedMode === 'print') {
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
      } else {
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `brand-audit-report-${auditId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      setOpen(false);
    } catch (err) {
      console.error('Audit export failed:', err);
      setError(err?.message || 'Brand Audit export failed.');
    } finally {
      setBusy(false);
    }
  }

  const isPrimary = variant === 'primary';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!auditId}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
        style={
          isPrimary
            ? { borderRadius: 4, backgroundColor: 'var(--cth-command-purple)', color: 'var(--cth-command-gold)', border: 'none' }
            : { borderRadius: 4, border: '1px solid var(--cth-command-border)', color: 'var(--cth-command-ink)', background: 'transparent' }
        }
      >
        <Download size={13} />
        Export Report
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(20, 15, 43, 0.45)' }}>
          <div className="w-full max-w-2xl border p-5 shadow-2xl" style={{ background: 'var(--cth-command-panel)', borderColor: 'var(--cth-command-border)', borderRadius: 4 }}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="cth-kicker m-0">Brand Audit</p>
                <h2 className="m-0 mt-1 text-xl font-bold" style={{ color: 'var(--cth-command-ink)' }}>Export Report</h2>
                <p className="m-0 mt-1 text-xs" style={{ color: 'var(--cth-command-muted)' }}>Choose how you want to use this report. Nothing exports until you pick an option.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ borderRadius: 4, border: '1px solid var(--cth-command-border)', color: 'var(--cth-command-ink)', background: 'transparent', padding: '6px 10px' }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setMode('print')}
                className="border p-4 text-left"
                style={{ borderRadius: 4, borderColor: mode === 'print' ? 'var(--cth-command-crimson)' : 'var(--cth-command-border)', background: 'var(--cth-command-panel)' }}
              >
                <Eye size={18} style={{ color: 'var(--cth-command-crimson)' }} />
                <p className="m-0 mt-2 text-sm font-bold" style={{ color: 'var(--cth-command-ink)' }}>Preview / Print</p>
                <p className="m-0 mt-1 text-xs" style={{ color: 'var(--cth-command-muted)' }}>Open the PDF in a new tab.</p>
              </button>

              <button
                type="button"
                onClick={() => setMode('download')}
                className="border p-4 text-left"
                style={{ borderRadius: 4, borderColor: mode === 'download' ? 'var(--cth-command-crimson)' : 'var(--cth-command-border)', background: 'var(--cth-command-panel)' }}
              >
                <Download size={18} style={{ color: 'var(--cth-command-crimson)' }} />
                <p className="m-0 mt-2 text-sm font-bold" style={{ color: 'var(--cth-command-ink)' }}>Download PDF</p>
                <p className="m-0 mt-1 text-xs" style={{ color: 'var(--cth-command-muted)' }}>Download the report.</p>
              </button>

              <div className="border p-4" style={{ borderRadius: 4, borderColor: 'var(--cth-command-border)', background: 'var(--cth-command-panel-soft)' }}>
                <FileText size={18} style={{ color: 'var(--cth-command-crimson)' }} />
                <p className="m-0 mt-2 text-sm font-bold" style={{ color: 'var(--cth-command-ink)' }}>Saved to Workspace Library</p>
                <p className="m-0 mt-1 text-xs" style={{ color: 'var(--cth-command-muted)' }}>A generated copy is saved to documents.</p>
              </div>
            </div>

            {error ? (
              <div className="mt-4 border p-3 text-sm" style={{ borderRadius: 4, borderColor: 'var(--cth-command-crimson)', color: 'var(--cth-command-crimson)' }}>
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => runExport(mode)}
              disabled={busy}
              className="mt-5 w-full justify-center inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold disabled:opacity-50"
              style={{ borderRadius: 4, backgroundColor: 'var(--cth-command-purple)', color: 'var(--cth-command-gold)', border: 'none' }}
            >
              {busy ? 'Exporting…' : mode === 'print' ? 'Preview / Print' : 'Generate Report'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
