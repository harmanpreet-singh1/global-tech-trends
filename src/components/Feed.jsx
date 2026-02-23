import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ExternalLink, Settings as SettingsIcon, AlertCircle, CheckCircle, Zap, X, ChevronDown } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { fetchTechUpdates } from '../services/ai';
import './Feed.css';

const PAGE_SIZE = 15; // articles per API page

/**
 * Format a raw RSS date string into a human-friendly relative label.
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffH = (Date.now() - d.getTime()) / (1000 * 60 * 60);
    if (diffH < 1)   return 'Just now';
    if (diffH < 24)  return `${Math.floor(diffH)}h ago`;
    if (diffH < 168) return `${Math.floor(diffH / 24)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ALL_TOPICS = [
    "Artificial Intelligence", "Web Development", "Mobile Apps",
    "Blockchain & Crypto", "Cloud Computing", "Gaming",
    "Cybersecurity", "Hardware", "Startups", "Space Tech"
];

// ── Skeleton Shimmer (shown while loading more) ───────────────────────────────
const SkeletonCard = () => (
    <div className="glass-card update-card skeleton-card" aria-hidden="true">
        <div className="card-header">
            <span className="skeleton-line skeleton-small" />
            <span className="skeleton-line skeleton-small" />
        </div>
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-body" />
        <div className="skeleton-line skeleton-body short" />
        <div className="card-footer">
            <span className="skeleton-line skeleton-small" />
            <span className="skeleton-line skeleton-small" />
        </div>
    </div>
);

const SkeletonList = ({ count = 3 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={`skel-${i}`} />
        ))}
    </>
);

// ── Interests Modal ───────────────────────────────────────────────────────────
const InterestsModal = ({ currentTopics, onSave, onClose }) => {
    const [selected, setSelected] = useState([...currentTopics]);

    const toggle = (topic) => {
        setSelected(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="glass-card modal-box"
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="modal-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/icons/icon-128.png" alt="Logo" style={{ width: 24, height: 24, borderRadius: '4px' }} />
                        <h3 className="modal-title">Change Interests</h3>
                    </div>
                    <button className="icon-btn" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <p className="modal-subtitle">
                    Select the topics you want to follow. Your feed will update automatically.
                </p>

                <div className="topic-grid modal-topic-grid">
                    {ALL_TOPICS.map(topic => (
                        <button
                            key={topic}
                            onClick={() => toggle(topic)}
                            className={`topic-btn ${selected.includes(topic) ? 'active' : ''}`}
                        >
                            {selected.includes(topic) && <CheckCircle size={13} style={{ marginRight: 6, flexShrink: 0 }} />}
                            {topic}
                        </button>
                    ))}
                </div>

                <button
                    className="btn-primary full-width"
                    disabled={selected.length === 0}
                    onClick={() => onSave(selected)}
                    style={{ marginTop: '0.5rem' }}
                >
                    Apply &amp; Refresh Feed
                </button>
            </motion.div>
        </div>
    );
};

// ── End-of-Feed State ─────────────────────────────────────────────────────────
const EndOfFeedCard = ({ onRefresh, onChangeInterests, isRefreshing }) => (
    <motion.div
        className="glass-card end-of-feed-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 25 }}
    >
        <div className="end-of-feed-icon">
            <CheckCircle size={36} className="icon-primary" />
        </div>
        <h3 className="end-of-feed-title">You&apos;re all caught up!</h3>
        <p className="end-of-feed-subtitle">
            No more articles available right now from your selected sources.
            Check back later for fresh updates.
        </p>
        <div className="end-of-feed-actions">
            <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="btn-primary end-of-feed-btn"
            >
                {isRefreshing
                    ? <><RefreshCw size={15} className="spin-icon" /> Refreshing...</>
                    : <><RefreshCw size={15} /> Refresh Feed</>
                }
            </button>
            <button onClick={onChangeInterests} className="btn-secondary end-of-feed-btn">
                <SettingsIcon size={15} /> Change Interests
            </button>
        </div>
    </motion.div>
);

// ── Main Feed Component ───────────────────────────────────────────────────────
const Feed = ({ onOpenSettings }) => {
    const { topics, saveTopics } = useStorage();

    const [updates, setUpdates] = useState([]);          // accumulated articles across pages
    const [currentPage, setCurrentPage] = useState(0);   // last page we fetched (0 = none yet)
    const [hasMore, setHasMore] = useState(true);        // server says more pages exist
    const [totalCount, setTotalCount] = useState(0);     // total articles available on server

    const [loading, setLoading] = useState(true);        // initial load spinner
    const [loadingMore, setLoadingMore] = useState(false);// shimmer during "Load More"
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [showInterestsModal, setShowInterestsModal] = useState(false);

    // ── Fetch one page of results ─────────────────────────────────────────────
    const fetchPage = useCallback(async (page, refresh = false) => {
        const result = await fetchTechUpdates(topics, { page, limit: PAGE_SIZE, refresh });
        return result;
    }, [topics]);

    // ── Initial load (page 1) ─────────────────────────────────────────────────
    const loadInitial = useCallback(async (refresh = false) => {
        setError(null);
        const result = await fetchPage(1, refresh);
        setUpdates(result.updates);
        setCurrentPage(1);
        setHasMore(result.hasMore);
        setTotalCount(result.total);
    }, [fetchPage]);

    useEffect(() => {
        if (topics.length > 0) {
            setLoading(true);
            loadInitial(false)
                .catch(err => setError(err.message || "Failed to load updates."))
                .finally(() => setLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(topics)]);

    // ── Notify background worker to clear badge when articles are shown ───────
    useEffect(() => {
        // eslint-disable-next-line no-undef
        if (updates.length > 0 && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            const titles = updates.map(a => a.title);
            // eslint-disable-next-line no-undef
            chrome.runtime.sendMessage({ action: "popupOpened", articleTitles: titles }).catch(() => {});
        }
    }, [updates]);

    // ── Load More (next page) ─────────────────────────────────────────────────
    const handleLoadMore = async () => {
        const nextPage = currentPage + 1;
        setLoadingMore(true);
        try {
            const result = await fetchPage(nextPage);
            setUpdates(prev => [...prev, ...result.updates]);
            setCurrentPage(nextPage);
            setHasMore(result.hasMore);
            setTotalCount(result.total);
        } catch (err) {
            setError(err.message || "Failed to load more.");
        } finally {
            setLoadingMore(false);
        }
    };

    // ── Refresh (bust cache, start from page 1) ──────────────────────────────
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadInitial(true);
        } catch (err) {
            setError(err.message || "Failed to refresh.");
        } finally {
            setIsRefreshing(false);
        }
    };

    // ── Save new interests ────────────────────────────────────────────────────
    const handleSaveInterests = (newTopics) => {
        saveTopics(newTopics);
        setShowInterestsModal(false);
    };

    // ── Derived state ─────────────────────────────────────────────────────────
    const isExhausted = !loading && !loadingMore && updates.length > 0 && !hasMore;

    // ── Initial loading ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="feed-container loading-state">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                    <RefreshCw size={40} className="icon-primary" />
                </motion.div>
                <p className="loading-text">Fetching live tech news...</p>
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error && updates.length === 0) {
        return (
            <div className="feed-container error-state">
                <AlertCircle size={48} style={{ color: '#f87171' }} />
                <h3>Oops! Something went wrong.</h3>
                <p>{error}</p>
                <button onClick={onOpenSettings} className="btn-secondary">Check Settings</button>
                <button onClick={() => loadInitial()} className="btn-primary">Try Again</button>
            </div>
        );
    }

    // ── Feed ──────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="feed-container">
                <header className="feed-header">
                    <div className="feed-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/icons/icon-128.png" alt="Logo" style={{ width: 24, height: 24, borderRadius: '4px' }} />
                        <h1 className="feed-title">Global Tech Trends</h1>
                    </div>
                    <div className="feed-header-right">
                        {totalCount > 0 && (
                            <span className="article-count">{updates.length} / {totalCount}</span>
                        )}
                        <button onClick={onOpenSettings} className="icon-btn" aria-label="Settings">
                            <SettingsIcon size={20} />
                        </button>
                    </div>
                </header>

                <div className="updates-list">
                    <AnimatePresence>
                        {updates.map((item, index) => (
                            <motion.div
                                key={`${item.url || item.title}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(index * 0.04, 0.5) }}
                                className="glass-card update-card"
                            >
                                <div className="card-header">
                                    <span className="tag">{item.tag || "News"}</span>
                                    <span className="date">{formatDate(item.date)}</span>
                                </div>
                                <h3 className="update-title">{item.title}</h3>
                                <p className="update-summary">{item.summary}</p>
                                <div className="card-footer">
                                    <span className="source-badge">{item.source}</span>
                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="read-more"
                                        >
                                            Read <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Skeleton shimmer while loading more */}
                    {loadingMore && <SkeletonList count={3} />}
                </div>

                {/* Load More button */}
                {hasMore && !loadingMore && (
                    <div className="load-more-container">
                        <button onClick={handleLoadMore} className="btn-secondary load-more-btn">
                            <ChevronDown size={16} style={{ marginRight: 6 }} />
                            Load More Updates
                        </button>
                    </div>
                )}

                {/* Non-blocking error toast for load-more failures */}
                {error && updates.length > 0 && (
                    <div className="load-more-error glass-card">
                        <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                        <span>{error}</span>
                        <button onClick={handleLoadMore} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                            Retry
                        </button>
                    </div>
                )}

                {/* End-of-feed state */}
                {isExhausted && (
                    <div className="load-more-container">
                        <EndOfFeedCard
                            onRefresh={handleRefresh}
                            onChangeInterests={() => setShowInterestsModal(true)}
                            isRefreshing={isRefreshing}
                        />
                    </div>
                )}
            </div>

            {/* Interests Modal */}
            <AnimatePresence>
                {showInterestsModal && (
                    <InterestsModal
                        currentTopics={topics}
                        onSave={handleSaveInterests}
                        onClose={() => setShowInterestsModal(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Feed;
