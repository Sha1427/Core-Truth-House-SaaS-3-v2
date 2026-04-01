import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ExternalLink, Tag, Loader2, ShoppingBag, ArrowRight } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

function StoreNav() {
  return (
    <nav className="w-full border-b border-white/5 bg-[#1c0828]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src="/cth-logo.png" alt="Core Truth House" className="h-8 w-auto object-contain" />
          <div className="leading-none">
            <span className="font-display text-sm font-bold text-white">Core Truth </span>
            <span className="font-display text-sm font-bold text-[#e04e35]">House</span>
          </div>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/blog" className="text-sm text-[#763b5b] hover:text-[#c7a09d] transition-colors">Blog</Link>
          <Link to="/store" className="text-sm text-[#e04e35] font-medium">Store</Link>
          <Link to="/sign-in" className="text-sm px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function AffiliateStore() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchLinks(); }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/public/affiliate-links`);
      setLinks(res.data.links || []);
    } catch (err) { console.error('Failed to fetch links:', err); }
    setLoading(false);
  };

  const handleClick = async (link) => {
    try { await axios.post(`${API}/api/admin/affiliate-links/${link.id}/click`); } catch {}
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const categories = ['all', ...new Set(links.map(l => l.category).filter(Boolean))];
  const filtered = filter === 'all' ? links : links.filter(l => l.category === filter);

  return (
    <div className="min-h-screen bg-[#1c0828]" data-testid="affiliate-store-page">
      <StoreNav />

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Recommended <span className="text-[#e04e35]">Tools</span>
            </h1>
            <p className="text-sm text-[#763b5b]">Hand-picked tools and resources we trust for building your brand</p>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap mt-8">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                data-testid={`store-filter-${cat}`}
                className={`px-4 py-2 rounded-full text-xs font-medium capitalize transition-colors ${
                  filter === cat ? 'bg-[#e04e35] text-white' : 'bg-white/5 text-[#a08aaa] hover:bg-white/10'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-[#4a3550] opacity-30 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
            <p className="text-sm text-[#4a3550]">Recommended tools will be added soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(link => (
              <div key={link.id} data-testid={`store-card-${link.id}`}
                className="group rounded-2xl border border-white/5 bg-[#2b1040] overflow-hidden hover:border-[rgba(224,78,53,0.25)] transition-all">
                {link.image_url ? (
                  <div className="h-48 overflow-hidden bg-[#1c0828]">
                    <img src={link.image_url} alt={link.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#e04e35]/10 to-[#af0024]/10 flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-[#e04e35]/30" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    {link.category && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-[#a08aaa] capitalize">{link.category}</span>
                    )}
                    {link.commission && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#e04e35]/10 text-[#e04e35]">{link.commission}</span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2 group-hover:text-[#e04e35] transition-colors">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-xs text-[#4a3550] line-clamp-3 mb-4">{link.description}</p>
                  )}
                  <button onClick={() => handleClick(link)}
                    data-testid={`store-visit-${link.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>
                    Visit <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-xs text-[#4a3550]">
          Some links on this page are affiliate links. We may earn a commission at no extra cost to you.
        </p>
        <p className="text-xs text-[#4a3550] mt-2">
          &copy; {new Date().getFullYear()} Core Truth House. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
