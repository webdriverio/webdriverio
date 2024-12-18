import { remote } from 'webdriverio'
const browser = await remote({
    logLevel: 'error',
    capabilities: {
        webSocketUrl: true,
        browserName: 'chrome'
    }
})

await browser.scriptAddPreloadScript({
    functionDeclaration: '() => { window.bar="foo"; }'
})

await browser.url('https://webdriver.io')
await browser.pause(2000)

console.log(await browser.execute(() => window.bar))
await browser.deleteSession()
