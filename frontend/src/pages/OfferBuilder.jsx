import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUser } from '../hooks/useAuth';
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
 Check,
} from 'lucide-react';
import TrackingLinkManager from "../components/mail/TrackingLinkManager";
import apiClient from '../lib/apiClient';

const CTH_PAGE_COLORS = {
 darkest: "var(--cth-admin-bg)",
 darker: "var(--cth-admin-panel-alt)",
 cardBg: "var(--cth-admin-panel)",
 crimson: "var(--cth-admin-accent)",
 cinnabar: "var(--cth-admin-accent)",
 tuscany: "var(--cth-admin-tuscany)",
 ruby: "var(--cth-admin-ruby)",
 textPrimary: "var(--cth-admin-ink)",
 textSecondary: "var(--cth-admin-ruby)",
 textMuted: "var(--cth-admin-ink-soft, var(--cth-admin-muted))",
 border: "var(--cth-admin-border)",
 accent: "var(--cth-admin-accent)",
 sidebarStart: "var(--cth-admin-sidebar-start)",
 sidebarEnd: "var(--cth-admin-sidebar-end)",
 sidebarHover: "var(--cth-admin-sidebar-hover)",
 panel: "var(--cth-admin-panel)",
 appBg: "var(--cth-admin-bg)",
};

const EMPTY_FORM = {
 name: '',
 description: '',
 price: '',
 features: '',
 target_audience: '',
 transformation: '',
};

function normalizeOffer(raw) {
 return {
 id: raw?.id || raw?.offer_id || `offer-${Date.now()}`,
 name: raw?.name || '',
 description: raw?.description || '',
 price: raw?.price ?? 0,
 features: Array.isArray(raw?.features) ? raw.features : [],
 target_audience: raw?.target_audience || '',
 transformation: raw?.transformation || '',
 created_at: raw?.created_at || '',
 updated_at: raw?.updated_at || '',
 };
}

