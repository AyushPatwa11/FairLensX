// FairLens AI — Custom React Hooks
import { useState, useEffect, useCallback, useRef } from 'react';

// ── useTheme ─────────────────────────────────────────────
export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fl-theme') || 'dark');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('fl-theme', theme);
  }, [theme]);

  return [theme, setTheme];
}

// ── useDomain ─────────────────────────────────────────────
export function useDomain() {
  const [domain, setDomain] = useState('hiring');
  return [domain, setDomain];
}

// ── useApiConfig ──────────────────────────────────────────
export function useApiConfig() {
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('fl-api-url') || 'http://localhost:8000');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('fl-gemini-key') || '');

  const save = useCallback((url, key) => {
    setApiUrl(url);
    setGeminiKey(key);
    localStorage.setItem('fl-api-url', url);
    localStorage.setItem('fl-gemini-key', key || '');
  }, []);

  return { apiUrl, geminiKey, save };
}

// ── useDatasetAnalysis ─────────────────────────────────────
export function useDatasetAnalysis() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [preview, setPreview] = useState(null);
  const [targetCol, setTargetCol] = useState('');
  const [sensitiveCols, setSensitiveCols] = useState([]);
  const [result, setResult] = useState(null);
  const [mitigated, setMitigated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);

  const reset = useCallback(() => {
    setFile(null); setColumns([]); setPreview(null);
    setTargetCol(''); setSensitiveCols([]);
    setResult(null); setMitigated(null);
    setLoading(false); setError(''); setStep(0);
  }, []);

  return {
    file, setFile, columns, setColumns, preview, setPreview,
    targetCol, setTargetCol, sensitiveCols, setSensitiveCols,
    result, setResult, mitigated, setMitigated,
    loading, setLoading, error, setError, step, setStep, reset,
  };
}

// ── useLocalBias (client-side fallback) ───────────────────
export function useLocalBiasDetect() {
  const PATTERNS = [
    { re: /\byoung(?:er)?\b/gi, type: 'Age Bias', sug: 'motivated', sev: 'high' },
    { re: /\brecent\s+graduate\b/gi, type: 'Age Bias', sug: 'qualified candidate', sev: 'medium' },
    { re: /\benergetic\b|\bgo[- ]getter\b/gi, type: 'Age Bias', sug: 'results-driven', sev: 'medium' },
    { re: /\byouthful\b/gi, type: 'Age Bias', sug: 'enthusiastic', sev: 'high' },
    { re: /\belderly\b/gi, type: 'Age Bias', sug: 'older adults', sev: 'high' },
    { re: /\bmasculine\b|\bmanly\b/gi, type: 'Gender Bias', sug: 'determined', sev: 'high' },
    { re: /\bsalesman\b/gi, type: 'Gender Bias', sug: 'sales professional', sev: 'high' },
    { re: /\baggressive\b/gi, type: 'Gender Bias', sug: 'assertive and driven', sev: 'medium' },
    { re: /\bmanpower\b/gi, type: 'Gender Bias', sug: 'workforce', sev: 'medium' },
    { re: /\bnative\s+english\s+speaker\b/gi, type: 'National Origin Bias', sug: 'fluent English skills', sev: 'high' },
    { re: /\bnative[- ]born\b/gi, type: 'National Origin Bias', sug: 'authorized to work', sev: 'high' },
    { re: /\bculturally?\s+(?:aligned|fit|match)\b/gi, type: 'Cultural Bias', sug: 'values-aligned', sev: 'high' },
    { re: /\bculture\s+fit\b/gi, type: 'Cultural Bias', sug: 'values alignment', sev: 'high' },
    { re: /\bfast[- ]paced\b/gi, type: 'Coded Language', sug: 'dynamic and collaborative', sev: 'low' },
    { re: /\brock\s*star\b|\bninja\b|\bguru\b/gi, type: 'Exclusionary Jargon', sug: 'highly skilled professional', sev: 'low' },
    { re: /\bheads?\s+of\s+household\b/gi, type: 'Marital Status Bias', sug: 'primary applicant', sev: 'high' },
    { re: /\bsingle\s+applicants?\b/gi, type: 'Marital Status Bias', sug: 'all applicants', sev: 'high' },
    { re: /\btraditional\s+famil(?:y|ies)\b/gi, type: 'Family Status Bias', sug: 'diverse backgrounds', sev: 'high' },
    { re: /\blegacy\s+applicants?\b/gi, type: 'Legacy Preference Bias', sug: 'returning applicants', sev: 'high' },
    { re: /\bprivate\s+insurance\b/gi, type: 'Socioeconomic Bias', sug: 'all insurance types', sev: 'medium' },
    { re: /\ble[- ]bodied\b/gi, type: 'Disability Bias', sug: 'capable of required tasks', sev: 'high' },
  ];

  return useCallback((text) => {
    const flags = [];
    const seen = new Set();
    PATTERNS.forEach(({ re, type, sug, sev }) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        const key = m[0].toLowerCase() + type;
        if (!seen.has(key)) {
          seen.add(key);
          flags.push({ phrase: m[0], type, suggestion: sug, severity: sev, start: m.index, end: m.index + m[0].length });
        }
      }
    });
    flags.sort((a, b) => a.start - b.start);
    const h = flags.filter(f => f.severity === 'high').length;
    const md = flags.filter(f => f.severity === 'medium').length;
    const lo = flags.filter(f => f.severity === 'low').length;
    const score = Math.min(100, h * 20 + md * 9 + lo * 3);
    let rewritten = text;
    [...flags].reverse().forEach(f => {
      let s = f.suggestion;
      if (f.phrase[0] === f.phrase[0].toUpperCase() && /[A-Z]/.test(f.phrase[0])) s = s[0].toUpperCase() + s.slice(1);
      rewritten = rewritten.slice(0, f.start) + s + rewritten.slice(f.end);
    });
    return {
      bias_score: score,
      risk_level: score >= 70 ? 'High' : score >= 35 ? 'Moderate' : 'Low',
      flags, rewritten_text: rewritten,
      summary: `Found ${flags.length} bias patterns (${h} high, ${md} medium, ${lo} low severity).`,
      high_severity: h, medium_severity: md, low_severity: lo, flag_count: flags.length,
    };
  }, []);
}

