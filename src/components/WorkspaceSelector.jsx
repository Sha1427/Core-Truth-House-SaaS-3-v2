import React, { useMemo, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import {
  ChevronDown,
  Check,
  Layers,
  Loader2,
} from "lucide-react";

export function WorkspaceSelector() {
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
            color: "rgba(248, 244, 242, 0.72)",
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
            borderRadius: 12,
            border: "1px solid rgba(248, 244, 242, 0.14)",
            background: "rgba(248, 244, 242, 0.08)",
            cursor: "pointer",
            textAlign: "left",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: activeWorkspace?.color_primary || "var(--cth-admin-accent)",
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
                fontWeight: 700,
                color: "var(--cth-admin-panel)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeWorkspace?.name || "Select Workspace"}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(248, 244, 242, 0.62)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeWorkspace?.plan
                ? `Plan: ${String(activeWorkspace.plan).toUpperCase()}`
                : activeWorkspace?.brand_name || "Workspace context"}
            </div>
          </div>

          <ChevronDown
            size={16}
            style={{
              color: "rgba(248, 244, 242, 0.72)",
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
                marginTop: 6,
                background: "linear-gradient(180deg, var(--cth-surface-raised), var(--cth-surface-night))",
                border: "1px solid rgba(248, 244, 242, 0.14)",
                borderRadius: 14,
                padding: 8,
                zIndex: 999,
                boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
                maxHeight: 300,
                overflowY: "auto",
              }}
            >
              {sortedWorkspaces.length === 0 ? (
                <div
                  style={{
                    padding: "12px 10px",
                    borderRadius: 8,
                    color: "rgba(248, 244, 242, 0.62)",
                    fontSize: 12,
                  }}
                >
                  No workspaces available.
                </div>
              ) : (
                sortedWorkspaces.map((ws) => {
                  const isActive =
                    ws.id === activeWorkspace?.id || ws.id === activeWorkspaceId;

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
                        borderRadius: 10,
                        cursor: "pointer",
                        background: isActive
                          ? "rgba(224, 78, 53, 0.14)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(224, 78, 53, 0.22)"
                          : "1px solid transparent",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: ws.color_primary || "var(--cth-admin-accent)",
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
                            fontWeight: isActive ? 700 : 500,
                            color: "var(--cth-admin-panel)",
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
                            color: "rgba(248, 244, 242, 0.60)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ws.role
                            ? `Role: ${String(ws.role).toUpperCase()}`
                            : "Workspace member"}
                        </div>
                      </div>

                      {isActive && (
                        <Check
                          size={14}
                          style={{ color: "var(--cth-admin-accent)" }}
                        />
                      )}
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
