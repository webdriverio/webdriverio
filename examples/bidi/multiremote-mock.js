import { multiRemote } from 'webdriverio'

/**
 * Two headless Chrome sessions so this can run without a display.
 * `webSocketUrl` turns on WebDriver BiDi, which `mock()` requires.
 */
function chrome () {
    return {
        logLevel: 'error',
        capabilities: {
            browserName: 'chrome',
            webSocketUrl: true,
            'goog:chromeOptions': {
                args: ['--headless=new', '--disable-gpu']
            }
        }
    }
}

let browser

try {
    browser = await multiRemote({
        myChromeBrowser: chrome(),
        myOtherChromeBrowser: chrome()
    })

    const mock = await browser.mock('https://example.com/**')
    console.log(`instances: ${mock.instances.join(',')}`)

    /**
     * `select()` can list browsers in a different order than `browser.instances`.
     * The mock records that order, and `getInstance` still finds each browser by name.
     */
    const selected = await browser.select('myOtherChromeBrowser', 'myChromeBrowser').mock('https://example.org/**')
    console.log(`selected: ${selected.instances.join(',')}`)

    try {
        mock.getInstance('missing')
        throw new Error('getInstance should throw for an unknown name')
    } catch (err) {
        if (!err.message.includes('Multi-remote object has no instance named "missing"')) {
            throw err
        }
        console.log(err.message)
    }

    mock.respond({ mocked: true })
    await browser.url('https://example.com/')
    await mock.waitForResponse({ timeout: 10_000 })

    for (const name of mock.instances) {
        const calls = mock.getInstance(name).calls.length
        console.log(`${name} calls: ${calls}`)
        if (calls < 1) {
            throw new Error(`${name} recorded no mocked requests`)
        }
    }
} catch (err) {
    console.log(`Something went wrong: ${err.stack}`)
    process.exitCode = 1
} finally {
    await browser?.deleteSession().catch((err) => {
        console.log(`Failed to delete sessions: ${err.message}`)
    })
}
