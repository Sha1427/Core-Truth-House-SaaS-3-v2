/**
 * DigitalStore.jsx
 * Core Truth House digital store
 */

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useUser } from '../hooks/useAuth'

const API = import.meta.env.VITE_BACKEND_URL

const C = {
 bg: 'var(--cth-brand-primary-deep)',
 card: 'var(--cth-admin-panel)',
 border: 'var(--cth-admin-border)',
 accent: 'var(--cth-admin-accent)',
 crimson: 'var(--cth-brand-primary)',
 tuscany: 'var(--cth-admin-muted)',
 purple: 'var(--cth-brand-primary-soft)',
 gold: 'var(--cth-brand-secondary)',
 green: 'var(--cth-status-success-bright)',
 white: 'var(--cth-white)',
 t70: 'var(--cth-admin-ink-soft)',
 t50: 'var(--cth-admin-muted)',
 t30: 'var(--cth-admin-muted)',
 t10: 'var(--cth-admin-border)',
 font: "'DM Sans', sans-serif",
 serif: 'DM Sans, system-ui, sans-serif',
}

const CATEGORY_LABELS = {
 template: '📄 Template',
 course: '🎓 Course',
 toolkit: '🧰 Toolkit',
 bundle: '📦 Bundle',
 other: '✦ Other',
}

function StoreNav() {
 return (
 <nav
 style={{
 position: 'sticky',
 top: 0,
 zIndex: 50,
 borderBottom: `1px solid ${C.border}`,
 background: 'rgba(13,0,16,0.95)',
 backdropFilter: 'blur(16px)',
 }}
 >
 <div
 style={{
 maxWidth: 1100,
 margin: '0 auto',
 padding: '14px 24px',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'space-between',
 }}
 >
 <Link
 to="/"
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 10,
 textDecoration: 'none',
 }}
 >
 <img
 src="/cth-logo.png"
 alt="Core Truth House"
 style={{ height: 32, objectFit: 'contain' }}
 />
 <span
 style={{
 fontFamily: C.serif,
 fontSize: 15,
 fontWeight: 700,
 color: C.white,
 }}
 >
 Core Truth <span style={{ color: C.accent }}>House</span>
 </span>
 </Link>

 <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
 <Link
 to="/store"
 style={{
 fontSize: 13,
 fontWeight: 600,
 color: C.accent,
 fontFamily: C.font,
 textDecoration: 'none',
 }}
 >
 Store
 </Link>
 <Link
 to="/blog"
 style={{
 fontSize: 13,
 color: C.t50,
 fontFamily: C.font,
 textDecoration: 'none',
 }}
 >
 Blog
 </Link>
 <Link
 to="/sign-in"
 style={{
 fontSize: 13,
 fontWeight: 600,
 color: C.white,
 fontFamily: C.font,
 textDecoration: 'none',
 padding: '7px 18px',
 borderRadius: 8,
 background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))',
 }}
 >
 Sign In
 </Link>
 </div>
 </div>
 </nav>
 )
}

