---
layout: post
title: "Silent Failures: Upgrading to YouTube API & The BOM JSON Trap"
date: 2026-04-22
category: JavaScript / DevOps
tags: [Node.js, YouTube API v3, Debugging, UTF-8, JSON]
excerpt_separator: <!--more-->
---

💡 I recently faced two separate "silent failures" where my playlist sync script was running successfully in GitHub Actions, but my tracklists were coming up empty on the website.

<!--more-->

**1. Bot Detection & Rate Limiting**
Initially, I was using `yt-dlp` to scrape playlist data. However, GitHub Actions runner IPs are heavily flagged by YouTube's bot detection. The script would run, get blocked, return 0 tracks, and exit gracefully—leaving the JSON untouched.
**The fix:** I rewrote the script to use the official **YouTube Data API v3**. By using an authenticated API Key (stored securely in GitHub Secrets) and native `fetch`, the sync is now faster, more stable, and immune to IP blocking.

**2. The Byte Order Mark (BOM) Trap**
After the API fix, the script *still* wasn't saving data. The GitHub Action was marked as a success, but I decided to dig into the logs manually (by going to the **Actions tab**, clicking the run, and expanding the **"Run sync script"** step). There, the logs showed a strange error: `Unexpected token '', "{ "quar"... is not valid JSON"`. To the naked eye, the JSON file looked perfect.

It turns out the file had been saved with a **UTF-8 BOM**. This is an invisible character at the very beginning of a file that tells some editors how to read the encoding. While humans can't see it, Node.js sees it as an illegal character before the opening `{`, causing `JSON.parse()` to fail instantly.

**How I fixed the BOM issue:**
1. Opened `playlists.json` in VS Code.
2. Clicked the encoding setting in the bottom right status bar.
3. Changed **UTF-8 with BOM** to **UTF-8** (plain).
4. Saved and pushed the file.

🔧 **Key Takeaways:**
First, avoid web scraping in CI/CD environments when official APIs are available. Second, if you see an "Unexpected Token" error at the start of a valid JSON file, check for invisible encoding characters. Always stick to plain **UTF-8 (No BOM)** for configuration files in Node.js environments.
