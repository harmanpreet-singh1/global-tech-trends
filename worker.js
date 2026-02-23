
/**
 * Cloudflare Worker for Fastest Tech Pulse
 *
 * Pure RSS aggregation with server-side pagination.
 * 
 * Request body: { topics: string[], refresh?: boolean, page?: number, limit?: number }
 *   - page:    1-indexed page number (default 1)
 *   - limit:   articles per page (default 15)
 *   - refresh: bypass the 10-min edge cache
 *
 * Response: { updates: [...], page, limit, total, hasMore }
 */

// ─── Topic → RSS Feed Mapping ─────────────────────────────────────────────────

const TOPIC_FEED_MAP = {

    "artificial intelligence": [
        { url: "https://techcrunch.com/category/artificial-intelligence/feed/",  source: "TechCrunch",      tag: "Artificial Intelligence" },
        { url: "https://venturebeat.com/category/ai/feed/",                       source: "VentureBeat",     tag: "Artificial Intelligence" },
        { url: "https://www.artificialintelligence-news.com/feed/",               source: "AI News",         tag: "Artificial Intelligence" },
        { url: "https://thenextweb.com/neural/feed/",                             source: "TNW Neural",      tag: "Artificial Intelligence" },
        { url: "https://feeds.arstechnica.com/arstechnica/index",                 source: "Ars Technica",    tag: "Artificial Intelligence" },
        { url: "https://www.wired.com/feed/tag/artificial-intelligence/rss",      source: "Wired",           tag: "Artificial Intelligence" },
    ],

    "web development": [
        { url: "https://css-tricks.com/feed/",                                    source: "CSS-Tricks",      tag: "Web Development" },
        { url: "https://www.smashingmagazine.com/feed/",                          source: "Smashing Mag",    tag: "Web Development" },
        { url: "https://thenewstack.io/feed/",                                    source: "The New Stack",   tag: "Web Development" },
        { url: "https://blog.chromium.org/feeds/posts/default",                   source: "Chromium Blog",   tag: "Web Development" },
        { url: "https://hnrss.org/frontpage",                                     source: "Hacker News",     tag: "Web Development" },
        { url: "https://www.theverge.com/rss/index.xml",                          source: "The Verge",       tag: "Web Development" },
    ],

    "mobile apps": [
        { url: "https://9to5mac.com/feed/",                                       source: "9to5Mac",         tag: "Mobile Apps" },
        { url: "https://9to5google.com/feed/",                                    source: "9to5Google",      tag: "Mobile Apps" },
        { url: "https://www.androidpolice.com/feed/",                             source: "Android Police",  tag: "Mobile Apps" },
        { url: "https://appleinsider.com/rss/news/",                              source: "AppleInsider",    tag: "Mobile Apps" },
        { url: "https://www.macrumors.com/macrumors.xml",                         source: "MacRumors",       tag: "Mobile Apps" },
        { url: "https://www.theverge.com/rss/index.xml",                          source: "The Verge",       tag: "Mobile Apps" },
    ],

    "blockchain & crypto": [
        { url: "https://cointelegraph.com/rss",                                   source: "CoinTelegraph",   tag: "Blockchain & Crypto" },
        { url: "https://coindesk.com/arc/outboundfeeds/rss/",                     source: "CoinDesk",        tag: "Blockchain & Crypto" },
        { url: "https://decrypt.co/feed",                                         source: "Decrypt",         tag: "Blockchain & Crypto" },
        { url: "https://cryptonews.com/news/feed",                                source: "CryptoNews",      tag: "Blockchain & Crypto" },
        { url: "https://bitcoinmagazine.com/.rss/full/",                          source: "Bitcoin Magazine", tag: "Blockchain & Crypto" },
        { url: "https://www.theblock.co/rss.xml",                                 source: "The Block",       tag: "Blockchain & Crypto" },
    ],

    "cloud computing": [
        { url: "https://aws.amazon.com/blogs/aws/feed/",                          source: "AWS Blog",        tag: "Cloud Computing" },
        { url: "https://azure.microsoft.com/en-us/blog/feed/",                    source: "Azure Blog",      tag: "Cloud Computing" },
        { url: "https://cloudcomputing-news.net/feed/",                           source: "Cloud News",      tag: "Cloud Computing" },
        { url: "https://thenewstack.io/feed/",                                    source: "The New Stack",   tag: "Cloud Computing" },
        { url: "https://siliconangle.com/feed/",                                  source: "SiliconANGLE",    tag: "Cloud Computing" },
        { url: "https://feeds.arstechnica.com/arstechnica/index",                 source: "Ars Technica",    tag: "Cloud Computing" },
    ],

    "gaming": [
        { url: "https://kotaku.com/rss",                                          source: "Kotaku",          tag: "Gaming" },
        { url: "https://www.polygon.com/rss/index.xml",                           source: "Polygon",         tag: "Gaming" },
        { url: "https://feeds.ign.com/ign/all",                                   source: "IGN",             tag: "Gaming" },
        { url: "https://www.pcgamer.com/rss/",                                    source: "PC Gamer",        tag: "Gaming" },
        { url: "https://www.eurogamer.net/feed",                                  source: "Eurogamer",       tag: "Gaming" },
        { url: "https://www.rockpapershotgun.com/feed",                           source: "Rock Paper Shotgun", tag: "Gaming" },
    ],

    "cybersecurity": [
        { url: "https://feeds.feedburner.com/TheHackersNews",                     source: "The Hacker News", tag: "Cybersecurity" },
        { url: "https://krebsonsecurity.com/feed/",                               source: "Krebs on Security", tag: "Cybersecurity" },
        { url: "https://www.bleepingcomputer.com/feed/",                          source: "BleepingComputer", tag: "Cybersecurity" },
        { url: "https://www.darkreading.com/rss.xml",                             source: "Dark Reading",    tag: "Cybersecurity" },
        { url: "https://threatpost.com/feed/",                                    source: "Threatpost",      tag: "Cybersecurity" },
        { url: "https://www.csoonline.com/feed/",                                 source: "CSO Online",      tag: "Cybersecurity" },
    ],

    "hardware": [
        { url: "https://www.tomshardware.com/feeds/all",                          source: "Tom's Hardware",  tag: "Hardware" },
        { url: "https://www.anandtech.com/rss/",                                  source: "AnandTech",       tag: "Hardware" },
        { url: "https://feeds.arstechnica.com/arstechnica/index",                 source: "Ars Technica",    tag: "Hardware" },
        { url: "https://www.theverge.com/rss/index.xml",                          source: "The Verge",       tag: "Hardware" },
        { url: "https://www.theregister.com/hardware/feed.atom",                  source: "The Register",    tag: "Hardware" },
        { url: "https://hexus.net/rss/",                                          source: "Hexus",           tag: "Hardware" },
    ],

    "startups": [
        { url: "https://techcrunch.com/category/startups/feed/",                  source: "TechCrunch",      tag: "Startups" },
        { url: "https://venturebeat.com/feed/",                                   source: "VentureBeat",     tag: "Startups" },
        { url: "https://siliconangle.com/feed/",                                  source: "SiliconANGLE",    tag: "Startups" },
        { url: "https://thenextweb.com/feed/",                                    source: "The Next Web",    tag: "Startups" },
        { url: "https://hnrss.org/frontpage",                                     source: "Hacker News",     tag: "Startups" },
    ],

    "space tech": [
        { url: "https://spacenews.com/feed/",                                     source: "SpaceNews",       tag: "Space Tech" },
        { url: "https://www.space.com/feeds/all",                                 source: "Space.com",       tag: "Space Tech" },
        { url: "https://spaceflightnow.com/feed/",                                source: "Spaceflight Now", tag: "Space Tech" },
        { url: "https://www.nasaspaceflight.com/feed/",                           source: "NASASpaceflight", tag: "Space Tech" },
        { url: "https://www.teslarati.com/feed/",                                 source: "Teslarati",       tag: "Space Tech" },
        { url: "https://arstechnica.com/science/feed/",                           source: "Ars Technica",    tag: "Space Tech" },
    ],
};

