---
layout: post
title: "Auto-Syncing YouTube Playlists with GitHub Actions"
date: 2025-01-01
category: Automation
tags: [GitHub Actions, Node.js, yt-dlp, JSON]
excerpt_separator: <!--more-->
---

🎵 I maintain several YouTube playlists for my music page, but keeping the track list on the website up-to-date was a manual chore. So I built a small automation to fix that.

<!--more-->

The solution uses **GitHub Actions** to run a daily job that fetches the latest video titles from each playlist using `yt-dlp`, updates a JSON file, and commits the changes automatically.

Now, whenever I add a song to a YouTube playlist, the website updates itself overnight. Zero manual work needed. ✨
