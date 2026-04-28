import React, { useState } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { useUser } from '../hooks/useAuth';
import {
 Download,
 FileArchive,
 Loader2,
 CheckCircle2,
 FileText,
 Image,
 Palette,
 Type,
 Package,
 BookOpen,
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function BrandKitExport() {
 const colors = useColors();
 const { user } = useUser();
 const userId = user?.id || 'default';
 const [exporting, setExporting] = useState(false);
 const [exportResult, setExportResult] = useState(null);
 const [exportingStyled, setExportingStyled] = useState(false);

 const handleExport = async () => {
 setExporting(true);
 setExportResult(null);
 try {
 const res = await axios.post(`${API}/export/brand-kit?user_id=${userId}`);
 setExportResult(res.data);
 } catch (err) {
 console.error('Export failed:', err);
 alert(err.response?.data?.detail || 'Export failed');
 } finally {
 setExporting(false);
 }
 };

 const handleDownload = () => {
 if (exportResult?.download_url) {
 window.open(`${import.meta.env.VITE_BACKEND_URL}${exportResult.download_url}`, '_blank');
 }
 };

 const handlePdfOnly = async () => {
 setExporting(true);
 try {
 const res = await axios.post(`${API}/export/brand-kit-pdf?user_id=${userId}`, {}, { responseType: 'blob' });
 const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
 const link = document.createElement('a');
 link.href = url;
 link.setAttribute('download', 'brand_guidelines.pdf');
 document.body.appendChild(link);
 link.click();
 link.remove();
 window.URL.revokeObjectURL(url);
 } catch (err) {
 console.error('PDF export failed:', err);
 alert('PDF export failed');
 } finally {
 setExporting(false);
 }
 };

 const handleStyledPdfExport = async () => {
 setExportingStyled(true);
 try {
 const res = await axios.get(`${API}/export/brand-guidelines-styled?user_id=${userId}&format=pdf`, { 
 responseType: 'blob' 
 });
 const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
 const link = document.createElement('a');
 link.href = url;
 link.setAttribute('download', 'brand-guidelines-styled.pdf');
 document.body.appendChild(link);
 link.click();
 link.remove();
 window.URL.revokeObjectURL(url);
 } catch (err) {
 console.error('Styled PDF export failed:', err);
 alert(err.response?.data?.detail || 'Styled PDF export failed. Please try again.');
 } finally {
 setExportingStyled(false);
 }
 };

 const formatSize = (bytes) => {
 if (bytes < 1024) return `${bytes} B`;
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
 };

 const INCLUDED_ITEMS = [
 { icon: FileText, label: 'Brand Guidelines PDF', desc: 'Complete brand style guide document' },
 { icon: Palette, label: 'Color Palette', desc: 'All brand colors with hex codes' },
 { icon: Type, label: 'Typography', desc: 'Font selections and usage guidelines' },
 { icon: Image, label: 'Brand Assets', desc: 'Logos, icons, and uploaded assets' },
 { icon: Image, label: 'Generated Media', desc: 'AI-generated images and videos' },
 { icon: Package, label: 'Brand Data JSON', desc: 'Machine-readable brand configuration' },
 ];

 return (
 <DashboardLayout>
 <TopBar title="Brand Kit Export" subtitle="Download your complete brand package" />

 <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
 <div style={{ maxWidth: 700, margin: '0 auto' }}>

 {/* Styled Brand Guidelines PDF - NEW PRIMARY OPTION */}
 <div
 style={{
 background: `linear-gradient(180deg, ${colors.cardBg}, rgba(224,78,53,0.12))`,
 border: `2px solid ${colors.cinnabar}44`,
 borderRadius: 20,
 overflow: 'hidden',
 marginBottom: 24,
 }}
 >
 <div
 style={{
 background: `linear-gradient(135deg, ${colors.cinnabar}22, ${colors.crimson}15)`,
 padding: '28px 28px 24px',
 textAlign: 'center',
 }}
 >
 <BookOpen size={44} style={{ color: colors.cinnabar, marginBottom: 14 }} />
 <h2
 style={{
 fontFamily: "'Playfair Display', Georgia, serif",
 fontSize: 22,
 color: colors.textPrimary,
 marginBottom: 8,
 }}
 >
 Brand Guidelines Document
 </h2>
 <p style={{ fontSize: 13, color: colors.textMuted, maxWidth: 420, margin: '0 auto' }}>
 Beautiful 6-page styled PDF with cover page, color swatches, typography specimens, voice guidelines, and more.
 </p>
 </div>

 <div style={{ padding: '20px 28px 28px' }}>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
 {['Cover Page', 'Brand Foundation', 'Color Palette', 'Typography', 'Voice & Messaging', 'Logo Standards'].map((item, i) => (
 <div key={i} style={{
 padding: '10px 12px',
 background: colors.darkest,
 borderRadius: 8,
 fontSize: 11,
 color: colors.textMuted,
 textAlign: 'center',
 }}>
 {item}
 </div>
 ))}
 </div>
 <button
 data-testid="export-styled-pdf-btn"
 onClick={handleStyledPdfExport}
 disabled={exportingStyled}
 style={{
 width: '100%',
 padding: '16px',
 background: exportingStyled
 ? colors.ruby
 : `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
 border: 'none',
 borderRadius: 12,
 color: 'white',
 fontSize: 14,
 fontWeight: 700,
 cursor: exportingStyled ? 'not-allowed' : 'pointer',
 letterSpacing: '0.03em',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 10,
 }}
 >
 {exportingStyled ? (
 <>
 <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
 Generating PDF...
 </>
 ) : (
 <>
 <Download size={18} />
 Download Styled PDF
 </>
 )}
 </button>
 </div>
 </div>

 {/* Export Card */}
 <div
 style={{
 background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175,0,36,0.08))`,
 border: `1px solid ${colors.tuscany}22`,
 borderRadius: 20,
 overflow: 'hidden',
 }}
 >
 {/* Header */}
 <div
 style={{
 background: `linear-gradient(135deg, ${colors.crimson}22, ${colors.cinnabar}15)`,
 padding: '32px 28px',
 textAlign: 'center',
 }}
 >
 <FileArchive size={48} style={{ color: colors.cinnabar, marginBottom: 16 }} />
 <h2
 style={{
 fontFamily: "'Playfair Display', Georgia, serif",
 fontSize: 22,
 color: colors.textPrimary,
 marginBottom: 8,
 }}
 >
 Brand Kit Package
 </h2>
 <p style={{ fontSize: 13, color: colors.textMuted, maxWidth: 400, margin: '0 auto' }}>
 Export your entire brand identity as a ZIP file containing your guidelines PDF, assets, and configuration data.
 </p>
 </div>

 {/* Included items */}
 <div style={{ padding: '24px 28px' }}>
 <div style={{ fontSize: 11, color: colors.tuscany, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
 Included in Export
 </div>
 <div style={{ display: 'grid', gap: 10 }}>
 {INCLUDED_ITEMS.map((item, i) => (
 <div
 key={i}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 14,
 padding: '12px 14px',
 background: colors.darkest,
 borderRadius: 10,
 border: `1px solid ${colors.tuscany}11`,
 }}
 >
 <item.icon size={18} style={{ color: colors.cinnabar, flexShrink: 0 }} />
 <div>
 <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{item.label}</div>
 <div style={{ fontSize: 11, color: colors.textMuted }}>{item.desc}</div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Action area */}
 <div style={{ padding: '0 28px 28px' }}>
 {!exportResult ? (
 <div style={{ display: 'flex', gap: 10 }}>
 <button
 data-testid="export-brand-kit-btn"
 onClick={handleExport}
 disabled={exporting}
 style={{
 flex: 1,
 padding: '16px',
 background: exporting
 ? colors.ruby
 : `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
 border: 'none',
 borderRadius: 12,
 color: 'white',
 fontSize: 14,
 fontWeight: 700,
 cursor: exporting ? 'not-allowed' : 'pointer',
 letterSpacing: '0.03em',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 10,
 }}
 >
 {exporting ? (
 <>
 <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
 Generating...
 </>
 ) : (
 <>
 <Package size={18} />
 Export Full ZIP
 </>
 )}
 </button>
 <button
 data-testid="export-pdf-only-btn"
 onClick={handlePdfOnly}
 disabled={exporting}
 style={{
 padding: '16px 20px',
 background: 'transparent',
 border: `1px solid ${colors.cinnabar}44`,
 borderRadius: 12,
 color: colors.cinnabar,
 fontSize: 14,
 fontWeight: 700,
 cursor: exporting ? 'not-allowed' : 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 10,
 }}
 >
 <FileText size={18} />
 PDF Only
 </button>
 </div>
 ) : (
 <div>
 <div
 data-testid="export-success"
 style={{
 padding: '16px',
 background: 'rgba(34, 197, 94, 0.1)',
 border: '1px solid rgba(34, 197, 94, 0.3)',
 borderRadius: 10,
 display: 'flex',
 alignItems: 'center',
 gap: 12,
 marginBottom: 12,
 }}
 >
 <CheckCircle2 size={20} style={{ color: 'var(--cth-status-success-bright)' }} />
 <div>
 <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cth-status-success-bright)' }}>
 Brand kit generated successfully
 </div>
 <div style={{ fontSize: 11, color: colors.textMuted }}>
 {exportResult.filename} ({formatSize(exportResult.file_size)})
 </div>
 </div>
 </div>
 <div style={{ display: 'flex', gap: 10 }}>
 <button
 data-testid="download-brand-kit-btn"
 onClick={handleDownload}
 style={{
 flex: 1,
 padding: '14px',
 background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
 border: 'none',
 borderRadius: 10,
 color: 'white',
 fontSize: 13,
 fontWeight: 700,
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 gap: 8,
 }}
 >
 <Download size={16} />
 Download ZIP
 </button>
 <button
 onClick={() => { setExportResult(null); }}
 style={{
 padding: '14px 20px',
 background: 'transparent',
 border: `1px solid ${colors.tuscany}22`,
 borderRadius: 10,
 color: colors.textMuted,
 fontSize: 13,
 cursor: 'pointer',
 }}
 >
 Export Again
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <style>
 {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
 </style>
 </DashboardLayout>
 );
}

