import React, { useState } from 'react';
import { useStorage } from './context/StorageContext';
import Onboarding from './components/Onboarding';
import Feed from './components/Feed';
import Settings from './components/Settings';

function App() {
  const { loading, topics } = useStorage();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', minHeight: '300px'
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid rgba(59,130,246,0.3)',
          borderTopColor: '#3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  const hasTopics = topics.length > 0;

  return (
    <div className="app-container">
      {settingsOpen && (
        <Settings
          onBack={() => setSettingsOpen(false)}
          onReset={() => setSettingsOpen(false)}
        />
      )}

      {!settingsOpen && !hasTopics && (
        <Onboarding onComplete={() => {/* topics update triggers re-render */}} />
      )}

      {!settingsOpen && hasTopics && (
        <Feed onOpenSettings={() => setSettingsOpen(true)} />
      )}
    </div>
  );
}

export default App;
