import { browser, $, expect } from '@wdio/globals'

/**
 * Runner-integration smoke test: confirms that when the LocalRunner forks a
 * worker on a headless host, the display (a daemon the runner starts, or an
 * existing Wayland display it sets the session vars for) is reachable by Chrome
 * inside the worker, and a real browser session can navigate and read the DOM.
 *
 * If the display-server env vars (DISPLAY / WAYLAND_DISPLAY / XDG_RUNTIME_DIR)
 * don't propagate to the worker's child Chrome, Chrome will fail to connect to a
 * display and the session will not start, making session creation itself the
 * assertion.
 */
describe('display server through local runner', () => {
    it('inherits the display', () => {
        const { DISPLAY, WAYLAND_DISPLAY } = process.env
        expect(DISPLAY || WAYLAND_DISPLAY).toBeTruthy()
        if (DISPLAY) {
            expect(DISPLAY).toMatch(/^:\d+$/)
        }
    })

    it('starts a real Chrome session backed by the display server', async () => {
        const sessionId = browser.sessionId
        expect(sessionId).toBeTruthy()
    })

    it('can navigate to a data: URL and read the DOM', async () => {
        await browser.url('data:text/html,<html><body><h1 id="t">display-server runner integration</h1></body></html>')

        const heading = await $('#t')
        await expect(heading).toBeExisting()
        await expect(heading).toHaveText('display-server runner integration')
    })

    it('reports a non-empty user agent (browser is alive on the display)', async () => {
        const ua = await browser.execute(() => navigator.userAgent)
        expect(typeof ua).toBe('string')
        expect(ua.length).toBeGreaterThan(0)
    })
})
