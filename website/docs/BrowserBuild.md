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
        "webdriverio": "/node_modules/.vite/deps/webdriverio.js"
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
- **`util`**: Includes `promisify`, `inherits`, etc.

### Limitations
Some Node.js modules that clearly rely on OS-level access (like `fs`, `child_process`, `net`) are **not** available and will throw descriptive errors if accessed.

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
