import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOPrintReport from '../lib/SEOPrintReport';
import axios from 'axios';
import { useUser } from '../hooks/useAuth';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function SEOPrintPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const userId = user?.id || 'default';
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSEOData() {
      try {
        const [auditRes, keywordsRes, competitorRes, shiftsRes] = await Promise.allSettled([
          axios.get(`${API}/api/seo/audits?user_id=${userId}`),
          axios.get(`${API}/api/seo/keywords?user_id=${userId}`),
          axios.get(`${API}/api/seo/competitors?user_id=${userId}`),
          axios.get(`${API}/api/seo/market-shifts?user_id=${userId}`),
        ]);

        const audits = auditRes.status === 'fulfilled' ? auditRes.value.data : {};
        const keywords = keywordsRes.status === 'fulfilled' ? keywordsRes.value.data : {};
        const competitors = competitorRes.status === 'fulfilled' ? competitorRes.value.data : {};
        const shifts = shiftsRes.status === 'fulfilled' ? shiftsRes.value.data : {};

        if (audits.audits?.length || keywords.keywords?.length || competitors.analyses?.length || shifts.shifts?.length) {
          setSeoData({
            siteAudit: audits.audits?.[0] || null,
            rankingGaps: keywords,
            competitors: competitors,
            marketShifts: shifts,
          });
        }
      } catch (e) {
        console.error('Failed to load SEO data:', e);
      }
      setLoading(false);
    }
    loadSEOData();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f0f8' }}>
        <p style={{ fontSize: 14, color: '#9c8fb0' }}>Loading SEO data...</p>
      </div>
    );
  }

  return <SEOPrintReport data={seoData} onClose={() => navigate('/seo')} />;
}
