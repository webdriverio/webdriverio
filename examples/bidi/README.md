# Bidi Examples

## Logging

The following examples shows how to capture logs from the browser in real time:

```javascript { interpreter=node mimeType=application/json terminalRows=1 }
import { remote } from 'webdriverio'
const browser = await remote({
    logLevel: 'error',
    capabilities: {
        webSocketUrl: true,
        browserName: 'firefox'
    }
})

await browser.sessionSubscribe({
    events: ['log.entryAdded']
})

browser.on('log.entryAdded', (entryAdded) => console.log(JSON.stringify(entryAdded, null, 4)))
await browser.execute(() => console.log('Hello Bidi'))
await browser.deleteSession()
```

Or listen for network events:

```javascript { mimeType=application/json terminalRows=1 }
import { remote } from 'webdriverio'
const browser = await remote({
    logLevel: 'error',
    capabilities: {
        webSocketUrl: true,
        browserName: 'chrome'
    }
})

await browser.sessionSubscribe({
    events: ['network.responseCompleted']
})

browser.on('network.responseCompleted', (networkResponse) => console.log(JSON.stringify(networkResponse, null, 4)))
await browser.url('https://webdriver.io')
await browser.deleteSession()
```

## Scripting

The following example shows how to create a preload script:

```javascript { interpreter=node terminalRows=2 }
import { remote } from 'webdriverio'
const browser = await remote({
    logLevel: 'error',
    capabilities: {
        webSocketUrl: true,
        browserName: 'chrome'
    }
})

await browser.scriptAddPreloadScript({
    functionDeclaration: `() => { window.bar='foo'; }`
})

await browser.url('https://webdriver.io')
await browser.pause(2000)
console.log(await browser.execute(() => window.bar))
await browser.deleteSession()
```
