import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout, TopBar } from '../components/Layout';
import {
 TrendingUp, AlertTriangle, DollarSign, Clock, Activity,
 Loader2, ChevronRight, Shield, PhoneCall
} from 'lucide-react';
import axios from 'axios';
import apiClient from "../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const RISK_COLORS = { high: 'var(--cth-status-danger)', medium: 'var(--cth-status-warning)', low: 'var(--cth-status-success-bright)' };

function PipelineForecastContent() {
 const { user } = useUser();
 const [forecast, setForecast] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => { if (user?.id) loadForecast(); }, [user?.id]);

 const loadForecast = async () => {
 setLoading(true);
 try {
 const res = await apiClient.get("/crm/forecast", { params: { user_id: user.id } });
 setForecast(res.data);
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 };

 const fmt = (n) => `$${(n || 0).toLocaleString()}`;
 const summary = forecast?.summary || {};
 const deals = forecast?.forecast || [];

 return (
 <DashboardLayout>
 <TopBar title="Pipeline Forecast" subtitle="AI-powered deal predictions, risk scoring, and follow-up recommendations" />
 <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
 {loading ? (
 <div className="flex items-center justify-center py-32">
 <Loader2 className="w-8 h-8 animate-spin text-[var(--cth-admin-accent)]" />
 </div>
 ) : (
 <div className="space-y-8" data-testid="pipeline-forecast">
 {/* Summary Cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { label: 'Pipeline Value', value: fmt(summary.total_pipeline), icon: DollarSign, color: 'var(--cth-admin-accent)' },
 { label: 'Predicted Revenue', value: fmt(summary.predicted_revenue), icon: TrendingUp, color: 'var(--cth-status-success-bright)' },
 { label: 'At Risk', value: summary.at_risk || 0, icon: AlertTriangle, color: 'var(--cth-status-danger)' },
 { label: 'Healthy', value: summary.healthy || 0, icon: Shield, color: 'var(--cth-status-success-bright)' },
 ].map((c, i) => (
 <div key={i} className="p-5 rounded-2xl border border-[var(--cth-admin-border)] cth-card">
 <div className="flex items-center gap-2 mb-3">
 <c.icon size={16} style={{ color: c.color }} />
 <span className="text-xs text-[var(--cth-admin-muted)] uppercase tracking-wider font-semibold">{c.label}</span>
 </div>
 <div className="text-2xl font-bold cth-heading">{c.value}</div>
 </div>
 ))}
 </div>

 {/* Deal Forecasts */}
 {deals.length > 0 ? (
 <div className="space-y-3">
 <h3 className="cth-heading font-semibold">Deal Risk Analysis</h3>
 {deals.map((deal, i) => (
 <div key={deal.deal_id} data-testid={`forecast-deal-${deal.deal_id}`}
 className="p-5 rounded-2xl border border-[var(--cth-admin-border)] cth-card">
 <div className="flex items-start justify-between mb-3">
 <div>
 <h4 className="cth-heading font-semibold">{deal.title}</h4>
 <div className="flex items-center gap-3 mt-1">
 <span className="text-lg font-bold text-[var(--cth-admin-accent)]">{fmt(deal.value)}</span>
 <span className="text-xs text-[var(--cth-admin-muted)] capitalize">{deal.stage}</span>
 <span className="text-xs text-[var(--cth-admin-muted)]">{deal.age_days}d old</span>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className="w-3 h-3 rounded-full" style={{ background: RISK_COLORS[deal.risk_level] }} />
 <span className="text-xs font-bold uppercase" style={{ color: RISK_COLORS[deal.risk_level] }}>
 {deal.risk_level} risk ({deal.risk_score}%)
 </span>
 </div>
 </div>

 {/* Risk Factors */}
 {deal.risk_factors.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-3">
 {deal.risk_factors.map((f, j) => (
 <span key={j} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-[var(--cth-admin-muted)]">{f}</span>
 ))}
 </div>
 )}

 {/* Metrics row */}
 <div className="flex items-center gap-6 text-xs text-[var(--cth-admin-muted)] mb-3">
 <span className="flex items-center gap-1"><Activity size={12} /> {deal.activity_count} activities</span>
 <span className="flex items-center gap-1"><DollarSign size={12} /> {fmt(deal.weighted_value)} weighted</span>
 <span className="flex items-center gap-1"><Clock size={12} /> Close by {new Date(deal.predicted_close).toLocaleDateString()}</span>
 </div>

 {/* Follow-up recommendation */}
 <div className="p-3 rounded-xl bg-[rgba(224,78,53,0.04)] border border-[rgba(224,78,53,0.1)]">
 <div className="flex items-center gap-2">
 <PhoneCall size={12} className="text-[var(--cth-admin-accent)] flex-shrink-0" />
 <span className="text-xs text-[var(--cth-admin-muted)] font-medium">{deal.follow_up}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-16">
 <TrendingUp size={40} className="mx-auto text-[var(--cth-admin-muted)] mb-4" />
 <h3 className="cth-heading font-semibold mb-2">No Active Deals</h3>
 <p className="text-sm text-[var(--cth-admin-muted)]">Create deals in your CRM to see pipeline forecasts</p>
 </div>
 )}
 </div>
 )}
 </div>
 </DashboardLayout>
 );
}

// Export with plan gate wrapper
export default function PipelineForecast() {
 return (
 <PipelineForecastContent />
 );
}

