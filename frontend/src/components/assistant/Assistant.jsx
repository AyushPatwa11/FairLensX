// FairLens AI — AI Chat Assistant
import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../../utils/api';

const QUICK_PROMPTS = [
  'What is disparate impact?',
  'How do I fix bias?',
  'What is demographic parity?',
  'How to use Mode 1?',
  'What is the 4/5ths rule?',
];

export default function Assistant({ geminiKey }) {
  const [open,    setOpen]    = useState(false);
  const [msgs,    setMsgs]    = useState([
    { role: 'bot', text: '👋 Hi! I\'m the **FairLens AI Assistant**. Ask me anything about bias detection, fairness metrics, how to use the platform, or AI governance regulations.' },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const send = async (message) => {
    const msg = message || input.trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg = { role: 'user', text: msg };
    setMsgs(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await chatAPI.send(msg, history, geminiKey);
      const reply = resp.data.reply;
      setMsgs(prev => [...prev, { role: 'bot', text: reply }]);
      setHistory(prev => [...prev, { role: 'user', content: msg }, { role: 'assistant', content: reply }].slice(-12));
    } catch {
      // Local fallback
      const LOCAL = {
        'disparate impact':   '**Disparate Impact** = minority_rate / majority_rate. The **4/5ths rule** requires this ≥ 0.80. Below 0.80 may constitute illegal discrimination under EEOC guidelines.',
        'demographic parity': '**Demographic Parity** = difference in positive outcome rates across groups. Ideal: < 0.10 (10%). Values above this indicate significant disparity.',
        'equal opportunity':  '**Equal Opportunity** measures the True Positive Rate (TPR) gap. High TPR gap means qualified individuals from disadvantaged groups are less likely to receive positive outcomes.',
        'fix bias':           'FairLens uses **Inverse Probability Reweighting** — upweights underrepresented outcome groups to equalize selection rates. Click "🔧 Fix Bias" in Mode 1 after running an audit.',
        'mode 1':             '**Mode 1 — Dataset Analyzer**: Upload CSV → select target & sensitive columns → system trains Random Forest → computes fairness metrics → one-click mitigation with before/after comparison.',
        'mode 2':             '**Mode 2 — Language Scanner**: Paste any text → detect 27+ bias patterns (age, gender, origin, family, disability) → highlight phrases → suggest alternatives → generate inclusive rewrite.',
        'mode 3':             '**Mode 3 — Bias Simulator**: Enter individual profile → predict outcome (hired/loan/admitted) → counterfactual analysis shows how changing gender/race shifts the decision.',
        '4/5':                'The **4/5ths Rule** (EEOC): If the selection rate for a protected group is less than 80% of the highest group\'s rate, this indicates adverse impact. FairLens flags this automatically.',
        'bias score':         'The **Bias Score** (0–100): Low (<40) = acceptable, Moderate (40–70) = needs review, High (>70) = immediate action. Computed from demographic parity (30%), disparate impact (35%), and equal opportunity (25%).',
        'mitigation':         'FairLens uses **Inverse Probability Reweighting** — upweights samples from underrepresented outcome groups. Other techniques: resampling, threshold adjustment, adversarial debiasing.',
        'upload':             'To upload: Go to **Mode 1** → click the upload zone or drag-drop your CSV → select target column (hired/approved/admitted) → select sensitive attributes → click **Run Bias Audit**.',
        'hello':              'Hello! I\'m the **FairLens AI Assistant**. I can help with:\n- Bias metrics (disparate impact, demographic parity)\n- How to use each analysis mode\n- Mitigation strategies\n- Legal compliance (EEOC, EU AI Act, GDPR)\n\nWhat would you like to know?',
        'gemini':             'To enable Gemini AI: click the ⚙️ settings icon in the top bar → paste your **Gemini API Key** (AIza...) → click Save. You can get a free key at ai.google.dev',
        'csv':                'Your CSV must have: headers in row 1, a binary outcome column (0/1, yes/no, hired/not), and sensitive attribute columns (gender, race, age, etc.). Minimum 4 rows needed.',
      };
      const ml = msg.toLowerCase();
      const key = Object.keys(LOCAL).find(k => ml.includes(k));
      const reply = key ? LOCAL[key] : 'I can help with bias detection, fairness metrics, and how to use FairLens. Try: "What is disparate impact?" or "How do I fix bias?" or "How to use Mode 1?"';
      setMsgs(prev => [...prev, { role: 'bot', text: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const renderText = (text) => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="AI Assistant"
        style={{
          width: 52, height: 52, borderRadius: '50%', background: 'var(--blue)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px var(--bglow)', transition: 'all 0.2s', color: '#fff',
          transform: open ? 'scale(1.05)' : 'scale(1)',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = open ? 'scale(1.05)' : 'scale(1)'; }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* Unread dot */}
      {!open && msgs.length > 1 && (
        <div style={{ position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--bg)', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
          {Math.min(msgs.length - 1, 9)}
        </div>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute', bottom: 64, right: 0, width: 368,
          background: 'var(--bg3)', border: '1px solid var(--bd)',
          borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>FairLens AI Assistant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>
                {geminiKey ? '✦ Gemini' : 'Rule-based'}
              </span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div ref={msgsRef} style={{ height: 300, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                padding: '9px 12px', borderRadius: 10, maxWidth: '88%', fontSize: 12.5, lineHeight: 1.55,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--blue)' : 'var(--bg4)',
                color: m.role === 'user' ? '#fff' : 'var(--t1)',
                border: m.role === 'bot' ? '1px solid var(--bd)' : 'none',
                borderRadius: m.role === 'user' ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
                animation: 'fadeUp 0.2s ease',
              }}>
                <span dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--bg4)', border: '1px solid var(--bd)', borderRadius: '10px 10px 10px 3px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: `pulse 1.2s ${i*0.2}s infinite` }} />
                ))}
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '6px 10px', borderTop: '1px solid var(--bd)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)} style={{
                padding: '3px 9px', borderRadius: 100, fontSize: 10.5, cursor: 'pointer',
                background: 'var(--bdim)', border: '1px solid rgba(59,130,246,.2)',
                color: 'var(--blue)', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bdim)'; e.currentTarget.style.color = 'var(--blue)'; }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bd)', display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask about bias, metrics, compliance..."
              style={{
                flex: 1, background: 'var(--bgi)', border: '1px solid var(--bd)',
                borderRadius: 8, padding: '8px 11px', color: 'var(--t1)',
                fontFamily: 'inherit', fontSize: 12.5, outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--blue)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--bd)'; }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 8, background: 'var(--blue)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', transition: 'all 0.18s', flexShrink: 0,
              }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
