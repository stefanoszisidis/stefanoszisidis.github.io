---
layout: post
title: "GitHub Actions Gotcha: 'Re-run' Runs the Old Workflow, Not the Latest One"
date: 2026-04-20
category: DevOps
tags: [GitHub Actions, Node.js 24, CI/CD, Debugging]
excerpt_separator: <!--more-->
---

💡 Today I spent way too long debugging why my GitHub Action kept failing with the same error — even after I had already fixed the workflow file locally.

<!--more-->

The issue? I was clicking **"Re-run all jobs"** on the failed run in GitHub Actions. That button re-runs that exact workflow from that exact commit snapshot. It does *not* pick up any new changes you have pushed to the repository.

**The correct way to trigger a fresh run with the latest code:**
Go to **Actions → your workflow name → Run workflow** (the button in the top-right). This triggers a brand new `workflow_dispatch` run from your current `main` branch.

🔧 **Bonus fix from the same session:** The underlying error was a Node.js deprecation warning. `actions/checkout@v4` and `actions/setup-node@v4` were built on Node.js 20, which GitHub is phasing out. The clean fix was to upgrade both actions to `@v5`, which natively runs on Node.js 24 — no environment variable workarounds needed.