// ── useLocalSimulator (client-side fallback) ──────────────
export function useLocalSimulator() {
  const BIAS_W = {
    hiring:     { gender: { Male:+.14,Female:-.08,'Non-binary':-.05 }, race: { White:+.11,Black:-.10,Hispanic:-.07,Asian:+.02,Other:-.04 } },
    loan:       { gender: { Male:+.12,Female:-.07,'Non-binary':-.04 }, race: { White:+.09,Black:-.09,Hispanic:-.06,Asian:+.03,Other:-.03 } },
    healthcare: { gender: { Male:+.08,Female:-.05 }, insurance: { Private:+.16,Public:-.09,None:-.15 } },
    education:  { gender: { Male:+.07,Female:-.04,'Non-binary':-.05 }, race: { White:+.10,Asian:+.05,Black:-.10,Hispanic:-.08,Other:-.05 }, income: { High:+.12,Medium:0,Low:-.10 } },
  };
  const RANGES = {
    hiring: { age:[18,65],experience:[0,40],gpa:[0,4] },
    loan:   { age:[18,80],income:[10000,500000],credit_score:[300,850],loan_amount:[1000,500000] },
    healthcare: { age:[1,110],bmi:[10,60],severity:[1,10] },
    education:  { gpa:[0,4],test_score:[400,1600] },
  };
  const SENS = new Set(['gender','race','ethnicity','age','insurance','income','nationality','zipcode']);
  const ORDINAL = { male:.5,female:.5,'non-binary':.5,white:.5,asian:.5,hispanic:.5,black:.5,other:.5,private:.9,public:.4,none:.1,high:.9,medium:.55,low:.2,phd:1,masters:.85,bachelors:.7,'high school':.45 };
  const CF_OPTS = { gender:['Male','Female','Non-binary'],race:['White','Black','Hispanic','Asian','Other'],insurance:['Private','Public','None'],income:['Low','Medium','High'] };
  const LBLS = { hiring:['Hired','Not Hired'],loan:['Loan Approved','Loan Denied'],healthcare:['Referred','Not Referred'],education:['Admitted','Not Admitted'] };

  return useCallback((profile, domain) => {
    const ranges = RANGES[domain] || {};
    const merits = [];
    Object.entries(profile).forEach(([k,v]) => {
      if (SENS.has(k.toLowerCase())) return;
      const r = ranges[k.toLowerCase()];
      let n;
      if (r) { n = Math.max(0, Math.min(1, (parseFloat(v)-r[0])/(r[1]-r[0]))); }
      else { const fv=parseFloat(v); n = isNaN(fv) ? (ORDINAL[String(v).toLowerCase()]??0.5) : Math.min(1, fv>100 ? Math.log10(fv+1)/6 : fv/100); }
      merits.push(n);
    });
    const base = merits.length ? Math.max(.15, Math.min(.85, (merits.reduce((a,b)=>a+b,0)/merits.length)*.7+.15)) : 0.5;
    let delta = 0;
    Object.entries(BIAS_W[domain]||{}).forEach(([field,biases]) => {
      const val = String(profile[field]||'').trim();
      if (!val) return;
      Object.entries(biases).forEach(([k,v]) => { if (k.toLowerCase()===val.toLowerCase()) delta+=v; });
    });
    const prob = Math.max(.03, Math.min(.97, base+delta));
    const [posL,negL] = LBLS[domain]||['Approved','Denied'];
    const cfs = [];
    Object.entries(CF_OPTS).forEach(([field,opts]) => {
      if (!profile[field] || !(BIAS_W[domain]||{})[field]) return;
      const cur = String(profile[field]);
      opts.forEach(alt => {
        if (alt.toLowerCase()===cur.toLowerCase()) return;
        let d2=delta;
        const biases=BIAS_W[domain][field]||{};
        Object.entries(biases).forEach(([k,v])=>{ if(k.toLowerCase()===cur.toLowerCase()) d2-=v; if(k.toLowerCase()===alt.toLowerCase()) d2+=v; });
        const p2=Math.max(.03,Math.min(.97,base+d2));
        const diff = +(p2-prob).toFixed(4);
        if (Math.abs(diff)>.005) cfs.push({ changed_field:field,original_value:cur,changed_value:alt,probability:+p2.toFixed(4),outcome:p2>=.5,delta:diff,bias_contribution:+d2.toFixed(4) });
      });
    });
    cfs.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    const maxD = cfs.length ? Math.max(...cfs.map(c=>Math.abs(c.delta))) : 0;
    return { probability:+prob.toFixed(4),outcome:prob>=.5,outcome_label:prob>=.5?posL:negL,base_probability:+base.toFixed(4),bias_contribution:+delta.toFixed(4),counterfactuals:cfs.slice(0,8),bias_detected:maxD>.08,max_delta:+maxD.toFixed(4) };
  }, []);
}

// ── useNeuralCanvas ───────────────────────────────────────
export function useNeuralCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let nodes = [], animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; initNodes(90); };
    const initNodes = (n) => { nodes = Array.from({length:n}, () => ({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-.5)*.45, vy: (Math.random()-.5)*.45, r: Math.random()*1.8+.8 })); };
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      nodes.forEach(n => { n.x+=n.vx; n.y+=n.vy; if(n.x<0||n.x>canvas.width)n.vx*=-1; if(n.y<0||n.y>canvas.height)n.vy*=-1; });
      for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if (d<150) { ctx.beginPath(); ctx.strokeStyle=`rgba(59,130,246,${(1-d/150)*.3})`; ctx.lineWidth=.8; ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke(); }
      }
      nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2); ctx.fillStyle='rgba(59,130,246,.85)'; ctx.fill(); });
      animId = requestAnimationFrame(draw);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize(); draw();
    return () => { ro.disconnect(); cancelAnimationFrame(animId); };
  }, [canvasRef]);
}
