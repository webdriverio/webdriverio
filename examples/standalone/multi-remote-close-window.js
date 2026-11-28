import assert from 'node:assert/strict'
import { multiRemote } from 'webdriverio'

/**
 * Each instance owns its WebDriver session. Closing one instance's last window
 * must leave another usable. Exercise the real command path in both transports.
 */
for (const classic of [false, true]) {
    const mode = classic ? 'Classic' : 'BiDi'
    const capabilities = () => ({
        browserName: 'chrome',
        'goog:chromeOptions': { args: ['--headless=new'] },
        ...(classic ? { 'wdio:enforceWebDriverClassic': true } : { webSocketUrl: true })
    })
    const browser = await multiRemote({
        browserA: { capabilities: capabilities() },
        browserB: { capabilities: capabilities() }
    })

    try {
        const browserA = browser.getInstance('browserA')
        const browserB = browser.getInstance('browserB')
        await browserA.url('data:text/html,<title>A</title>')
        await browserB.url('data:text/html,<title>B</title>')

        assert.equal(browserA.isBidi, !classic)
        assert.deepEqual(await browserA.closeWindow(), [])
        assert.equal(await browserB.getTitle(), 'B')
        console.log(`${mode}: closed A; B remains usable`)
    } finally {
        await browser.deleteSession()
    }
}
