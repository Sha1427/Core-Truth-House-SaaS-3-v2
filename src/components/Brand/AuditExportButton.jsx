import React, { useState } from 'react';
import { Download, Eye, FileText, X } from 'lucide-react';
import { normalizeBaseUrl } from '../../lib/apiClient';

function resolveApiBase() {
  return normalizeBaseUrl(
    import.meta?.env?.VITE_BACKEND_URL ||
    import.meta?.env?.VITE_API_BASE_URL ||
    'https://api.coretruthhouse.com'
  );
}

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
      const base = resolveApiBase();

      const startUrl = `${base}/api/export/brand-audit-styled?audit_id=${encodeURIComponent(auditId)}`;
      const startRes = await fetch(startUrl, { method: 'GET', credentials: 'include' });

      if (!startRes.ok) throw new Error('Export job failed to start.');

      const startData = await startRes.json();
      const jobId = startData?.job_id;
      if (!jobId) throw new Error('Export job did not return a job id.');

      let statusData = null;

      for (let attempt = 0; attempt < 90; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const statusUrl = `${base}/api/export/brand-audit/status?job_id=${encodeURIComponent(jobId)}`;
        const statusRes = await fetch(statusUrl, { method: 'GET', credentials: 'include' });

        if (!statusRes.ok) throw new Error('Export status check failed.');

        statusData = await statusRes.json();

        if (statusData?.status === 'error') {
          throw new Error(statusData?.error || 'PDF export failed.');
        }

        if (statusData?.status === 'ready' && statusData?.download_url) break;
      }

      if (!statusData?.download_url) {
        throw new Error(`PDF was not ready. Last status: ${statusData?.status || 'unknown'}`);
      }

      const downloadUrl = `${base}/api/export/brand-audit/download/${encodeURIComponent(jobId)}`;
      const pdfRes = await fetch(downloadUrl, { method: 'GET', credentials: 'include' });

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
        className={isPrimary ? 'cth-button-primary inline-flex items-center gap-2' : 'cth-button-secondary inline-flex items-center gap-2'}
      >
        <Download size={13} />
        Export Report
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(20, 15, 43, 0.45)' }}>
          <div className="w-full max-w-2xl rounded-3xl border p-5 shadow-2xl" style={{ background: 'var(--cth-admin-panel)', borderColor: 'var(--cth-admin-border)' }}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="cth-kicker m-0">Brand Audit</p>
                <h2 className="m-0 mt-1 text-xl font-bold cth-heading">Export Report</h2>
                <p className="m-0 mt-1 text-xs cth-muted">Choose how you want to use this report. Nothing exports until you pick an option.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="cth-button-secondary px-3 py-2">
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
                <p className="m-0 mt-1 text-xs cth-muted">Open the PDF in a new tab.</p>
              </button>

              <button
                type="button"
                onClick={() => setMode('download')}
                className="rounded-2xl border p-4 text-left"
                style={{ borderColor: mode === 'download' ? 'var(--cth-admin-accent)' : 'var(--cth-admin-border)', background: 'var(--cth-admin-panel)' }}
              >
                <Download size={18} className="cth-text-accent" />
                <p className="m-0 mt-2 text-sm font-bold cth-heading">Download PDF</p>
                <p className="m-0 mt-1 text-xs cth-muted">Download the report.</p>
              </button>

              <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--cth-admin-border)', background: 'var(--cth-admin-panel-alt)' }}>
                <FileText size={18} className="cth-text-accent" />
                <p className="m-0 mt-2 text-sm font-bold cth-heading">Saved to Workspace Library</p>
                <p className="m-0 mt-1 text-xs cth-muted">A generated copy is saved to documents.</p>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border p-3 text-sm cth-text-danger" style={{ borderColor: 'var(--cth-danger)' }}>
                {error}
              </div>
            ) : null}

            <button type="button" onClick={() => runExport(mode)} disabled={busy} className="cth-button-primary mt-5 w-full justify-center">
              {busy ? 'Exporting…' : mode === 'print' ? 'Preview / Print' : 'Generate Report'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
