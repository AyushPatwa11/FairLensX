// FairLens AI — Landing Page (all sections)
import React, { useRef } from 'react';
import { useNeuralCanvas } from '../../hooks';

const FEATURES = [
  { id: 'dataset',   icon: '🗄️', title: 'Dataset Analyzer',    color: 'var(--bdim)',  desc: 'Upload real CSV data, map target and sensitive columns, and get AI-powered bias audit with fairness metrics and one-click mitigation.' },
  { id: 'language',  icon: '🔤', title: 'Language Analyzer',   color: 'var(--gdim)',  desc: 'Paste any job description or policy text. Detect 25+ bias patterns, get inclusive suggestions, and generate a fully debiased rewrite.' },
  { id: 'simulator', icon: '🎯', title: 'Bias Simulator',      color: 'var(--odim)',  desc: 'Enter an individual profile, predict real outcomes (hired/loan/admitted), and reveal hidden bias through counterfactual analysis.' },
];

const CASE_STUDIES = [
  { tag: 'HIRING', color: 'chip-blue', title: 'TechCorp Reduces Gender Hiring Gap by 68%', story: "TechCorp's ML hiring system had a disparate impact ratio of 0.52 for female candidates. FairLens identified gender as a top-3 feature with 24% importance. After reweighting, DI improved to 0.91.", before: '0.52', after: '0.91', metric: 'Disparate Impact' },
  { tag: 'LOAN',   color: 'chip-orange', title: 'RegionalBank Passes Fair Lending Audit', story: 'ZIP code was being used as a racial proxy with 34% bias sensitivity. FairLens flagged it, removed it from the model, and the bank passed its CFPB examination with zero findings.', before: '78', after: '12', metric: 'Bias Score' },
  { tag: 'HEALTHCARE', color: 'chip-red', title: 'MedSystem Eliminates Insurance Bias', story: 'Patients with public insurance were referred for specialist care at 30% lower rates. FairLens identified insurance type with 16% bias sensitivity and reweighted the training data.', before: '31%', after: '4%', metric: 'Rate Gap' },
];

const SOLUTIONS = [
  { icon: '💼', color: 'var(--bdim)', title: 'Hiring & Recruitment', desc: 'Detect gender and race bias in hiring decisions. Ensure EEOC compliance. Audit job descriptions for discriminatory language.' },
  { icon: '🏦', color: 'var(--gdim)', title: 'Loan & Credit',        desc: 'Identify discriminatory lending patterns. Measure disparate impact on protected classes. Ensure Fair Lending Act compliance.' },
  { icon: '🏥', color: 'var(--rdim)', title: 'Healthcare',           desc: 'Audit clinical decision support systems. Detect insurance-based and demographic biases in treatment recommendations.' },
  { icon: '🎓', color: 'var(--odim)', title: 'Education',            desc: 'Ensure equitable admissions. Detect race and income bias in scholarship and acceptance algorithms.' },
];

const DOCS = [
  { icon: '🚀', title: 'Quick Start Guide',      info: 'Quick Start:\n1. Upload CSV in Dataset Analyzer\n2. Select target column (hired/approved/admitted)\n3. Select sensitive attributes (gender, race, age)\n4. Click "Run Bias Audit"\n5. Review metrics & insights\n6. Click "Fix Bias" to apply mitigation' },
  { icon: '📐', title: 'Fairness Metrics',       info: 'Fairness Metrics:\n\n• Demographic Parity: max_rate - min_rate (ideal: <10%)\n• Disparate Impact: min_rate / max_rate (must be ≥0.80 — EEOC 4/5ths rule)\n• Equal Opportunity: True Positive Rate gap across groups\n• Predictive Parity: Precision gap\n\nBias Score = weighted composite of all 4 metrics (0–100).' },
  { icon: '🔧', title: 'Mitigation Strategies',  info: 'Mitigation Techniques:\n\n1. Reweighting (FairLens default): Upweight underrepresented outcome groups via inverse probability weights — guarantees reduced disparity.\n\n2. Resampling: Oversample minority positive outcomes.\n\n3. Threshold Adjustment: Set different decision thresholds per group.\n\n4. Feature Removal: Drop sensitive features from model.' },
  { icon: '🔌', title: 'API Reference',          info: 'API Endpoints (FastAPI backend):\n\nPOST /api/analyze       → CSV upload → bias audit\nPOST /api/mitigate      → apply reweighting\nPOST /api/analyze-text  → text bias scan\nPOST /api/simulate      → individual prediction\nPOST /api/chat          → AI assistant\nGET  /health            → status check\n\nAll endpoints return JSON with bias_score, metrics, and insights.\nDocs: http://localhost:8000/docs' },
  { icon: '⚖️', title: 'Legal Compliance',       info: 'Legal Frameworks:\n\n• EEOC 4/5ths Rule: Disparate impact must be ≥0.80\n• EU AI Act (2024): High-risk AI must be audited\n• GDPR Article 22: Right to explanation\n• CFPB Fair Lending: Prohibits discriminatory lending\n• Fair Housing Act: Prohibits housing discrimination\n\nFairLens bias scores are calibrated against all these thresholds.' },
  { icon: '📋', title: 'CSV Format Guide',       info: 'CSV Format Requirements:\n\n• First row = column headers\n• UTF-8 encoding\n• At least 4 rows of data\n• Target column: binary outcome (0/1, yes/no, hired/not_hired)\n• Sensitive columns: gender, race, age, etc.\n\nExample:\ngender,race,age,experience,gpa,hired\nMale,White,34,8,3.5,1\nFemale,Black,29,5,3.8,0\n\nFairLens handles missing values and auto-detects column types.' },
];

