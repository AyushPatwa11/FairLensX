// FairLens AI — Sidebar Navigation
import React from 'react';

const MODES = [
  {
    id: 'dataset',
    label: 'Dataset Analyzer',
    desc: 'Upload CSV · audit bias',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'language',
    label: 'Language Analyzer',
    desc: 'Detect biased text',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
      </svg>
    ),
  },
  {
    id: 'simulator',
    label: 'Bias Simulator',
    desc: 'Individual counterfactuals',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
];

export default function Sidebar({ activeMode, setActiveMode, onGoHome, onNewAudit, statusFile }) {
  return (
    <aside style={{
      width: 228, minWidth: 228, height: '100vh',
      background: 'var(--bg2)', borderRight: '1px solid var(--bd)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'background 0.3s',
    }}>
      {/* Brand */}
      <div
        onClick={onGoHome}
        style={{
          padding: '16px 14px', borderBottom: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 0 14px var(--bglow)',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--t1)' }}>FairLens AI</div>
          <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '0.13em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace', marginTop: 1 }}>
            PRECISION AUDITING
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '12px 9px', flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 5, fontFamily: 'JetBrains Mono, monospace' }}>
          Modules
        </div>
        {MODES.map(mode => {
          const active = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 11px', borderRadius: 8,
                background: active ? 'var(--bdim)' : 'transparent',
                border: active ? '1px solid rgba(59,130,246,.22)' : '1px solid transparent',
                color: active ? 'var(--blue)' : 'var(--t2)',
                cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                transition: 'all 0.18s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bgi)'; e.currentTarget.style.color = 'var(--t1)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t2)'; } }}
            >
              <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{mode.icon}</span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{mode.label}</div>
                <div style={{ fontSize: 10.5, opacity: 0.6, marginTop: 1 }}>{mode.desc}</div>
              </div>
            </button>
          );
        })}

        {/* Navigation */}
        <div style={{ marginTop: 12, borderTop: '1px solid var(--bd)', paddingTop: 10 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 5, fontFamily: 'JetBrains Mono, monospace' }}>
            Navigation
          </div>
          {[
            { label: 'Back to Home', icon: '🏠', action: onGoHome },
            { label: 'Documentation', icon: '📚', action: () => window.open('https://github.com', '_blank') },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                width: '100%', padding: '7px 11px', borderRadius: 7,
                background: 'transparent', border: 'none',
                color: 'var(--blue)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', marginBottom: 2, fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bdim)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '11px 9px', borderTop: '1px solid var(--bd)' }}>
        <button
          onClick={onNewAudit}
          style={{
            width: '100%', padding: 10, background: 'var(--blue)', color: '#fff',
            border: 'none', borderRadius: 8, fontFamily: 'inherit', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 7, transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; e.currentTarget.style.boxShadow = '0 0 20px var(--bglow)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Audit
        </button>
      </div>

      {/* Status */}
      <div style={{ padding: '8px 14px 11px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--green)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          System: Ready
        </span>
        <span style={{ color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
          {statusFile || 'No file loaded'}
        </span>
      </div>
    </aside>
  );
}
