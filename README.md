# 🌐 Global Tech Trends — Chrome Extension

**Global Tech Trends** is a premium, real-time tech news aggregator built for developers and tech enthusiasts. It delivers curated, high-speed updates from over **60+ premium RSS sources** across 10 specialized categories directly into your browser's toolbar.

![Extension Preview]([https://via.placeholder.com/800x450?text=Global+Tech+Trends+Interface](https://chromewebstore.google.com/detail/global-tech-trends/pmiofamcdbdibdeenonllncaochimjlb))

## ✨ Features

*   **⚡ Real-Time Aggregation**: Stay ahead with a combined feed from TechCrunch, The Verge, Wired, Wired, Hacker News, and more.
*   **🎯 Interest-Based Curation**: Choose your specific focus areas:
    *   *AI, Web Development, Mobile Apps, Blockchain & Crypto, Cloud Computing, Gaming, Cybersecurity, Hardware, Startups, and Space Tech.*
*   **🎨 Stunning Glassmorphism UI**: High-end modern aesthetics featuring vibrant gradients, subtle micro-animations (Framer Motion), and a sleek dark mode.
*   **🛠️ Optimized Performance**: 
    *   Powered by a **Cloudflare Worker Proxy** to handle RSS parsing and deduplication.
    *   Server-side caching (10 min) and response truncation (200 articles max) to ensure instant load times and low resource usage.
*   **🔔 Intelligent Badge Alerts** (vNext): Background checks compare new articles against your seen history to notify you when fresh news arrives (Feature flagged for release).

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Lucide Icons.
- **Backend/Edge**: Cloudflare Workers (Edge Computing), RSS/Atom Parsing.
- **Extension**: Chrome Manifest V3, Storage API.
- **Styling**: Vanilla CSS with modern Glassmorphism principles.

## 🛠️ Installation & Setup

### 1. Build the Extension
Ensure you have Node.js installed, then run:
```bash
npm install
npm run build
```

### 2. Load into Chrome
1.  Open Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked**.
4.  Navigate to this project folder and select the `dist` directory.

### 3. Personalize
*   Click the **Global Tech Trends** icon in your toolbar.
*   The onboarding screen will guide you to select your topics.
*   Enjoy your lightning-fast, personalized tech feed!

## 🏗️ Architecture

The extension follows a client-proxy architecture:
1.  **Frontend**: Built with React, it manages user state and preferences locally via `chrome.storage`.
2.  **Worker (`worker.js`)**: A Cloudflare Worker act as an RSS aggregator. It fetches multiple XML/Atom feeds in parallel, deduplicates articles by title, and returns a clean JSON payload.
3.  **Deduplication**: The background service worker (`background.js`) calculates a 60-character hash of article titles to manage unread counts without storing large datasets.

## 📄 License
MIT License - Created for modern tech exploration.
