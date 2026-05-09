// FairLens AI — API Client
import axios from 'axios';

const getBase = () => localStorage.getItem('fl-api-url') || process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ timeout: 90000 });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err?.response?.data?.detail || err?.message || 'Request failed';
    return Promise.reject(new Error(detail));
  }
);

export const datasetAPI = {
  analyze: (file, targetColumn, sensitiveColumns, domain) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('target_column', targetColumn);
    fd.append('sensitive_columns', JSON.stringify(sensitiveColumns));
    fd.append('domain', domain);
    return api.post(`${getBase()}/api/analyze`, fd);
  },
  mitigate: (file, targetColumn, sensitiveColumns, domain, originalScore, technique = 'reweight') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('target_column', targetColumn);
    fd.append('sensitive_columns', JSON.stringify(sensitiveColumns));
    fd.append('domain', domain);
    fd.append('original_score', originalScore);
    fd.append('technique', technique);
    return api.post(`${getBase()}/api/mitigate`, fd);
  },
};

export const textAPI = {
  analyze: (text, domain, geminiKey) =>
    api.post(`${getBase()}/api/analyze-text`, {
      text,
      domain,
      ...(geminiKey ? { gemini_key: geminiKey } : {}),
    }),
};

export const simulatorAPI = {
  simulate: (profile, domain) =>
    api.post(`${getBase()}/api/simulate`, { profile, domain }),
};

export const chatAPI = {
  send: (message, history, geminiKey) =>
    api.post(`${getBase()}/api/chat`, {
      message,
      history,
      ...(geminiKey ? { gemini_key: geminiKey } : {}),
    }),
};

export const checkHealth = () => api.get(`${getBase()}/health`);

export default api;
