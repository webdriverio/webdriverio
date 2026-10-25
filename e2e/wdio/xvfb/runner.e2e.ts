import { browser, $, expect } from '@wdio/globals'

/**
 * Runner-integration smoke test: the local runner spawns this worker through
 * `xvfb-run`, so the worker only starts if its IPC channel survives the wrapper
 * (#15685), and Chrome only starts if the worker inherited xvfb-run's display.
 */
describe('xvfb through local runner', () => {
    it('runs the worker under xvfb-run', () => {
        expect(process.env.DISPLAY).toMatch(/^:\d+$/)
    })

    it('can navigate to a data: URL and read the DOM', async () => {
        await browser.url('data:text/html,<html><body><h1 id="t">xvfb runner integration</h1></body></html>')

        const heading = await $('#t')
        await expect(heading).toBeExisting()
        await expect(heading).toHaveText('xvfb runner integration')
    })
})
