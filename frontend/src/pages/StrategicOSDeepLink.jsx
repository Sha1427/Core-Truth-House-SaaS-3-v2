import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PATH_TO_STEP = {
  '/audience-psychology': 2,
  '/differentiation':     3,
  '/competitor-analysis': 4,
  '/content-pillars':     5,
  '/platform-strategy':   6,
  '/monetization':        7,
};

const STEP_LABELS = {
  2: 'Audience Psychology',
  3: 'Differentiation',
  4: 'Competitor Analysis',
  5: 'Content Pillars',
  6: 'Platform Strategy',
  7: 'Monetization Path',
};

export default function StrategicOSDeepLink() {
  const navigate = useNavigate();
  const location = useLocation();
  const stepNum = PATH_TO_STEP[location.pathname] || 1;
  const stepLabel = STEP_LABELS[stepNum] || 'Strategic OS';

  useEffect(() => {
    sessionStorage.setItem('cth-strategic-os-open-step', String(stepNum));
    navigate('/strategic-os', { replace: true });
  }, [stepNum, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', background: '#0D0010', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(224,78,53,0.3)', borderTopColor: '#E04E35', animation: 'cth-spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Opening {stepLabel}...
        </p>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes cth-spin{to{transform:rotate(360deg)}}' }} />
      </div>
    </div>
  );
}
