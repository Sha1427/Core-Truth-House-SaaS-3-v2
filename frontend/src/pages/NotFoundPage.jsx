import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="bg-[#1c0828] min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, #e04e35 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(224,78,53,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(224,78,53,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>
      
      <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
        <div className="font-display font-bold text-[#e04e35] mb-4" style={{ fontSize: "8rem", lineHeight: 1, textShadow: "0 0 60px rgba(224,78,53,0.4)" }}>
          404
        </div>
        
        <h1 className="font-display font-bold text-white text-3xl mb-4">
          Page not found
        </h1>
        
        <p className="text-[#a08aaa] leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #e04e35, #af0024)", boxShadow: "0 4px 16px rgba(224,78,53,0.35)" }}
          >
            Go to Homepage
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-3 rounded-xl text-[#c7a09d] font-medium border border-white/10 hover:border-[rgba(224,78,53,0.4)] hover:text-white transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
