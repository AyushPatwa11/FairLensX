// FairLens AI — Bias Simulator Mode
import React, { useState, useEffect } from 'react';
import { simulatorAPI } from '../../utils/api';
import { SIMULATOR_FORMS, DOMAIN_CONFIG } from '../../config';
import { Spinner, showToast, DemoModeBanner } from '../shared';
import { useLocalSimulator } from '../../hooks';

export default function SimulatorMode({ domain, geminiKey }) {
  const cfg     = SIMULATOR_FORMS[domain] || SIMULATOR_FORMS.hiring;
  const domCfg  = DOMAIN_CONFIG[domain]   || DOMAIN_CONFIG.hiring;
  const localSim = useLocalSimulator();

  const defaultForm = () => {
    const d = {};
    cfg.fields.forEach(f => { d[f.key] = f.type === 'select' ? f.options[0] : (f.defaultVal ?? f.min ?? 0); });
    return d;
  };

  const [form,     setForm]     = useState(defaultForm);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  // Reset form when domain changes
  useEffect(() => { setForm(defaultForm()); setResult(null); }, [domain]);

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const runSim = async () => {
    setLoading(true);
    try {
      const res = await simulatorAPI.simulate(form, domain);
      setResult(res.data); setDemoMode(false);
    } catch {
      setResult(localSim(form, domain)); setDemoMode(true);
    } finally { setLoading(false); }
  };

  const reset = () => { setForm(defaultForm()); setResult(null); setDemoMode(false); };

  // Probability donut
  const ProbDonut = ({ prob }) => {
    const r = 50, arc = 2 * Math.PI * r;
    const off = arc - (prob * arc);
    const color = prob >= 0.5 ? 'var(--green)' : 'var(--red)';
    return (
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={arc} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }} />
        <text x="65" y="61" textAnchor="middle" fontSize="26" fontWeight="900" fill="white" fontFamily="Inter, sans-serif">
          {Math.round(prob * 100)}%
        </text>
        <text x="65" y="76" textAnchor="middle" fontSize="9" fill="var(--t3)" fontFamily="JetBrains Mono, monospace" letterSpacing="1">
          CONFIDENCE
        </text>
      </svg>
    );
  };

  return (
    <div style={{ overflowY: 'auto', height: 'calc(100vh - 58px)', padding: '0 18px 18px' }}>
      {/* Header */}
      <div style={{ padding: '16px 0 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 5 }}>Bias Simulator</h1>
          <p style={{ fontSize: 12.5, color: 'var(--t2)', maxWidth: 540, lineHeight: 1.65 }}>
            Enter a real profile. The model predicts the outcome and reveals hidden bias via counterfactual analysis.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={reset}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
            Reset
          </button>
          <button className="btn btn-primary" onClick={runSim} disabled={loading}>
            {loading ? <><Spinner /> Simulating...</> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>Simulate Outcome</>}
          </button>
        </div>
      </div>

      {demoMode && result && <DemoModeBanner />}

      {/* Domain label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Simulating for:</label>
        <span style={{ fontSize: 12, color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bdim)', padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(59,130,246,.25)' }}>
          {domCfg.label} — {domCfg.outcomeLabels.join(' / ')}
        </span>
      </div>

      {/* Three-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr 310px', gap: 14 }}>

        {/* LEFT: Profile form */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 12, padding: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Applicant Profile</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cfg.fields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {f.label}
                  {f.sensitive && <span className="protected-badge">PROTECTED</span>}
                </label>
                {f.type === 'select' ? (
                  <div className="select-wrap">
                    <select className="form-select" value={form[f.key] ?? f.options[0]}
                      onChange={e => setField(f.key, e.target.value)}
                      style={{ color: f.sensitive ? 'var(--orange)' : 'var(--t1)', borderColor: f.sensitive ? 'rgba(245,158,11,.3)' : 'var(--bd)' }}>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ) : (
                  <input className="form-input" type="number" value={form[f.key] ?? f.defaultVal ?? f.min}
                    min={f.min} max={f.max} step={f.step || 1}
                    onChange={e => setField(f.key, e.target.value)}
                    style={{ color: f.sensitive ? 'var(--orange)' : 'var(--t1)', borderColor: f.sensitive ? 'rgba(245,158,11,.3)' : 'var(--bd)' }} />
                )}
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-full" style={{ marginTop: 16, padding: 11 }} onClick={runSim} disabled={loading}>
            {loading ? <><Spinner /> Simulating...</> : `▶ Predict: ${domCfg.outcomeLabels[0]}`}
          </button>
        </div>

        {/* CENTER: Outcome + Counterfactuals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Outcome card */}
          <div style={{
            background: result ? (result.outcome ? 'linear-gradient(135deg,rgba(16,185,129,.07),rgba(59,130,246,.04))' : 'linear-gradient(135deg,rgba(239,68,68,.06),rgba(59,130,246,.04))') : 'var(--bg4)',
            border: `1px solid ${result ? (result.outcome ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)') : 'var(--bd)'}`,
            borderRadius: 12, padding: '24px 20px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 200,
            position: 'relative', overflow: 'hidden', transition: 'all 0.4s',
          }}>
            <div style={{ position: 'absolute', top: 14, right: 14, opacity: 0.1 }}>
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <div style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 11 }}>Prediction Outcome</div>
            {!result ? (
              <div style={{ fontSize: 20, color: 'var(--t3)', fontWeight: 600, lineHeight: 1.4 }}>Fill in the profile<br/>and click Simulate</div>
            ) : (
              <>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12, color: result.outcome ? 'var(--green)' : 'var(--red)', transition: 'color 0.4s' }}>
                  {result.outcome_label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: result.outcome ? 'var(--green)' : 'var(--red)', background: result.outcome ? 'var(--gdim)' : 'var(--rdim)', border: `1px solid ${result.outcome ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`, padding: '3px 13px', borderRadius: 100, fontFamily: 'JetBrains Mono, monospace' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: result.outcome ? 'var(--green)' : 'var(--red)' }} />
                  {result.bias_detected ? 'BIAS DETECTED' : result.outcome ? 'APPROVED' : 'HIGH RISK FLAG'}
                </div>
                {/* Prob bar */}
                <div style={{ width: '100%', marginTop: 14 }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${result.probability * 100}%`, background: result.outcome ? 'linear-gradient(90deg,var(--green),#4ade80)' : 'linear-gradient(90deg,var(--red),#f87171)', boxShadow: `0 0 10px ${result.outcome ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--t3)' }}>
                    <span>Merit score: <span style={{ color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{Math.round(result.base_probability * 100)}%</span></span>
                    <span>Bias delta: <span style={{ color: result.bias_contribution >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{result.bias_contribution >= 0 ? '+' : ''}{Math.round(result.bias_contribution * 100)}%</span></span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bias alert */}
          {result && (
            <div className={`alert ${result.bias_detected ? 'alert-error' : 'alert-success'}`}>
              <span style={{ fontSize: 16 }}>{result.bias_detected ? '⚠️' : '✅'}</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{result.bias_detected ? 'Individual Bias Detected' : 'No Significant Bias'}</div>
                <div style={{ fontSize: 12 }}>
                  {result.bias_detected
                    ? `Changing protected attributes shifts the outcome by up to ${Math.round(result.max_delta * 100)}%. The model is influenced by protected characteristics beyond merit.`
                    : `Outcome driven primarily by merit factors. Protected attribute influence is within acceptable variance (<8%).`}
                </div>
              </div>
            </div>
          )}

          {/* Counterfactuals */}
          {result?.counterfactuals?.length > 0 && (
            <div style={{ background: 'var(--bg4)', border: '1px solid var(--bd)', borderRadius: 12, padding: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Counterfactual Analysis — "What if?"</span>
              </div>
              {/* Top pair comparison */}
              {result.counterfactuals[0] && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ background: 'var(--bgi)', border: '1px solid var(--bd)', borderRadius: 7, padding: 11 }}>
                    <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', marginBottom: 5 }}>Original Profile</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
                      {result.counterfactuals[0].changed_field}: {result.counterfactuals[0].original_value}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: result.outcome ? 'var(--green)' : 'var(--red)' }}>
                      {result.outcome_label}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--t3)', textAlign: 'center' }}>→</div>
                  <div style={{ background: 'var(--bgi)', border: `1px solid ${result.counterfactuals[0].outcome !== result.outcome ? 'rgba(245,158,11,.3)' : 'var(--bd)'}`, borderRadius: 7, padding: 11 }}>
                    <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--cyan)', marginBottom: 5 }}>
                      If {result.counterfactuals[0].changed_field} = "{result.counterfactuals[0].changed_value}"
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
                      {result.counterfactuals[0].changed_field}: {result.counterfactuals[0].changed_value}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: result.counterfactuals[0].outcome ? 'var(--green)' : 'var(--red)' }}>
                      {domCfg.outcomeLabels[result.counterfactuals[0].outcome ? 0 : 1]}
                    </div>
                    {result.counterfactuals[0].outcome !== result.outcome && (
                      <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em', background: 'var(--orange)', color: '#000', padding: '2px 8px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', display: 'inline-block', marginTop: 4 }}>
                        BIAS DETECTED
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Remaining counterfactuals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {result.counterfactuals.slice(1, 6).map((cf, i) => {
                  const isBig = Math.abs(cf.delta) > 0.08;
                  const dColor = cf.delta > 0.05 ? 'var(--green)' : cf.delta < -0.05 ? 'var(--red)' : 'var(--t3)';
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center',
                      padding: '10px 12px', borderRadius: 8, transition: 'all 0.18s',
                      background: isBig ? (cf.delta > 0 ? 'rgba(16,185,129,.04)' : 'rgba(239,68,68,.04)') : 'var(--bgi)',
                      border: `1px solid ${isBig ? (cf.delta > 0 ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)') : 'var(--bd)'}`,
                    }}>
                      <div>
                        <div style={{ fontSize: 12.5, color: 'var(--t1)', marginBottom: 4 }}>
                          If <span style={{ color: 'var(--orange)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{cf.changed_field}</span> were{' '}
                          <span style={{ color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>"{cf.changed_value}"</span>
                          <span style={{ color: 'var(--t3)', fontSize: 11 }}> (was "{cf.original_value}")</span>
                        </div>
                        <div className="progress-track" style={{ height: 4 }}>
                          <div className="progress-fill" style={{ width: `${cf.probability * 100}%`, background: cf.outcome ? 'var(--green)' : 'var(--red)' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: cf.outcome ? 'var(--green)' : 'var(--t3)' }}>
                          {Math.round(cf.probability * 100)}%
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--t3)' }}>{domCfg.outcomeLabels[cf.outcome ? 0 : 1]}</div>
                      </div>
                      <div style={{ padding: '3px 9px', borderRadius: 100, flexShrink: 0, background: isBig ? (cf.delta > 0 ? 'var(--gdim)' : 'var(--rdim)') : 'var(--bg3)', border: `1px solid ${isBig ? (cf.delta > 0 ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)') : 'var(--bd)'}` }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: dColor }}>
                          {cf.delta > 0 ? '+' : ''}{Math.round(cf.delta * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>Green = better outcome · Red = worse outcome · Large deltas indicate protected-attribute bias</p>
            </div>
          )}
        </div>

        {/* RIGHT: Probability + Feature Weights */}
        <div>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 12, padding: 15 }}>
            <div style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 12 }}>Probability Score</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <ProbDonut prob={result?.probability ?? 0.5} />
              <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', fontStyle: 'italic', maxWidth: 200, lineHeight: 1.55 }}>
                {result
                  ? result.bias_detected
                    ? `Bias detected — protected attributes shifting outcome by ${Math.round(result.max_delta * 100)}%`
                    : 'Outcome primarily driven by merit factors'
                  : 'Simulate a profile to see prediction confidence'}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 12, padding: 15, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bias Weight Analysis</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['var(--blue)', 'Merit'], ['var(--red)', 'Bias']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                    <span style={{ fontSize: 9.5, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {cfg.fields.map(f => {
                const isSens = f.sensitive;
                const width = isSens ? (15 + Math.random() * 20) : (30 + Math.random() * 50);
                return (
                  <div key={f.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--t2)' }}>{f.label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: isSens ? 'var(--red)' : 'var(--blue)' }}>
                        {isSens ? 'Protected' : 'Merit Factor'}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bgi)', borderRadius: 100, overflow: 'hidden', display: 'flex' }}>
                      {isSens
                        ? <div style={{ height: '100%', width: `${width}%`, background: 'var(--red)', transition: 'width 0.8s ease' }} />
                        : <div style={{ height: '100%', width: `${width}%`, background: 'var(--blue)', transition: 'width 0.8s ease' }} />
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
