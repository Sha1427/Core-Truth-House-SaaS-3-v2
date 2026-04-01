import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useColors } from '../context/ThemeContext';
import { 
  ChevronDown, 
  Plus, 
  Check, 
  Settings, 
  Trash2, 
  X,
  Layers,
  Loader2
} from 'lucide-react';

export function WorkspaceSelector() {
  const colors = useColors();
  const { 
    workspaces, 
    activeWorkspace, 
    switchWorkspace, 
    createWorkspace,
    deleteWorkspace,
    isLoading 
  } = useWorkspace();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceBrand, setNewWorkspaceBrand] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    setIsCreating(true);
    setError(null);
    
    const result = await createWorkspace({
      name: newWorkspaceName,
      brand_name: newWorkspaceBrand || newWorkspaceName,
    });
    
    if (result.success) {
      setShowCreateModal(false);
      setNewWorkspaceName('');
      setNewWorkspaceBrand('');
    } else {
      setError(result.error);
    }
    
    setIsCreating(false);
  };

  const handleDeleteWorkspace = async (e, workspaceId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this workspace and all its data? This cannot be undone.')) return;
    
    await deleteWorkspace(workspaceId);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '8px 12px' }}>
        <Loader2 size={16} style={{ color: colors.textMuted, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <>
      {/* Workspace Selector Button */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <button
          data-testid="workspace-selector"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${colors.tuscany}22`,
            background: `${colors.tuscany}11`,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: activeWorkspace?.color_primary || colors.cinnabar,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={16} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeWorkspace?.name || 'Select Workspace'}
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>
              {activeWorkspace?.brand_name || 'No brand'}
            </div>
          </div>
          <ChevronDown
            size={16}
            style={{
              color: colors.textMuted,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 998,
              }}
              onClick={() => setIsOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 4,
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 8,
                zIndex: 999,
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              {/* Workspace List */}
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  data-testid={`workspace-${ws.id}`}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: ws.id === activeWorkspace?.id ? `${colors.cinnabar}22` : 'transparent',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: ws.color_primary || colors.cinnabar,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Layers size={14} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: ws.id === activeWorkspace?.id ? 600 : 400,
                        color: colors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ws.name}
                    </div>
                  </div>
                  {ws.id === activeWorkspace?.id && (
                    <Check size={14} style={{ color: colors.cinnabar }} />
                  )}
                  {!ws.is_default && (
                    <button
                      onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                      style={{
                        padding: 4,
                        borderRadius: 4,
                        border: 'none',
                        background: 'transparent',
                        color: colors.textMuted,
                        cursor: 'pointer',
                        opacity: 0.5,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: colors.border,
                  margin: '8px 0',
                }}
              />

              {/* Create New Workspace */}
              <button
                data-testid="create-workspace-btn"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: colors.cinnabar,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Plus size={16} />
                Create New Workspace
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            data-testid="create-workspace-modal"
            style={{
              background: colors.cardBg,
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: colors.textPrimary }}>
                New Workspace
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: colors.textMuted,
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
                  Workspace Name *
                </label>
                <input
                  data-testid="workspace-name-input"
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g., My Agency, Side Project"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.tuscany}22`,
                    background: colors.darkest,
                    color: colors.textPrimary,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
                  Brand Name (optional)
                </label>
                <input
                  data-testid="workspace-brand-input"
                  type="text"
                  value={newWorkspaceBrand}
                  onChange={(e) => setNewWorkspaceBrand(e.target.value)}
                  placeholder="e.g., Acme Inc."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px solid ${colors.tuscany}22`,
                    background: colors.darkest,
                    color: colors.textPrimary,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                data-testid="create-workspace-submit"
                onClick={handleCreateWorkspace}
                disabled={!newWorkspaceName.trim() || isCreating}
                style={{
                  marginTop: 8,
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: !newWorkspaceName.trim()
                    ? colors.textMuted
                    : `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !newWorkspaceName.trim() || isCreating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isCreating && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {isCreating ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
}
