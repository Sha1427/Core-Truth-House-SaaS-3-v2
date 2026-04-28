import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
 ArrowLeft, Calendar, Clock, Eye, Tag, Search, Loader2, User
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

function BlogNav() {
 return (
 <nav className="w-full border-b border-white/5 bg-[var(--cth-surface-deep)]/95 backdrop-blur-xl sticky top-0 z-50">
 <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
 <Link to="/" className="flex items-center gap-3">
 <img src="/brand-assets/logo/cth-logo-horizontal.png" alt="Core Truth House" className="h-8 w-auto object-contain" />
 <div className="leading-none">
 <span className="font-display text-sm font-bold text-white">Core Truth </span>
 <span className="font-display text-sm font-bold text-[var(--cth-admin-accent)]">House</span>
 </div>
 </Link>
 <div className="flex items-center gap-6">
 <Link to="/blog" className="text-sm text-[var(--cth-admin-accent)] font-medium">Blog</Link>
 <Link to="/store" className="text-sm text-[var(--cth-admin-ruby)] hover:text-[var(--cth-admin-muted)] transition-colors">Store</Link>
 <Link to="/sign-in" className="text-sm px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
 style={{ background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))' }}>
 Sign In
 </Link>
 </div>
 </div>
 </nav>
 );
}

