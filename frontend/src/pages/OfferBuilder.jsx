import React, { useState, useEffect } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles,
  DollarSign,
  Users,
  Target,
  Loader2,
  X,
  Check
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

function OfferBuilderContent() {
  const colors = useColors();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [generatingCopy, setGeneratingCopy] = useState(null);
  const [generatedCopy, setGeneratedCopy] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: '',
    target_audience: '',
    transformation: '',
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const response = await axios.get(`${API}/offers`);
      setOffers(response.data || []);
    } catch (error) {
      console.error('Failed to load offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        name: offer.name || '',
        description: offer.description || '',
        price: offer.price?.toString() || '',
        features: offer.features?.join('\n') || '',
        target_audience: offer.target_audience || '',
        transformation: offer.transformation || '',
      });
    } else {
      setEditingOffer(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        features: '',
        target_audience: '',
        transformation: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOffer(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      features: '',
      target_audience: '',
      transformation: '',
    });
  };

  const handleSaveOffer = async () => {
    const offerData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      features: formData.features.split('\n').filter(f => f.trim()),
      target_audience: formData.target_audience,
      transformation: formData.transformation,
    };

    try {
      if (editingOffer) {
        await axios.put(`${API}/offers/${editingOffer.id}`, offerData);
      } else {
        await axios.post(`${API}/offers`, offerData);
      }
      await loadOffers();
      handleCloseModal();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      await axios.delete(`${API}/offers/${offerId}`);
      await loadOffers();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleGenerateCopy = async (offerId) => {
    setGeneratingCopy(offerId);
    setGeneratedCopy('');

    try {
      const response = await axios.post(`${API}/offers/generate`, null, {
        params: { offer_id: offerId }
      });
      setGeneratedCopy(response.data.sales_copy || 'No copy generated');
    } catch (error) {
      console.error('Generate error:', error);
      setGeneratedCopy('Failed to generate copy. Please try again.');
    } finally {
      setGeneratingCopy(null);
    }
  };

  return (
    <DashboardLayout>
      <TopBar
        title="Offer Builder"
        subtitle="Create and manage your irresistible offers"
      />

      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: colors.textMuted }}>
            {offers.length} offer{offers.length !== 1 ? 's' : ''} created
          </div>
          <button
            data-testid="create-offer-btn"
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
            New Offer
          </button>
        </div>

        {/* Offers Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Loader2 size={32} style={{ color: colors.cinnabar, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : offers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}22`,
              borderRadius: 16,
            }}
          >
            <Package size={48} style={{ color: colors.textMuted, marginBottom: 16 }} />
            <div style={{ fontSize: 18, color: colors.textPrimary, marginBottom: 8 }}>
              No offers yet
            </div>
            <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>
              Create your first irresistible offer to start selling
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
              Create Your First Offer
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {offers.map((offer) => (
              <div
                key={offer.id}
                data-testid={`offer-card-${offer.id}`}
                style={{
                  background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.08))`,
                  border: `1px solid ${colors.crimson}33`,
                  borderRadius: 16,
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: colors.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {offer.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarSign size={14} style={{ color: colors.cinnabar }} />
                      <span style={{ fontSize: 20, fontWeight: 700, color: colors.cinnabar }}>
                        {offer.price || 0}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      data-testid={`edit-offer-${offer.id}`}
                      onClick={() => handleOpenModal(offer)}
                      style={{
                        padding: '8px',
                        borderRadius: 6,
                        border: `1px solid ${colors.tuscany}44`,
                        background: 'transparent',
                        color: colors.tuscany,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      data-testid={`delete-offer-${offer.id}`}
                      onClick={() => handleDeleteOffer(offer.id)}
                      style={{
                        padding: '8px',
                        borderRadius: 6,
                        border: `1px solid #ef444444`,
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {offer.description && (
                  <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
                    {offer.description}
                  </p>
                )}

                {offer.target_audience && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: colors.tuscany }}>
                    <Users size={14} />
                    <span>For: {offer.target_audience}</span>
                  </div>
                )}

                {offer.transformation && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, fontSize: 12, color: colors.tuscany }}>
                    <Target size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{offer.transformation}</span>
                  </div>
                )}

                {offer.features && offer.features.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: colors.tuscany, marginBottom: 8, textTransform: 'uppercase' }}>
                      What's Included
                    </div>
                    {offer.features.slice(0, 4).map((feature, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>
                        <Check size={12} style={{ color: colors.cinnabar }} />
                        {feature}
                      </div>
                    ))}
                    {offer.features.length > 4 && (
                      <div style={{ fontSize: 11, color: colors.tuscany }}>
                        +{offer.features.length - 4} more features
                      </div>
                    )}
                  </div>
                )}

                <button
                  data-testid={`generate-copy-${offer.id}`}
                  onClick={() => handleGenerateCopy(offer.id)}
                  disabled={generatingCopy === offer.id}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 8,
                    border: `1px solid ${colors.cinnabar}44`,
                    background: 'transparent',
                    color: colors.cinnabar,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: generatingCopy === offer.id ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {generatingCopy === offer.id ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate Sales Copy
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Generated Copy Modal */}
        {generatedCopy && (
          <div
            data-testid="generated-copy-modal"
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
            onClick={() => setGeneratedCopy('')}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: colors.textPrimary }}>
                  Generated Sales Copy
                </div>
                <button
                  onClick={() => setGeneratedCopy('')}
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
              <div
                style={{
                  background: colors.darkest,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 14,
                  color: colors.textPrimary,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {generatedCopy}
              </div>
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
              data-testid="offer-modal"
              style={{
                background: colors.cardBg,
                borderRadius: 16,
                padding: 24,
                maxWidth: 500,
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: colors.textPrimary }}>
                  {editingOffer ? 'Edit Offer' : 'Create New Offer'}
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
                    Offer Name *
                  </label>
                  <input
                    data-testid="offer-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Brand Strategy Intensive"
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
                    data-testid="offer-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What is this offer about?"
                    rows={3}
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
                    Price ($)
                  </label>
                  <input
                    data-testid="offer-price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
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
                    Target Audience
                  </label>
                  <input
                    data-testid="offer-audience"
                    type="text"
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    placeholder="Who is this offer for?"
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
                    Transformation Promise
                  </label>
                  <input
                    data-testid="offer-transformation"
                    type="text"
                    value={formData.transformation}
                    onChange={(e) => setFormData({ ...formData, transformation: e.target.value })}
                    placeholder="What outcome will they achieve?"
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
                    Features (one per line)
                  </label>
                  <textarea
                    data-testid="offer-features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="1:1 Strategy Session&#10;Custom Brand Playbook&#10;30-Day Support"
                    rows={4}
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
                    data-testid="save-offer-btn"
                    onClick={handleSaveOffer}
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
                    {editingOffer ? 'Save Changes' : 'Create Offer'}
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
export default function OfferBuilder() {
  return (
      <OfferBuilderContent />
  );
}

