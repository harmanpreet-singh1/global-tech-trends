/* global chrome */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StorageContext = createContext();

// Runtime check (evaluated once at module load)
const IS_EXTENSION = typeof chrome !== 'undefined' && !!chrome.storage?.local;

/**
 * Read topics synchronously from localStorage (dev mode).
 * Used as a lazy initializer for useState to avoid cascading renders.
 */
function getInitialTopics() {
    if (IS_EXTENSION) return []; // will be loaded async in useEffect
    try {
        const stored = localStorage.getItem('tech_updates_topics');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {
        // Corrupted storage — ignore
    }
    return [];
}

export const StorageProvider = ({ children }) => {
    const [topics, setTopics] = useState(getInitialTopics);
    const [loading, setLoading] = useState(IS_EXTENSION); // only loading if extension (async read)

    // For the extension, read from chrome.storage.local (async)
    useEffect(() => {
        if (IS_EXTENSION) {
            chrome.storage.local.get(['topics'], (result) => {
                if (Array.isArray(result.topics)) setTopics(result.topics);
                setLoading(false);
            });
        }
    }, []);

    const saveTopics = useCallback((newTopics) => {
        setTopics(newTopics);
        if (IS_EXTENSION) {
            chrome.storage.local.set({ topics: newTopics });
        } else {
            localStorage.setItem('tech_updates_topics', JSON.stringify(newTopics));
        }
    }, []);

    const clearStorage = useCallback(() => {
        setTopics([]);
        if (IS_EXTENSION) {
            chrome.storage.local.remove(['topics', 'seenArticles']);
        } else {
            localStorage.removeItem('tech_updates_topics');
        }
    }, []);

    return (
        <StorageContext.Provider value={{ topics, loading, saveTopics, clearStorage }}>
            {children}
        </StorageContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStorage = () => useContext(StorageContext);
