import { remote } from '../../packages/webdriverio/build/index.js'
const browser = await remote({
    logLevel: 'error',
    capabilities: {
        webSocketUrl: true,
        browserName: 'chrome'
    }
})

await browser.sessionSubscribe({
    events: ['log.entryAdded']
})

/**
 * Console logging
 */
browser.on('log.entryAdded', (logEntry) => console.log(JSON.stringify(logEntry, null, 4)))
await browser.execute(() => console.log('Hello Bidi'))

/**
 * Network logging
 */
await browser.sessionSubscribe({
    events: ['network.responseCompleted']
})
browser.on('network.responseCompleted', (networkResponse) => console.log(JSON.stringify(networkResponse, null, 4)))
await browser.url('https://webdriver.io')
await browser.deleteSession()