function ProductCard({ product, onSelect }) {
 const [hovered, setHovered] = useState(false)
 const price = product.price_cents
 ? `$${(product.price_cents / 100).toFixed(0)}`
 : 'Free'

 return (
 <div
 onClick={() => onSelect(product)}
 onMouseEnter={() => setHovered(true)}
 onMouseLeave={() => setHovered(false)}
 style={{
 background: C.card,
 border: `1px solid ${hovered ? 'rgba(224,78,53,0.3)' : C.border}`,
 borderRadius: 14,
 overflow: 'hidden',
 transition: 'all 0.18s',
 transform: hovered ? 'translateY(-3px)' : 'none',
 boxShadow: hovered ? '0 12px 40px rgba(224,78,53,0.12)' : 'none',
 cursor: 'pointer',
 display: 'flex',
 flexDirection: 'column',
 }}
 >
 <div
 style={{
 height: 180,
 background: product.cover_url
 ? `url(${product.cover_url}) center/cover no-repeat`
 : 'linear-gradient(135deg, var(--cth-brand-primary-soft) 0%, var(--cth-surface-night) 50%, var(--cth-brand-primary-deep) 100%)',
 position: 'relative',
 flexShrink: 0,
 }}
 >
 <span
 style={{
 position: 'absolute',
 top: 12,
 left: 12,
 fontSize: 10,
 fontWeight: 700,
 letterSpacing: '0.08em',
 padding: '3px 10px',
 borderRadius: 20,
 background: 'rgba(13,0,16,0.85)',
 color: C.tuscany,
 fontFamily: C.font,
 border: '1px solid rgba(199,160,157,0.2)',
 }}
 >
 {CATEGORY_LABELS[product.category] || '✦ Product'}
 </span>

 <span
 style={{
 position: 'absolute',
 top: 12,
 right: 12,
 fontSize: 13,
 fontWeight: 800,
 padding: '4px 12px',
 borderRadius: 20,
 background: product.is_purchased
 ? 'rgba(16,185,129,0.15)'
 : 'rgba(224,78,53,0.15)',
 color: product.is_purchased ? 'var(--cth-status-success-bright)' : C.accent,
 fontFamily: C.font,
 border: `1px solid ${
 product.is_purchased
 ? 'rgba(16,185,129,0.3)'
 : 'rgba(224,78,53,0.3)'
 }`,
 }}
 >
 {product.is_purchased ? '✓ Owned' : price}
 </span>

 {!product.cover_url && (
 <div
 style={{
 position: 'absolute',
 inset: 0,
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 fontSize: 48,
 opacity: 0.3,
 }}
 >
 {product.category === 'template'
 ? '📄'
 : product.category === 'course'
 ? '🎓'
 : product.category === 'toolkit'
 ? '🧰'
 : '📦'}
 </div>
 )}
 </div>

 <div
 style={{
 padding: '16px 18px',
 flex: 1,
 display: 'flex',
 flexDirection: 'column',
 }}
 >
 <h3
 style={{
 fontFamily: C.serif,
 fontSize: 16,
 fontWeight: 700,
 color: C.white,
 margin: '0 0 8px',
 lineHeight: 1.3,
 }}
 >
 {product.name}
 </h3>

 <p
 style={{
 fontSize: 12,
 color: C.t50,
 fontFamily: C.font,
 lineHeight: 1.6,
 margin: '0 0 16px',
 flex: 1,
 }}
 >
 {(product.description || '').substring(0, 100)}
 {product.description?.length > 100 ? '...' : ''}
 </p>

 {product.tags && product.tags.length > 0 && (
 <div
 style={{
 display: 'flex',
 gap: 5,
 flexWrap: 'wrap',
 marginBottom: 12,
 }}
 >
 {product.tags.slice(0, 3).map((tag) => (
 <span
 key={tag}
 style={{
 fontSize: 9.5,
 color: C.t30,
 background: C.t10,
 padding: '2px 8px',
 borderRadius: 20,
 fontFamily: C.font,
 }}
 >
 {tag}
 </span>
 ))}
 </div>
 )}

 <button
 type="button"
 style={{
 width: '100%',
 padding: '10px',
 borderRadius: 8,
 border: 'none',
 cursor: 'pointer',
 fontFamily: C.font,
 fontSize: 13,
 fontWeight: 600,
 background: product.is_purchased
 ? 'rgba(16,185,129,0.12)'
 : 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))',
 color: product.is_purchased ? 'var(--cth-status-success-bright)' : C.white,
 boxShadow: product.is_purchased
 ? 'none'
 : '0 4px 16px rgba(224,78,53,0.25)',
 }}
 >
 {product.is_purchased ? '⬇ Download' : `Buy for ${price}`}
 </button>
 </div>
 </div>
 )
}

