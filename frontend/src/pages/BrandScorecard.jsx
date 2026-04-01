import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, Tooltip 
} from 'recharts';
import { Target, TrendingUp, Award, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useColors } from '../context/ThemeContext';

const API = import.meta.env.VITE_BACKEND_URL;

// Brand dimensions for the radar chart
const BRAND_DIMENSIONS = [
  { key: 'foundation', label: 'Foundation', description: 'Mission, vision, values, story' },
  { key: 'messaging', label: 'Messaging', description: 'Voice, tone, key messages' },
  { key: 'visual', label: 'Visual Identity', description: 'Colors, fonts, imagery' },
  { key: 'content', label: 'Content', description: 'Production and consistency' },
  { key: 'offers', label: 'Offers', description: 'Product/service architecture' },
  { key: 'systems', label: 'Systems', description: 'SOPs, workflows, operations' },
  { key: 'audience', label: 'Audience', description: 'ICP clarity and targeting' },
  { key: 'presence', label: 'Presence', description: 'Online visibility and reach' },
];

export default function BrandScorecard() {
  const { user } = useUser();
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [scoreData, setScoreData] = useState(null);
  const [overallScore, setOverallScore] = useState(0);

  const userId = user?.id;

  useEffect(() => {
    fetchScoreData();
  }, [userId]);

  const fetchScoreData = async () => {
    try {
      // Fetch various data points to calculate scores
      const [foundation, content, offers, systems, identity, memory] = await Promise.all([
        axios.get(`${API}/api/persist/brand-foundation?user_id=${userId}`).catch(() => ({ data: {} })),
        axios.get(`${API}/api/content?user_id=${userId}`).catch(() => ({ data: { content: [] } })),
        axios.get(`${API}/api/offers?user_id=${userId}`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/systems?user_id=${userId}`).catch(() => ({ data: [] })),
        axios.get(`${API}/api/identity?user_id=${userId}`).catch(() => ({ data: {} })),
        axios.get(`${API}/api/analytics/brand-memory?user_id=${userId}`).catch(() => ({ data: {} })),
      ]);

      // Calculate scores for each dimension
      const scores = calculateScores(foundation.data, content.data, offers.data, systems.data, identity.data, memory.data);
      setScoreData(scores);
      
      // Calculate overall score
      const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
      setOverallScore(Math.round(avg));
    } catch (err) {
      console.error('Error fetching score data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateScores = (foundation, content, offers, systems, identity, memory) => {
    // Foundation score: based on completed fields
    const foundationFields = ['mission', 'vision', 'values', 'origin_story', 'brand_promise', 'positioning'];
    const foundationComplete = foundationFields.filter(f => foundation[f] && foundation[f].length > 10).length;
    const foundationScore = Math.round((foundationComplete / foundationFields.length) * 100);

    // Messaging score: based on voice settings and content variety
    const voiceFields = ['voice_tone', 'brand_personality', 'key_messages'];
    const voiceComplete = voiceFields.filter(f => foundation[f] && foundation[f].length > 5).length;
    const messagingScore = Math.round((voiceComplete / voiceFields.length) * 100);

    // Visual score: based on identity completeness
    const hasColors = identity.colors && identity.colors.length >= 3;
    const hasFonts = identity.fonts && identity.fonts.heading && identity.fonts.body;
    const visualScore = (hasColors ? 50 : 0) + (hasFonts ? 50 : 0);

    // Content score: based on content pieces created
    const contentItems = content.content || [];
    const contentScore = Math.min(100, contentItems.length * 10);

    // Offers score: based on offers defined
    const offersArray = Array.isArray(offers) ? offers : [];
    const offersScore = Math.min(100, offersArray.length * 25);

    // Systems score: based on systems created
    const systemsArray = Array.isArray(systems) ? systems : [];
    const systemsScore = Math.min(100, systemsArray.length * 20);

    // Audience score: based on target audience definition
    const audienceFields = ['target_audience', 'pain_points', 'transformation'];
    const audienceComplete = audienceFields.filter(f => foundation[f] && foundation[f].length > 10).length;
    const audienceScore = Math.round((audienceComplete / audienceFields.length) * 100);

    // Presence score: based on overall activity
    const memoryScore = memory.memory_score || 0;
    const presenceScore = memoryScore;

    return [
      { key: 'foundation', label: 'Foundation', score: foundationScore, fullMark: 100 },
      { key: 'messaging', label: 'Messaging', score: messagingScore, fullMark: 100 },
      { key: 'visual', label: 'Visual', score: visualScore, fullMark: 100 },
      { key: 'content', label: 'Content', score: contentScore, fullMark: 100 },
      { key: 'offers', label: 'Offers', score: offersScore, fullMark: 100 },
      { key: 'systems', label: 'Systems', score: systemsScore, fullMark: 100 },
      { key: 'audience', label: 'Audience', score: audienceScore, fullMark: 100 },
      { key: 'presence', label: 'Presence', score: presenceScore, fullMark: 100 },
    ];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#eab308'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Developing';
    return 'Needs Work';
  };

  const getScoreIcon = (score) => {
    if (score >= 60) return <CheckCircle className="w-5 h-5" style={{ color: getScoreColor(score) }} />;
    return <AlertCircle className="w-5 h-5" style={{ color: getScoreColor(score) }} />;
  };

  // Get recommendations based on low scores
  const getRecommendations = () => {
    if (!scoreData) return [];
    const lowScores = scoreData.filter(s => s.score < 60).sort((a, b) => a.score - b.score);
    
    const recommendations = {
      foundation: 'Complete your Brand Foundation with mission, vision, and values to build a solid base.',
      messaging: 'Define your brand voice and key messages for consistent communication.',
      visual: 'Set up your visual identity with brand colors and typography in Identity Studio.',
      content: 'Start creating content in Content Studio to build your brand presence.',
      offers: 'Structure your offers in Offer Builder to clarify your value proposition.',
      systems: 'Document your processes in Systems Builder for scalable operations.',
      audience: 'Define your target audience and their pain points for focused marketing.',
      presence: 'Increase platform usage to strengthen your Brand Memory.',
    };

    return lowScores.slice(0, 3).map(s => ({
      dimension: s.label,
      action: recommendations[s.key],
      score: s.score
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
        </div>
      </DashboardLayout>
    );
  }

  const recommendations = getRecommendations();

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
      <div className="space-y-6" data-testid="brand-scorecard-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="w-7 h-7 text-[#e04e35]" />
            Brand Scorecard
          </h1>
          <p className="text-sm text-gray-400 mt-1">Your brand health across 8 key dimensions</p>
        </div>

        {/* Overall Score */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#2b1040] to-[#1c0828] border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Overall Brand Score</p>
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold" style={{ color: getScoreColor(overallScore) }}>
                  {overallScore}
                </span>
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              <p className="text-sm mt-2" style={{ color: getScoreColor(overallScore) }}>
                {getScoreLabel(overallScore)}
              </p>
            </div>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ 
              background: `conic-gradient(${getScoreColor(overallScore)} ${overallScore * 3.6}deg, rgba(255,255,255,0.1) 0deg)`
            }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: colors.darkest }}>
                <Award className="w-8 h-8" style={{ color: getScoreColor(overallScore) }} />
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart and Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="p-6 rounded-2xl bg-[#2b1040] border border-white/10">
            <h3 className="text-white font-semibold mb-4">Brand Health Radar</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={scoreData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke={colors.border} />
                  <PolarAngleAxis 
                    dataKey="label" 
                    tick={{ fill: colors.textMuted, fontSize: 11 }} 
                    tickLine={false}
                  />
                  <PolarRadiusAxis 
                    angle={22.5} 
                    domain={[0, 100]} 
                    tick={{ fill: colors.textMuted, fontSize: 10 }}
                    tickCount={5}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#e04e35"
                    fill="#e04e35"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: colors.darkest, 
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.textPrimary
                    }}
                    formatter={(value) => [`${value}/100`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="p-6 rounded-2xl bg-[#2b1040] border border-white/10">
            <h3 className="text-white font-semibold mb-4">Dimension Breakdown</h3>
            <div className="space-y-3">
              {scoreData?.map((dim) => (
                <div key={dim.key} className="flex items-center gap-3">
                  {getScoreIcon(dim.score)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{dim.label}</span>
                      <span className="text-sm font-medium" style={{ color: getScoreColor(dim.score) }}>
                        {dim.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${dim.score}%`,
                          background: `linear-gradient(90deg, ${getScoreColor(dim.score)}, ${getScoreColor(dim.score)}88)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#2b1040] border border-[#e04e35]/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#e04e35]" />
              Top Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{rec.dimension}</span>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          background: `${getScoreColor(rec.score)}20`,
                          color: getScoreColor(rec.score)
                        }}
                      >
                        {rec.score}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{rec.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dimension Details */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BRAND_DIMENSIONS.map((dim) => {
            const score = scoreData?.find(s => s.key === dim.key)?.score || 0;
            return (
              <div key={dim.key} className="p-4 rounded-xl bg-[#2b1040] border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{dim.label}</span>
                  <span 
                    className="text-sm font-bold"
                    style={{ color: getScoreColor(score) }}
                  >
                    {score}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">{dim.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
