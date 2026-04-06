import React, { useMemo, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import { useColors } from "../context/ThemeContext";
import {
  ChevronDown,
  Check,
  X,
  Layers,
  Loader2,
} from "lucide-react";

export function WorkspaceSelector() {
  const colors = useColors();
  const {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    selectWorkspace,
    loading,
    initialized,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);

  const sortedWorkspaces = useMemo(() => {
    if (!Array.isArray(workspaces)) return [];
    return [...workspaces].sort((a, b) => {
      if (a?.id === activeWorkspaceId) return -1;
      if (b?.id === activeWorkspaceId) return 1;
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });
  }, [workspaces, activeWorkspaceId]);

  const handleSelectWorkspace = (workspaceId) => {
    if (!workspaceId) return;
    selectWorkspace(workspaceId);
    setIsOpen(false);
  };

  if (loading && !initialized) {
    return (
      <div style={{ padding: "8px 12px" }}>
        <Loader2
          size={16}
          style={{
            color: colors.textMuted,
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <button
          data-testid="workspace-selector"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${colors.tuscany}22`,
            background: `${colors.tuscany}11`,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: activeWorkspace?.color_primary || colors.cinnabar,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeWorkspace?.name || "Select Workspace"}
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted }}>
              {activeWorkspace?.plan
                ? `Plan: ${String(activeWorkspace.plan).toUpperCase()}`
                : activeWorkspace?.brand_name || "Workspace context"}
            </div>
          </div>

          <ChevronDown
            size={16}
            style={{
              color: colors.textMuted,
              transform: isOpen ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>

        {isOpen && (
          <>
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 998,
              }}
              onClick={() => setIsOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 8,
                zIndex: 999,
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              {sortedWorkspaces.length === 0 ? (
                <div
                  style={{
                    padding: "12px 10px",
                    borderRadius: 8,
                    color: colors.textMuted,
                    fontSize: 12,
                  }}
                >
                  No workspaces available.
                </div>
              ) : (
                sortedWorkspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspace?.id || ws.id === activeWorkspaceId;

                  return (
                    <div
                      key={ws.id}
                      data-testid={`workspace-${ws.id}`}
                      onClick={() => handleSelectWorkspace(ws.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px",
                        borderRadius: 8,
                        cursor: "pointer",
                        background: isActive ? `${colors.cinnabar}22` : "transparent",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: ws.color_primary || colors.cinnabar,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Layers size={14} color="white" />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: isActive ? 600 : 400,
                            color: colors.textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ws.name || "Workspace"}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: colors.textMuted,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ws.role ? `Role: ${String(ws.role).toUpperCase()}` : "Workspace member"}
                        </div>
                      </div>

                      {isActive && <Check size={14} style={{ color: colors.cinnabar }} />}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

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

export default WorkspaceSelector;
