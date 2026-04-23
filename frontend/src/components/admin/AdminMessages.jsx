import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';

export function AdminMessages({ messages, selectedMessage, setSelectedMessage, selectedMessages, setSelectedMessages, deleteMessage, deleteSelectedMessages, markMessageRead }) {
  const toggleSelectMessage = (msgId) => {
    const next = new Set(selectedMessages);
    if (next.has(msgId)) next.delete(msgId);
    else next.add(msgId);
    setSelectedMessages(next);
  };

  return (
    <div className="space-y-4">
      {messages.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox"
                checked={selectedMessages.size === messages.length && messages.length > 0}
                onChange={() => {
                  if (selectedMessages.size === messages.length) setSelectedMessages(new Set());
                  else setSelectedMessages(new Set(messages.map(m => m.id)));
                }}
                className="rounded" />
              Select all
            </label>
            {selectedMessages.size > 0 && <span className="text-xs text-gray-500">{selectedMessages.size} selected</span>}
          </div>
          {selectedMessages.size > 0 && (
            <button data-testid="delete-selected-messages" onClick={deleteSelectedMessages}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
              <Trash2 size={14} /> Delete ({selectedMessages.size})
            </button>
          )}
        </div>
      )}
      {messages.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
          <p className="text-sm text-gray-400">Contact form submissions will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} data-testid={`message-${msg.id}`}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedMessages.has(msg.id)
                  ? 'bg-[var(--cth-admin-ink)] border-[var(--cth-admin-accent)]/50 ring-1 ring-[var(--cth-admin-accent)]/30'
                  : msg.status === 'new'
                    ? 'bg-[var(--cth-admin-ink)] border-[var(--cth-admin-accent)]/30 hover:border-[var(--cth-admin-accent)]/50'
                    : 'bg-[var(--cth-admin-ink)] border-white/10 hover:border-white/20'
              }`}
              onClick={() => { setSelectedMessage(selectedMessage?.id === msg.id ? null : msg); markMessageRead(msg.id); }}>
              <div className="flex items-start gap-3">
                <div onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedMessages.has(msg.id)}
                    onChange={() => toggleSelectMessage(msg.id)} className="rounded mt-1"
                    data-testid={`select-message-${msg.id}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{msg.name}</span>
                    {msg.status === 'new' && <span className="px-2 py-0.5 bg-[var(--cth-admin-accent)]/20 text-[var(--cth-admin-accent)] text-xs rounded-full">New</span>}
                    <span className="text-xs text-gray-500 ml-auto">{new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-1">{msg.email}</div>
                  <div className="text-xs text-[var(--cth-admin-accent)] mb-1 font-medium">{msg.subject}</div>
                  {selectedMessage?.id === msg.id
                    ? <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                    : <p className="text-sm text-gray-300 truncate">{msg.message}</p>}
                </div>
                <button data-testid={`delete-message-${msg.id}`}
                  onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
