---
id: cloud-providers
title: Cloud Providers
description: "Run WebdriverIO MCP browser and mobile sessions on cloud device farms, including credentials, app uploads, tunnels and reporting."
---

The WebdriverIO MCP server has native support for running browser and mobile automation sessions on cloud device farms. No local drivers, emulators, or simulators required. Five cloud providers are supported:

- **BrowserStack** — [Automate](https://www.browserstack.com/automate) (browsers) and [App Automate](https://www.browserstack.com/app-automate) (mobile apps)
- **Sauce Labs** — [Sauce Labs](https://saucelabs.com) real device cloud and virtual browsers
- **TestMu (formerly LambdaTest)** — [TestMu](https://www.lambdatest.com) real device and browser cloud
- **TestingBot** — [TestingBot](https://testingbot.com) real device cloud and browser grid
- **Digital.ai Testing** — browser and mobile sessions on your own Digital.ai cloud host

All five providers share the same workflow: set credentials, optionally upload a mobile app, then call `start_session` with the provider name. Differences, such as tunnel support and reporting labels, are listed under Provider-Specific Notes. For any other W3C WebDriver endpoint, see [External Provider](#external-provider).

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
export DIGITALAI_CLOUD_URL="https://cloud.example.com"
export DIGITALAI_ACCESS_KEY="your_access_key"
```

| Provider     | Username Variable            | Access Key Variable       | Where to find                                                      |
| ------------ | ---------------------------- | ------------------------- | ------------------------------------------------------------------ |
| BrowserStack | `BROWSERSTACK_USERNAME`      | `BROWSERSTACK_ACCESS_KEY` | [Account settings](https://www.browserstack.com/accounts/settings) |
| Sauce Labs   | `SAUCE_USERNAME`             | `SAUCE_ACCESS_KEY`        | [User settings](https://app.saucelabs.com/user-settings)           |
| TestMu       | `TESTMU_USERNAME`            | `TESTMU_ACCESS_KEY`       | [Account settings](https://accounts.lambdatest.com/detail/profile) |
| TestingBot   | `TESTINGBOT_KEY`             | `TESTINGBOT_SECRET`       | [Account settings](https://testingbot.com/membership)              |
| Digital.ai   | `DIGITALAI_CLOUD_URL` (host) | `DIGITALAI_ACCESS_KEY`    | Your Digital.ai Testing account                                    |

## Browser Automation

Run a browser session on any cloud provider by setting `provider` in `start_session`:

```js
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
  osVersion: "15"
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
```

All providers support `browser`: `"chrome"`, `"firefox"`, `"edge"`, `"safari"`. If you omit `os` / `osVersion`, the provider uses sensible defaults (typically latest Linux for browser sessions).

### Operating system values

`os` and `osVersion` are passed to the provider unchanged, so use the names that provider's API and docs use. The values are provider-native and not normalized across providers:

| Provider     | macOS                                     | Windows                            |
| ------------ | ----------------------------------------- | ---------------------------------- |
| BrowserStack | `os: "OS X"`, `osVersion: "Sequoia"`      | `os: "Windows"`, `osVersion: "11"` |
| Sauce Labs   | `os: "macOS"`, `osVersion: "15"`          | `os: "Windows"`, `osVersion: "11"` |
| TestMu       | `os: "macOS"`, `osVersion: "Sequoia"`     | `os: "Windows"`, `osVersion: "11"` |
| TestingBot   | `os: "SEQUOIA"`                           | `os: "WIN11"`                      |
| Digital.ai   | Use the names your Digital.ai cloud lists | `os: "Windows"`, `osVersion: "11"` |

BrowserStack sends `os` and `osVersion` as separate capabilities. Sauce Labs, TestMu, TestingBot and Digital.ai join them with a space into one platform name, so `macOS` and `15` become `macOS 15`. An empty `osVersion` is dropped.

### Sauce Labs Regions

Sauce Labs supports multiple data center regions. Set the `region` parameter in `start_session`:

```js
start_session({
  provider: "saucelabs",
  platform: "browser",
  browser: "chrome",
  region: "us-west-1"
})
```

Supported values: `"us-west-1"`, `"eu-central-1"` (default), `"apac-southeast-1"`.

## Mobile App Automation

The mobile workflow has three steps, identical across all providers:

### Step 1: Upload your app

```js
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
- TestingBot: the `tb://…` `app_url` returned by the upload, used verbatim
- Digital.ai: `cloud:<name>`

You can optionally set a `customId` for stable references across uploads:

```js
upload_app({ provider: "saucelabs", path: "/path/to/app.ipa", customId: "MyApp-v2.1" })
```

For Sauce Labs, add `region` to match your storage region (default `"eu-central-1"`).

### Step 2: List available apps

```js
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

```js
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
```

## Local Tunnel

BrowserStack, Sauce Labs, TestMu, and TestingBot support a local tunnel so cloud sessions can reach servers on your machine (localhost, staging environments, internal services). Digital.ai has no tunnel support, and `tunnel` has no effect with `provider: "digitalai"` or `provider: "external"`.

The MCP server uses a **unified `tunnel` parameter** that works identically across providers:

### Auto-managed tunnel (recommended)

The MCP server starts and stops the tunnel automatically:

```js
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

### External tunnel

If you're already running the tunnel in a separate process:

```js
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

```text
// Read setup instructions (from your AI client)
wdio://saucelabs/local-binary
wdio://testingbot/local-binary
```

Each resource returns the download URL, platform-specific commands, and daemon instructions.

## Reporting

Tag sessions with project, build, and session labels for the provider's dashboard. This works identically across BrowserStack, Sauce Labs, TestMu, and TestingBot. Digital.ai uses the session label, or the project label when none is set, as its test name; `build` is not sent.

```js
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

Sessions appear in the provider's dashboard under the specified project and build:
- BrowserStack: [Automate dashboard](https://automate.browserstack.com)
- Sauce Labs: [Test results](https://app.saucelabs.com/dashboard/builds)
- TestMu: [Automation dashboard](https://automation.lambdatest.com)
- TestingBot: [Test results](https://testingbot.com/members)

## Provider-Specific Notes

### BrowserStack

- Browser sessions: `os` accepts `"Windows"` or `"OS X"`. Windows versions: `"10"`, `"11"`. macOS versions: `"Ventura"`, `"Sonoma"`, `"Sequoia"`.
- App management API: `organizationWide: true` on `list_apps` lists all team uploads.

### Sauce Labs

- **Regions matter.** The default region is `eu-central-1`. If your account is in a different region, set `region` on `start_session`, `list_apps`, and `upload_app` to match.
- Mobile sessions support `automationName` (`"XCUITest"` or `"UiAutomator2"`); defaults are sensible per platform.
- `SAUCE_REGION` only changes the region in the start command returned by `wdio://saucelabs/local-binary` (default `eu-central-1`). It does not set the region for `start_session`; pass `region` for that.
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

- **Host.** `DIGITALAI_CLOUD_URL` is your cloud host. A scheme, a trailing `/wd/hub`, and trailing slashes are stripped, so `https://cloud.example.com` and `cloud.example.com` both work. Sessions connect to `https://<host>/wd/hub` on port 443.
- **Credentials.** Sessions send `DIGITALAI_ACCESS_KEY` as the access key capability. `list_apps` and `upload_app` send it as a Bearer token.
- **Browser sessions.** Capabilities are flat: `digitalai:accessKey`, `browserName`, and `digitalai:osName`. `edge` is sent as `MicrosoftEdge`. `digitalai:osName` joins `os` and `osVersion`, so `os: "Windows"` with `osVersion: "11"` becomes `Windows 11`. `digitalai:testName` comes from `reporting.session`, falling back to `reporting.project`.
- **Mobile sessions.** Digital.ai capabilities are nested under `digitalai:options` (`accessKey`, `testName`, `deviceQuery`). The provider sets `platformName`, `appium:automationName` (`XCUITest` for iOS, `UiAutomator2` for Android, unless you pass `automationName`), and `appium:newCommandTimeout` (300 by default). The Appium version is set on the Digital.ai project, not in `start_session`.
- **Devices.** Pass `deviceQuery` to target a device. Without it, the provider builds a query from `platformVersion` and `deviceName`, for example `@os='android' and @version='14' and @name='Pixel 7'`. With neither, no query is sent. Real devices match by default; `deviceQuery: "@emulator='true'"` selects an emulator.
- **Apps.** Pass `app: "cloud:<name>"` from `upload_app` or `list_apps`. With `browser` set on a mobile platform, the session runs in mobile browser mode and no app is needed.
- **Apps and listing.** `list_apps` and `upload_app` support `provider: "digitalai"`. `organizationWide` and `region` do not apply.
- **No tunnel.** `tunnel` has no effect with Digital.ai.
- **Reporting.** On close, the provider marks the test Passed or Failed on the cloud. If Digital.ai returns a report URL, `start_session` shows it as `Report: <url>`.
- **Close.** Sessions are never auto-detached; `close_session` ends them.

```js
start_session({
  provider: "digitalai",
  platform: "browser",
  browser: "edge",
  os: "Windows",
  osVersion: "11",
  reporting: { project: "Checkout", session: "Login flow" }
})

start_session({
  provider: "digitalai",
  platform: "android",
  deviceName: "Pixel 7",
  platformVersion: "14",
  app: "cloud:com.example.app"
})
```

## External Provider

`provider: "external"` runs a browser session on any W3C WebDriver endpoint, such as a Selenium Grid or a standalone driver. The server connects to the endpoint and sends your `capabilities`. It does not start, stop, or tunnel anything.

```js
start_session({
  provider: "external",
  platform: "browser",
  browser: "firefox",
  webdriverConfig: { hostname: "grid.internal", port: 4444, path: "/wd/hub" }
})
```

- **Endpoint.** Defaults to `http://127.0.0.1:4445/`. Each `webdriverConfig` field falls back to its own default: `protocol` `http`, `hostname` `127.0.0.1`, `port` `4445`, `path` `/`.
- **Browser.** `browser` defaults to `chrome`, sent as `browserName`.
- **Capabilities.** `capabilities` merge over the defaults, so your values win.
- **Platform.** Browser only. Mobile and Electron requests return an error.
- **Close.** `close_session` detaches by default, so the remote session keeps running. Pass `detach: false` to end it.