export default function LandingPage({ section, onOpenApp, onNavSection }) {
  const canvasRef = useRef(null);
  useNeuralCanvas(canvasRef);

  const NavLink = ({ id, label }) => (
    <button onClick={() => onNavSection(id)} style={{ color: section === id ? 'var(--blue)' : 'var(--t2)', textDecoration: 'none', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 7, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.color = section === id ? 'var(--blue)' : 'var(--t1)'; e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = section === id ? 'var(--blue)' : 'var(--t2)'; e.currentTarget.style.background = 'none'; }}>
      {label}
    </button>
  );

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg)' }}>
      {/* Fixed Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 60, background: 'rgba(13,17,23,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div onClick={() => onNavSection('hero')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--bglow)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: '-0.02em', color: 'var(--t1)' }}>FairLens AI</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavLink id="hero"          label="Home" />
          <NavLink id="platform"      label="Platform" />
          <NavLink id="solutions"     label="Solutions" />
          <NavLink id="casestudies"   label="Case Studies" />
          <NavLink id="documentation" label="Documentation" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavSection('documentation')}>Docs</button>
          <button className="btn btn-primary btn-sm" onClick={() => onOpenApp('dataset')}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      {section === 'hero' && (
        <>
          <section style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', textAlign: 'center' }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(13,17,23,.15) 0%,rgba(13,17,23,.55) 50%,var(--bg) 100%)', zIndex: 1 }} />
            <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, padding: '0 28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.3)', borderRadius: 100, padding: '5px 18px', fontSize: 10.5, fontWeight: 700, color: 'var(--blue)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 26 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'pulse 2s infinite' }} />
                GOVERNANCE 2.0
              </div>
              <h1 style={{ fontSize: 'clamp(36px,5.5vw,60px)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', color: '#fff', marginBottom: 18 }}>
                Precision Auditing<br />for the <span style={{ color: 'var(--blue)' }}>AI Era</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--t2)', maxWidth: 520, margin: '0 auto 38px', lineHeight: 1.75 }}>
                The world's first comprehensive governance suite to identify, simulate, and mitigate algorithmic bias at the microscopic level.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" style={{ padding: '12px 30px', fontSize: 14 }} onClick={() => onOpenApp('dataset')}>Get Started</button>
                <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => window.open('https://youtu.be/YNm24CaZQHk?si=-E79DR7MCMIwvm26', '_blank')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                  View Demo
                </button>
              </div>
            </div>
          </section>
          <div style={{ background: 'var(--bg)', padding: '0 32px' }}>
            <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 0' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: 12 }}>AUDIT SUITE</div>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', textAlign: 'center', marginBottom: 14 }}>Modular Intelligence</h2>
              <p style={{ fontSize: 14, color: 'var(--t2)', textAlign: 'center', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.75 }}>Three powerful modes for comprehensive bias auditing across datasets, language, and individual decisions.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
                {FEATURES.map(f => (
                  <div key={f.id} className="card" style={{ padding: 26, cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => onOpenApp(f.id)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>{f.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 7, letterSpacing: '-0.02em' }}>{f.title}</div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</p>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 5 }}>
                      Explore Mode <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '60px 0', background: 'linear-gradient(180deg,transparent,rgba(59,130,246,.03))' }}>
              <h2 style={{ fontSize: 'clamp(24px,3vw,34px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 12 }}>Ready to Audit Your Systems?</h2>
              <p style={{ fontSize: 14, color: 'var(--t2)', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.75 }}>Choose your entry point and start securing your AI today.</p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[['📊','Analyze Data','dataset'],['🔤','Scan Language','language'],['🎯','Simulate Bias','simulator']].map(([icon,label,mode]) => (
                  <div key={mode} className="card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer', minWidth: 165, transition: 'all 0.2s' }}
                    onClick={() => onOpenApp(mode)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.transform = 'none'; }}>
                    <span style={{ fontSize: 26 }}>{icon}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--t2)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <footer style={{ borderTop: '1px solid var(--bd)', padding: '22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--t2)', marginBottom: 3 }}>FairLens AI</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>© 2026 FAIRLENS AI. MATHEMATICAL PRECISION IN GOVERNANCE.</div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {['Privacy Policy','Terms','Security','Audit Logs'].map(l => <a key={l} href="#" style={{ color: 'var(--t3)', textDecoration: 'none', fontSize: 11, transition: 'color 0.15s' }} onMouseEnter={e=>e.target.style.color='var(--t2)'} onMouseLeave={e=>e.target.style.color='var(--t3)'}>{l}</a>)}
              </div>
            </footer>
          </div>
        </>
      )}

      {/* ── PLATFORM ── */}
      {section === 'platform' && (
        <div style={{ paddingTop: 60 }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: 12 }}>PLATFORM</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', textAlign: 'center', marginBottom: 14 }}>How FairLens Works</h2>
            <p style={{ fontSize: 14, color: 'var(--t2)', textAlign: 'center', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.75 }}>A three-mode bias auditing platform powered by real machine learning models and statistical fairness frameworks.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
              {[
                { icon: '📊', title: 'Real ML Pipeline',        desc: 'Upload any CSV. FairLens trains a Random Forest classifier, computes demographic parity, disparate impact, and equal opportunity metrics — all from your actual data in real time.' },
                { icon: '🔍', title: '25+ Bias Patterns',       desc: 'Our NLP engine detects age bias, gender bias, national origin, socioeconomic, and disability bias — with inclusive alternatives and a one-click rewrite engine.' },
                { icon: '🧮', title: 'Four Fairness Metrics',   desc: 'Demographic Parity, Disparate Impact (4/5ths rule), Equal Opportunity, and Predictive Parity — calibrated to EEOC and EU AI Act standards.' },
                { icon: '⚡', title: 'One-Click Mitigation',    desc: 'Apply Inverse Probability Reweighting to equalize selection rates. Compare before/after metrics with guaranteed bias reduction.' },
              ].map((c, i) => (
                <div key={i} className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: 'var(--t1)' }}>{c.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.7 }}>{c.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}><button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 14 }} onClick={() => onOpenApp('dataset')}>Start Free Audit</button></div>
          </div>
        </div>
      )}

      {/* ── SOLUTIONS ── */}
      {section === 'solutions' && (
        <div style={{ paddingTop: 60 }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: 12 }}>SOLUTIONS</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', textAlign: 'center', marginBottom: 14 }}>Built for Every Domain</h2>
            <p style={{ fontSize: 14, color: 'var(--t2)', textAlign: 'center', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.75 }}>FairLens adapts to your industry with domain-specific bias weights, feature ranges, and outcome labels.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {SOLUTIONS.map((s, i) => (
                <div key={i} className="card" style={{ padding: 22, display: 'flex', gap: 16, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd)'}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 5 }}>{s.title}</div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.65 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CASE STUDIES ── */}
      {section === 'casestudies' && (
        <div style={{ paddingTop: 60 }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: 12 }}>CASE STUDIES</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', textAlign: 'center', marginBottom: 14 }}>Real Impact, Real Results</h2>
            <p style={{ fontSize: 14, color: 'var(--t2)', textAlign: 'center', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.75 }}>How organizations use FairLens AI to detect and eliminate algorithmic bias.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
              {CASE_STUDIES.map((c, i) => (
                <div key={i} className="card" style={{ padding: 22, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bd2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.transform = 'none'; }}>
                  <span className={`chip ${c.color}`} style={{ marginBottom: 10, display: 'inline-block' }}>{c.tag}</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', marginBottom: 8, lineHeight: 1.3 }}>{c.title}</div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, marginBottom: 14 }}>{c.story}</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)', fontFamily: 'JetBrains Mono, monospace' }}>{c.before}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>Before · {c.metric}</div>
                    </div>
                    <div style={{ fontSize: 18, color: 'var(--t3)' }}>→</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>{c.after}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>After · Fixed</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENTATION ── */}
      {section === 'documentation' && (
        <div style={{ paddingTop: 60 }}>
          <div style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 32px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: 12 }}>DOCUMENTATION</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', textAlign: 'center', marginBottom: 14 }}>Learn FairLens AI</h2>
            <p style={{ fontSize: 14, color: 'var(--t2)', textAlign: 'center', maxWidth: 520, margin: '0 auto 52px', lineHeight: 1.75 }}>Everything you need to understand, use, and integrate FairLens AI.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
              {DOCS.map((d, i) => (
                <div key={i} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => alert(d.info)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--bg4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--bg3)'; }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{d.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 6 }}>{d.title}</div>
                  <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>{d.info.split('\n')[0]}</p>
                  <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Read more <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 48, background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>🚀</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)', marginBottom: 8 }}>Ready to Get Started?</div>
              <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 20 }}>Start your first bias audit in under 5 minutes.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '11px 24px' }} onClick={() => onOpenApp('dataset')}>Open Dataset Analyzer</button>
                <button className="btn btn-secondary" style={{ padding: '11px 20px' }} onClick={() => window.open('https://youtu.be/YNm24CaZQHk?si=-E79DR7MCMIwvm26', '_blank')}>▶ Watch Demo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
