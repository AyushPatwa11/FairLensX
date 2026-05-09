// FairLens AI — Language Analyzer Mode
import React, { useState } from 'react';
import { textAPI } from '../../utils/api';
import { DOMAIN_CONFIG } from '../../config';
import { Spinner, showToast, DemoModeBanner } from '../shared';
import { useLocalBiasDetect } from '../../hooks';

const SEV_CLS = { high: 'hl-r', medium: 'hl-o', low: 'hl-b' };
const SEV_BADGE = { high: 'chip-red', medium: 'chip-orange', low: 'chip-blue' };
const SEV_COLOR = { high: 'var(--red)', medium: 'var(--orange)', low: 'var(--blue)' };

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export default function TextMode({ domain, geminiKey }) {
  const cfg = DOMAIN_CONFIG[domain] || DOMAIN_CONFIG.hiring;
  const [text,        setText]       = useState('');
  const [result,      setResult]     = useState(null);
  const [loading,     setLoading]    = useState(false);
  const [demoMode,    setDemoMode]   = useState(false);
  const [showRewrite, setShowRewrite]= useState(false);
  const [hoveredFlag, setHoveredFlag]= useState(null);
  const localDetect = useLocalBiasDetect();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const scan = async () => {
    if (!text.trim()) return;
    setLoading(true); setShowRewrite(false);
    try {
      const res = await textAPI.analyze(text, domain, geminiKey);
      setResult(res.data); setDemoMode(false);
    } catch {
      setResult(localDetect(text)); setDemoMode(true);
    } finally { setLoading(false); }
  };

  const buildHighlight = (flags) => {
    if (!flags?.length) return `<span style="color:var(--t2)">${esc(text)}</span>`;
    let html = '', cur = 0;
    flags.forEach(f => {
      if (f.start > cur) html += `<span style="color:var(--t2)">${esc(text.slice(cur, f.start))}</span>`;
      html += `<span class="${SEV_CLS[f.severity]||'hl-r'}" title="${esc(f.type)}: ${esc(f.suggestion)}"
        onmouseenter="window.__flHover(${flags.indexOf(f)})"
        onmouseleave="window.__flHoverEnd()">${esc(text.slice(f.start, f.end))}</span>`;
      cur = f.end;
    });
    if (cur < text.length) html += `<span style="color:var(--t2)">${esc(text.slice(cur))}</span>`;
    return html;
  };

  // Expose hover handlers to DOM
  if (result) {
    window.__flHover = (i) => setHoveredFlag(result.flags[i]);
    window.__flHoverEnd = () => setHoveredFlag(null);
  }

  const clear = () => { setText(''); setResult(null); setShowRewrite(false); setHoveredFlag(null); };
  const copyText = () => { navigator.clipboard.writeText(text).then(() => showToast('Copied!')); };
  const copyRewrite = () => { navigator.clipboard.writeText(result?.rewritten_text || '').then(() => showToast('Rewrite copied!', 'success')); };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', height: 'calc(100vh - 58px)' }}>
      {/* LEFT */}
      <div style={{ overflowY: 'auto', padding: 22 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 5 }}>Language Audit</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 16 }}>Bias Language Analyzer</h1>

        {demoMode && result && <DemoModeBanner />}

        {/* Domain selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Domain:</label>
          <div style={{ fontSize: 12, color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bdim)', padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(59,130,246,.25)' }}>
            {cfg.label}
          </div>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>(change via top domain tabs)</span>
        </div>

        {/* Input panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Input Text Content</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 10.5, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>{wordCount} words</span>
              {result && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'var(--rdim)', border: '1px solid rgba(239,68,68,.25)', padding: '2px 8px', borderRadius: 100, fontFamily: 'JetBrains Mono, monospace' }}>{result.flag_count} issues found</span>}
            </div>
          </div>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setResult(null); setShowRewrite(false); }}
            placeholder={`Paste any ${cfg.label.toLowerCase()} text, job description, policy, or communication to scan for bias patterns...`}
            style={{ width: '100%', minHeight: 200, padding: '16px 18px', background: 'var(--bg3)', border: 'none', outline: 'none', color: 'var(--t2)', fontFamily: 'inherit', fontSize: 13.5, lineHeight: 1.85, resize: 'vertical' }}
          />
          <div style={{ padding: '10px 15px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={copyText} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--t3)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', transition: 'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--t2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy
              </button>
              <button onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--t3)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', transition: 'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--t2)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Clear
              </button>
              <button onClick={() => setText(cfg.sampleText || '')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--t3)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', transition: 'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--blue)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>Load Sample</button>
            </div>
            <button className="btn btn-primary" onClick={scan} disabled={loading || !text.trim()}>
              {loading ? <><Spinner /> Scanning...</> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>Scan for Bias</>}
            </button>
          </div>
        </div>

        {/* Highlighted output */}
        {result && (
          <div className="animate-in">
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {showRewrite ? 'Inclusive Rewrite' : 'Highlighted Analysis'}
                </span>
                <div style={{ display: 'flex', gap: 7 }}>
                  {result.rewritten_text && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowRewrite(s => !s)}>
                      {showRewrite ? '← Show Highlights' : '✨ Show Rewrite'}
                    </button>
                  )}
                  {showRewrite && <button className="btn btn-secondary btn-sm" onClick={copyRewrite}>Copy Rewrite</button>}
                </div>
              </div>
              <div style={{ padding: '16px 18px', minHeight: 120, maxHeight: 260, overflowY: 'auto', fontSize: 13.5, lineHeight: 1.88 }}>
                {showRewrite ? (
                  <div style={{ color: 'var(--t1)' }}>{result.rewritten_text}</div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: buildHighlight(result.flags) }} />
                )}
              </div>
            </div>

            {/* Hover tooltip */}
            {hoveredFlag && (
              <div className="alert alert-info animate-fade" style={{ marginBottom: 12 }}>
                💡 <strong>{hoveredFlag.type}</strong>
                <span className={`chip ${SEV_BADGE[hoveredFlag.severity]}`} style={{ margin: '0 6px', fontSize: 9 }}>{hoveredFlag.severity.toUpperCase()}</span>
                — Replace <code style={{ background: 'var(--rdim)', color: 'var(--red)', padding: '1px 5px', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace' }}>"{hoveredFlag.phrase}"</code>
                {' '}with <code style={{ background: 'var(--gdim)', color: 'var(--green)', padding: '1px 5px', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace' }}>"{hoveredFlag.suggestion}"</code>
              </div>
            )}

            {/* Refinement */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>🔧</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>Proposed Refinement</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>Original (excerpt)</div>
                  <div style={{ background: 'var(--bgi)', border: '1px solid var(--bd)', borderRadius: 7, padding: '10px 12px', fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.65, fontStyle: 'italic', minHeight: 72 }}>
                    "{text.slice(0, 130)}{text.length > 130 ? '...' : ''}"
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>Inclusive Rewrite</div>
                  <div style={{ background: 'var(--bgi)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 7, padding: '10px 12px', fontSize: 12.5, color: 'var(--t1)', lineHeight: 1.65, minHeight: 72 }}>
                    {result.rewritten_text ? `"${result.rewritten_text.slice(0, 130)}${result.rewritten_text.length > 130 ? '...' : ''}"` : <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>Rewrite generated above</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Audit Details */}
      <div style={{ borderLeft: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '13px 14px 10px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg4)' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>Audit Details</span>
          {result && (
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', background: result.risk_level === 'High' ? 'var(--rdim)' : result.risk_level === 'Moderate' ? 'var(--odim)' : 'var(--gdim)', color: result.risk_level === 'High' ? 'var(--red)' : result.risk_level === 'Moderate' ? 'var(--orange)' : 'var(--green)', border: `1px solid ${result.risk_level === 'High' ? 'rgba(239,68,68,.3)' : result.risk_level === 'Moderate' ? 'rgba(245,158,11,.3)' : 'rgba(16,185,129,.3)'}`, padding: '3px 8px', borderRadius: 5, fontFamily: 'JetBrains Mono, monospace' }}>
              {result.risk_level?.toUpperCase()} RISK
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!result ? (
            <div style={{ textAlign: 'center', color: 'var(--t3)', padding: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🔍</div>
              <div style={{ fontSize: 12 }}>Paste text and click Scan to detect bias patterns</div>
            </div>
          ) : result.flags?.length === 0 ? (
            <div className="alert alert-success">✅ No bias patterns detected. This text looks inclusive!</div>
          ) : (
            result.flags?.map((f, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredFlag(f)}
                onMouseLeave={() => setHoveredFlag(null)}
                style={{
                  background: hoveredFlag === f ? 'var(--bgi)' : 'var(--bg4)',
                  border: `1px solid ${hoveredFlag === f ? 'rgba(59,130,246,.3)' : 'var(--bd)'}`,
                  borderRadius: 9, padding: 12, cursor: 'default', transition: 'all 0.18s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: SEV_COLOR[f.severity] }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{f.type}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.55, marginBottom: 8 }}>
                  The phrase <span style={{ color: 'var(--t2)', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>"{f.phrase}"</span> may discourage applicants.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.03)', borderRadius: 5, padding: '6px 9px' }}>
                  <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>Alternative:</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>"{f.suggestion}"</span>
                </div>
                {i === result.flags.length - 1 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                    {['Explain bias', 'How to fix?'].map(label => (
                      <button key={label} onClick={() => showToast(label === 'Explain bias' ? `${f.type}: ${f.phrase} may systematically exclude certain groups` : `Replace "${f.phrase}" with "${f.suggestion}" for more inclusive language`, 'info')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--t3)', background: 'rgba(255,255,255,.03)', border: '1px solid var(--bd)', padding: '3px 9px', borderRadius: 100, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }} onMouseEnter={e=>{e.currentTarget.style.color='var(--t2)';e.currentTarget.style.background='var(--bgi)';}} onMouseLeave={e=>{e.currentTarget.style.color='var(--t3)';e.currentTarget.style.background='rgba(255,255,255,.03)';}}>{label}</button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Score footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg4)' }}>
          <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Bias Score</span>
          <div>
            <span style={{ fontSize: 24, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: result ? (result.bias_score >= 70 ? 'var(--red)' : result.bias_score >= 35 ? 'var(--orange)' : 'var(--green)') : 'var(--t3)' }}>
              {result ? result.bias_score : '—'}
            </span>
            <span style={{ fontSize: 14, color: 'var(--t3)' }}>/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