const GENERAL_FEEDS = [
    { url: "https://techcrunch.com/feed/",           source: "TechCrunch", tag: "Tech" },
    { url: "https://www.theverge.com/rss/index.xml", source: "The Verge",  tag: "Tech" },
    { url: "https://www.wired.com/feed/rss",         source: "Wired",      tag: "Tech" },
];

// ─── RSS / Atom Parsing ───────────────────────────────────────────────────────

function extractCdata(text, tag) {
    const m = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i").exec(text);
    return m?.[1] || null;
}

function extractSimple(text, tag) {
    const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(text);
    return m?.[1] || null;
}

function stripHtml(str) {
    return str.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

function toTimestamp(dateStr) {
    if (!dateStr) return 0;
    const d = new Date(dateStr.trim());
    return isNaN(d.getTime()) ? 0 : d.getTime();
}

const MAX_PER_FEED = 20; // Reduced from 30 to save CPU
const MAX_TOTAL_RESULTS = 200; // Cap total articles to stay within Free Tier CPU limits

function parseRssItems(xml, source, tag) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const title   = extractCdata(block, "title") || extractSimple(block, "title");
        const link    = extractSimple(block, "link") || extractSimple(block, "guid");
        const desc    = extractCdata(block, "description") || extractSimple(block, "description");
        const dateStr = extractSimple(block, "pubDate");
        if (title) {
            items.push({
                title: title.trim(), url: link?.trim() || "",
                summary: stripHtml(desc || "").slice(0, 180), // Shorter summary saves bytes
                date: dateStr?.trim() || "", timestamp: toTimestamp(dateStr),
                source, tag
            });
        }
        if (items.length >= MAX_PER_FEED) break;
    }
    return items;
}