function BlogList() {
 const [articles, setArticles] = useState([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [categories, setCategories] = useState([]);
 const [activeCategory, setActiveCategory] = useState(null);

 useEffect(() => {
 fetchArticles();
 fetchCategories();
 }, [activeCategory]);

 const fetchArticles = async () => {
 setLoading(true);
 try {
 let url = `${API}/api/blog/public/articles?limit=20`;
 if (activeCategory) url += `&category=${activeCategory}`;
 if (search) url += `&search=${encodeURIComponent(search)}`;
 const res = await axios.get(url);
 setArticles(res.data.articles || []);
 } catch (err) { console.error('Failed to fetch articles:', err); }
 setLoading(false);
 };

 const fetchCategories = async () => {
 try {
 const res = await axios.get(`${API}/api/blog/public/categories`);
 setCategories(res.data.categories || []);
 } catch {}
 };

 const handleSearch = (e) => {
 e.preventDefault();
 fetchArticles();
 };

 return (
 <div className="min-h-screen bg-[var(--cth-surface-deep)]" data-testid="public-blog-page">
 <BlogNav />

 {/* Hero */}
 <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
 <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
 The <span className="text-[var(--cth-admin-accent)]">Brand Truth</span> Blog
 </h1>
 <p className="text-lg text-[var(--cth-admin-ruby)] max-w-2xl mb-8">
 Insights on brand strategy, content creation, and building a business that reflects who you truly are.
 </p>

 {/* Search */}
 <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mb-8">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cth-admin-muted)]" />
 <input data-testid="blog-search" type="text" value={search} onChange={e => setSearch(e.target.value)}
 placeholder="Search articles..."
 className="w-full pl-10 pr-4 py-3 bg-[var(--cth-admin-ink)] border border-white/10 rounded-xl text-white text-sm placeholder-[var(--cth-admin-muted)] focus:outline-none focus:border-[var(--cth-admin-accent)]/50" />
 </div>
 <button type="submit" className="px-5 py-3 rounded-xl text-white text-sm font-medium"
 style={{ background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))' }}>
 Search
 </button>
 </form>

 {/* Category Filters */}
 {categories.length > 0 && (
 <div className="flex gap-2 flex-wrap mb-8">
 <button onClick={() => setActiveCategory(null)}
 className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
 !activeCategory ? 'bg-[var(--cth-admin-accent)] text-white' : 'bg-white/5 text-[var(--cth-admin-muted)] hover:bg-white/10'
 }`}>
 All
 </button>
 {categories.map(cat => (
 <button key={cat.id || cat.slug} onClick={() => setActiveCategory(cat.id || cat.slug)}
 className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
 activeCategory === (cat.id || cat.slug) ? 'text-white' : 'bg-white/5 text-[var(--cth-admin-muted)] hover:bg-white/10'
 }`}
 style={activeCategory === (cat.id || cat.slug) ? { background: cat.color || 'var(--cth-admin-accent)' } : {}}>
 {cat.name}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Articles Grid */}
 <div className="max-w-6xl mx-auto px-6 pb-20">
 {loading ? (
 <div className="flex items-center justify-center py-20">
 <Loader2 className="w-8 h-8 animate-spin text-[var(--cth-admin-accent)]" />
 </div>
 ) : articles.length === 0 ? (
 <div className="text-center py-20">
 <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
 <Tag className="w-7 h-7 text-[var(--cth-admin-muted)]" />
 </div>
 <h3 className="text-lg font-semibold text-white mb-2">No articles yet</h3>
 <p className="text-sm text-[var(--cth-admin-muted)]">Published articles will appear here.</p>
 </div>
 ) : (
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {articles.map(article => (
 <Link key={article.id} to={`/blog/${article.slug}`}
 data-testid={`blog-card-${article.slug}`}
 className="group rounded-2xl border border-white/5 bg-[var(--cth-admin-ink)] overflow-hidden hover:border-[rgba(224,78,53,0.25)] transition-all">
 {article.featured_image && (
 <div className="h-48 overflow-hidden">
 <img src={article.featured_image} alt={article.title}
 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
 </div>
 )}
 <div className="p-5">
 <div className="flex items-center gap-2 mb-3 flex-wrap">
 {article.tags?.slice(0, 2).map(tag => (
 <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[var(--cth-admin-muted)]">{tag}</span>
 ))}
 </div>
 <h2 className="text-white font-semibold text-base mb-2 group-hover:text-[var(--cth-admin-accent)] transition-colors line-clamp-2">
 {article.title}
 </h2>
 <p className="text-xs text-[var(--cth-admin-muted)] line-clamp-3 mb-4">{article.excerpt}</p>
 <div className="flex items-center gap-4 text-xs text-[var(--cth-admin-muted)]">
 {article.author_name && <span className="flex items-center gap-1"><User size={10} />{article.author_name}</span>}
 {article.published_at && <span className="flex items-center gap-1"><Calendar size={10} />{new Date(article.published_at).toLocaleDateString()}</span>}
 {article.reading_time > 0 && <span className="flex items-center gap-1"><Clock size={10} />{article.reading_time} min</span>}
 </div>
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

function BlogArticle() {
 const { slug } = useParams();
 const [article, setArticle] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchArticle();
 }, [slug]);

 const fetchArticle = async () => {
 setLoading(true);
 try {
 const res = await axios.get(`${API}/api/blog/public/articles/${slug}`);
 setArticle(res.data.article);
 } catch (err) { console.error('Failed to fetch article:', err); }
 setLoading(false);
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-[var(--cth-surface-deep)]">
 <BlogNav />
 <div className="flex items-center justify-center py-20">
 <Loader2 className="w-8 h-8 animate-spin text-[var(--cth-admin-accent)]" />
 </div>
 </div>
 );
 }

 if (!article) {
 return (
 <div className="min-h-screen bg-[var(--cth-surface-deep)]">
 <BlogNav />
 <div className="text-center py-20">
 <h2 className="text-2xl font-bold text-white mb-2">Article not found</h2>
 <Link to="/blog" className="text-[var(--cth-admin-accent)] hover:underline">Back to Blog</Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[var(--cth-surface-deep)]" data-testid="blog-article-page">
 <BlogNav />
 <article className="max-w-3xl mx-auto px-6 py-12">
 <Link to="/blog" className="flex items-center gap-2 text-sm text-[var(--cth-admin-ruby)] hover:text-[var(--cth-admin-accent)] transition-colors mb-8">
 <ArrowLeft size={14} /> Back to Blog
 </Link>

 {article.featured_image && (
 <div className="rounded-2xl overflow-hidden mb-8 border border-white/5">
 <img src={article.featured_image} alt={article.title} className="w-full max-h-[400px] object-cover" />
 </div>
 )}

 <div className="flex items-center gap-3 mb-4 flex-wrap">
 {article.tags?.map(tag => (
 <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[var(--cth-admin-accent)]/10 text-[var(--cth-admin-accent)]">{tag}</span>
 ))}
 </div>

 <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
 {article.title}
 </h1>

 <div className="flex items-center gap-6 text-sm text-[var(--cth-admin-ruby)] mb-10 pb-8 border-b border-white/5">
 {article.author_name && <span className="flex items-center gap-2"><User size={14} />{article.author_name}</span>}
 {article.published_at && <span className="flex items-center gap-2"><Calendar size={14} />{new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
 {article.reading_time > 0 && <span className="flex items-center gap-2"><Clock size={14} />{article.reading_time} min read</span>}
 <span className="flex items-center gap-2"><Eye size={14} />{article.views || 0} views</span>
 </div>

 <div className="blog-content text-gray-300 leading-relaxed"
 dangerouslySetInnerHTML={{ __html: article.content }} />

 <div className="mt-12 pt-8 border-t border-white/5">
 <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
 style={{ background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))' }}>
 <ArrowLeft size={14} /> More Articles
 </Link>
 </div>
 </article>
 </div>
 );
}

export { BlogList, BlogArticle };
