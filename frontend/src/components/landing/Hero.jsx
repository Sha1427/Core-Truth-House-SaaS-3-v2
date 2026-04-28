import React from 'react';
import { Link } from 'react-router-dom';

export function Hero() {
 return (
 <section className="relative overflow-hidden bg-[var(--cth-surface-deep)] pt-16">
 <div className="absolute inset-0 pointer-events-none">
 <div
 className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
 style={{
 opacity: 0.1,
 background: 'radial-gradient(circle, var(--cth-admin-accent) 0%, transparent 70%)',
 }}
 />
 <div
 className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full"
 style={{
 opacity: 0.08,
 background: 'radial-gradient(circle, var(--cth-brand-primary-soft) 0%, transparent 70%)',
 }}
 />
 <div
 className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full"
 style={{
 opacity: 0.1,
 background: 'radial-gradient(circle, var(--cth-admin-ruby) 0%, transparent 70%)',
 }}
 />
 <div
 className="absolute inset-0"
 style={{
 opacity: 0.03,
 backgroundImage:
 'linear-gradient(rgba(224,78,53,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(224,78,53,0.5) 1px, transparent 1px)',
 backgroundSize: '72px 72px',
 }}
 />
 </div>

 <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 py-12 md:py-20 text-center">
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(224,78,53,0.3)] bg-[rgba(224,78,53,0.08)] mb-8">
 <span className="w-1.5 h-1.5 rounded-full bg-[var(--cth-admin-accent)] animate-pulse" />
 <span className="text-[11px] sm:text-xs text-[var(--cth-admin-accent)] font-medium tracking-wider uppercase">
 AI-Powered Brand Operating System
 </span>
 </div>

 <h1
 className="font-bold text-white mb-6 leading-[1.05]"
 style={{ fontSize: 'clamp(2.2rem, 7vw, 5rem)' }}
 >
 Build the brand{' '}
 <span
 style={{
 color: 'var(--cth-admin-accent)',
 textShadow: '0 0 36px rgba(224,78,53,0.35)',
 }}
 >
 behind the business
 </span>
 <br />
 before you build the brand
 <br />
 the world sees.
 </h1>

 <p
 className="text-[var(--cth-admin-muted)] mb-10 max-w-2xl mx-auto leading-relaxed"
 style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)' }}
 >
 Create your strategy, systems, offers, identity, and content in one
 powerful platform designed to build brands from the back to the front.
 </p>

 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 md:mb-14">
 <Link
 to="/sign-up"
 data-testid="hero-cta"
 className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:scale-[1.02]"
 style={{
 background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))',
 boxShadow: '0 8px 32px rgba(224,78,53,0.35)',
 }}
 >
 Start Building Free
 </Link>

 <a
 href="#how-it-works"
 className="w-full sm:w-auto px-8 py-4 rounded-2xl text-[var(--cth-admin-muted)] font-medium text-base border border-white/10 hover:border-[rgba(224,78,53,0.4)] hover:text-white transition-all"
 >
 See How It Works →
 </a>
 </div>

 <div className="relative mx-auto w-full max-w-5xl mb-12 md:mb-16">
 <div
 className="rounded-2xl overflow-hidden border"
 style={{
 borderColor: 'rgba(224,78,53,0.22)',
 background: 'var(--cth-surface-raised)',
 boxShadow:
 '0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
 }}
 >
 <div
 className="flex items-center gap-3 px-4 py-3"
 style={{
 background: 'var(--cth-surface-strong)',
 borderBottom: '1px solid rgba(255,255,255,0.05)',
 }}
 >
 <div className="flex gap-1.5">
 {['var(--cth-ui-red)', 'var(--cth-ui-yellow)', 'var(--cth-ui-green)'].map((c) => (
 <div
 key={c}
 style={{
 width: 9,
 height: 9,
 borderRadius: '50%',
 background: c,
 }}
 />
 ))}
 </div>

 <div
 className="flex-1 h-7 rounded-md flex items-center justify-center"
 style={{ background: 'rgba(255,255,255,0.05)' }}
 >
 <span className="text-[10px] text-white/25">
 coretruthhouse.com/dashboard
 </span>
 </div>
 </div>

 <div className="grid md:grid-cols-[180px_1fr] min-h-[420px]">
 <div
 className="hidden md:block"
 style={{
 background: 'var(--cth-surface-deep)',
 borderRight: '1px solid rgba(255,255,255,0.04)',
 }}
 >
 <div className="p-4">
 <div
 className="h-8 rounded-lg flex items-center gap-2 px-3"
 style={{
 background: 'linear-gradient(135deg,var(--cth-brand-primary),var(--cth-admin-accent))',
 }}
 >
 <div
 className="w-2 h-2 rounded-full bg-white"
 style={{ opacity: 0.9 }}
 />
 <span className="text-[9px] font-bold tracking-[0.08em] text-white">
 CORE TRUTH HOUSE
 </span>
 </div>
 </div>

 {[
 'Brand Foundation',
 'Content Studio',
 'Offer Builder',
 'Systems Builder',
 'Identity Studio',
 'Launch Planner',
 ].map((item, i) => (
 <div
 key={item}
 className="flex items-center gap-2 px-4 py-2"
 style={{
 background:
 i === 0 ? 'rgba(224,78,53,0.1)' : 'transparent',
 borderLeft:
 i === 0
 ? '2px solid var(--cth-admin-accent)'
 : '2px solid transparent',
 }}
 >
 <div
 className="w-1.5 h-1.5 rounded-full"
 style={{
 background:
 i === 0
 ? 'var(--cth-admin-accent)'
 : 'rgba(255,255,255,0.15)',
 }}
 />
 <span
 className="text-[10px]"
 style={{
 color:
 i === 0
 ? 'var(--cth-admin-accent)'
 : 'rgba(255,255,255,0.38)',
 fontWeight: i === 0 ? 600 : 400,
 }}
 >
 {item}
 </span>
 </div>
 ))}
 </div>

 <div className="p-4 sm:p-5 md:p-6">
 <div className="mb-4">
 <div
 className="h-3 rounded mb-2"
 style={{
 width: '140px',
 background: 'rgba(255,255,255,0.08)',
 }}
 />
 <div
 className="h-2 rounded"
 style={{
 width: '220px',
 maxWidth: '70%',
 background: 'rgba(255,255,255,0.04)',
 }}
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
 {[
 ['Brand Clarity', '92%', 'var(--cth-admin-accent)'],
 ['Offers Built', '4', 'var(--cth-admin-muted)'],
 ['Content Generated', '128', 'var(--cth-brand-primary)'],
 ].map(([label, val, color]) => (
 <div
 key={label}
 className="rounded-xl p-3"
 style={{
 background: 'var(--cth-surface-strong)',
 border: '1px solid rgba(255,255,255,0.05)',
 }}
 >
 <div className="text-[9px] text-white/35 mb-1">
 {label}
 </div>
 <div
 className="text-lg font-extrabold"
 style={{ color }}
 >
 {val}
 </div>
 </div>
 ))}
 </div>

 <div
 className="rounded-xl p-4 mb-4"
 style={{
 background: 'var(--cth-surface-strong)',
 border: '1px solid rgba(224,78,53,0.14)',
 }}
 >
 <div
 className="h-2 rounded mb-3"
 style={{
 width: '150px',
 background: 'rgba(255,255,255,0.07)',
 }}
 />
 {[82, 66, 91, 58].map((w, i) => (
 <div key={i} className="flex items-center gap-3 mb-2.5">
 <div
 className="w-14 h-1.5 rounded"
 style={{ background: 'rgba(255,255,255,0.06)' }}
 >
 <div
 className="h-full rounded"
 style={{
 width: `${w}%`,
 background:
 'linear-gradient(90deg,var(--cth-brand-primary),var(--cth-admin-accent))',
 }}
 />
 </div>
 <div
 className="flex-1 h-1.5 rounded"
 style={{ background: 'rgba(255,255,255,0.04)' }}
 />
 </div>
 ))}
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {[
 ['Strategy', 'var(--cth-admin-accent)'],
 ['Offers', 'var(--cth-admin-muted)'],
 ['Identity', 'var(--cth-admin-ruby)'],
 ['Content', 'var(--cth-brand-primary)'],
 ].map(([label, color]) => (
 <div
 key={label}
 className="rounded-xl p-3 text-left"
 style={{
 background: 'rgba(255,255,255,0.03)',
 border: '1px solid rgba(255,255,255,0.05)',
 }}
 >
 <div
 className="w-2 h-2 rounded-full mb-2"
 style={{ background: color }}
 />
 <div className="text-[10px] text-white/50">{label}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div
 className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
 style={{
 bottom: -24,
 width: '60%',
 height: 52,
 borderRadius: '999px',
 background: 'rgba(224,78,53,0.18)',
 filter: 'blur(28px)',
 }}
 />
 </div>

 <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
 {[
 'Brand Foundation',
 'Systems Builder',
 'Offer Builder',
 'Identity Studio',
 'Content Studio',
 'Launch Planner',
 ].map((item) => (
 <span
 key={item}
 className="text-xs text-[var(--cth-admin-ruby)] flex items-center gap-1.5"
 >
 <span className="w-1 h-1 rounded-full bg-[var(--cth-admin-accent)]" />
 {item}
 </span>
 ))}
 </div>
 </div>
 </section>
 );
}
