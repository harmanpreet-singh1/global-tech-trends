import React from 'react';
import { ArrowLeft, Trash2, Info } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import './Settings.css';

/**
 * Get the extension/app version.
 * In the Chrome extension: reads from manifest.
 * In dev: uses the Vite injected build constant.
 */
function getAppVersion() {
    try {
        // eslint-disable-next-line no-undef
        if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
            // eslint-disable-next-line no-undef
            return chrome.runtime.getManifest().version || '1.0.0';
        }
        return __APP_VERSION__; // eslint-disable-line no-undef
    } catch {
        return '1.0.0';
    }
}

const APP_VERSION = getAppVersion();

const Settings = ({ onBack, onReset }) => {
    const { clearStorage } = useStorage();

    const handleReset = () => {
        if (confirm("Are you sure? This will delete your topic preferences.")) {
            clearStorage();
            onReset();
        }
    };

    return (
        <div className="settings-container">
            <header className="settings-header">
                <button onClick={onBack} className="icon-btn" aria-label="Go back">
                    <ArrowLeft size={20} />
                </button>
                <h2>Settings</h2>
                <div style={{ width: 32 }}></div>
            </header>

            <div className="glass-card settings-card">
                <div className="section">
                    <h3 className="section-title">
                        <Info size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                        About
                    </h3>
                    <p className="section-desc">
                        Global Tech Trends aggregates the latest tech news from 60+ premium RSS sources
                        across 10 categories — delivering curated, real-time updates right to your browser.
                    </p>
                    <p className="section-desc version-label">
                        Version {APP_VERSION}
                    </p>
                </div>

                <div className="divider"></div>

                <div className="section">
                    <h3 className="section-title text-danger">Danger Zone</h3>
                    <p className="section-desc">Reset your selected topics and start fresh.</p>

                    <button onClick={handleReset} className="btn-danger full-width mt-4">
                        Reset Preferences <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
