import React from 'react';
import { Zap, CreditCard, Loader2 } from 'lucide-react';
import { useColors } from '../../context/ThemeContext';

const DEFAULT_PACKS = [
  { id: 'starter', name: 'Starter Pack', credits: 50, price: 9, popular: false, description: 'A little more when you need it' },
  { id: 'growth', name: 'Growth Pack', credits: 150, price: 24, popular: true, description: 'Most popular for active creators' },
  { id: 'scale', name: 'Scale Pack', credits: 400, price: 59, popular: false, description: 'High-volume content creation' },
  { id: 'agency', name: 'Agency Pack', credits: 1000, price: 129, popular: false, description: 'Maximum credits for agencies' },
];

export function CreditPacks({ creditPacks, creditBalance, buyingCredit, onPurchase }) {
  const colors = useColors();
  const packs = creditPacks.length > 0 ? creditPacks : DEFAULT_PACKS;

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}>
            AI Credit Top-Ups
          </div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
            Purchase additional AI generations beyond your plan limit.
            Current extra balance: <strong style={{ color: colors.cinnabar }}>{creditBalance} credits</strong>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: colors.cardBg, border: `1px solid ${colors.border}` }}>
          <Zap size={13} style={{ color: colors.cinnabar }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>{creditBalance} extra credits</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {packs.map(pack => (
          <div
            key={pack.id}
            data-testid={`credit-pack-${pack.id}`}
            style={{
              background: pack.popular ? `linear-gradient(180deg, ${colors.cardBg}, rgba(175,0,36,0.06))` : colors.cardBg,
              border: `1px solid ${pack.popular ? 'rgba(224,78,53,0.4)' : colors.border}`,
              borderRadius: 16, padding: '20px 18px', position: 'relative',
            }}
          >
            {pack.badge && (
              <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 99, background: colors.crimson, color: 'white', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {pack.badge}
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>{pack.name}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 14 }}>{pack.description}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: colors.cinnabar, marginBottom: 2 }}>${pack.price}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 16 }}>
              <strong style={{ color: colors.textPrimary }}>{pack.credits}</strong> AI generations &middot; ${(pack.price / pack.credits).toFixed(2)}/credit
            </div>
            <button
              data-testid={`buy-credit-${pack.id}`}
              onClick={() => onPurchase(pack)}
              disabled={buyingCredit === pack.id}
              style={{
                width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                background: pack.popular ? `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})` : colors.darker,
                color: pack.popular ? 'white' : colors.textPrimary,
                fontSize: 12, fontWeight: 700, cursor: buyingCredit === pack.id ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {buyingCredit === pack.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={12} />}
              {buyingCredit === pack.id ? 'Redirecting...' : 'Buy Credits'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
