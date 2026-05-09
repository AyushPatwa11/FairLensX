// FairLens AI — Root Application Component
import React, { useState, useCallback } from 'react';
import './styles/globals.css';
import { useTheme, useApiConfig } from './hooks';
import LandingPage   from './components/modes/LandingPage';
import Sidebar        from './components/sidebar/Sidebar';
import Navbar         from './components/navbar/Navbar';
import DatasetMode    from './components/modes/DatasetMode';
import TextMode       from './components/modes/TextMode';
import SimulatorMode  from './components/modes/SimulatorMode';
import Assistant      from './components/assistant/Assistant';

export default function App() {
  const [theme, setTheme]       = useTheme();
  const { apiUrl, geminiKey, save: saveSettings } = useApiConfig();
  const [view,   setView]       = useState('landing'); // 'landing' | 'app'
  const [section, setSection]   = useState('hero');
  const [mode,   setMode]       = useState('dataset');
  const [domain, setDomain]     = useState('hiring');
  const [statusFile, setStatusFile] = useState(null);

  const openApp = useCallback((m = 'dataset') => {
    setMode(m); setView('app');
  }, []);

  const goLanding = useCallback((sec = 'hero') => {
    setSection(sec); setView('landing');
  }, []);

  const handleNavSection = useCallback((sec) => {
    setSection(sec);
    if (view === 'app') setView('landing');
  }, [view]);

  const handleDomainChange = useCallback((d) => {
    setDomain(d);
  }, []);

  const handleFileUpload = useCallback((file) => {
    if (file) { setMode('dataset'); setStatusFile(file.name); }
  }, []);

  const handleNewAudit = useCallback(() => {
    setStatusFile(null);
  }, []);

  if (view === 'landing') {
    return (
      <>
        <LandingPage
          section={section}
          onOpenApp={openApp}
          onNavSection={handleNavSection}
        />
        <Assistant geminiKey={geminiKey} />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        activeMode={mode}
        setActiveMode={setMode}
        onGoHome={() => goLanding('hero')}
        onNewAudit={handleNewAudit}
        statusFile={statusFile}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar
          activeMode={mode}
          domain={domain}
          setDomain={handleDomainChange}
          theme={theme}
          setTheme={setTheme}
          onFileUpload={handleFileUpload}
          apiUrl={apiUrl}
          geminiKey={geminiKey}
          onSaveSettings={saveSettings}
        />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {mode === 'dataset'   && <DatasetMode  domain={domain} geminiKey={geminiKey} onFileLoaded={setStatusFile} />}
          {mode === 'language'  && <TextMode     domain={domain} geminiKey={geminiKey} />}
          {mode === 'simulator' && <SimulatorMode domain={domain} geminiKey={geminiKey} />}
        </div>
      </div>
      <Assistant geminiKey={geminiKey} />
    </div>
  );
}
