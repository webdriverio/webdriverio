# Using WebdriverIO In The Browser

WebdriverIO can now run directly in the browser, enabling client-side WebDriver automation without a Node.js runtime.

## Installation

### Via CDN (IIFE)
```html
<script src="https://unpkg.com/webdriverio/build/browser.min.js"></script>
<script>
  const { remote } = window.WebdriverIO
  // Use remote...
</script>
```

### Via ESM
```html
<script type="module">
  import { remote } from 'webdriverio/browser'
  // Use remote...
</script>
```

### Via npm + bundler
```js
import { remote } from 'webdriverio/browser'
```

## Usage Example
```js
import { remote } from 'webdriverio/browser'

async function automateFromBrowser() {
    const browser = await remote({
        hostname: 'remote-selenium.example.com',
        port: 4444,
        capabilities: {
            browserName: 'chrome'
        }
    })

    await browser.url('https://webdriver.io')
    const title = await browser.getTitle()
    console.log('Page title:', title)

    await browser.deleteSession()
}
```

## Limitations

Not supported in the browser build:
- File system operations (e.g. `uploadFile`, `saveScreenshot` to file)
- Local WebDriver process spawning
- Services that require Node.js (chromedriver, geckodriver, etc.)
- Reporters that write to disk
- Reading configuration from files

Supported:
- WebDriver protocol commands
- Remote WebDriver server connections
- Element interactions
- JavaScript execution
- Screenshots via `takeScreenshot()` (returns base64)

## API Differences

| Method | Node.js | Browser |
| --- | --- | --- |
| `browser.saveScreenshot()` | Saves to file | Throws (no file system). Use `takeScreenshot()` |
| `browser.uploadFile()` | Uploads from path | Not supported |
| `browser.debug()` | Opens REPL | Opens browser DevTools |

## Bundle Size

- Raw: ~1848.55 KB
- Minified: ~983.90 KB
- Gzipped: ~254.91 KB

## Browser Compatibility

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## Troubleshooting

### CORS Issues
When connecting to remote WebDriver servers, ensure CORS is properly configured:
```js
// Server should allow browser origins
Access-Control-Allow-Origin: https://your-app.com
```

### WebSocket Connections
Some browser security policies may block WebSocket connections to certain ports.

### Buffer or Process Not Defined
If you see `Buffer is not defined` or `process is not defined`:
- Ensure you are importing `webdriverio/browser`
- Ensure your bundler respects the `browser` export condition

## Advanced Configuration

### Custom Polyfills
```js
import { remote } from 'webdriverio/browser'

window.process = {
    env: { CUSTOM_VAR: 'value' }
}
```

### Error Handling
```js
try {
    const browser = await remote(config)
} catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
        console.error('Cannot connect to WebDriver server')
    }
}
```
