// FairLens AI — Top Navigation Bar
import React, { useState, useRef, useEffect } from 'react';
import { THEMES } from '../../config';

const DOMAINS = [
  { value: 'hiring',     label: 'Hiring' },
  { value: 'loan',       label: 'Loan' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education',  label: 'Education' },
];

const MODE_INFO = {
  dataset:   { title: 'Dataset Analyzer',      sub: 'Upload CSV · map columns · detect statistical bias · apply mitigation' },
  language:  { title: 'Language Analyzer',      sub: 'Detect biased language patterns · get inclusive alternatives · rewrite text' },
  simulator: { title: 'Bias Simulator',         sub: 'Enter a profile · predict outcome · reveal hidden bias via counterfactuals' },
};

export default function Navbar({
  activeMode, domain, setDomain,
  theme, setTheme,
  onFileUpload, apiUrl, geminiKey, onSaveSettings,
}) {
  const [themeOpen,    setThemeOpen]    = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localUrl,     setLocalUrl]     = useState(apiUrl);
  const [localKey,     setLocalKey]     = useState(geminiKey);
  const themeRef    = useRef(null);
  const settingsRef = useRef(null);
  const fileRef     = useRef(null);
  const info = MODE_INFO[activeMode] || MODE_INFO.dataset;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = () => {
    onSaveSettings(localUrl, localKey);
    setSettingsOpen(false);
  };

  const IBtn = ({ children, onClick, title, active }) => (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: 7,
      background: active ? 'var(--bdim)' : 'var(--bgi)',
      border: active ? '1px solid rgba(59,130,246,.3)' : '1px solid var(--bd)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: active ? 'var(--blue)' : 'var(--t2)',
      transition: 'all 0.18s', flexShrink: 0,
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--bd2)'; e.currentTarget.style.color = 'var(--t1)'; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.color = 'var(--t2)'; } }}
    >
      {children}
    </button>
  );

  return (
    <header style={{
      height: 58, minHeight: 58,
      background: 'var(--bg2)', borderBottom: '1px solid var(--bd)',
      display: 'flex', alignItems: 'center', padding: '0 18px',
      gap: 12, justifyContent: 'space-between', transition: 'background 0.3s',
    }}>
      {/* Left: Search + Domain Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bgi)', border: '1px solid var(--bd)', borderRadius: 7, padding: '6px 11px', marginRight: 14, minWidth: 180 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text" placeholder="Search audits..."
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--t1)', fontFamily: 'inherit', fontSize: 12, width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {DOMAINS.map(d => (
            <button
              key={d.value}
              onClick={() => setDomain(d.value)}
              style={{
                padding: '6px 13px', borderRadius: 100, fontSize: 13, fontWeight: domain === d.value ? 700 : 500,
                cursor: 'pointer', color: domain === d.value ? 'var(--blue)' : 'var(--t2)',
                border: domain === d.value ? '0 0 2px 0' : 'none',
                borderBottom: domain === d.value ? '2px solid var(--blue)' : '2px solid transparent',
                borderRadius: domain === d.value ? 0 : 100,
                background: 'none', fontFamily: 'inherit', transition: 'all 0.18s',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Page title */}
      <div style={{ textAlign: 'center', minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {info.title}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {info.sub}
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        {/* Upload */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', background: 'var(--blue)', border: 'none', borderRadius: 7,
          color: '#fff', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Dataset
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onFileUpload(e.target.files[0]); e.target.value = ''; }} />
        </label>

        {/* Theme picker */}
        <div ref={themeRef} style={{ position: 'relative' }}>
          <IBtn onClick={() => { setThemeOpen(o => !o); setSettingsOpen(false); }} title="Change Theme" active={themeOpen}>
            🎨
          </IBtn>
          {themeOpen && (
            <div style={{
              position: 'absolute', top: 42, right: 0, width: 224,
              background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 12,
              padding: 12, boxShadow: '0 12px 32px rgba(0,0,0,.5)', zIndex: 500,
              animation: 'fadeUp 0.2s ease',
            }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
                Choose Theme
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setThemeOpen(false); }}
                    title={t.label}
                    style={{
                      width: 46, height: 46, borderRadius: 8, cursor: 'pointer',
                      background: t.bg, border: `2px solid ${theme === t.id ? t.accent : 'transparent'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, transition: 'all 0.18s', position: 'relative',
                      boxShadow: theme === t.id ? `0 0 12px ${t.accent}55` : 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {t.emoji}
                    {theme === t.id && (
                      <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 800 }}>✓</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div ref={settingsRef} style={{ position: 'relative' }}>
          <IBtn onClick={() => { setSettingsOpen(o => !o); setThemeOpen(false); }} title="API Settings" active={settingsOpen}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
          </IBtn>
          {settingsOpen && (
            <div style={{
              position: 'absolute', top: 42, right: 0, width: 290,
              background: 'var(--bg3)', border: '1px solid var(--bd)', borderRadius: 12,
              padding: 16, boxShadow: '0 12px 32px rgba(0,0,0,.5)', zIndex: 500,
              animation: 'fadeUp 0.2s ease',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
                ⚙️ API Configuration
              </div>
              <div style={{ marginBottom: 10 }}>
                <label>Backend URL</label>
                <input className="form-input" value={localUrl} onChange={e => setLocalUrl(e.target.value)} placeholder="http://localhost:8000" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Gemini API Key <span style={{ textTransform: 'none', color: 'var(--t3)', fontWeight: 400 }}>(optional — for enhanced AI)</span></label>
                <input className="form-input" type="password" value={localKey} onChange={e => setLocalKey(e.target.value)} placeholder="AIza... paste your key here" />
                <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 4 }}>
                  Enables smarter text analysis and AI chat responses
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleSave}>Save Settings</button>
            </div>
          )}
        </div>

        {/* Live badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--gdim)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 100 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>LIVE</span>
        </div>

        {/* Avatar */}
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', border: '2px solid var(--bd2)', cursor: 'pointer', flexShrink: 0 }}>
          A
        </div>
      </div>
    </header>
  );
}
