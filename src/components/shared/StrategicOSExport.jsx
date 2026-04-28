import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Loader2, X, CheckCircle } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL;

const STEPS = [
  { number: 1, key: 'brand_analysis', label: 'Strategic Brand and Market Analysis' },
  { number: 2, key: 'audience_psychology', label: 'Audience Psychology and Messaging Intelligence' },
  { number: 3, key: 'differentiation', label: 'Authority Positioning and Differentiation System' },
  { number: 4, key: 'competitor_analysis', label: 'Competitor Content Breakdown and Strategic White Space' },
  { number: 5, key: 'content_pillars', label: 'Conversion-Oriented Content Pillars' },
  { number: 6, key: 'platform_strategy', label: 'Platform-Specific Adaptation Engine' },
  { number: 7, key: 'content_plan', label: '30-Day Strategic Content Plan' },
  { number: 8, key: 'hero_content', label: 'Hero Content Builder' },
  { number: 9, key: 'monetization', label: 'Monetization and Audience Conversion Strategy' },
];

function isStepComplete(completedSteps, step) {
  if (!completedSteps) return false;
  return Boolean(
    completedSteps[step.number] ||
    completedSteps[String(step.number)] ||
    completedSteps[step.key]
  );
}

function getCompletedCount(completedSteps) {
  return STEPS.filter((step) => isStepComplete(completedSteps, step)).length;
}

function resolveUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${API}${url}`;
}

function OptionCard({ icon, title, text, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border p-4 text-left transition hover:opacity-90"
      style={{
        borderColor: active ? 'var(--cth-admin-accent)' : 'var(--cth-admin-border)',
        background: active ? 'color-mix(in srgb, var(--cth-admin-accent) 8%, var(--cth-admin-panel))' : 'var(--cth-admin-panel)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: 'var(--cth-admin-panel-alt)',
            color: 'var(--cth-admin-accent)',
          }}
        >
          {icon}
        </div>
        <div>
          <p className="m-0 text-sm font-bold cth-heading">{title}</p>
          <p className="m-0 mt-1 text-xs leading-relaxed cth-muted">{text}</p>
        </div>
      </div>
    </button>
  );
}

export default function StrategicOSExport({ onClose, completedSteps = {}, inline = false }) {
  const { currentWorkspace, activeWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || activeWorkspace?.id || '';

  const [selected, setSelected] = useState(STEPS.map((step) => step.number));
  const [mode, setMode] = useState('download');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  const completedCount = useMemo(() => getCompletedCount(completedSteps), [completedSteps]);
  const canExport = selected.length > 0 && status !== 'generating';

  useEffect(() => {
    if (!jobId || status !== 'generating') return undefined;

    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/export/strategic-os/status?job_id=${jobId}`);
        setProgress(res.data?.progress || 0);

        if (res.data?.status === 'ready') {
          clearInterval(timer);
          setStatus('ready');
          setDownloadUrl(resolveUrl(res.data?.download_url));
          setProgress(100);
        }

        if (res.data?.status === 'error') {
          clearInterval(timer);
          setStatus('error');
          setError(res.data?.error || 'Export failed.');
        }
      } catch {
        clearInterval(timer);
        setStatus('error');
        setError('Connection lost while generating the report.');
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [jobId, status]);

  function stepParams() {
    return new URLSearchParams({
      steps: selected.join(','),
      workspace_id: workspaceId || '',
    });
  }

  async function handleExport() {
    if (!canExport) return;

    setStatus('generating');
    setProgress(5);
    setError('');
    setDownloadUrl('');

    try {
      const params = stepParams();

      if (mode === 'print') {
        window.open(`${API}/api/export/strategic-os/print-preview?${params}`, '_blank');
        setStatus('idle');
        return;
      }

      const res = await axios.get(`${API}/api/export/strategic-os-styled?${params}`);
      if (!res.data?.job_id) throw new Error('Export job failed to start.');

      setJobId(res.data.job_id);
      setProgress(10);
    } catch (err) {
      setStatus('error');
      setError(err?.response?.data?.detail || err?.message || 'Export failed.');
    }
  }

  const content = (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="cth-kicker m-0">Strategic OS</p>
          <h2 className="m-0 mt-1 text-xl font-bold cth-heading">Export Report</h2>
          <p className="m-0 mt-1 text-xs cth-muted">
            {completedCount} of 9 steps complete. Choose what to include, then preview or download.
          </p>
        </div>

        {onClose ? (
          <button type="button" onClick={onClose} className="cth-button-secondary px-3 py-2">
            <X size={15} />
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <OptionCard
          icon={<Eye size={18} />}
          title="Preview / Print"
          text="Open a print-ready report in a new tab."
          active={mode === 'print'}
          onClick={() => setMode('print')}
        />
        <OptionCard
          icon={<Download size={18} />}
          title="Download PDF"
          text="Generate the polished report PDF."
          active={mode === 'download'}
          onClick={() => setMode('download')}
        />
        <OptionCard
          icon={<FileText size={18} />}
          title="Saved to Workspace Library"
          text="A generated copy is saved with your workspace documents."
          active={false}
          onClick={() => setMode('download')}
        />
      </div>

      <div className="cth-card-muted rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="cth-kicker m-0">Steps to include</p>
          <div className="flex gap-2 text-xs">
            <button type="button" className="cth-button-secondary px-3 py-1" onClick={() => setSelected(STEPS.map((s) => s.number))}>
              All
            </button>
            <button
              type="button"
              className="cth-button-secondary px-3 py-1"
              onClick={() => setSelected(STEPS.filter((s) => isStepComplete(completedSteps, s)).map((s) => s.number))}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {STEPS.map((step) => {
            const checked = selected.includes(step.number);
            return (
              <label
                key={step.number}
                className="flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs"
                style={{
                  borderColor: checked ? 'var(--cth-admin-accent)' : 'var(--cth-admin-border)',
                  background: checked ? 'color-mix(in srgb, var(--cth-admin-accent) 7%, var(--cth-admin-panel))' : 'var(--cth-admin-panel)',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, step.number].sort((a, b) => a - b)
                        : current.filter((item) => item !== step.number)
                    );
                  }}
                />
                <span className="cth-heading">Step {step.number}</span>
                <span className="cth-muted">{step.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {status === 'generating' ? (
        <div className="cth-card-muted rounded-2xl p-4 text-center">
          <Loader2 className="mx-auto animate-spin cth-text-accent" size={24} />
          <p className="m-0 mt-3 text-sm font-semibold cth-heading">Generating report...</p>
          <p className="m-0 mt-1 text-xs cth-muted">{progress}% complete</p>
        </div>
      ) : null}

      {status === 'ready' ? (
        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--cth-success)', background: 'color-mix(in srgb, var(--cth-success) 8%, var(--cth-admin-panel))' }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="cth-text-success" />
            <p className="m-0 text-sm font-semibold cth-heading">Your report is ready.</p>
          </div>
          <p className="m-0 mt-1 text-xs cth-muted">A copy has been saved to your Workspace Library.</p>
          <a href={downloadUrl} download="strategic-os-report.pdf" className="cth-button-primary mt-4 inline-flex items-center gap-2">
            <Download size={14} />
            Download PDF
          </a>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="rounded-2xl border p-4 text-sm cth-text-danger" style={{ borderColor: 'var(--cth-danger)' }}>
          {error}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!canExport}
        onClick={handleExport}
        className="cth-button-primary w-full justify-center"
      >
        {mode === 'print' ? 'Preview / Print' : 'Generate Report'}
      </button>
    </div>
  );

  if (inline) return content;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(20, 15, 43, 0.45)' }}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border p-5 shadow-2xl"
        style={{
          background: 'var(--cth-admin-panel)',
          borderColor: 'var(--cth-admin-border)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {content}
      </div>
    </div>
  );
}

export function StrategicOSExportButton({ completedSteps = {}, variant = 'secondary', label = 'Export Report' }) {
  const [open, setOpen] = useState(false);
  const completedCount = getCompletedCount(completedSteps);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={variant === 'primary' ? 'cth-button-primary inline-flex items-center gap-2' : 'cth-button-secondary inline-flex items-center gap-2'}
        data-testid="strategic-os-export-btn"
      >
        <Download size={13} />
        {label}
        {completedCount > 0 ? (
          <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'color-mix(in srgb, var(--cth-admin-accent) 15%, transparent)', color: 'var(--cth-admin-accent)' }}>
            {completedCount}/9
          </span>
        ) : null}
      </button>

      {open ? <StrategicOSExport completedSteps={completedSteps} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
