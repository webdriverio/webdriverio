---
id: browser-build
title: WebdriverIO Browser Build
sidebar_label: Browser Build
---

> [!NOTE]
> This feature is available in WebdriverIO v9 and later.

WebdriverIO provides a standalone browser build that enables running automation scripts directly within a browser environment. This is particularly useful for:
- Building "AI Agent" sandboxes where automation checks run client-side.
- Creating web-based test editors or playgrounds.
- Running lightweight automation checks without a Node.js runtime.

## Installation

The browser build is part of the `webdriverio` package. It is available as an ESM module that can be imported directly into your browser application.

### Via NPM
If you are using a bundler like Vite, Webpack, or Rollup, you can import `webdriverio` and the bundler will automatically pick up the browser-compatible build:

```javascript
import { remote } from 'webdriverio'
```

### Via Import Map
You can also use an [Import Map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) to point to the browser build served by your development server or CDN:

```html
<script type="importmap">
{
    "imports": {
        "webdriverio": "/node_modules/webdriverio/build/browser.js"
    }
}
</script>
<script type="module">
    import { remote } from 'webdriverio'
</script>
```

## Polyfills & Node.js Compatibility

The browser build includes polyfills for several Node.js core modules to ensure compatibility with existing WebdriverIO scripts and third-party libraries.

### Available Polyfills
The following Node.js globals and modules are polyfilled:

- **`process`**: Detailed polyfill including `platform: 'browser'`, `env`, `nextTick`, etc.
- **`Buffer`**: Full implementation extending `Uint8Array`, supporting `from`, `alloc`, `concat`, and encoding/decoding (`base64`, `hex`, `utf-8`).
- **`path`**: POSIX-compliant implementation for path manipulation.
- **`url`**: Uses native browser `URL` and `URLSearchParams`.
- **`events`**: Full `EventEmitter` implementation.
- **`querystring`**: Query string encoding/decoding utilities.
- **`util`**: Includes `promisify`, `inherits`, `format`, `inspect`, etc.

### Limitations

> [!IMPORTANT]
> Some Node.js modules and WebdriverIO commands are not available in browser environments.

#### Unavailable Commands
The following WebdriverIO commands will throw descriptive errors:
- `browser.saveScreenshot()` - File system access required
- `browser.uploadFile()` - File system access required
- `browser.savePDF()` - File system access required
- `browser.saveRecordingScreen()` - File system access required
- `browser.downloadFile()` - File system access required

#### Unavailable Node.js Modules
These modules throw errors if accessed:
- `fs`, `fs/promises` - File system operations
- `child_process` - Process spawning
- `net`, `tls`, `dgram` - Network sockets
- `http`, `https`, `http2` - HTTP servers
- `os` - Operating system utilities
- `crypto` - Cryptographic operations (use Web Crypto API instead)

## CORS Requirements

> [!WARNING]
> When connecting to a remote WebDriver endpoint from the browser, you must handle CORS (Cross-Origin Resource Sharing).

### Option 1: Configure WebDriver Server
Enable CORS headers on your WebDriver server:
```bash
# Example: ChromeDriver with CORS
chromedriver --allowed-origins=http://localhost:3000
```

### Option 2: Use a Proxy Server
Configure your development server to proxy WebDriver requests:

**Vite Configuration:**
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/webdriver': {
        target: 'http://localhost:4444',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/webdriver/, '')
      }
    }
  }
}
```

**Webpack Dev Server:**
```javascript
// webpack.config.js
module.exports = {
  devServer: {
    proxy: {
      '/webdriver': {
        target: 'http://localhost:4444',
        pathRewrite: { '^/webdriver': '' }
      }
    }
  }
}
```

Then connect using the proxy path:
```javascript
const browser = await remote({
    hostname: window.location.hostname,
    port: window.location.port,
    path: '/webdriver',
    capabilities: { browserName: 'chrome' }
})
```

## Troubleshooting

### "Module not found" Errors
If you see errors like `Cannot find module 'fs'`:
1. Ensure you're importing from the browser build (not the Node.js build)
2. Check your bundler configuration picks up the `browser` export condition
3. Verify your bundler supports export conditions (Vite, Webpack 5+, Rollup with plugins)

### WebSocket Connection Failures
- Verify the WebDriver endpoint supports WebSocket (BiDi protocol)
- Check CORS headers if connecting to a remote endpoint
- Ensure the WebDriver server is running and accessible
- Use browser DevTools Network tab to inspect WebSocket handshake

### Buffer/Process Not Defined
If you see `Buffer is not defined` or `process is not defined`:
1. The polyfills should be automatically injected
2. Check that the browser build is being used (not Node.js build)
3. Verify your bundler isn't stripping the banner injection

### Performance Issues
- The browser build bundles all dependencies, which can be large (~500KB+)
- Use code splitting if only certain features are needed
- Consider lazy loading the WebdriverIO module when needed

## Example Usage

Here is a simple example of running a script in the browser:

```javascript
import { remote } from 'webdriverio'

async function run() {
    // 1. Connect to a WebDriver backend (e.g., local driver or cloud grid)
    const browser = await remote({
        hostname: 'localhost',
        port: 4444,
        capabilities: { browserName: 'chrome' }
    })

    // 2. Run automation commands
    await browser.url('https://webdriver.io')
    console.log(await browser.getTitle())

    // 3. Use Node.js APIs naturally
    const data = Buffer.from('SGVsbG8gV29ybGQ=', 'base64').toString('utf-8')
    console.log(data) // "Hello World"

    await browser.deleteSession()
}

run()
```

### Dynamic AI Agent Sandbox

You can create a sandbox where users provide a script that is executed dynamically in the browser. This pattern is common in AI agent evaluation environments.

```javascript
import { remote } from 'webdriverio'

// 1. User provides a script string (e.g., from a code editor)
const userScript = `
    export async function run(browser) {
        await browser.url('https://example.com')
        const title = await browser.getTitle()
        return title
    }
`

// 2. Create a dynamic module from the string
const blob = new Blob([userScript], { type: 'text/javascript' })
const scriptUrl = URL.createObjectURL(blob)

// 3. Execution Harness
async function executeUserScript() {
    let browser
    try {
        // Evaluate the user's code
        const module = await import(scriptUrl)

        // Initialize WebDriver
        browser = await remote({
            hostname: 'localhost',
            port: 4444,
            capabilities: { browserName: 'chrome' }
        })

        // Run the exported function
        const result = await module.run(browser)
        console.log('Script Result:', result)

    } catch (err) {
        console.error('Execution failed:', err)
    } finally {
        if (browser) await browser.deleteSession()
        URL.revokeObjectURL(scriptUrl)
    }
}

executeUserScript()
```
