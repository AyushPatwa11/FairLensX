// FairLens AI — Shared UI Components
import React from 'react';
import { getRiskStyle } from '../../config';

// ── StepIndicator ─────────────────────────────────────────
export function StepIndicator({ steps, current }) {
  return (
    <div role="list" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 0', flexWrap: 'wrap' }}>
      {steps.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        const color  = done ? 'var(--green)' : active ? 'var(--blue)' : 'var(--t3)';
        return (
          <React.Fragment key={i}>
            <div role="listitem" aria-current={active ? 'step' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 100,
              fontSize: 10, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
              border: `1px solid ${done ? 'rgba(16,185,129,.3)' : active ? 'rgba(59,130,246,.3)' : 'var(--bd)'}`,
              background: done ? 'var(--gdim)' : active ? 'var(--bdim)' : 'var(--bg3)',
              color, transition: 'all 0.25s',
            }}>
              <div style={{
                width: 17, height: 17, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
                background: done ? 'var(--green)' : active ? 'var(--blue)' : 'rgba(255,255,255,.06)',
                color: done || active ? '#fff' : 'var(--t3)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {step}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 20, height: 1, background: done ? 'var(--green)' : 'var(--bd)', transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── BiasGauge ─────────────────────────────────────────────
export function BiasGauge({ score, size = 130 }) {
  const s = Math.max(0, Math.min(100, score));
  const { label, color } = (() => {
    if (s >= 70) return { label: 'HIGH RISK',   color: 'var(--red)'    };
    if (s >= 40) return { label: 'MODERATE',    color: 'var(--orange)' };
    return               { label: 'LOW RISK',   color: 'var(--green)'  };
  })();
  const r = size / 2 - 7;
  const arc = 2 * Math.PI * r;
  const offset = arc - (s / 100) * arc;
  const cx = size / 2, cy = size / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg role="img" aria-label={`Global bias score ${s} percent, ${label}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={`glow-${s}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="11" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="11"
          strokeDasharray={arc} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          filter={`url(#glow-${s})`}
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size * 0.22} fontWeight="900"
          fill="#fff" fontFamily="Inter, sans-serif">
          {s}
        </text>
        <text x={cx} y={cy + size * 0.13} textAnchor="middle" fontSize="9"
          fill={color} fontFamily="JetBrains Mono, monospace" letterSpacing="1.5">
          {label}
        </text>
      </svg>
    </div>
  );
}

// ── MetricCard ─────────────────────────────────────────────
export function MetricCard({ label, value, formatted, threshold, pass, description }) {
  const color = pass ? 'var(--green)' : 'var(--red)';
  const bg    = pass ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)';
  const bc    = pass ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)';
  return (
    <div style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 10, padding: '13px 15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
        <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span className={`chip ${pass ? 'chip-green' : 'chip-red'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
          {pass ? '✓ PASS' : '✗ FAIL'}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
        {formatted}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{description}</div>
    </div>
  );
}

// ── MetricGrid ─────────────────────────────────────────────
export function MetricGrid({ metrics }) {
  if (!metrics) return null;
  const DEFS = [
    { key: 'demographic_parity', label: 'Demographic Parity', pass: v => Math.abs(v) < 0.1, fmt: v => (Math.abs(v)*100).toFixed(1)+'%', desc: 'Selection rate gap (ideal < 10%)' },
    { key: 'disparate_impact',   label: 'Disparate Impact',   pass: v => v >= 0.8,          fmt: v => v.toFixed(3),                   desc: '4/5ths rule — must be ≥ 0.80' },
    { key: 'equal_opportunity',  label: 'Equal Opportunity',  pass: v => Math.abs(v) < 0.1, fmt: v => (Math.abs(v)*100).toFixed(1)+'%', desc: 'True positive rate gap' },
    { key: 'predictive_parity',  label: 'Predictive Parity',  pass: v => Math.abs(v) < 0.1, fmt: v => (Math.abs(v)*100).toFixed(1)+'%', desc: 'Precision gap across groups' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
      {DEFS.map(d => {
        const val = metrics[d.key];
        if (val === undefined || val === null) return null;
        return <MetricCard key={d.key} label={d.label} value={val} formatted={d.fmt(val)} pass={d.pass(val)} description={d.desc} />;
      })}
    </div>
  );
}

// ── FeatureImportanceChart ─────────────────────────────────
export function FeatureImportanceChart({ features }) {
  if (!features?.length) return null;
  const sorted = [...features].sort((a, b) => b.importance - a.importance).slice(0, 7);
  const maxImp = sorted[0]?.importance || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {sorted.map((f, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: f.is_sensitive ? 'var(--orange)' : 'var(--t2)' }}>
                {f.feature}
              </span>
              {f.is_sensitive && (
                <span className="protected-badge">PROTECTED</span>
              )}
            </div>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: f.is_sensitive ? 'var(--orange)' : 'var(--blue)', fontWeight: 600 }}>
              {(f.importance * 100).toFixed(1)}%
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{
              width: `${(f.importance / maxImp) * 100}%`,
              background: f.is_sensitive
                ? 'linear-gradient(90deg, var(--orange), #fbbf24)'
                : 'linear-gradient(90deg, var(--blue), #60a5fa)',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SelectionRateChart ─────────────────────────────────────
export function SelectionRateChart({ rates }) {
  if (!rates?.length) return null;
  const maxRate = Math.max(...rates.map(r => r.rate));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rates.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 68, fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t2)', textAlign: 'right', flexShrink: 0 }}>
            {r.group}
          </div>
          <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,.04)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${r.rate * 100}%`,
              background: r.rate === maxRate ? 'var(--blue)' : 'rgba(59,130,246,.45)',
              transition: 'width 0.9s ease',
            }} />
            {/* 80% rule threshold line */}
            <div style={{ position: 'absolute', top: 0, left: '80%', height: '100%', width: 1.5, background: 'rgba(245,158,11,.6)' }} />
          </div>
          <div style={{ width: 38, fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', color: r.rate === maxRate ? 'var(--blue)' : 'var(--t2)', fontWeight: r.rate === maxRate ? 600 : 400, flexShrink: 0 }}>
            {(r.rate * 100).toFixed(1)}%
          </div>
        </div>
      ))}
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>
        ▏ Dashed line at 80% = legal fairness threshold (4/5ths rule)
      </div>
    </div>
  );
}

