---
id: browserstack
title: BrowserStack
---

The WebdriverIO MCP server has native BrowserStack support for running browser and mobile automation sessions in the cloud without local drivers or simulators.

## Prerequisites

Set your BrowserStack credentials as environment variables:

```bash
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"
```

Find these in your [BrowserStack account settings](https://www.browserstack.com/accounts/settings).

---

## Browser Automation

Run a browser session on BrowserStack Automate:

```
start_session({
  provider: "browserstack",
  platform: "browser",
  browser: "chrome",
  browserVersion: "latest",
  os: "Windows",
  osVersion: "11"
})
```

Supported `os` values: `"Windows"`, `"OS X"`
Supported `osVersion` for Windows: `"10"`, `"11"`
Supported `osVersion` for OS X: `"Ventura"`, `"Sonoma"`, `"Sequoia"`

---

## Mobile App Automation

### Step 1 — Upload your app

```
upload_app({ path: "/absolute/path/to/app.apk" })
// Returns: { app_url: "bs://abc123...", custom_id: null }
```

Or use a `customId` for stable references:

```
upload_app({ path: "/path/to/app.ipa", customId: "MyApp-v2.1" })
```

### Step 2 — List available apps

```
list_apps()
// Returns your uploaded apps, sorted by upload date
```

```
list_apps({ organizationWide: true, limit: 50 })
// Returns all org uploads
```

### Step 3 — Start the session

Use the `bs://` URL from `upload_app`, or a `customId`:

```
start_session({
  provider: "browserstack",
  platform: "android",
  deviceName: "Samsung Galaxy S24",
  platformVersion: "14.0",
  app: "bs://abc123..."
})
```

```
start_session({
  provider: "browserstack",
  platform: "ios",
  deviceName: "iPhone 15",
  platformVersion: "17.0",
  app: "MyApp-v2.1"
})
```

---

## BrowserStack Local

BrowserStack Local lets your BrowserStack sessions access servers running on your machine (localhost, staging environments behind a firewall).

### Auto-managed tunnel (recommended)

The MCP server starts and stops the tunnel automatically:

```
start_session({
  provider: "browserstack",
  platform: "browser",
  browser: "chrome",
  browserstackLocal: true
})
```

Before your first session with `browserstackLocal: true`, read `wdio://browserstack/local-binary` — it contains the download URL and exact commands for your OS and CPU architecture.

### External tunnel

If you're already running BrowserStack Local in a separate process:

```
start_session({
  provider: "browserstack",
  platform: "browser",
  browser: "chrome",
  browserstackLocal: "external"
})
```

`"external"` tells the MCP server that a tunnel is already running — it sets `local: true` in the capabilities but doesn't start or stop any process.

### Setup (manual)

```bash
# Read setup instructions for your platform
# (MCP resource — read from your AI client)
wdio://browserstack/local-binary

# macOS / Linux
./BrowserStackLocal --key YOUR_ACCESS_KEY

# Windows
BrowserStackLocal.exe --key YOUR_ACCESS_KEY
```

---

## Reporting

Tag your sessions for BrowserStack Automate reporting:

```
start_session({
  provider: "browserstack",
  platform: "browser",
  browser: "chrome",
  reporting: {
    project: "My Project",
    build: "v2.1.0",
    session: "Login flow test"
  }
})
```

Sessions appear in your [BrowserStack Automate dashboard](https://automate.browserstack.com) under the specified project and build.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BROWSERSTACK_USERNAME` | ✓ | BrowserStack username |
| `BROWSERSTACK_ACCESS_KEY` | ✓ | BrowserStack access key |
