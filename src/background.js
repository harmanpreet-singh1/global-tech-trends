/* global chrome */
/**
 * Global Tech Trends — Background Service Worker
 *
 * Periodically checks for new articles and shows a badge count on the
 * extension icon so the user knows there are unread updates.
 *
 * Flow:
 *   1. On install / browser start → set a recurring alarm (every 30 min).
 *   2. On alarm fire → fetch page 1 from the worker API.
 *   3. Compare article titles against the last-seen set stored in chrome.storage.
 *   4. If new articles exist → set badge text (e.g. "5") with a blue background.
 *   5. When the popup opens → popup calls clearBadge() via chrome.runtime.sendMessage.
 */

const PROXY_URL = "https://fastest-tech-pulse-proxy.sharmanpreet1122.workers.dev";
const ALARM_NAME = "tech-pulse-check";
const CHECK_INTERVAL_MINUTES = 30;

/**
 * Feature flag — set to `true` to enable periodic background article checks
 * and badge counts. Kept `false` for v1; will be enabled in a future release.
 */
const BACKGROUND_CHECK_ENABLED = false;

// ── Install / Startup ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: CHECK_INTERVAL_MINUTES });
    // Run an initial check after 1 minute (give time for topics to be set)
    chrome.alarms.create("tech-pulse-initial", { delayInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: CHECK_INTERVAL_MINUTES });
});

// ── Alarm Handler ─────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (!BACKGROUND_CHECK_ENABLED) return; // feature disabled — skip check
    if (alarm.name === ALARM_NAME || alarm.name === "tech-pulse-initial") {
        await checkForNewArticles();
    }
});

// ── Core: Check for new articles ──────────────────────────────────────────────

async function checkForNewArticles() {
    try {
        // Get user's topics from storage
        const { topics } = await chrome.storage.local.get("topics");
        if (!topics || topics.length === 0) return;

        // Fetch page 1 (latest 15 articles)
        const response = await fetch(PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topics, page: 1, limit: 15 })
        });

        if (!response.ok) return;

        const data = await response.json();
        const latestArticles = data.updates || [];
        if (latestArticles.length === 0) return;

        // Get the set of previously seen article titles
        const { seenArticles = [] } = await chrome.storage.local.get("seenArticles");
        const seenSet = new Set(seenArticles);

        // Count how many are genuinely new
        const newCount = latestArticles.filter(
            a => !seenSet.has(a.title?.toLowerCase().slice(0, 60))
        ).length;

        if (newCount > 0) {
            // Show badge: "1"-"9" or "9+" for 10+
            const badgeText = newCount > 9 ? "9+" : String(newCount);
            chrome.action.setBadgeText({ text: badgeText });
            chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" });
        } else {
            // Explicitly clear — no new articles
            chrome.action.setBadgeText({ text: "" });
        }

    } catch (err) {
        console.error("[Global Tech Trends] Background check failed:", err);
    }
}

// ── Message Handler (called by popup to clear badge & mark as seen) ───────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "popupOpened") {
        // Clear the badge
        chrome.action.setBadgeText({ text: "" });

        // Mark current articles as seen
        if (message.articleTitles && message.articleTitles.length > 0) {
            // Keep a rolling window of the last 200 titles to avoid unbounded storage
            const normalized = message.articleTitles.map(t => t.toLowerCase().slice(0, 60));
            chrome.storage.local.set({ seenArticles: normalized.slice(0, 200) });
        }

        sendResponse({ ok: true });
    }
    return true; // keep channel open for async
});
