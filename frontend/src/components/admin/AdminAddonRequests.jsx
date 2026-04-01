import React, { useMemo, useState } from 'react';
import { Package, Clock, CheckCircle, X, MessageSquare, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL;

const STATUS_STYLES = {
  pending: 'bg-gray-500/20 text-gray-300',
  under_review: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  denied: 'bg-red-500/20 text-red-400',
  completed: 'bg-blue-500/20 text-blue-400',
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {(status || 'pending').replace('_', ' ')}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Package className="w-12 h-12 mx-auto text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">No Requests Yet</h3>
      <p className="text-sm text-gray-400">Client add-on requests will appear here</p>
    </div>
  );
}

export function AdminAddonRequests({
  addonRequests = [],
  updateAddonStatus,
  adminId,
}) {
  const [notesOpen, setNotesOpen] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [rowLoading, setRowLoading] = useState({});
  const [error, setError] = useState('');

  const pendingCount = useMemo(
    () => addonRequests.filter((r) => r.status === 'pending').length,
    [addonRequests]
  );

  const reviewCount = useMemo(
    () => addonRequests.filter((r) => r.status === 'under_review').length,
    [addonRequests]
  );

  const setLoadingFor = (id, value) => {
    setRowLoading((prev) => ({ ...prev, [id]: value }));
  };

  const getRequestById = (requestId) =>
    addonRequests.find((r) => r.id === requestId);

  const closeNotes = () => {
    setNotesOpen(null);
    setNoteText('');
  };

  const saveStatus = async (requestId, nextStatus, notesOverride) => {
    setError('');
    setLoadingFor(requestId, true);

    try {
      const current = getRequestById(requestId);
      const statusToSend = nextStatus || current?.status || 'pending';
      const notesToSend =
        typeof notesOverride === 'string' ? notesOverride : noteText;

      await axios.put(
        `${API}/api/admin/addon-requests/${requestId}/status`,
        null,
        {
          params: {
            status: statusToSend,
            notes: notesToSend,
            admin_id: adminId,
          },
        }
      );

      if (typeof updateAddonStatus === 'function') {
        await updateAddonStatus(requestId, statusToSend);
      }

      if (notesOpen === requestId) {
        closeNotes();
      }
    } catch (err) {
      setError(
        err?.response?.data?.detail || 'Failed to update add-on request.'
      );
    } finally {
      setLoadingFor(requestId, false);
    }
  };

  const saveNotesOnly = async (requestId) => {
    const current = getRequestById(requestId);
    await saveStatus(requestId, current?.status || 'pending', noteText);
  };

  const openNotesEditor = (req) => {
    setError('');
    setNotesOpen((prev) => (prev === req.id ? null : req.id));
    setNoteText(req.admin_notes || '');
  };

  return (
    <div className="space-y-4" data-testid="addon-requests-tab">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Client Add-on Requests</h3>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 bg-orange-500/15 text-orange-400 text-xs font-semibold rounded-full">
              {pendingCount} Pending
            </span>
          )}
          {reviewCount > 0 && (
            <span className="px-2.5 py-1 bg-yellow-500/15 text-yellow-400 text-xs font-semibold rounded-full">
              {reviewCount} In Review
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {addonRequests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {addonRequests.map((req) => {
            const isBusy = !!rowLoading[req.id];

            return (
              <div
                key={req.id}
                className="p-5 rounded-xl bg-[#2b1040] border border-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-white font-medium">{req.title}</span>
                      <StatusBadge status={req.status} />
                      <span className="px-2 py-0.5 bg-white/5 text-gray-500 rounded-full text-xs">
                        {req.category}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-2">{req.description}</p>

                    <div className="text-xs text-gray-500">
                      From: {req.user_id?.slice(0, 12)}... ·{' '}
                      {req.created_at
                        ? new Date(req.created_at).toLocaleDateString()
                        : 'Unknown date'}
                    </div>

                    {req.admin_notes && (
                      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="text-xs text-[#e04e35] font-semibold mb-1 flex items-center gap-1">
                          <MessageSquare size={10} /> Admin Notes
                        </div>
                        <p className="text-xs text-gray-400 whitespace-pre-wrap">
                          {req.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {(req.status === 'pending' || req.status === 'under_review') && (
                      <button
                        onClick={() => openNotesEditor(req)}
                        disabled={isBusy}
                        className="p-2 rounded-lg text-[#c7a09d] hover:bg-white/5 transition-colors disabled:opacity-50"
                        title="Add Notes"
                      >
                        <MessageSquare size={16} />
                      </button>
                    )}

                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => saveStatus(req.id, 'under_review', req.admin_notes || '')}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-50"
                          title="Review"
                        >
                          {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                        </button>
                        <button
                          onClick={() => saveStatus(req.id, 'approved', req.admin_notes || '')}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => saveStatus(req.id, 'denied', req.admin_notes || '')}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          title="Deny"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}

                    {req.status === 'under_review' && (
                      <>
                        <button
                          onClick={() => saveStatus(req.id, 'approved', req.admin_notes || '')}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => saveStatus(req.id, 'denied', req.admin_notes || '')}
                          disabled={isBusy}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          title="Deny"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}

                    {req.status === 'approved' && (
                      <button
                        onClick={() => saveStatus(req.id, 'completed', req.admin_notes || '')}
                        disabled={isBusy}
                        className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                        title="Mark Complete"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {notesOpen === req.id && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add notes for the client..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#e04e35]/50 resize-none"
                    />

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => saveNotesOnly(req.id)}
                        disabled={isBusy}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#e04e35] rounded-lg text-white text-xs font-medium disabled:opacity-50"
                      >
                        {isBusy ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        Save Notes
                      </button>

                      <button
                        onClick={closeNotes}
                        disabled={isBusy}
                        className="px-3 py-1.5 bg-white/5 rounded-lg text-gray-400 text-xs disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
