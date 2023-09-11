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
browser.on('message', (data) => {
    const payload = JSON.parse(data.toString())
    if (payload.method !== 'log.entryAdded') {
        return
    }
    console.log(JSON.stringify(payload, null, 4))
})
await browser.execute(() => console.log('Hello Bidi'))

/**
 * Network logging
 */
await browser.sessionSubscribe({
    events: ['network.responseCompleted']
})
browser.on('message', (data) => {
    const payload = JSON.parse(data.toString())
    if (payload.method !== 'network.responseCompleted') {
        return
    }
    console.log(JSON.stringify(payload, null, 4))
})
await browser.url('https://webdriver.io')
await browser.deleteSession()
