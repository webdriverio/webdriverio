---
id: metadata
title: Metadata
---

Inspect the full context of every browser session your test opens. The Metadata tab surfaces the capabilities, environment, and timing behind each run, so you can confirm exactly what was under test without digging through logs.

**What Gets Captured:**
- **Session capabilities** - Browser name and version, platform, and the negotiated WebDriver capabilities
- **Session details** - Session ID, base URL, and viewport size
- **Execution timing** - Test duration, status, and start/end timestamps
- **Per-session view** - Each browser session (including sessions created by `browser.reloadSession()`) is preserved independently and selectable from a dropdown

This is invaluable for diagnosing environment-specific failures, verifying the right capabilities were applied, and understanding how multi-session tests behaved.

## Demo

### 📋 Metadata
![Metadata Demo](/img/devtools/metadata.gif)
