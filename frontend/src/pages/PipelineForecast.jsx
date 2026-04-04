import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout, TopBar } from '../components/Layout';
import {
  TrendingUp, AlertTriangle, DollarSign, Clock, Activity,
  Loader2, ChevronRight, Shield, PhoneCall
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const RISK_COLORS = { high: '#ef4444', medium: '#eab308', low: '#22c55e' };

function PipelineForecastContent() {
  const { user } = useUser();
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user?.id) loadForecast(); }, [user?.id]);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/crm/forecast?user_id=${user.id}`);
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
            <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
          </div>
        ) : (
          <div className="space-y-8" data-testid="pipeline-forecast">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Pipeline Value', value: fmt(summary.total_pipeline), icon: DollarSign, color: '#e04e35' },
                { label: 'Predicted Revenue', value: fmt(summary.predicted_revenue), icon: TrendingUp, color: '#22c55e' },
                { label: 'At Risk', value: summary.at_risk || 0, icon: AlertTriangle, color: '#ef4444' },
                { label: 'Healthy', value: summary.healthy || 0, icon: Shield, color: '#22c55e' },
              ].map((c, i) => (
                <div key={i} className="p-5 rounded-2xl border border-white/5 bg-[#2b1040]">
                  <div className="flex items-center gap-2 mb-3">
                    <c.icon size={16} style={{ color: c.color }} />
                    <span className="text-xs text-[#4a3550] uppercase tracking-wider font-semibold">{c.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{c.value}</div>
                </div>
              ))}
            </div>

            {/* Deal Forecasts */}
            {deals.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-white font-semibold">Deal Risk Analysis</h3>
                {deals.map((deal, i) => (
                  <div key={deal.deal_id} data-testid={`forecast-deal-${deal.deal_id}`}
                    className="p-5 rounded-2xl border border-white/5 bg-[#2b1040]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-white font-semibold">{deal.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-lg font-bold text-[#e04e35]">{fmt(deal.value)}</span>
                          <span className="text-xs text-[#4a3550] capitalize">{deal.stage}</span>
                          <span className="text-xs text-[#4a3550]">{deal.age_days}d old</span>
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
                          <span key={j} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-[#C7A09D]">{f}</span>
                        ))}
                      </div>
                    )}

                    {/* Metrics row */}
                    <div className="flex items-center gap-6 text-xs text-[#4a3550] mb-3">
                      <span className="flex items-center gap-1"><Activity size={12} /> {deal.activity_count} activities</span>
                      <span className="flex items-center gap-1"><DollarSign size={12} /> {fmt(deal.weighted_value)} weighted</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> Close by {new Date(deal.predicted_close).toLocaleDateString()}</span>
                    </div>

                    {/* Follow-up recommendation */}
                    <div className="p-3 rounded-xl bg-[rgba(224,78,53,0.04)] border border-[rgba(224,78,53,0.1)]">
                      <div className="flex items-center gap-2">
                        <PhoneCall size={12} className="text-[#e04e35] flex-shrink-0" />
                        <span className="text-xs text-[#C7A09D] font-medium">{deal.follow_up}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <TrendingUp size={40} className="mx-auto text-[#4a3550] mb-4" />
                <h3 className="text-white font-semibold mb-2">No Active Deals</h3>
                <p className="text-sm text-[#4a3550]">Create deals in your CRM to see pipeline forecasts</p>
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

