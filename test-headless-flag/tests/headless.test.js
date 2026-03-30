/* global describe, it */
/**
 * Test file to verify the --headless CLI flag behaviour.
 *
 * Usage:
 *   pnpm --filter test-headless-flag test:headless  → runs Chrome headlessly (no window)
 *   pnpm --filter test-headless-flag test:headed    → runs Chrome with a visible window
 *   pnpm --filter test-headless-flag test           → runs as configured in wdio.conf.js (no override)
 */
describe('--headless CLI flag', () => {
    it('should open a page in the browser', async () => {
        await browser.url('https://www.example.com')
        const title = await browser.getTitle()
        console.log('\n  Page title:', title)
        expect(title).toBeTruthy()
    })

    it('should log user agent to verify headless mode', async () => {
        const ua = await browser.execute(() => navigator.userAgent)
        console.log('\n  User-Agent:', ua)

        // In --headless (Chrome new headless) the UA no longer contains "HeadlessChrome"
        // but the browser still functions as expected. The key is that no window appears.
        // For older Chrome headless (pre-112), you'd see "HeadlessChrome" in the UA.
        const isOldHeadless = ua.includes('HeadlessChrome')
        console.log('  Old-style headless UA detected:', isOldHeadless)
    })

    it('should report the effective goog:chromeOptions args via capabilities', async () => {
        const caps = browser.capabilities
        const chromeArgs = caps?.['goog:chromeOptions']?.args ?? []
        console.log('\n  Effective goog:chromeOptions.args:', JSON.stringify(chromeArgs))

        // The test passes regardless of headless state — this is for inspection only.
        // When run with --headless, you should see "--headless" and "--disable-gpu" in the args.
        // When run with --headless=false, those args should be absent.
    })
})