function ProductModal({ product, onClose, onBuy, buying }) {
 if (!product) return null

 const hasDownload = Boolean(product.download_url)

 return (
 <div
 style={{
 position: 'fixed',
 inset: 0,
 zIndex: 200,
 background: 'rgba(0,0,0,0.82)',
 display: 'flex',
 alignItems: 'center',
 justifyContent: 'center',
 padding: 24,
 }}
 onClick={onClose}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 style={{
 background: 'var(--cth-surface-night)',
 border: '1px solid var(--cth-admin-border)',
 borderRadius: 16,
 padding: '32px 36px',
 maxWidth: 520,
 width: '100%',
 maxHeight: '88vh',
 overflowY: 'auto',
 fontFamily: C.font,
 }}
 >
 {product.cover_url && (
 <img
 src={product.cover_url}
 alt={product.name}
 style={{
 width: '100%',
 borderRadius: 10,
 marginBottom: 20,
 height: 200,
 objectFit: 'cover',
 }}
 />
 )}

 <div
 style={{
 display: 'flex',
 alignItems: 'flex-start',
 justifyContent: 'space-between',
 gap: 16,
 marginBottom: 12,
 }}
 >
 <h2
 style={{
 fontFamily: C.serif,
 fontSize: 22,
 fontWeight: 700,
 color: C.white,
 margin: 0,
 }}
 >
 {product.name}
 </h2>
 <button
 onClick={onClose}
 style={{
 background: 'none',
 border: 'none',
 cursor: 'pointer',
 color: C.t30,
 fontSize: 22,
 }}
 >
 ×
 </button>
 </div>

 <div
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: 10,
 marginBottom: 18,
 }}
 >
 <span
 style={{
 fontSize: 11,
 color: C.tuscany,
 background: 'rgba(199,160,157,0.1)',
 padding: '3px 10px',
 borderRadius: 20,
 }}
 >
 {CATEGORY_LABELS[product.category] || 'Product'}
 </span>
 <span style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>
 ${(product.price_cents / 100).toFixed(0)}
 </span>
 </div>

 <p
 style={{
 fontSize: 13.5,
 color: C.t70,
 lineHeight: 1.7,
 marginBottom: 22,
 }}
 >
 {product.description}
 </p>

 {product.tags && product.tags.length > 0 && (
 <div
 style={{
 display: 'flex',
 gap: 6,
 flexWrap: 'wrap',
 marginBottom: 22,
 }}
 >
 {product.tags.map((tag) => (
 <span
 key={tag}
 style={{
 fontSize: 10,
 color: C.t50,
 background: C.t10,
 padding: '3px 10px',
 borderRadius: 20,
 }}
 >
 {tag}
 </span>
 ))}
 </div>
 )}

 {product.is_purchased && hasDownload ? (
 <a
 href={`${API}${product.download_url}`}
 target="_blank"
 rel="noopener noreferrer"
 style={{
 display: 'block',
 width: '100%',
 padding: '12px',
 textAlign: 'center',
 borderRadius: 9,
 textDecoration: 'none',
 background: 'rgba(16,185,129,0.12)',
 border: '1px solid rgba(16,185,129,0.3)',
 color: 'var(--cth-status-success-bright)',
 fontWeight: 600,
 fontSize: 14,
 }}
 >
 ⬇ Download Your Purchase
 </a>
 ) : (
 <button
 onClick={() => onBuy(product)}
 disabled={buying}
 style={{
 width: '100%',
 padding: '13px',
 borderRadius: 9,
 border: 'none',
 cursor: buying ? 'wait' : 'pointer',
 fontFamily: C.font,
 fontSize: 14,
 fontWeight: 700,
 color: C.white,
 background: buying
 ? 'rgba(224,78,53,0.5)'
 : 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))',
 boxShadow: '0 4px 20px rgba(224,78,53,0.3)',
 }}
 >
 {buying
 ? 'Redirecting to checkout...'
 : `Buy for $${(product.price_cents / 100).toFixed(0)}`}
 </button>
 )}

 <p
 style={{
 fontSize: 10.5,
 color: C.t30,
 textAlign: 'center',
 margin: '12px 0 0',
 }}
 >
 Secure checkout via Stripe · Instant download after payment
 </p>
 </div>
 </div>
 )
}