function parseAtomItems(xml, source, tag) {
    const items = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
        const block   = match[1];
        const title   = extractCdata(block, "title") || extractSimple(block, "title");
        const linkM   = /href="([^"]+)"/.exec(block);
        const summary = extractCdata(block, "summary") || extractSimple(block, "summary")
                     || extractCdata(block, "content") || extractSimple(block, "content");
        const dateStr = extractSimple(block, "updated") || extractSimple(block, "published");
        if (title) {
            items.push({
                title: title.trim(), url: linkM?.[1]?.trim() || "",
                summary: stripHtml(summary || "").slice(0, 180), // Shorter summary saves bytes
                date: dateStr?.trim() || "", timestamp: toTimestamp(dateStr),
                source, tag
            });
        }
        if (items.length >= MAX_PER_FEED) break;
    }
    return items;
}

async function fetchFeed(feed) {
    try {
        const res = await fetch(feed.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; TechPulseBot/1.0)" },
            cf: { cacheTtl: 600, cacheEverything: true } // Increased cache TTL to 10 min
        });
        if (!res.ok) return [];
        const xml = await res.text();
        if (xml.includes("<feed") && xml.includes("<entry>")) {
            return parseAtomItems(xml, feed.source, feed.tag);
        }
        return parseRssItems(xml, feed.source, feed.tag);
    } catch {
        return [];
    }
}

function resolveFeedsForTopics(topics) {
    const selected = [];
    const seen     = new Set();
    for (const topic of topics) {
        const feeds = TOPIC_FEED_MAP[topic.toLowerCase().trim()] || [];
        for (const feed of feeds) {
            if (!seen.has(feed.url)) { seen.add(feed.url); selected.push(feed); }
        }
    }
    if (selected.length === 0) {
        GENERAL_FEEDS.forEach(f => { if (!seen.has(f.url)) { seen.add(f.url); selected.push(f); } });
    }
    // Only take a few feeds per topic if the user has many
    return selected.slice(0, 20); 
}

// ─── Main Worker ──────────────────────────────────────────────────────────────

export default {
    async fetch(request) {
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        };

        if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
        if (request.method !== "POST")    return new Response("Method Not Allowed", { status: 405 });

        try {
            const body = await request.json();
            const { topics, refresh = false } = body;
            const page  = Math.max(1, parseInt(body.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(body.limit) || 15));

            if (!topics || !Array.isArray(topics) || topics.length === 0) {
                return new Response("Invalid request: 'topics' array required.", { status: 400 });
            }

            const cache        = caches.default;
            const sortedTopics = [...topics].sort().join(",");
            const cacheKey     = new Request(
                `https://cache.techpulse/v3/all?topics=${encodeURIComponent(sortedTopics)}`,
                { method: "GET" }
            );

            let allSorted;

            if (!refresh) {
                const hit = await cache.match(cacheKey);
                if (hit) {
                    allSorted = (await hit.json()).articles;
                }
            }

            if (!allSorted) {
                const feeds      = resolveFeedsForTopics(topics);
                const results    = await Promise.all(feeds.map(fetchFeed));
                const allArticles = results.flat();

                if (allArticles.length === 0) {
                    return new Response(
                        JSON.stringify({ updates: [], page, limit, total: 0, hasMore: false }),
                        { headers: { "Content-Type": "application/json", ...corsHeaders } }
                    );
                }

                const seenTitles = new Set();
                const unique = [];
                
                // Deduplicate and cap at MAX_TOTAL_RESULTS
                for (const a of allArticles) {
                    const key = a.title.toLowerCase().slice(0, 60);
                    if (!seenTitles.has(key)) {
                        seenTitles.add(key);
                        unique.push(a);
                    }
                    if (unique.length >= MAX_TOTAL_RESULTS) break;
                }

                unique.sort((a, b) => b.timestamp - a.timestamp);
                allSorted = unique.map(a => ({
                    title: a.title,
                    url: a.url,
                    summary: a.summary,
                    date: a.date,
                    source: a.source,
                    tag: a.tag
                }));

                await cache.put(cacheKey, new Response(
                    JSON.stringify({ articles: allSorted }),
                    { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=600" } }
                ));
            }

            const total  = allSorted.length;
            const start  = (page - 1) * limit;
            const slice  = allSorted.slice(start, start + limit);
            const hasMore = start + limit < total;

            const payload = JSON.stringify({ updates: slice, page, limit, total, hasMore });

            return new Response(payload, {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });

        } catch (err) {
            return new Response(`Worker Error: ${err.message}`, { status: 500 });
        }
    }
};
