import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SECTION_LINKS = [
 { label: 'Features', id: 'features' },
 { label: 'How It Works', id: 'how-it-works' },
 { label: 'Tiers', to: '/tiers' },
];

const PAGE_LINKS = [
 { label: 'Tiers', to: '/tiers' },
  { label: 'About', to: '/about' }
 { label: 'Blog', to: '/blog' },
 { label: 'Methodology', to: '/methodology' },
 { label: 'Store', to: '/store' },
];

export function Nav() {
 const [mobileOpen, setMobileOpen] = React.useState(false);
 const navigate = useNavigate();
 const location = useLocation();

 const goToSection = (sectionId) => {
 setMobileOpen(false);

 if (location.pathname !== '/') {
 navigate(`/#${sectionId}`);
 setTimeout(() => {
 const element = document.getElementById(sectionId);
 if (element) {
 element.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
 }, 120);
 return;
 }

 const element = document.getElementById(sectionId);
 if (element) {
 element.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }
 };

 const closeMobile = () => setMobileOpen(false);

 return (
 <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[var(--cth-surface-deep)]/80 backdrop-blur-xl">
 <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
 <Link
 to="/"
 onClick={closeMobile}
 className="flex items-center gap-3 min-w-0"
 data-testid="nav-logo-link"
 >
 <img
 src="/brand-assets/logo/cth-logo-horizontal.png"
 alt="Core Truth House"
 className="h-10 w-auto object-contain"
 data-testid="nav-logo"
 />
 <div className="leading-none whitespace-nowrap">
 <span className="text-sm font-bold text-white">Core Truth </span>
 <span className="text-sm font-bold text-[var(--cth-admin-accent)]">House</span>
 </div>
 </Link>

 <div className="hidden md:flex items-center gap-8">
 {SECTION_LINKS.map((item) => (
 <button
 key={item.label}
 onClick={() => goToSection(item.id)}
 type="button"
 className="text-sm text-[var(--cth-admin-muted)] hover:text-white transition-colors"
 >
 {item.label}
 </button>
 ))}

 {PAGE_LINKS.map((item) => (
 <Link
 key={item.label}
 to={item.to}
 className="text-sm text-[var(--cth-admin-muted)] hover:text-white transition-colors"
 >
 {item.label}
 </Link>
 ))}
 </div>

 <div className="flex items-center gap-3">
 <Link
 to="/sign-in"
 className="hidden md:block text-sm text-[var(--cth-admin-muted)] hover:text-white transition-colors px-4 py-2"
 data-testid="nav-sign-in"
 >
 Sign In
 </Link>

 <a href="/brand-diagnostic/"
 className="hidden sm:inline-flex text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
 style={{
 background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))',
 boxShadow: '0 4px 16px rgba(224,78,53,0.35)',
 }}
 data-testid="nav-start-building"
 >
 Start Building
 </a>

 <button
 className="md:hidden flex flex-col gap-1.5 p-2"
 onClick={() => setMobileOpen((prev) => !prev)}
 aria-label="Menu"
 aria-expanded={mobileOpen}
 type="button"
 data-testid="mobile-menu-btn"
 >
 <span
 className={`block w-5 h-0.5 bg-white transition-all ${
 mobileOpen ? 'rotate-45 translate-y-2' : ''
 }`}
 />
 <span
 className={`block w-5 h-0.5 bg-white transition-all ${
 mobileOpen ? 'opacity-0' : ''
 }`}
 />
 <span
 className={`block w-5 h-0.5 bg-white transition-all ${
 mobileOpen ? '-rotate-45 -translate-y-2' : ''
 }`}
 />
 </button>
 </div>
 </div>

 {mobileOpen && (
 <div className="md:hidden bg-[var(--cth-surface-deep)]/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-2">
 {SECTION_LINKS.map((item) => (
 <button
 key={item.label}
 onClick={() => goToSection(item.id)}
 type="button"
 className="block w-full text-left text-sm text-[var(--cth-admin-muted)] hover:text-white py-2 transition-colors"
 >
 {item.label}
 </button>
 ))}

 {PAGE_LINKS.map((item) => (
 <Link
 key={item.label}
 to={item.to}
 onClick={closeMobile}
 className="block text-sm text-[var(--cth-admin-muted)] hover:text-white py-2 transition-colors"
 >
 {item.label}
 </Link>
 ))}

 <div className="border-t border-white/5 pt-3 mt-2 space-y-2">
 <Link
 to="/sign-in"
 onClick={closeMobile}
 className="block text-sm text-[var(--cth-admin-muted)] py-2"
 >
 Sign In
 </Link>

 <a href="/brand-diagnostic/"
 onClick={closeMobile}
 className="inline-flex text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all"
 style={{
 background: 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))',
 boxShadow: '0 4px 16px rgba(224,78,53,0.35)',
 }}
 >
 Start Building
 </a>
 </div>
 </div>
 )}
 </nav>
 );
}
