import React, { useState, useEffect } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { 
  Rocket, 
  Plus, 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const PHASE_COLORS = {
  'pre-launch': '#AF0024',
  'launch': '#e04e35',
  'post-launch': '#9B1B30',
};

const DEFAULT_PHASES = [
  {
    id: 'pre-launch',
    name: 'Pre-Launch',
    description: 'Build anticipation and prepare your audience',
    tasks: [
      { id: '1', title: 'Define launch goals and success metrics', completed: false },
      { id: '2', title: 'Create launch landing page', completed: false },
      { id: '3', title: 'Build email waitlist', completed: false },
      { id: '4', title: 'Prepare social media content calendar', completed: false },
      { id: '5', title: 'Create teaser content', completed: false },
      { id: '6', title: 'Reach out to potential partners/affiliates', completed: false },
    ],
  },
  {
    id: 'launch',
    name: 'Launch Day',
    description: 'Execute your launch strategy',
    tasks: [
      { id: '7', title: 'Send launch email to list', completed: false },
      { id: '8', title: 'Post launch announcement on all platforms', completed: false },
      { id: '9', title: 'Go live with sales page', completed: false },
      { id: '10', title: 'Monitor and respond to comments/DMs', completed: false },
      { id: '11', title: 'Track real-time metrics', completed: false },
    ],
  },
  {
    id: 'post-launch',
    name: 'Post-Launch',
    description: 'Sustain momentum and optimize',
    tasks: [
      { id: '12', title: 'Send follow-up emails to non-buyers', completed: false },
      { id: '13', title: 'Collect and share testimonials', completed: false },
      { id: '14', title: 'Analyze launch performance', completed: false },
      { id: '15', title: 'Create case study from results', completed: false },
      { id: '16', title: 'Plan evergreen funnel', completed: false },
    ],
  },
];

function LaunchPlannerContent() {
  const colors = useColors();
  const [launches, setLaunches] = useState([]);
  const [activeLaunch, setActiveLaunch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewLaunchModal, setShowNewLaunchModal] = useState(false);
  const [newLaunchName, setNewLaunchName] = useState('');
  const [newLaunchDate, setNewLaunchDate] = useState('');
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    loadLaunches();
  }, []);

  const loadLaunches = async () => {
    try {
      const response = await axios.get(`${API}/launches`);
      const data = response.data || [];
      setLaunches(data);
      if (data.length > 0 && !activeLaunch) {
        setActiveLaunch(data[0]);
      }
    } catch (error) {
      console.error('Failed to load launches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLaunch = async () => {
    if (!newLaunchName.trim()) return;

    const newLaunch = {
      name: newLaunchName,
      launch_date: newLaunchDate || null,
      phases: DEFAULT_PHASES,
    };

    try {
      const response = await axios.post(`${API}/launches`, newLaunch);
      const created = response.data;
      setLaunches([...launches, created]);
      setActiveLaunch(created);
      setShowNewLaunchModal(false);
      setNewLaunchName('');
      setNewLaunchDate('');
    } catch (error) {
      console.error('Failed to create launch:', error);
    }
  };

  const handleToggleTask = async (phaseId, taskId) => {
    if (!activeLaunch) return;

    const updatedPhases = activeLaunch.phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, completed: !task.completed };
            }
            return task;
          }),
        };
      }
      return phase;
    });

    const updatedLaunch = { ...activeLaunch, phases: updatedPhases };
    setActiveLaunch(updatedLaunch);

    try {
      await axios.put(`${API}/launches/${activeLaunch.id}`, {
        name: activeLaunch.name,
        launch_date: activeLaunch.launch_date,
        phases: updatedPhases,
      });
      setLaunches(launches.map(l => l.id === activeLaunch.id ? updatedLaunch : l));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleAddTask = async (phaseId) => {
    if (!activeLaunch) return;

    const taskTitle = prompt('Enter new task:');
    if (!taskTitle?.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: taskTitle,
      completed: false,
    };

    const updatedPhases = activeLaunch.phases.map(phase => {
      if (phase.id === phaseId) {
        return { ...phase, tasks: [...phase.tasks, newTask] };
      }
      return phase;
    });

    const updatedLaunch = { ...activeLaunch, phases: updatedPhases };
    setActiveLaunch(updatedLaunch);

    try {
      await axios.put(`${API}/launches/${activeLaunch.id}`, {
        name: activeLaunch.name,
        launch_date: activeLaunch.launch_date,
        phases: updatedPhases,
      });
      setLaunches(launches.map(l => l.id === activeLaunch.id ? updatedLaunch : l));
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleDeleteLaunch = async (launchId) => {
    if (!window.confirm('Are you sure you want to delete this launch?')) return;

    try {
      await axios.delete(`${API}/launches/${launchId}`);
      const remaining = launches.filter(l => l.id !== launchId);
      setLaunches(remaining);
      if (activeLaunch?.id === launchId) {
        setActiveLaunch(remaining[0] || null);
      }
    } catch (error) {
      console.error('Failed to delete launch:', error);
    }
  };

  const handleGenerateContent = async () => {
    if (!activeLaunch) return;
    setGeneratingContent(true);

    try {
      const response = await axios.post(`${API}/launches/${activeLaunch.id}/generate-content`);
      alert('Launch content ideas generated! Check your Content Studio.');
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setGeneratingContent(false);
    }
  };

  const getProgress = () => {
    if (!activeLaunch) return { completed: 0, total: 0, percentage: 0 };
    const allTasks = activeLaunch.phases.flatMap(p => p.tasks);
    const completed = allTasks.filter(t => t.completed).length;
    return {
      completed,
      total: allTasks.length,
      percentage: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
    };
  };

  const progress = getProgress();

  return (
    <DashboardLayout>
      <TopBar
        title="Launch Planner"
        subtitle="Plan and execute your product launches"
      />

      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Loader2 size={32} style={{ color: colors.cinnabar, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : launches.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}22`,
              borderRadius: 16,
            }}
          >
            <Rocket size={48} style={{ color: colors.textMuted, marginBottom: 16 }} />
            <div style={{ fontSize: 18, color: colors.textPrimary, marginBottom: 8 }}>
              No launches planned yet
            </div>
            <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>
              Create your first launch plan to start organizing your next big release
            </div>
            <button
              onClick={() => setShowNewLaunchModal(true)}
              data-testid="create-first-launch"
              style={{
                padding: '12px 24px',
                borderRadius: 10,
                border: 'none',
                background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Plan Your First Launch
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
            {/* Launch List Sidebar */}
            <div>
              <div
                style={{
                  background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.06))`,
                  border: `1px solid ${colors.tuscany}22`,
                  borderRadius: 16,
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: colors.tuscany, fontWeight: 600 }}>
                    Your Launches
                  </span>
                  <button
                    onClick={() => setShowNewLaunchModal(true)}
                    data-testid="new-launch-btn"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: colors.cinnabar,
                      color: 'white',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Plus size={12} />
                    New
                  </button>
                </div>

                {launches.map((launch) => (
                  <div
                    key={launch.id}
                    data-testid={`launch-${launch.id}`}
                    onClick={() => setActiveLaunch(launch)}
                    style={{
                      padding: '12px',
                      borderRadius: 10,
                      marginBottom: 8,
                      cursor: 'pointer',
                      background: activeLaunch?.id === launch.id
                        ? `linear-gradient(90deg, rgba(175, 0, 36, 0.2), rgba(224, 78, 53, 0.15))`
                        : 'transparent',
                      border: activeLaunch?.id === launch.id
                        ? `1px solid ${colors.crimson}55`
                        : '1px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>
                          {launch.name}
                        </div>
                        {launch.launch_date && (
                          <div style={{ fontSize: 11, color: colors.tuscany, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={10} />
                            {new Date(launch.launch_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteLaunch(launch.id); }}
                        style={{
                          padding: '4px',
                          borderRadius: 4,
                          border: 'none',
                          background: 'transparent',
                          color: colors.textMuted,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div>
              {activeLaunch && (
                <>
                  {/* Progress Header */}
                  <div
                    style={{
                      background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.08))`,
                      border: `1px solid ${colors.crimson}33`,
                      borderRadius: 16,
                      padding: '20px 24px',
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                            fontSize: 20,
                            color: colors.textPrimary,
                            fontWeight: 600,
                          }}
                        >
                          {activeLaunch.name}
                        </div>
                        {activeLaunch.launch_date && (
                          <div style={{ fontSize: 12, color: colors.tuscany, marginTop: 4 }}>
                            Launch Date: {new Date(activeLaunch.launch_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleGenerateContent}
                        disabled={generatingContent}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: generatingContent ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {generatingContent ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Generate Launch Content
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ background: `${colors.tuscany}22`, borderRadius: 4, height: 8 }}>
                          <div
                            style={{
                              width: `${progress.percentage}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${colors.crimson}, ${colors.cinnabar})`,
                              borderRadius: 4,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: 14, color: colors.cinnabar, fontWeight: 700 }}>
                        {progress.percentage}%
                      </span>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>
                        {progress.completed}/{progress.total} tasks
                      </span>
                    </div>
                  </div>

                  {/* Phases */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {activeLaunch.phases.map((phase) => {
                      const phaseProgress = phase.tasks.filter(t => t.completed).length;
                      const phaseColor = PHASE_COLORS[phase.id] || colors.cinnabar;

                      return (
                        <div
                          key={phase.id}
                          data-testid={`phase-${phase.id}`}
                          style={{
                            background: colors.cardBg,
                            border: `1px solid ${phaseColor}33`,
                            borderRadius: 16,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Phase Header */}
                          <div
                            style={{
                              padding: '16px 20px',
                              borderBottom: `1px solid ${colors.border}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  background: `${phaseColor}22`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {phase.id === 'pre-launch' && <Clock size={18} style={{ color: phaseColor }} />}
                                {phase.id === 'launch' && <Rocket size={18} style={{ color: phaseColor }} />}
                                {phase.id === 'post-launch' && <Target size={18} style={{ color: phaseColor }} />}
                              </div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                                  {phase.name}
                                </div>
                                <div style={{ fontSize: 11, color: colors.textMuted }}>
                                  {phase.description}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ fontSize: 12, color: phaseColor, fontWeight: 600 }}>
                                {phaseProgress}/{phase.tasks.length}
                              </span>
                              <button
                                onClick={() => handleAddTask(phase.id)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  border: `1px solid ${colors.tuscany}44`,
                                  background: 'transparent',
                                  color: colors.tuscany,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Plus size={12} />
                                Add Task
                              </button>
                            </div>
                          </div>

                          {/* Tasks */}
                          <div style={{ padding: '12px 20px' }}>
                            {phase.tasks.map((task) => (
                              <div
                                key={task.id}
                                data-testid={`task-${task.id}`}
                                onClick={() => handleToggleTask(phase.id, task.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  padding: '10px 0',
                                  borderBottom: `1px solid ${colors.border}`,
                                  cursor: 'pointer',
                                }}
                              >
                                {task.completed ? (
                                  <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                                ) : (
                                  <Circle size={18} style={{ color: colors.textMuted, flexShrink: 0 }} />
                                )}
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: task.completed ? colors.textMuted : colors.textPrimary,
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                  }}
                                >
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* New Launch Modal */}
        {showNewLaunchModal && (
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
            onClick={() => setShowNewLaunchModal(false)}
          >
            <div
              data-testid="new-launch-modal"
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
                  New Launch
                </div>
                <button
                  onClick={() => setShowNewLaunchModal(false)}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
                    Launch Name *
                  </label>
                  <input
                    data-testid="launch-name-input"
                    type="text"
                    value={newLaunchName}
                    onChange={(e) => setNewLaunchName(e.target.value)}
                    placeholder="e.g., Course Launch, Product Release"
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
                    Launch Date (optional)
                  </label>
                  <input
                    data-testid="launch-date-input"
                    type="date"
                    value={newLaunchDate}
                    onChange={(e) => setNewLaunchDate(e.target.value)}
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
                  data-testid="create-launch-btn"
                  onClick={handleCreateLaunch}
                  disabled={!newLaunchName.trim()}
                  style={{
                    marginTop: 8,
                    padding: '14px',
                    borderRadius: 10,
                    border: 'none',
                    background: !newLaunchName.trim()
                      ? colors.textMuted
                      : `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: !newLaunchName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Create Launch Plan
                </button>
              </div>
            </div>
          </div>
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
    </DashboardLayout>
  );
}

// Export with plan gate wrapper
export default function LaunchPlanner() {
  return (
      <LaunchPlannerContent />
  );
}

