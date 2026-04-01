import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PLATFORM_LINKS = [
  { label: 'Features', id: 'features' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
];

const PRODUCT_LINKS = [
  { label: 'Content Studio', href: '/content-studio' },
  { label: 'Blog', href: '/blog' },
  { label: 'Store', href: '/store' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

function FooterNavButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-[#9c7d95] hover:text-[#c7a09d] transition-colors text-left"
      type="button"
    >
      {label}
    </button>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm text-[#9c7d95] hover:text-[#c7a09d] transition-colors"
    >
      {children}
    </Link>
  );
}

export function FooterSection() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="border-t border-white/5 bg-[#1c0828] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/cth-logo.png"
                alt="Core Truth House"
                className="h-10 w-auto object-contain"
              />
              <div className="leading-none">
                <span className="text-sm font-bold text-white">Core Truth </span>
                <span className="text-sm font-bold text-[#e04e35]">House</span>
              </div>
            </div>

            <p className="text-sm text-[#9c7d95] leading-relaxed max-w-sm">
              Build the brand behind the business before you build the brand the
              world sees.
            </p>
          </div>

          <div>
            <p className="text-xs text-[#e04e35] uppercase tracking-widest font-medium mb-4">
              Platform
            </p>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterNavButton
                    label={item.label}
                    onClick={() => scrollToSection(item.id)}
                  />
                </li>
              ))}

              {PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterLink to={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs text-[#e04e35] uppercase tracking-widest font-medium mb-4">
              Company
            </p>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterLink to={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#5d4960]">
            &copy; {new Date().getFullYear()} Core Truth House. All rights reserved.
          </p>
          <p className="text-xs text-[#5d4960] text-center md:text-right">
            Brands that convert consistently are not louder. They are more controlled.
          </p>
        </div>
      </div>
    </footer>
  );
}
