---
id: browser-logs
title: Browser Logs
---

When running tests the browser may log important information that you are interested or want to assert against.

<Tabs
defaultValue="bidi"
values={[
    {label: 'Bidi', value: 'bidi'},
    {label: 'Classic (Deprecated)', value: 'classic'
}]
}>

<TabItem value='bidi'>

When using WebDriver Bidi, which is the default way how WebdriverIO automates the browser, you can subscribe to events coming from the browser. For log events you want to listen on `log.entryAdded'`, e.g.:

```ts
await browser.sessionSubscribe({ events: ['log.entryAdded'] })

/**
 * returns: {"type":"console","method":"log","realm":null,"args":[{"type":"string","value":"Hello Bidi"}],"level":"info","text":"Hello Bidi","timestamp":1657282076037}
 */
browser.on('log.entryAdded', (entryAdded) => console.log('received %s', entryAdded))
```

In a test you can just push log events to an array an assert that array once your action is done, e.g.:

```ts
import type { local } from 'webdriver'

describe('should log when doing a certain action', () => {
    const logs: string[] = []

    function logEvents (event: local.LogEntry) {
        logs.push(event.text) // add log message to the array
    }

    before(async () => {
        await browser.sessionSubscribe({ events: ['log.entryAdded'] })
        browser.on('log.entryAdded', logEvents)
    })

    it('should trigger the console event', () => {
        // trigger the browser send a message to the console
        ...

        // assert if log was captured
        expect(logs).toContain('Hello Bidi')
    })

    // clean up listener afterwards
    after(() => {
        browser.off('log.entryAdded', logEvents)
    })
})
```

</TabItem>

<TabItem value='classic'>

If you still use WebDriver Classic or disabled Bidi usage via the `'wdio:enforceWebDriverClassic': true` capability, you can use the `getLogs` JSONWire command to fetch the latest logs. Since WebdriverIO has removed these deprecated commands you will have to use the [JSONWP Service](https://github.com/webdriverio-community/wdio-jsonwp-service) to add the command back to your browser instance.

After you added or initiate the service you can fetch logs via:

```ts
const logs = await browser.getLogs('browser')
const logMessage = logs.find((log) => log.message.includes('Hello Bidi'))
expect(logMessage).toBeTruthy()
```

Note: the `getLogs` command can only fetch the most recent logs from the browser. It may clean up log messages eventually if they become to old.
</TabItem>

</Tabs>

Please note that you can use this method to retrieve error messages and verify whether your application has encountered any errors.
