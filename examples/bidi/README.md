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

browser.on('message', (data) => console.log(JSON.stringify(JSON.parse(data.toString()), null, 4)))
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

browser.on('message', (data) => {
    const payload = JSON.parse(data.toString())
    if (payload.method !== 'network.responseCompleted') return
    console.log(JSON.stringify(payload, null, 4))
})
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

await browser.scriptAddPreloadScriptCommand({
    functionDeclaration: `() => { window.bar='foo'; }`
})

await browser.url('https://webdriver.io')
await browser.pause(2000)
console.log(await browser.execute(() => window.bar))
await browser.deleteSession()
```
