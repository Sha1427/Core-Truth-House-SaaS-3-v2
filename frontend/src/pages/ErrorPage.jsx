import React from 'react';

export default function ErrorPage({ error, resetError }) {
  // Use regular anchor tags instead of Link to avoid Router context issues
  // when this component is rendered during error recovery
  const handleHomeClick = () => {
    window.location.href = '/';
  };

  const handleContactClick = () => {
    window.location.href = '/contact';
  };

  return (
    <main className="bg-[var(--cth-surface-deep)] min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, var(--cth-brand-primary) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(139,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,0,0,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>
      
      <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-4xl" style={{ background: "rgba(139,0,0,0.2)", border: "1px solid rgba(139,0,0,0.3)" }}>
          ⚠
        </div>
        
        <h1 className="font-display font-bold text-white text-3xl mb-4">
          Something went wrong
        </h1>
        
        <p className="text-[var(--cth-admin-muted)] leading-relaxed mb-6">
          We encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>
        
        {error && (
          <div className="p-4 rounded-xl bg-[rgba(139,0,0,0.1)] border border-[rgba(139,0,0,0.2)] mb-8">
            <p className="text-sm text-[var(--cth-admin-muted)] font-mono break-all">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {resetError && (
            <button
              onClick={resetError}
              className="px-8 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))", boxShadow: "0 4px 16px rgba(224,78,53,0.35)" }}
            >
              Try Again
            </button>
          )}
          <button
            onClick={handleHomeClick}
            className="px-8 py-3 rounded-xl text-[var(--cth-admin-muted)] font-medium border border-white/10 hover:border-[rgba(224,78,53,0.4)] hover:text-white transition-all"
          >
            Go to Homepage
          </button>
        </div>
        
        <p className="text-xs text-[var(--cth-admin-muted)] mt-8">
          If this problem persists, please{' '}
          <button onClick={handleContactClick} className="text-[var(--cth-admin-accent)] hover:underline">
            contact support
          </button>.
        </p>
      </div>
    </main>
  );
}
