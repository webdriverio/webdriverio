---
id: cloud-providers
title: Cloud Providers
---

The WebdriverIO MCP server has native support for running browser and mobile automation sessions on cloud device farms. No local drivers, emulators, or simulators required. Five providers are supported:

- **BrowserStack** — [Automate](https://www.browserstack.com/automate) (browsers) and [App Automate](https://www.browserstack.com/app-automate) (mobile apps)
- **Sauce Labs** — [Sauce Labs](https://saucelabs.com) real device cloud and virtual browsers
- **TestMu (formerly LambdaTest)** — [TestMu](https://www.lambdatest.com) real device and browser cloud
- **TestingBot** — [TestingBot](https://testingbot.com) real device cloud and browser grid
- **Digital.ai Testing** — [Digital.ai Testing](https://digital.ai/products/continuous-testing/) real device and browser cloud

All five providers share the same workflow: set credentials, optionally upload a mobile app, then call `start_session` with the provider name. Mobile app lifecycle (`upload_app` → `list_apps` → `start_session`) is identical across all five. Reporting labels and tunnel configuration are identical across BrowserStack, Sauce Labs, TestMu, and TestingBot — Digital.ai supports both, but with a different underlying model (see the Digital.ai notes below).

## Prerequisites

Set your credentials as environment variables before starting the MCP server:

```bash
# BrowserStack
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"

# Sauce Labs
export SAUCE_USERNAME="your_username"
export SAUCE_ACCESS_KEY="your_access_key"

# TestMu
export TESTMU_USERNAME="your_username"
export TESTMU_ACCESS_KEY="your_access_key"

# TestingBot
export TESTINGBOT_KEY="your_key"
export TESTINGBOT_SECRET="your_secret"

# Digital.ai
export DIGITALAI_CLOUD_URL="https://your-cloud.example.com"
export DIGITALAI_ACCESS_KEY="your_access_key"
```

| Provider | Username Variable | Access Key Variable | Where to find |
|----------|-------------------|---------------------|---------------|
| BrowserStack | `BROWSERSTACK_USERNAME` | `BROWSERSTACK_ACCESS_KEY` | [Account settings](https://www.browserstack.com/accounts/settings) |
| Sauce Labs | `SAUCE_USERNAME` | `SAUCE_ACCESS_KEY` | [User settings](https://app.saucelabs.com/user-settings) |
| TestMu | `TESTMU_USERNAME` | `TESTMU_ACCESS_KEY` | [Account settings](https://accounts.lambdatest.com/detail/profile) |
| TestingBot | `TESTINGBOT_KEY` | `TESTINGBOT_SECRET` | [Account settings](https://testingbot.com/membership) |
| Digital.ai | — | `DIGITALAI_ACCESS_KEY` | [User settings](https://docs.digital.ai/continuous-testing/docs/te/test-execution-home/getting-started/obtain-your-access-key) |

> Digital.ai authenticates with a cloud host + access key instead of a username/access-key pair — set `DIGITALAI_CLOUD_URL` to your cloud's base URL (e.g. `https://your-cloud.example.com`).

---

## Browser Automation

Run a browser session on any cloud provider by setting `provider` in `start_session`:

```
// BrowserStack — Windows + Chrome
start_session({
  provider: "browserstack",
  platform: "browser",
  browser: "chrome",
  browserVersion: "latest",
  os: "Windows",
  osVersion: "11"
})

// Sauce Labs — macOS + Safari
start_session({
  provider: "saucelabs",
  platform: "browser",
  browser: "safari",
  browserVersion: "latest",
  os: "macOS",
  osVersion: "Sequoia"
})

// TestMu — Linux + Firefox
start_session({
  provider: "testmu",
  platform: "browser",
  browser: "firefox",
  browserVersion: "latest",
  os: "Linux"
})

// TestingBot — Windows + Chrome
start_session({
  provider: "testingbot",
  platform: "browser",
  browser: "chrome",
  browserVersion: "latest",
  os: "Windows",
  osVersion: "11"
})

// Digital.ai — Windows + Chrome
start_session({
  provider: "digitalai",
  platform: "browser",
  browser: "chrome",
  os: "Windows",
  osVersion: "11"
})
```

All providers support `browser`: `"chrome"`, `"firefox"`, `"edge"`, `"safari"`. If you omit `os` / `osVersion`, the provider uses sensible defaults (typically latest Linux for browser sessions). Digital.ai maps `os`/`osVersion` to the `digitalai:osName` capability (unlike the other providers, which use `platformName`).

### Sauce Labs Regions

Sauce Labs supports multiple data center regions. Set the `region` parameter in `start_session`:

```
start_session({
  provider: "saucelabs",
  platform: "browser",
  browser: "chrome",
  region: "us-west-1"
})
```

Supported values: `"us-west-1"`, `"eu-central-1"` (default), `"apac-southeast-1"`.

---

## Mobile App Automation

The mobile workflow has three steps, identical across all providers:

### Step 1: Upload your app

```
upload_app({ provider: "browserstack", path: "/absolute/path/to/app.apk" })
upload_app({ provider: "saucelabs", path: "/path/to/app.ipa" })
upload_app({ provider: "testmu", path: "/path/to/app.apk" })
upload_app({ provider: "testingbot", path: "/path/to/app.apk" })
upload_app({ provider: "digitalai", path: "/path/to/app.apk" })
```

Each returns an app reference you'll use in `start_session`:
- BrowserStack: `bs://abc123...`
- Sauce Labs: `storage:filename=MyApp.ipa`
- TestMu: `lt://abc123...`
- TestingBot: `https://api.testingbot.com/v1/storage/<app_url>`
- Digital.ai: `cloud:<package-or-bundle>`

You can optionally set a `customId` for stable references across uploads:

```
upload_app({ provider: "saucelabs", path: "/path/to/app.ipa", customId: "MyApp-v2.1" })
```

For Sauce Labs, add `region` to match your storage region (default `"eu-central-1"`).

### Step 2: List available apps

```
list_apps({ provider: "browserstack" })
list_apps({ provider: "saucelabs" })
list_apps({ provider: "testmu" })
list_apps({ provider: "testingbot" })
list_apps({ provider: "digitalai" })
```

Optional parameters for all providers:
- `sortBy`: `"app_name"` or `"uploaded_at"` (default)
- `limit`: max results (default 20)

BrowserStack also supports `organizationWide: true` to list all org uploads. Sauce Labs accepts `region`.

### Step 3: Start the session

Use the app reference from `upload_app`, or a `customId`:

```
// BrowserStack — Android
start_session({
  provider: "browserstack",
  platform: "android",
  deviceName: "Samsung Galaxy S24",
  platformVersion: "14.0",
  app: "bs://abc123..."
})

// Sauce Labs — iOS
start_session({
  provider: "saucelabs",
  platform: "ios",
  deviceName: "iPhone 15",
  platformVersion: "17.0",
  app: "storage:filename=MyApp.ipa"
})

// TestMu — Android
start_session({
  provider: "testmu",
  platform: "android",
  deviceName: "Samsung Galaxy S24",
  platformVersion: "14.0",
  app: "lt://abc123..."
})

// TestingBot — Android
start_session({
  provider: "testingbot",
  platform: "android",
  deviceName: "Samsung Galaxy S24",
  platformVersion: "14.0",
  app: "<app_url from upload_app>"
})

// Digital.ai — Android
start_session({
  provider: "digitalai",
  platform: "android",
  deviceQuery: "@os='android' and @version='14' and @name='Samsung Galaxy S24'",
  app: "cloud:com.example.myapp"
})
```

---

## Local Tunnel

All four of BrowserStack, Sauce Labs, TestMu, and TestingBot support a local tunnel so cloud sessions can reach servers on your machine (localhost, staging environments, internal services).

The MCP server uses a **unified `tunnel` parameter** that works identically across providers:

### Auto-managed tunnel (recommended)

The MCP server starts and stops the tunnel automatically:

```
start_session({
  provider: "browserstack",
  platform: "browser",
  browser: "chrome",
  tunnel: true
})
```

Before your first session with `tunnel: true`, the MCP server handles downloading and starting the tunnel binary. If you want to verify setup manually, read the provider's local-binary resource:

- `wdio://browserstack/local-binary`
- `wdio://saucelabs/local-binary`
- `wdio://testmu/local-binary`
- `wdio://testingbot/local-binary`

The tunnel stops automatically when you close the session.

> **Note:** Digital.ai does not support the `tunnel` parameter. On a dedicated cloud, devices already reach the customer's internal/staging URLs by default — no separate tunnel is needed. On a public cloud (or when a dedicated cloud needs to reach servers on your local network), use Digital.ai's [Network Tunnel Client](https://docs.digital.ai/continuous-testing/docs/lt/live-testing-home/network-tunnel-test-local-networks) directly — it's set up and run outside the MCP server, independent of the `tunnel` parameter used by the other providers.

### External tunnel

If you're already running the tunnel in a separate process:

```
start_session({
  provider: "saucelabs",
  platform: "browser",
  browser: "chrome",
  tunnel: "external",
  tunnelName: "my-sauce-tunnel"
})
```

`"external"` tells the MCP server that a tunnel is already running; it sets the appropriate capability flags but doesn't start or stop any process. Set `tunnelName` to match the running tunnel.

### Manual tunnel setup

If you prefer to run the tunnel manually, read the setup instructions from the MCP resource for your provider and platform. For example:

```
// Read setup instructions (from your AI client)
wdio://saucelabs/local-binary
wdio://testingbot/local-binary
```

Each resource returns the download URL, platform-specific commands, and daemon instructions.

---

## Reporting

Tag sessions with project, build, and session labels for the provider's dashboard. This works identically across BrowserStack, Sauce Labs, TestMu, and TestingBot:

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

// Digital.ai
start_session({
  provider: "digitalai",
  platform: "browser",
  browser: "chrome",
  reporting: {
    session: "Login flow test"
  }
})
```

Sessions appear in the provider's dashboard under the specified project and build:
- BrowserStack: [Automate dashboard](https://automate.browserstack.com)
- Sauce Labs: [Test results](https://app.saucelabs.com/dashboard/builds)
- TestMu: [Automation dashboard](https://automation.lambdatest.com)
- TestingBot: [Test results](https://testingbot.com/members)
- Digital.ai: report link is returned directly in the `start_session` response (`digitalai:reportUrl`)

---

## Provider-Specific Notes

### BrowserStack

- Browser sessions: `os` accepts `"Windows"` or `"OS X"`. Windows versions: `"10"`, `"11"`. macOS versions: `"Ventura"`, `"Sonoma"`, `"Sequoia"`.
- App management API: `organizationWide: true` on `list_apps` lists all team uploads.

### Sauce Labs

- **Regions matter.** The default region is `eu-central-1`. If your account is in a different region, set `region` on `start_session`, `list_apps`, and `upload_app` to match.
- Mobile sessions support `automationName` (`"XCUITest"` or `"UiAutomator2"`); defaults are sensible per platform.
- Sauce Connect tunnel is auto-managed via the `saucelabs` npm package. No external binary needed for `tunnel: true`.

### TestMu

- Provider name is `"testmu"` in `start_session`, `list_apps`, and `upload_app`.
- Browser sessions connect to `hub.lambdatest.com`; mobile sessions connect to `mobile-hub.lambdatest.com`; this is handled automatically.
- Tunnel is auto-managed via the `@lambdatest/node-tunnel` npm package.
- Mobile app management fetches both Android and iOS apps via separate API calls, then merges the results.

### TestingBot

- Provider name is `"testingbot"` in `start_session`, `list_apps`, and `upload_app`.
- Browser and mobile sessions both connect to `hub.testingbot.com` on port 443 (handled automatically).
- Credentials use `TESTINGBOT_KEY` and `TESTINGBOT_SECRET` (not a username/access-key pair like the other providers).
- Tunnel is auto-managed via the `testingbot-tunnel-launcher` npm package (requires Java 11+).
- No region parameter — TestingBot's hub is global.
- Mobile browser/emulator mode is supported: set `platform: "android"` or `"ios"` with a `browser` name (e.g., `"chrome"`) instead of `app`.

### Digital.ai

- Authenticates via `DIGITALAI_CLOUD_URL` (your cloud's base host) + `DIGITALAI_ACCESS_KEY`, rather than a username/access-key pair.
- Device selection uses a `deviceQuery` (a property-based query over the device fleet). If you don't pass `deviceQuery` directly, one is built from `deviceName`/`platformVersion`. Queries match **real devices by default** — append `and @emulator='true'` to force an emulator/simulator.
- Mobile browser mode is supported: set `platform: "android"` or `"ios"` with a `browser` name (e.g., `"chrome"`) instead of `app`.
- Browser sessions map `os`/`osVersion` to the flat `digitalai:osName` capability (not `platformName`).
- `reporting.session` (or `reporting.project` if `session` is omitted) is sent to Digital.ai as `testName`, which appears as the test name in the cloud report.
- No `tunnel` parameter support — a dedicated cloud reaches internal/staging URLs by default; a public cloud (or a dedicated cloud that needs your local network) uses Digital.ai's [Network Tunnel Client](https://docs.digital.ai/continuous-testing/docs/lt/live-testing-home/network-tunnel-test-local-networks) instead, run independently of the MCP server.
- For the cloud dashboard to reflect accurate pass/fail status, pass `capabilities: { "wdio:enforceWebDriverClassic": true }` in `start_session` — Digital.ai's pass/fail detection relies on the classic WebDriver protocol, which WebdriverIO's default BiDi transport can bypass.