function OfferBuilderContent() {
 const { user } = useUser();
 const colors = CTH_PAGE_COLORS;
 const { currentWorkspace } = useWorkspace();

 const workspaceId =
 currentWorkspace?.id ||
 currentWorkspace?.workspace_id ||
 '';
 const userId = user?.id || '';

 const [offers, setOffers] = useState([]);
 const [isLoading, setIsLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [editingOffer, setEditingOffer] = useState(null);
 const [savingOffer, setSavingOffer] = useState(false);

 const [generatingCopy, setGeneratingCopy] = useState(null);
 const [generatedCopy, setGeneratedCopy] = useState('');
 const [generatedCopyTitle, setGeneratedCopyTitle] = useState('');

 const [formData, setFormData] = useState(EMPTY_FORM);
 const [error, setError] = useState('');

 const offerCountLabel = useMemo(
 () => `${offers.length} offer${offers.length !== 1 ? 's' : ''} created`,
 [offers.length]
 );

 const loadOffers = useCallback(async () => {
 if (!workspaceId) {
 setOffers([]);
 setIsLoading(false);
 return;
 }

 setIsLoading(true);
 setError('');

 try {
 const response = await apiClient.get('/api/offers', {
 params: {
 user_id: userId,
 workspace_id: workspaceId,
 },
 });
 const nextOffers = Array.isArray(response?.offers)
 ? response.offers
 : Array.isArray(response)
 ? response
 : [];

 setOffers(nextOffers.map(normalizeOffer));
 } catch (err) {
 console.error('Failed to load offers:', err);
 setOffers([]);
 setError(err?.message || 'Failed to load offers.');
 } finally {
 setIsLoading(false);
 }
 }, [workspaceId]);

 useEffect(() => {
 loadOffers();
 }, [loadOffers]);

 const handleOpenModal = useCallback((offer = null) => {
 if (offer) {
 setEditingOffer(offer);
 setFormData({
 name: offer.name || '',
 description: offer.description || '',
 price: offer.price?.toString() || '',
 features: Array.isArray(offer.features) ? offer.features.join('\n') : '',
 target_audience: offer.target_audience || '',
 transformation: offer.transformation || '',
 sales_page_url: offer.sales_page_url || offer.salesPageUrl || offer.sales_page || offer.url || '',
 checkout_url: offer.checkout_url || offer.checkoutUrl || offer.checkout_page_url || '',
 booking_url: offer.booking_url || offer.bookingUrl || offer.booking_link || '',
 });
 } else {
 setEditingOffer(null);
 setFormData(EMPTY_FORM);
 }

 setShowModal(true);
 setError('');
 }, []);

 const handleCloseModal = useCallback(() => {
 setShowModal(false);
 setEditingOffer(null);
 setFormData(EMPTY_FORM);
 setError('');
 }, []);

 const handleSaveOffer = async () => {
 if (!formData.name.trim()) return;

 const payload = {
 user_id: userId,
 workspace_id: workspaceId,
 name: formData.name.trim(),
 description: formData.description.trim(),
 price: parseFloat(formData.price) || 0,
 features: formData.features
 .split('\n')
 .map((f) => f.trim())
 .filter(Boolean),
 target_audience: formData.target_audience.trim(),
 transformation: formData.transformation.trim(),
 sales_page_url: formData.sales_page_url?.trim() || '',
 checkout_url: formData.checkout_url?.trim() || '',
 booking_url: formData.booking_url?.trim() || '',
 };

 setSavingOffer(true);
 setError('');

 try {
 if (editingOffer?.id) {
 await apiClient.put(`/api/offers/${editingOffer.id}`, payload);
 } else {
 await apiClient.post('/api/offers', payload);
 }

 await loadOffers();
 handleCloseModal();
 } catch (err) {
 console.error('Save error:', err);
 setError(err?.message || 'Failed to save offer.');
 } finally {
 setSavingOffer(false);
 }
 };

 const handleDeleteOffer = async (offerId) => {
 if (!offerId) return;
 if (!window.confirm('Are you sure you want to delete this offer?')) return;

 setError('');

 try {
 await apiClient.delete(`/api/offers/${offerId}`);
 await loadOffers();
 } catch (err) {
 console.error('Delete error:', err);
 setError(err?.message || 'Failed to delete offer.');
 }
 };

 const handleGenerateCopy = async (offer) => {
 if (!offer?.id) return;

 setGeneratingCopy(offer.id);
 setGeneratedCopy('');
 setGeneratedCopyTitle(offer.name || 'Generated Sales Copy');
 setError('');

 try {
 const response = await apiClient.post('/api/offers/generate', null, {
 params: { offer_id: offer.id },
 });

 setGeneratedCopy(
 response?.sales_copy ||
 response?.copy ||
 'No sales copy was returned.'
 );
 } catch (err) {
 console.error('Generate error:', err);
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
 <div
 style={{
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: 24,
 gap: 16,
 flexWrap: 'wrap',
 }}
 >
 <div style={{ fontSize: 14, color: colors.textMuted }}>
 {offerCountLabel}
 {workspaceId ? (
 <span style={{ display: 'block', fontSize: 11, marginTop: 4, opacity: 0.7 }}>
 Workspace: {workspaceId}
 </span>
 ) : null}
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
 background: "var(--cth-admin-accent)",
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

 {error ? (
 <div
 style={{
 marginBottom: 20,
 padding: '12px 14px',
 borderRadius: 10,
 border: '1px solid rgba(239,68,68,0.25)',
 background: "color-mix(in srgb, var(--cth-danger) 10%, var(--cth-admin-panel))",
 color: "var(--cth-danger)",
 fontSize: 12,
 }}
 >
 {error}
 </div>
 ) : null}

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
 border: "1px solid #d8c5c3",
 borderRadius: 16,
 }}
 >
 <Package size={48} style={{ color: colors.textMuted, marginBottom: 16 }} />
 <div style={{ fontSize: 18, color: "#2b1040", marginBottom: 8 }}>
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
 background: "var(--cth-admin-accent)",
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
 background: "#f8f4f2",
 color: "#2b1040",
 border: "1px solid #d8c5c3",
 borderRadius: 24,
 padding: '24px',
 boxShadow: "0 18px 44px rgba(43,16,64,0.08)",
 }}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
 <div>
 <div
 style={{
 fontFamily: "'Playfair Display', Georgia, serif",
 fontSize: 18,
 fontWeight: 700,
 color: "#2b1040",
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
 border: "1px solid color-mix(in srgb, var(--cth-danger) 35%, transparent)",
 background: 'transparent',
 color: "var(--cth-danger)",
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
 <div
 key={i}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 8,
 fontSize: 12,
 color: colors.textMuted,
 marginBottom: 6,
 }}
 >
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
 onClick={() => handleGenerateCopy(offer)}
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

 <div className="mt-5">
 <TrackingLinkManager
 title="Offer Tracking Links"
 subtitle="Create tracked links for this offer’s sales page, checkout page, booking link, or CTA."
 defaultLabel={`${offer.name || "Offer"} CTA`}
 defaultUrl={offer.sales_page_url || offer.checkout_url || offer.booking_url || ""}
 context={{
 source: "offer_builder",
 offer_id: offer.id || "",
 metadata: {
 offer_name: offer.name || "",
 offer_price: offer.price || 0,
 sales_page_url: offer.sales_page_url || "",
 checkout_url: offer.checkout_url || "",
 booking_url: offer.booking_url || "",
 },
 }}
 compact
 />
 </div>
 </div>
 ))}
 </div>
 )}

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
 onClick={() => {
 setGeneratedCopy('');
 setGeneratedCopyTitle('');
 }}
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
 onClick={(e) => e.stopPropagation()}
 >
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: colors.textPrimary }}>
 {generatedCopyTitle || 'Generated Sales Copy'}
 </div>

 <button
 onClick={() => {
 setGeneratedCopy('');
 setGeneratedCopyTitle('');
 }}
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
 color: "#2b1040",
 lineHeight: 1.7,
 whiteSpace: 'pre-wrap',
 }}
 >
 {generatedCopy}
 </div>
 </div>
 </div>
 )}

 {showModal && (
 <div
 style={{
 position: 'fixed',
 top: 0,
 left: 0,
 right: 0,
 bottom: 0,
 background: 'rgba(13, 0, 16, 0.72)',
 backdropFilter: 'blur(6px)',
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
 background: "#f8f4f2",
 border: "1px solid #d8c5c3",
 boxShadow: "0 30px 90px rgba(43,16,64,0.28)",
 borderRadius: 16,
 padding: 24,
 maxWidth: 640,
 width: '100%',
 maxHeight: '90vh',
 overflow: 'auto',
 }}
 onClick={(e) => e.stopPropagation()}
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
 onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
 placeholder="e.g., Brand Strategy Intensive"
 style={inputStyle(colors)}
 />
 </div>

 <div>
 <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
 Description
 </label>
 <textarea
 data-testid="offer-description"
 value={formData.description}
 onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
 placeholder="What is this offer about?"
 rows={3}
 style={textareaStyle(colors)}
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
 onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
 placeholder="0"
 style={inputStyle(colors)}
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
 onChange={(e) => setFormData((prev) => ({ ...prev, target_audience: e.target.value }))}
 placeholder="Who is this offer for?"
 style={inputStyle(colors)}
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
 onChange={(e) => setFormData((prev) => ({ ...prev, transformation: e.target.value }))}
 placeholder="What outcome will they achieve?"
 style={inputStyle(colors)}
 />
 </div>
 <div>
 <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
 Sales Page URL
 </label>
 <input
 data-testid="offer-sales-page-url"
 type="url"
 value={formData.sales_page_url || ''}
 onChange={(e) => setFormData((prev) => ({ ...prev, sales_page_url: e.target.value }))}
 placeholder="https://yourdomain.com/sales-page"
 style={inputStyle(colors)}
 />
 </div>

 <div>
 <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
 Checkout URL
 </label>
 <input
 data-testid="offer-checkout-url"
 type="url"
 value={formData.checkout_url || ''}
 onChange={(e) => setFormData((prev) => ({ ...prev, checkout_url: e.target.value }))}
 placeholder="https://checkout.yourdomain.com/offer"
 style={inputStyle(colors)}
 />
 </div>

 <div>
 <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
 Booking URL
 </label>
 <input
 data-testid="offer-booking-url"
 type="url"
 value={formData.booking_url || ''}
 onChange={(e) => setFormData((prev) => ({ ...prev, booking_url: e.target.value }))}
 placeholder="https://calendly.com/your-offer"
 style={inputStyle(colors)}
 />
 </div>

 <div>
 <label style={{ fontSize: 12, color: colors.tuscany, display: 'block', marginBottom: 6 }}>
 Features (one per line)
 </label>
 <textarea
 data-testid="offer-features"
 value={formData.features}
 onChange={(e) => setFormData((prev) => ({ ...prev, features: e.target.value }))}
 placeholder={'1:1 Strategy Session\nCustom Brand Playbook\n30-Day Support'}
 rows={4}
 style={textareaStyle(colors)}
 />
 </div>

 {error ? (
 <div
 style={{
 padding: '10px 12px',
 borderRadius: 8,
 border: '1px solid rgba(239,68,68,0.25)',
 background: 'rgba(239,68,68,0.08)',
 color: "var(--cth-danger)",
 fontSize: 12,
 }}
 >
 {error}
 </div>
 ) : null}

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
 disabled={!formData.name.trim() || savingOffer}
 style={{
 flex: 1,
 padding: '14px',
 borderRadius: 10,
 border: 'none',
 background:
 !formData.name.trim() || savingOffer
 ? colors.textMuted
 : "var(--cth-admin-accent)",
 color: 'white',
 fontSize: 13,
 fontWeight: 700,
 cursor: !formData.name.trim() || savingOffer ? 'not-allowed' : 'pointer',
 }}
 >
 {savingOffer
 ? 'Saving...'
 : editingOffer
 ? 'Save Changes'
 : 'Create Offer'}
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

function inputStyle(colors) {
 return {
 width: '100%',
 padding: '12px 16px',
 borderRadius: 8,
 border: "1px solid #d8c5c3",
 background: "#fffaf7",
 color: "#2b1040",
 fontSize: 14,
 boxSizing: 'border-box',
 };
}

function textareaStyle(colors) {
 return {
 width: '100%',
 padding: '12px 16px',
 borderRadius: 8,
 border: "1px solid #d8c5c3",
 background: "#fffaf7",
 color: "#2b1040",
 fontSize: 14,
 resize: 'vertical',
 boxSizing: 'border-box',
 };
}

export default function OfferBuilder() {
 return <OfferBuilderContent />;
}
