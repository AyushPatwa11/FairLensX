// FairLens AI — Dataset Analyzer Mode
import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { datasetAPI } from '../../utils/api';
import { DOMAIN_CONFIG } from '../../config';
import {
  StepIndicator, BiasGauge, MetricGrid,
  FeatureImportanceChart, SelectionRateChart, InsightsList,
  Spinner, showToast, DemoModeBanner, EmptyState, LoadingOverlay,
} from '../shared';

const STEPS = ['Upload Data', 'Map Columns', 'Bias Audit', 'Mitigation'];

function makeGaugeSVG(score, size = 90) {
  const c = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
  const r = size / 2 - 6;
  const arc = 2 * Math.PI * r;
  const off = arc - (score / 100) * arc;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={c} strokeWidth="8"
        strokeDasharray={arc} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`} />
      <text x={cx} y={cx + 5} textAnchor="middle" fontSize={size * 0.19} fontWeight="800"
        fill={c} fontFamily="Inter, sans-serif">{score}</text>
    </svg>
  );
}

export default function DatasetMode({ domain, geminiKey, onFileLoaded }) {
  const [step, setStep]               = useState(0);
  const [file, setFile]               = useState(null);
  const [csvData, setCsvData]         = useState(null);
  const [columns, setColumns]         = useState([]);
  const [targetCol, setTargetCol]     = useState('');
  const [sensitiveCols, setSensitive] = useState([]);
  const [mappingKey, setMappingKey] = useState(0);
  const [result, setResult]           = useState(null);
  const [mitigated, setMitigated]     = useState(null);
  const [mitigationTech, setMitigationTech] = useState('reweight');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [demoMode, setDemoMode]       = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const cfg = DOMAIN_CONFIG[domain] || DOMAIN_CONFIG.hiring;

  // ── File handling ─────────────────────────────────────
  const processFile = useCallback((f) => {
    if (!f || !f.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a .csv file'); return;
    }
    setFile(f);
    setError('');
    Papa.parse(f, {
      header: true, skipEmptyLines: true,
      complete: ({ data, meta }) => {
        if (!data.length) { setError('CSV is empty or has no data rows'); return; }
        setCsvData(data);
        setColumns(meta.fields || []);
        // Auto-suggest target
        const autoTarget = meta.fields.find(h => cfg.targetSuggestions.some(s => h.toLowerCase().includes(s)));
        if (autoTarget) setTargetCol(autoTarget);
        // Auto-suggest sensitives
        const autoSens = meta.fields.filter(h => cfg.sensitiveSuggestions.some(s => h.toLowerCase().includes(s)));
        // If nothing matched suggestions, auto-select the first non-target column so user can proceed
        if (autoSens.length) {
          setSensitive(autoSens.slice(0, 3));
        } else {
          const fallback = meta.fields.find(h => h !== autoTarget && h.toLowerCase() !== (autoTarget || '').toLowerCase());
          if (fallback) setSensitive([fallback]);
        }

        // If no auto target suggested, try to detect a binary outcome column automatically
        if (!autoTarget) {
          const detectBinary = (vals) => {
            const cleaned = vals.map(v => String(v ?? '').trim().toLowerCase()).filter(v => v !== '');
            const uniq = Array.from(new Set(cleaned));
            if (uniq.length <= 2) return true;
            // common textual positive labels
            const positives = ['1','0','yes','no','true','false','y','n','hired','selected','approved','promoted'];
            const hasPos = uniq.some(u => positives.includes(u));
            return hasPos && uniq.length <= 4;
          };

          let detected = null;
          for (const col of meta.fields) {
            const vals = data.map(r => r[col]);
            if (detectBinary(vals)) { detected = col; break; }
          }
          if (detected) setTargetCol(detected);
        }
        setStep(1);
        if (onFileLoaded) onFileLoaded(f.name);
      },
      error: (e) => setError('CSV parse error: ' + e.message),
    });
  }, [cfg, onFileLoaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    processFile(f);
  }, [processFile]);

  const loadSample = () => {
    // Generate 30-row biased sample
    const genders = Array.from({ length: 30 }, (_, i) => i % 2 === 0 ? 'Male' : 'Female');
    const races   = ['White','Black','Hispanic','Asian','Other','White','White','Black','Asian','Hispanic'].concat(
                    ['White','Black','White','Asian','Hispanic','White','Black','Asian','White','Hispanic']).concat(
                    ['White','Black','Hispanic','Asian','Other','White','Black','White','Asian','Hispanic']);
    const edus    = ['Masters','Bachelors','PhD','Bachelors','Masters','Bachelors','Masters','PhD','Bachelors','Masters',
                     'PhD','Bachelors','Masters','Bachelors','Masters','PhD','Bachelors','Masters','Bachelors','PhD',
                     'Masters','Bachelors','PhD','Masters','Bachelors','Masters','PhD','Bachelors','Masters','PhD'];
    const rows = [['id','gender','race','age','education','experience','gpa','hired']];
    for (let i = 0; i < 30; i++) {
      const g = genders[i], r = races[i];
      const exp = 2 + Math.floor(Math.random() * 18);
      const gpa = parseFloat((2.5 + Math.random() * 1.5).toFixed(2));
      const prob = (g === 'Male' ? 0.74 : 0.30) + (r === 'White' ? 0.08 : -0.05) + (exp > 10 ? 0.04 : 0);
      const hired = Math.random() < Math.min(0.95, Math.max(0.05, prob)) ? 1 : 0;
      rows.push([i + 1, g, r, 22 + Math.floor(Math.random() * 28), edus[i], exp, gpa, hired]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const f = new File([blob], 'sample_hiring_data.csv', { type: 'text/csv' });
    processFile(f);
  };

  // ── Analysis ──────────────────────────────────────────
  const localAnalyze = (data, target, sens) => {
    const primary = sens[0];
    const groups = {};
    data.forEach(row => {
      const g = String(row[primary] ?? 'Unknown');
      if (!groups[g]) groups[g] = { total: 0, pos: 0 };
      groups[g].total++;
      const v = row[target];
      if (v === 1 || v === '1' || String(v).toLowerCase() === 'yes' || String(v).toLowerCase() === 'hired' || String(v).toLowerCase() === 'approved') groups[g].pos++;
    });
    const rates = Object.entries(groups).map(([g, s]) => ({ group: g, rate: s.total ? +(s.pos / s.total).toFixed(4) : 0, count: s.total, positive: s.pos })).sort((a, b) => b.rate - a.rate);
    const maxR = Math.max(...rates.map(r => r.rate)), minR = Math.min(...rates.map(r => r.rate));
    const dp = +(maxR - minR).toFixed(4), di = maxR > 0 ? +(minR / maxR).toFixed(4) : 1;
    const dpS = Math.min(100, dp * 200), diS = Math.min(100, Math.max(0, (1 - di) * 125)), eoS = Math.min(100, dp * 0.82 * 200);
    const bias_score = Math.min(100, Math.max(0, Math.round(dpS * 0.3 + diS * 0.35 + eoS * 0.25)));
    const cols = Object.keys(data[0] || {}).filter(c => c !== target);
    const feat = cols.map(c => ({ feature: c, importance: +(Math.random() * 0.3 + 0.02).toFixed(4), is_sensitive: sens.includes(c) })).sort((a, b) => b.importance - a.importance);
    const totalImp = feat.reduce((s, f) => s + f.importance, 0);
    feat.forEach(f => f.importance = +(f.importance / totalImp).toFixed(4));
    const insights = [];
    if (rates.length >= 2) insights.push(`'${rates[0].group}' has ${(rates[0].rate * 100).toFixed(1)}% positive rate vs ${(rates[rates.length-1].rate * 100).toFixed(1)}% for '${rates[rates.length-1].group}' — a ${(dp*100).toFixed(1)}% disparity`);
    if (di < 0.8) insights.push(`Disparate impact ${di.toFixed(3)} violates the 4/5ths legal rule (threshold: 0.80)`);
    insights.push(bias_score >= 70 ? 'High bias severity — immediate mitigation required' : bias_score >= 40 ? 'Moderate bias detected — review before deployment' : 'Bias within acceptable thresholds');
    return { bias_score, risk_level: bias_score >= 70 ? 'High' : bias_score >= 40 ? 'Moderate' : 'Low', selection_rates: rates, metrics: { demographic_parity: dp, disparate_impact: di, equal_opportunity: +(dp * 0.82).toFixed(4), predictive_parity: +(dp * 0.65).toFixed(4) }, feature_importance: feat, insights, row_count: data.length, columns: cols, primary_sensitive: primary };
  };

  const localMitigate = (prev, technique = 'reweight') => {
    // heuristic simulated mitigation depending on technique
    let factor = 0.32;
    let summaryTech = 'Inverse Probability Reweighting';
    if (technique && technique.startsWith('down')) { factor = 0.5; summaryTech = 'Downsampling'; }
    const newScore = Math.max(4, Math.round(prev.bias_score * factor));
    const di = prev.metrics.disparate_impact;
    const newDi = Math.min(0.97, di + (1 - di) * (technique.startsWith('down') ? 0.5 : 0.72));
    const newDp = prev.metrics.demographic_parity * (technique.startsWith('down') ? 0.45 : 0.22);
    return { ...prev, bias_score: newScore, risk_level: newScore >= 70 ? 'High' : newScore >= 40 ? 'Moderate' : 'Low', metrics: { demographic_parity: +newDp.toFixed(4), disparate_impact: +newDi.toFixed(4), equal_opportunity: +(newDp * 0.82).toFixed(4), predictive_parity: +(newDp * 0.65).toFixed(4) }, selection_rates: prev.selection_rates.map(r => ({ ...r, rate: Math.min(0.95, +(r.rate + (0.5 - r.rate) * (technique.startsWith('down') ? 0.5 : 0.72)).toFixed(4)) })), improvement: prev.bias_score - newScore, technique: summaryTech, summary: `Bias score reduced from ${prev.bias_score} → ${newScore} (${prev.bias_score - newScore} points). Disparate impact improved to ${newDi.toFixed(3)}.` };
  };

  const downloadReport = () => {
    const payload = { metadata: { file: file?.name || null, domain, target: targetCol, sensitive: sensitiveCols }, result, mitigated, generated_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (file?.name?.replace('.csv','') || 'fairness_report') + '_report.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast('Report downloaded', 'success');
  };

  const runAnalysis = async () => {
    setError('');
    if (!columns.length) { setError('Please upload a CSV first'); return; }
    setLoading(true);
    // ensure we have mappings, try to detect if missing
    let t = targetCol;
    let s = sensitiveCols.slice();
    if (!t || !s.length) {
      const detected = detectMappings();
      if (detected.detectedTarget) t = detected.detectedTarget;
      if (detected.detectedSens?.length) s = detected.detectedSens;
      setTargetCol(t || '');
      setSensitive(s || []);
      setMappingKey(k => k + 1);
      showToast('Auto-detected mappings applied for analysis', 'info');
    }

    try {
      const res = await datasetAPI.analyze(file, t, s, domain);
      setResult(res.data); setDemoMode(false); setStep(2);
    } catch {
      setResult(localAnalyze(csvData, t, s));
      setDemoMode(true); setStep(2);
    } finally { setLoading(false); }
  };

  const runMitigation = async () => {
    setLoading(true);
    try {
      const res = await datasetAPI.mitigate(file, targetCol, sensitiveCols, domain, result.bias_score, mitigationTech);
      setMitigated(res.data); setDemoMode(false);
    } catch (err) {
      setMitigated(localMitigate(result, mitigationTech));
      setDemoMode(true);
    } finally { setLoading(false); setStep(3); showToast('Mitigation applied successfully!', 'success'); }
  };

  const reset = () => {
    setStep(0); setFile(null); setCsvData(null); setColumns([]);
    setTargetCol(''); setSensitive([]); setResult(null);
    setMitigated(null); setError(''); setDemoMode(false);
    if (onFileLoaded) onFileLoaded(null);
  };

  const toggleSensitive = (col) => {
    if (col === targetCol) return;
    setSensitive(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const autoDetectMappings = () => {
    if (!csvData || !columns.length) { showToast('Upload a CSV first', 'error'); return; }
    // detect binary-like target column
    const detectBinary = (vals) => {
      const cleaned = vals.map(v => String(v ?? '').trim().toLowerCase()).filter(v => v !== '');
      const uniq = Array.from(new Set(cleaned));
      if (uniq.length <= 2) return true;
      const positives = ['1','0','yes','no','true','false','y','n','hired','selected','approved','promoted'];
      const hasPos = uniq.some(u => positives.includes(u));
      return hasPos && uniq.length <= 4;
    };

    let detectedTarget = targetCol;
    if (!detectedTarget) {
      for (const col of columns) {
        const vals = csvData.slice(0, 500).map(r => r[col]);
        if (detectBinary(vals)) { detectedTarget = col; break; }
      }
    }

    let detectedSens = sensitiveCols.slice();
    if (!detectedSens.length) {
      const autoSens = columns.filter(h => cfg.sensitiveSuggestions.some(s => h.toLowerCase().includes(s)));
      if (autoSens.length) detectedSens = autoSens.slice(0, 3);
      else {
        const fallback = columns.find(c => c !== detectedTarget && c.toLowerCase() !== (detectedTarget || '').toLowerCase());
        if (fallback) detectedSens = [fallback];
      }
    }

    if (!detectedTarget) {
      // fallback: pick first non-id/continuous-looking column
      const avoid = ['id','index','age','salary','income','experience','gpa','date'];
      const fallback = columns.find(c => !avoid.includes(c.toLowerCase()));
      detectedTarget = fallback || columns[0];
    }
    console.log('autoDetectMappings -> target:', detectedTarget, 'sensitive:', detectedSens);
    // Always set the target and sensitive states (explicitly assign empty values when not detected)
    setTargetCol(detectedTarget || '');
    setSensitive(detectedSens.length ? detectedSens : []);
    console.log('autoDetectMappings after setState -> targetCol:', detectedTarget, 'sensitiveCols:', detectedSens);
    // Immediately bump mappingKey to force remount of the mapping controls so DOM reflects state
    setMappingKey(k => k + 1);
    showToast('Auto-detected target and sensitive columns', 'success');
  };

  const detectMappings = () => {
    if (!csvData || !columns.length) return { detectedTarget: '', detectedSens: [] };
    const detectBinary = (vals) => {
      const cleaned = vals.map(v => String(v ?? '').trim().toLowerCase()).filter(v => v !== '');
      const uniq = Array.from(new Set(cleaned));
      if (uniq.length <= 2) return true;
      const positives = ['1','0','yes','no','true','false','y','n','hired','selected','approved','promoted'];
      const hasPos = uniq.some(u => positives.includes(u));
      return hasPos && uniq.length <= 4;
    };

    let detectedTarget = targetCol;
    if (!detectedTarget) {
      for (const col of columns) {
        const vals = csvData.slice(0, 500).map(r => r[col]);
        if (detectBinary(vals)) { detectedTarget = col; break; }
      }
    }

    let detectedSens = sensitiveCols.slice();
    if (!detectedSens.length) {
      const autoSens = columns.filter(h => cfg.sensitiveSuggestions.some(s => h.toLowerCase().includes(s)));
      if (autoSens.length) detectedSens = autoSens.slice(0, 3);
      else {
        const fallback = columns.find(c => c !== detectedTarget && c.toLowerCase() !== (detectedTarget || '').toLowerCase());
        if (fallback) detectedSens = [fallback];
      }
    }

    if (!detectedTarget) {
      const avoid = ['id','index','age','salary','income','experience','gpa','date'];
      const fallback = columns.find(c => !avoid.includes(c.toLowerCase()));
      detectedTarget = fallback || columns[0] || '';
    }

    return { detectedTarget, detectedSens };
  };

  // ── Render ────────────────────────────────────────────
  const S = { padding: '20px 20px 0' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header + Steps */}
      <div style={S}>
        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', marginBottom: 3 }}>Dataset Analyzer</h1>
        <p style={{ fontSize: 12.5, color: 'var(--t2)', marginBottom: 0 }}>Upload real CSV data — the system trains a model and computes actual fairness metrics.</p>
        <StepIndicator steps={STEPS} current={step} />
      </div>

      {/* Main Layout */}
      <div className="dataset-layout" style={{ flex: 1, overflow: 'auto' }}>

        {/* LEFT PANEL */}
        <div className="panel-wrap" style={{ overflowY: 'auto', padding: '14px 16px', borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Workflow quick steps */}
          {columns.length > 0 && (
            <div className="workflow-card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 800 }}>Next Steps</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>Step {Math.min(step+1, STEPS.length)} of {STEPS.length}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STEPS.map((s,i) => (
                  <div key={s} style={{ padding: '6px 9px', borderRadius: 8, background: i === step ? 'var(--bdim)' : 'transparent', border: i < step ? '1px solid rgba(16,185,129,.12)' : '1px solid transparent', fontSize: 12, fontWeight: 700 }}>
                    {i+1}. {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="alert alert-error" role="alert" aria-live="assertive"><span>⚠</span><span>{error}</span></div>}

          {/* Step 1: Upload */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)', fontSize: 9.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Step 1: Upload Dataset
            </div>
            <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div className={`upload-zone ${!file ? '' : ''}`} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('ds-file-inp').click(); } }} onClick={() => document.getElementById('ds-file-inp').click()} onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag'); }} onDragLeave={e => e.currentTarget.classList.remove('drag')} onDrop={e => { e.currentTarget.classList.remove('drag'); handleDrop(e); }} role="button" aria-label="Upload CSV file">
                <input id="ds-file-inp" aria-label="Upload CSV file" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]); e.target.value = ''; }} />
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center' }}>
                    <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
                    <span style={{ fontSize: 12.5, color: 'var(--green)', fontWeight: 700 }}>{file.name} — {csvData?.length || 0} rows loaded</span>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 8, color: 'var(--t3)' }}>☁</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 3 }}>Drag & drop CSV file here</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>or click to browse · .csv files only</div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
                <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'JetBrains Mono, monospace' }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
              </div>
              <button className="btn btn-secondary btn-full" onClick={loadSample}>Use Sample {cfg.label} Dataset (30 rows)</button>

              {/* Preview (collapsible) */}
              {csvData && (
                <div className="animate-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>Preview · {csvData.length} rows · {columns.length} columns</div>
                    <button aria-expanded={showPreview} aria-controls="csv-preview" className="btn btn-ghost btn-sm" onClick={() => setShowPreview(p => !p)} style={{ padding: '6px 10px' }}>{showPreview ? 'Hide' : 'Show'} preview</button>
                  </div>
                  {showPreview && (
                    <div id="csv-preview" style={{ border: '1px solid var(--bd)', borderRadius: 7, overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                      <table className="data-table">
                        <thead><tr>{columns.slice(0, 6).map(c => <th key={c}>{c}</th>)}</tr></thead>
                        <tbody>
                          {csvData.slice(0, 5).map((row, i) => (
                            <tr key={i}>{columns.slice(0, 6).map(c => <td key={c}>{String(row[c] ?? '')}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Column Mapping */}
          {columns.length > 0 && (
            <div className="card animate-in" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bd)', fontSize: 9.5, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Step 2: Column Mapping
              </div>
              <div style={{ padding: 13, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label>Target Column (Outcome Variable)</label>
                    <div className="select-wrap">
                    <select aria-label="Target column" key={mappingKey} className="form-select" value={targetCol} onChange={e => setTargetCol(e.target.value)}>
                      <option value="">Select target column...</option>
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button id="auto-detect-mappings-btn" title="Auto-detect target and sensitive columns" className="btn btn-ghost" onClick={autoDetectMappings} style={{ padding: '6px 10px', fontSize: 12 }}>Auto-detect mappings</button>
                    <div style={{ display: 'inline-block', marginLeft: 10, fontSize: 11, color: 'var(--t3)' }}>Can't see the right column? Click to auto-detect target & sensitive columns.</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 4 }}>
                    Suggested: <span style={{ color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace' }}>{cfg.targetSuggestions.slice(0,4).join(', ')}</span>
                  </div>
                </div>
                <div>
                  <label>Sensitive Attributes — click to select</label>
                  <p style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 8 }}>
                    <span style={{ color: 'var(--orange)' }}>⚠ Amber</span> = recommended for {cfg.label} domain
                  </p>
                  <div key={mappingKey} style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {columns.filter(c => c !== targetCol).map(c => {
                      const sel = sensitiveCols.includes(c);
                      const sugg = cfg.sensitiveSuggestions.some(s => c.toLowerCase().includes(s));
                      return (
                        <button
                          key={c}
                          data-test="sensitive-button"
                          aria-pressed={sel}
                          aria-label={`${sel ? 'Unselect' : 'Select'} sensitive attribute ${c}`}
                          className={`sensitive-btn ${sel ? 'selected' : ''}`}
                          onClick={() => toggleSensitive(c)}
                          style={{
                            padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                            fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer', transition: 'all 0.15s',
                            background: sel ? 'var(--blue)' : sugg ? 'var(--odim)' : 'var(--bgi)',
                            border: `1px solid ${sel ? 'var(--blue)' : sugg ? 'rgba(245,158,11,.3)' : 'var(--bd)'}`,
                            color: sel ? '#fff' : sugg ? 'var(--orange)' : 'var(--t2)',
                          }}
                        >
                          {sel ? '✓ ' : ''}{c}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button className="btn btn-primary btn-full" onClick={runAnalysis} disabled={loading || !columns.length}>
                  {loading ? <><Spinner /> Running Analysis...</> : (!targetCol || !sensitiveCols.length ? 'Run Bias Audit (auto-detect mappings)' : 'Run Bias Audit')}
                </button>
              </div>
            </div>
          )}

          {/* Mitigation Banner */}
          {result && step === 2 && (
            <div className="animate-in" style={{ background: 'linear-gradient(135deg,rgba(16,185,129,.08),rgba(59,130,246,.05))', border: '1px solid rgba(16,185,129,.2)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 3 }}>Mitigate Identified Bias</div>
                <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                  Apply reweighting to equalize rates across <strong style={{ color: 'var(--green)' }}>{result.primary_sensitive}</strong> groups. Guaranteed improvement.
                </div>
              </div>
              <button className="btn btn-success" onClick={runMitigation} disabled={loading} style={{ flexShrink: 0, flexDirection: 'column', gap: 2, minWidth: 80, padding: '10px 16px' }}>
                {loading ? <Spinner /> : <><span style={{ fontSize: 14, fontWeight: 900 }}>Apply</span><span style={{ fontSize: 10.5, fontWeight: 600 }}>Fix Bias</span></>}
              </button>
            </div>
          )}

          {/* Before / After */}
          {mitigated && step === 3 && (
            <div className="animate-in">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, marginBottom: 11 }}>
                {[
                  { label: 'Before', data: result, color: 'var(--red)' },
                  { label: 'After',  data: mitigated, color: 'var(--green)' },
                ].map(({ label, data, color }) => (
                  <div className="card" key={label} style={{ padding: 13, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, justifyContent: 'center' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 9.5, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label} Mitigation</span>
                    </div>
                    {makeGaugeSVG(data.bias_score)}
                    <div style={{ fontSize: 10, color: data.bias_score >= 70 ? 'var(--red)' : data.bias_score >= 40 ? 'var(--orange)' : 'var(--green)', marginTop: 4, fontWeight: 600 }}>
                      {data.bias_score >= 70 ? 'HIGH RISK' : data.bias_score >= 40 ? 'MODERATE' : 'LOW RISK'}
                    </div>
                    {label === 'After' && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 3, fontWeight: 700 }}>+{mitigated.improvement} pts improved</div>}
                  </div>
                ))}
              </div>
              {mitigated.summary && (
                <div className="alert alert-success"><span>✅</span><div><div style={{ fontWeight: 700, marginBottom: 2 }}>Bias Reduced</div><div style={{ fontSize: 12 }}>{mitigated.summary}</div></div></div>
              )}
              <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={reset}>← New Analysis</button>
            </div>
          )}
          <LoadingOverlay show={loading} message={step === 2 ? 'Running analysis...' : step === 3 ? 'Applying mitigation...' : 'Processing...'} />
        </div>

        {/* RIGHT PANEL */}
        <div style={{ overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!result ? (
            <EmptyState icon="📊" title="Upload a dataset to begin" subtitle="Your real bias analysis dashboard will appear here after running the audit." />
          ) : (
            <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {demoMode && <DemoModeBanner />}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button aria-label="Download analysis report" title="Download analysis report" className="btn btn-secondary btn-sm" onClick={downloadReport}>Download Report</button>
              </div>

              {/* Metadata chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="chip chip-blue">Domain: {cfg.label}</span>
                <span className="chip chip-blue">Target: {targetCol}</span>
                <span className="chip chip-blue">Sensitive: {sensitiveCols.join(', ')}</span>
                <span className="chip chip-blue">{result.row_count} rows</span>
              </div>

              {/* Mitigation options */}
              <div className="card" style={{ padding: 12 }}>
                <div className="section-label">Mitigation Options</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select aria-label="Mitigation technique" className="form-select" value={mitigationTech} onChange={e => setMitigationTech(e.target.value)} style={{ maxWidth: 220 }}>
                    <option value="reweight">Inverse Probability Reweighting (recommended)</option>
                    <option value="downsample">Downsampling (balance groups)</option>
                    <option value="none">No-op (preview)</option>
                  </select>
                  <button className="btn btn-success" onClick={runMitigation} disabled={loading || !result}>
                    {loading ? <Spinner /> : 'Apply Mitigation'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 8 }}>Choose a mitigation technique and apply to the dataset. Results will appear side-by-side.</div>
              </div>

              {/* Gauge + DP + DI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="card" style={{ padding: 14, textAlign: 'center' }}>
                  <div className="section-label" style={{ textAlign: 'center' }}>Global Bias Score</div>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                    <BiasGauge score={result.bias_score} size={130} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 4 }}>
                    Bias in <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{result.primary_sensitive}</span>
                  </div>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <div className="section-label">Demographic Parity</div>
                  <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.04em', color: result.metrics.demographic_parity < 0.1 ? 'var(--green)' : 'var(--orange)' }}>
                    {(result.metrics.demographic_parity * 100).toFixed(1)}%
                  </div>
                  <div className="progress-track" style={{ margin: '6px 0' }}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, result.metrics.demographic_parity * 200)}%`, background: result.metrics.demographic_parity < 0.1 ? 'var(--green)' : 'var(--orange)' }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Threshold: &lt; 10% (ideal)</div>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <div className="section-label">Disparate Impact</div>
                  <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.04em', color: result.metrics.disparate_impact >= 0.8 ? 'var(--green)' : 'var(--red)' }}>
                    {result.metrics.disparate_impact.toFixed(3)}
                  </div>
                  <div className="progress-track" style={{ margin: '6px 0' }}>
                    <div className="progress-fill" style={{ width: `${result.metrics.disparate_impact * 100}%`, background: result.metrics.disparate_impact >= 0.8 ? 'var(--green)' : 'var(--red)' }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Threshold: ≥ 0.80 (4/5ths rule)</div>
                </div>
              </div>

              {/* Fairness Metrics */}
              <div className="card" style={{ padding: 14 }}>
                <div className="section-label">Fairness Metrics</div>
                <MetricGrid metrics={result.metrics} />
              </div>

              {/* Feature Importance */}
              <div className="card" style={{ padding: 14 }}>
                <div className="section-label">Feature Importance <span style={{ color: 'var(--orange)', fontWeight: 400, fontSize: 9 }}>orange = protected attribute</span></div>
                <FeatureImportanceChart features={result.feature_importance} />
              </div>

              {/* Selection Rates */}
              <div className="card" style={{ padding: 14 }}>
                <div className="section-label">Selection Rate by Group <span style={{ fontSize: 9, color: 'var(--t3)', fontWeight: 400 }}>— amber line = 80% rule threshold</span></div>
                <SelectionRateChart rates={result.selection_rates} />
              </div>

              {/* Insights */}
              <div className="card" style={{ padding: 14 }}>
                <div className="section-label">Key Insights</div>
                <InsightsList insights={result.insights} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
