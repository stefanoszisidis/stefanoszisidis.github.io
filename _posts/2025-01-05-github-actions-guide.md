---
layout: post
title: "A Quick Guide to GitHub Actions"
date: 2025-01-05
category: DevOps
tags: [GitHub Actions, CI/CD, YAML, Automation]
excerpt_separator: <!--more-->
---

⚡ GitHub Actions is a powerful CI/CD tool built right into GitHub. Here's what I've learned from setting up my first few workflows.

<!--more-->

**The basics:** A workflow is defined in a `.yml` file under `.github/workflows/`. It runs on "triggers" like `push`, `schedule` (cron), or `workflow_dispatch` (manual trigger).

**Key concepts:**

*   **Jobs** — Independent units of work that run in parallel by default
*   **Steps** — Sequential commands within a job
*   **Actions** — Reusable building blocks (e.g., `actions/checkout@v4`)
*   **Secrets** — Encrypted variables for API keys and tokens

💡 **Pro tip:** Use `workflow_dispatch` to test your workflows manually before relying on scheduled runs.