// ── InsightsList ───────────────────────────────────────────
export function InsightsList({ insights }) {
  if (!insights?.length) return null;
  const icons = ['📊', '⚠️', '💡', '🔍'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {insights.map((text, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          padding: '10px 13px', background: 'var(--bg4)',
          border: '1px solid var(--bd)', borderRadius: 8,
        }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>{icons[i] || '•'}</span>
          <span style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55 }}>{text}</span>
        </div>
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ size = 14 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: '2px solid rgba(255,255,255,.2)', borderTopColor: 'currentColor',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

// ── Toast ──────────────────────────────────────────────────
export function showToast(msg, type = 'info') {
  const colors = { info: 'var(--blue)', success: 'var(--green)', error: 'var(--red)' };
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${colors[type]||colors.info};color:#fff;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;animation:fadeUp .2s ease;font-family:Inter,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3)`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── DemoModeBanner ─────────────────────────────────────────
export function DemoModeBanner() {
  return (
    <div className="alert alert-info" style={{ marginBottom: 12, fontSize: 12 }}>
      <span>⚡</span>
      <span><strong>Demo mode</strong> — backend not connected. Results computed locally using real algorithms. Start the backend at <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>localhost:8000</code> for full ML analysis.</span>
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 320, gap: 10, textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 44, opacity: 0.2, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t2)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 320 }}>{subtitle}</div>}
      {action && onAction && (
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={onAction}>{action}</button>
      )}
    </div>
  );
}

// ── LoadingOverlay ─────────────────────────────────────
export function LoadingOverlay({ message = 'Working...', show = false }) {
  if (!show) return null;
  return (
    <div role="status" aria-live="polite" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'rgba(2,6,23,0.6)', padding: 20, borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 6px 24px rgba(0,0,0,.6)' }}>
        <div className="spinner" style={{ width: 18, height: 18 }} aria-hidden="true" />
        <div style={{ color: '#fff', fontWeight: 700 }}>{message}</div>
      </div>
    </div>
  );
}