export default function DigitalStore() {
 useUser()

 const [products, setProducts] = useState([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState('all')
 const [selected, setSelected] = useState(null)
 const [buying, setBuying] = useState(false)
 const [toast, setToast] = useState(null)

 function showToast(msg, isError = false) {
 setToast({ msg, isError })
 setTimeout(() => setToast(null), 4000)
 }

 async function loadProducts(activeFilter = filter) {
 setLoading(true)
 try {
 const url =
 activeFilter === 'all'
 ? `${API}/api/store/products`
 : `${API}/api/store/products?category=${encodeURIComponent(activeFilter)}`

 const res = await axios.get(url)
 setProducts(res.data.products || [])
 } catch (err) {
 console.error(err)
 showToast('Unable to load products right now.', true)
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 loadProducts(filter)

 const params = new URLSearchParams(window.location.search)
 if (params.get('purchased') === 'true') {
 showToast('Purchase complete! Your download is ready.')
 window.history.replaceState({}, '', '/store')
 }
 }, [filter])

 async function handleBuy(product) {
 if (product.is_purchased && product.download_url) {
 window.open(`${API}${product.download_url}`, '_blank')
 return
 }

 setBuying(true)

 try {
 const res = await axios.post(
 `${API}/api/store/products/${product.product_id || product.id}/purchase`,
 {
 success_url: `${window.location.origin}/store?purchased=true`,
 cancel_url: `${window.location.origin}/store`,
 }
 )

 if (res.data.already_purchased && res.data.download_url) {
 showToast('Already purchased! Opening download...')
 window.open(`${API}${res.data.download_url}`, '_blank')
 } else if (res.data.checkout_url) {
 window.location.href = res.data.checkout_url
 } else if (res.data.pending) {
 showToast('A checkout session is already pending.')
 } else {
 showToast('Unable to start checkout.', true)
 }
 } catch (err) {
 const message =
 err?.response?.data?.detail ||
 'Something went wrong. Please try again.'
 showToast(message, true)
 console.error(err)
 } finally {
 setBuying(false)
 }
 }

 const categories = ['all', 'template', 'toolkit', 'course', 'bundle', 'other']

 return (
 <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font }}>
 <style
 dangerouslySetInnerHTML={{
 __html: `
 @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
 * { box-sizing: border-box; }
 body { margin: 0; }
 ::-webkit-scrollbar { width: 5px; }
 ::-webkit-scrollbar-track { background: transparent; }
 ::-webkit-scrollbar-thumb { background: var(--cth-admin-border); border-radius: 3px; }
 @keyframes spin { to { transform: rotate(360deg); } }
 `,
 }}
 />

 <StoreNav />

 <div
 style={{
 textAlign: 'center',
 padding: '72px 24px 48px',
 position: 'relative',
 overflow: 'hidden',
 }}
 >
 <div
 style={{
 position: 'absolute',
 top: '50%',
 left: '50%',
 transform: 'translate(-50%,-50%)',
 width: 600,
 height: 600,
 borderRadius: '50%',
 background:
 'radial-gradient(circle, rgba(224,78,53,0.08) 0%, transparent 70%)',
 pointerEvents: 'none',
 }}
 />
 <div
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: 6,
 padding: '5px 14px',
 borderRadius: 20,
 border: '1px solid rgba(224,78,53,0.25)',
 background: 'rgba(224,78,53,0.06)',
 marginBottom: 20,
 }}
 >
 <span
 style={{
 width: 6,
 height: 6,
 borderRadius: '50%',
 background: C.accent,
 display: 'inline-block',
 }}
 />
 <span
 style={{
 fontSize: 11,
 color: C.accent,
 fontWeight: 600,
 letterSpacing: '0.1em',
 textTransform: 'uppercase',
 }}
 >
 Digital Products
 </span>
 </div>

 <h1
 style={{
 fontFamily: C.serif,
 fontSize: 'clamp(2rem, 5vw, 3.5rem)',
 fontWeight: 700,
 color: C.white,
 margin: '0 0 16px',
 lineHeight: 1.1,
 }}
 >
 Tools that build{' '}
 <em style={{ fontStyle: 'normal', color: C.accent }}>real brands</em>
 </h1>

 <p
 style={{
 fontSize: 16,
 color: C.t50,
 maxWidth: 480,
 margin: '0 auto',
 lineHeight: 1.7,
 }}
 >
 Templates, toolkits, and courses from Core Truth House built for
 founders who do the work.
 </p>
 </div>

 <div
 style={{
 display: 'flex',
 justifyContent: 'center',
 gap: 8,
 padding: '0 24px 36px',
 flexWrap: 'wrap',
 }}
 >
 {categories.map((cat) => (
 <button
 key={cat}
 onClick={() => setFilter(cat)}
 style={{
 padding: '7px 18px',
 borderRadius: 20,
 cursor: 'pointer',
 fontFamily: C.font,
 fontSize: 12.5,
 fontWeight: 500,
 border: `1px solid ${
 filter === cat ? 'rgba(224,78,53,0.4)' : C.border
 }`,
 background:
 filter === cat
 ? 'rgba(224,78,53,0.1)'
 : 'var(--cth-admin-panel-alt)',
 color: filter === cat ? C.white : C.t50,
 transition: 'all 0.15s',
 }}
 >
 {cat === 'all' ? 'All Products' : CATEGORY_LABELS[cat] || cat}
 </button>
 ))}
 </div>

 <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
 {loading ? (
 <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
 <div
 style={{
 width: 28,
 height: 28,
 borderRadius: '50%',
 border: '2px solid rgba(224,78,53,0.3)',
 borderTopColor: C.accent,
 animation: 'spin 0.8s linear infinite',
 }}
 />
 </div>
 ) : products.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '80px 0' }}>
 <span style={{ fontSize: 40 }}>📦</span>
 <p style={{ fontSize: 16, color: C.t50, margin: '16px 0 0' }}>
 No products available yet. Check back soon.
 </p>
 </div>
 ) : (
 <div
 style={{
 display: 'grid',
 gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
 gap: 20,
 }}
 >
 {products.map((product) => (
 <ProductCard
 key={product.product_id || product.id}
 product={product}
 onSelect={setSelected}
 />
 ))}
 </div>
 )}
 </div>

 <ProductModal
 product={selected}
 onClose={() => setSelected(null)}
 onBuy={handleBuy}
 buying={buying}
 />

 {toast && (
 <div
 style={{
 position: 'fixed',
 bottom: 24,
 right: 24,
 zIndex: 300,
 padding: '12px 20px',
 borderRadius: 10,
 fontFamily: C.font,
 fontSize: 13,
 fontWeight: 500,
 background: toast.isError
 ? 'rgba(239,68,68,0.15)'
 : 'rgba(16,185,129,0.15)',
 border: `1px solid ${
 toast.isError
 ? 'rgba(239,68,68,0.3)'
 : 'rgba(16,185,129,0.3)'
 }`,
 color: toast.isError ? 'var(--cth-status-danger)' : 'var(--cth-status-success-bright)',
 }}
 >
 {toast.msg}
 </div>
 )}
 </div>
 )
}
