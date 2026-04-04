import React, { useState, useEffect } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { 
  Cog, 
  Plus, 
  Edit2, 
  Trash2,
  Loader2,
  X,
  GripVertical,
  ChevronRight,
  Megaphone,
  ShoppingCart,
  Truck,
  Settings
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const CATEGORIES = [
  { id: 'marketing', name: 'Marketing', icon: Megaphone, color: '#AF0024' },
  { id: 'sales', name: 'Sales', icon: ShoppingCart, color: '#e04e35' },
  { id: 'delivery', name: 'Delivery', icon: Truck, color: '#9B1B30' },
  { id: 'operations', name: 'Operations', icon: Settings, color: '#C7A09D' },
];

function SystemsBuilderContent() {
  const colors = useColors();
  const [systems, setSystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewingSystem, setViewingSystem] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'marketing',
    steps: [{ title: '', description: '' }],
  });

  useEffect(() => {
    loadSystems();
  }, []);

  const loadSystems = async () => {
    try {
      const response = await axios.get(`${API}/systems`);
      setSystems(response.data || []);
    } catch (error) {
      console.error('Failed to load systems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (system = null) => {
    if (system) {
      setEditingSystem(system);
      setFormData({
        name: system.name || '',
        description: system.description || '',
        category: system.category || 'marketing',
        steps: system.steps?.length > 0 ? system.steps : [{ title: '', description: '' }],
      });
    } else {
      setEditingSystem(null);
      setFormData({
        name: '',
        description: '',
        category: 'marketing',
        steps: [{ title: '', description: '' }],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSystem(null);
  };

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { title: '', description: '' }],
    });
  };

  const handleRemoveStep = (index) => {
    if (formData.steps.length <= 1) return;
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSaveSystem = async () => {
    const systemData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      steps: formData.steps.filter(s => s.title.trim()),
    };

    try {
      if (editingSystem) {
        await axios.put(`${API}/systems/${editingSystem.id}`, systemData);
      } else {
        await axios.post(`${API}/systems`, systemData);
      }
      await loadSystems();
      handleCloseModal();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDeleteSystem = async (systemId) => {
    if (!window.confirm('Are you sure you want to delete this system?')) return;

    try {
      await axios.delete(`${API}/systems/${systemId}`);
      await loadSystems();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const filteredSystems = selectedCategory === 'all' 
    ? systems 
    : systems.filter(s => s.category === selectedCategory);

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Systems Builder"
        subtitle="Build repeatable systems for your business"
      />

      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              data-testid="filter-all"
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: selectedCategory === 'all' ? colors.cinnabar : `${colors.tuscany}22`,
                color: selectedCategory === 'all' ? 'white' : colors.textMuted,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                data-testid={`filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: selectedCategory === cat.id ? cat.color : `${colors.tuscany}22`,
                  color: selectedCategory === cat.id ? 'white' : colors.textMuted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <cat.icon size={14} />
                {cat.name}
              </button>
            ))}
          </div>

          <button
            data-testid="create-system-btn"
            onClick={() => handleOpenModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <Plus size={16} />
            New System
          </button>
        </div>

        {/* Systems Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Loader2 size={32} style={{ color: colors.cinnabar, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredSystems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}22`,
              borderRadius: 16,
            }}
          >
            <Cog size={48} style={{ color: colors.textMuted, marginBottom: 16 }} />
            <div style={{ fontSize: 18, color: colors.textPrimary, marginBottom: 8 }}>
              No systems yet
            </div>
            <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>
              Create your first system to start building scalable processes
            </div>
            <button
              onClick={() => handleOpenModal()}
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
              Create Your First System
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filteredSystems.map((system) => {
              const categoryInfo = getCategoryInfo(system.category);
              const CategoryIcon = categoryInfo.icon;

              return (
                <div
                  key={system.id}
                  data-testid={`system-card-${system.id}`}
                  style={{
                    background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.08))`,
                    border: `1px solid ${categoryInfo.color}33`,
                    borderRadius: 16,
                    padding: '20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setViewingSystem(system)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${categoryInfo.color}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CategoryIcon size={20} style={{ color: categoryInfo.color }} />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button
                        data-testid={`edit-system-${system.id}`}
                        onClick={() => handleOpenModal(system)}
                        style={{
                          padding: '6px',
                          borderRadius: 4,
                          border: `1px solid ${colors.tuscany}44`,
                          background: 'transparent',
                          color: colors.tuscany,
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        data-testid={`delete-system-${system.id}`}
                        onClick={() => handleDeleteSystem(system.id)}
                        style={{
                          padding: '6px',
                          borderRadius: 4,
                          border: `1px solid #ef444444`,
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 16,
                      fontWeight: 700,
                      color: colors.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    {system.name}
                  </div>

                  <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
                    {system.description?.substring(0, 80) || 'No description'}
                    {system.description?.length > 80 && '...'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: `${categoryInfo.color}22`,
                        color: categoryInfo.color,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      {categoryInfo.name}
                    </span>
                    <span style={{ fontSize: 11, color: colors.tuscany }}>
                      {system.steps?.length || 0} steps
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View System Modal */}
        {viewingSystem && (
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
            onClick={() => setViewingSystem(null)}
          >
            <div
              style={{
                background: colors.cardBg,
                borderRadius: 16,
                padding: 24,
                maxWidth: 600,
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: colors.textPrimary }}>
                    {viewingSystem.name}
                  </div>
                  <div style={{ fontSize: 12, color: colors.tuscany, marginTop: 4 }}>
                    {viewingSystem.description}
                  </div>
                </div>
                <button
                  onClick={() => setViewingSystem(null)}
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

              <div style={{ fontSize: 12, color: colors.tuscany, marginBottom: 16, textTransform: 'uppercase' }}>
                Process Steps
              </div>

              {viewingSystem.steps?.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: '16px 0',
                    borderBottom: i < viewingSystem.steps.length - 1 ? `1px solid ${colors.border}` : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: colors.cinnabar,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
                      {step.title}
                    </div>
                    {step.description && (
                      <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
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
            onClick={handleCloseModal}
          >
            <div
              data-testid="system-modal"
              style={{
                background: colors.cardBg,
                borderRadius: 16,
                padding: 24,
                maxWidth: 600,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: colors.textPrimary }}>
                  {editingSystem ? 'Edit System' : 'Create New System'}
                </div>
                <button
                  onClick={handleCloseModal}
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
                    System Name *
                  </label>
                  <input
                    data-testid="system-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Client Onboarding Process"
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
                    Description
                  </label>
                  <textarea
                    data-testid="system-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this system accomplish?"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: `1px solid ${colors.tuscany}22`,
                      background: colors.darkest,
                      color: colors.textPrimary,
                      fontSize: 14,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
                    Category
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat.id })}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 8,
                          border: formData.category === cat.id ? `2px solid ${cat.color}` : `1px solid ${colors.tuscany}22`,
                          background: formData.category === cat.id ? `${cat.color}22` : 'transparent',
                          color: formData.category === cat.id ? cat.color : colors.textMuted,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <cat.icon size={14} />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label style={{ fontSize: 12, color: colors.tuscany }}>
                      Process Steps
                    </label>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: `1px solid ${colors.cinnabar}44`,
                        background: 'transparent',
                        color: colors.cinnabar,
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Plus size={12} />
                      Add Step
                    </button>
                  </div>

                  {formData.steps.map((step, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 12,
                        padding: 12,
                        background: colors.darkest,
                        borderRadius: 8,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: colors.cinnabar,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: 8,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleStepChange(i, 'title', e.target.value)}
                          placeholder="Step title"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: `1px solid ${colors.tuscany}22`,
                            background: colors.cardBg,
                            color: colors.textPrimary,
                            fontSize: 13,
                            marginBottom: 8,
                            boxSizing: 'border-box',
                          }}
                        />
                        <textarea
                          value={step.description}
                          onChange={(e) => handleStepChange(i, 'description', e.target.value)}
                          placeholder="Step description (optional)"
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: `1px solid ${colors.tuscany}22`,
                            background: colors.cardBg,
                            color: colors.textPrimary,
                            fontSize: 12,
                            resize: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      {formData.steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(i)}
                          style={{
                            padding: '6px',
                            borderRadius: 4,
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            marginTop: 8,
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    onClick={handleCloseModal}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 10,
                      border: `1px solid ${colors.tuscany}44`,
                      background: 'transparent',
                      color: colors.tuscany,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="save-system-btn"
                    onClick={handleSaveSystem}
                    disabled={!formData.name.trim()}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 10,
                      border: 'none',
                      background: !formData.name.trim() 
                        ? colors.textMuted 
                        : `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: !formData.name.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {editingSystem ? 'Save Changes' : 'Create System'}
                  </button>
                </div>
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
export default function SystemsBuilder() {
  return (
      <SystemsBuilderContent />
  );
}

