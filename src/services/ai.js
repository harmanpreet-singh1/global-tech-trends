/**
 * Service for fetching tech updates via the Cloudflare Worker proxy.
 * Supports paginated fetching.
 */

const PROXY_URL = "https://fastest-tech-pulse-proxy.sharmanpreet1122.workers.dev";

/**
 * Fetches a page of tech updates.
 *
 * @param {string[]} topics   - User's selected topics.
 * @param {Object}   opts     - Options.
 * @param {number}   opts.page    - 1-indexed page number (default 1).
 * @param {number}   opts.limit   - Articles per page (default 15).
 * @param {boolean}  opts.refresh - Bypass Cloudflare cache (default false).
 * @returns {Promise<{ updates: Array, page: number, total: number, hasMore: boolean }>}
 */
export const fetchTechUpdates = async (topics, { page = 1, limit = 15, refresh = false } = {}) => {
    if (!topics || topics.length === 0) {
        return { updates: [], page: 1, total: 0, hasMore: false };
    }

    const response = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, page, limit, refresh })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Proxy Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return {
        updates: data.updates || [],
        page:    data.page    || page,
        total:   data.total   || 0,
        hasMore: data.hasMore ?? false
    };
};
