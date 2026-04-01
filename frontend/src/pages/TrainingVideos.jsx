import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { Video, Play, Filter } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

export default function TrainingVideos() {
  const colors = useColors();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get(`${API}/api/admin/training-videos`);
        setVideos(res.data.videos || []);
      } catch (err) {
        console.error('Failed to load training videos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const categories = ['all', ...new Set(videos.map(v => v.category))];
  const filtered = selectedCategory === 'all' ? videos : videos.filter(v => v.category === selectedCategory);

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="training-videos-page">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Video size={28} style={{ color: colors.cinnabar }} />
            Training Library
          </h1>
          <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
            Learn how to make the most of your brand tools
          </p>
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              data-testid={`filter-${cat}`}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: selectedCategory === cat ? `1px solid ${colors.cinnabar}` : `1px solid ${colors.border}`,
                background: selectedCategory === cat ? `${colors.cinnabar}22` : 'transparent',
                color: selectedCategory === cat ? colors.cinnabar : colors.textMuted,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {cat === 'all' ? 'All Videos' : cat.replace(/-/g, ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: colors.textMuted }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Video size={48} style={{ color: colors.textMuted, margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 16, color: colors.textPrimary, fontWeight: 600, marginBottom: 8 }}>No videos available yet</p>
            <p style={{ fontSize: 14, color: colors.textMuted }}>Training content will be added soon</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {filtered.map(video => {
              const embedUrl = getEmbedUrl(video.url);
              return (
                <div
                  key={video.id}
                  data-testid={`video-card-${video.id}`}
                  style={{
                    borderRadius: 16,
                    border: `1px solid ${colors.border}`,
                    background: colors.darker,
                    overflow: 'hidden',
                  }}
                >
                  {embedUrl ? (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                      <iframe
                        src={embedUrl}
                        title={video.title}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a href={video.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: 200, background: `${colors.cinnabar}10`,
                        textDecoration: 'none',
                      }}
                    >
                      <Play size={48} style={{ color: colors.cinnabar }} />
                    </a>
                  )}
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>{video.title}</h3>
                    {video.description && (
                      <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{video.description}</p>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <span style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 6,
                        background: `${colors.tuscany}15`, color: colors.tuscany,
                        textTransform: 'capitalize',
                      }}>
                        {video.category?.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
