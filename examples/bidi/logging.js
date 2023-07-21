import { remote } from '../../packages/webdriverio/build/index.js'

/**
 * this little script demonstrates how to run a session
 * on the WebDriver Bidi protocol.
 */
const browser = await remote({
    capabilities: {
        webSocketUrl: true,
        browserName: 'chrome'
    }
})

console.log(browser.capabilities)

await browser.send({
    method: 'session.subscribe',
    params: { events: ['log.entryAdded'] }
})

/**
 * returns: {"method":"log.entryAdded","params":{"type":"console","method":"log","realm":null,"args":[{"type":"string","value":"Hello Bidi"}],"level":"info","text":"Hello Bidi","timestamp":1657282076037}}
 */
browser.on('message', (data) => console.log('received %s', data))

await browser.executeScript('console.log("Hello Bidi")', [])
// await browser.debug()
await browser.deleteSession()
