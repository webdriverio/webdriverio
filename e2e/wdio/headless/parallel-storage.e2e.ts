import { browser, expect } from '@wdio/globals'
import { PARALLEL_FIXTURE_ORIGIN } from '../parallelFixtureServer.js'

const ORIGIN = `${PARALLEL_FIXTURE_ORIGIN}/`
const MARKER_A = 'parallel-marker-a'
const MARKER_B = 'parallel-marker-b'

const readMarkers = () => browser.execute((a, b) => ({
    localA: localStorage.getItem(a),
    localB: localStorage.getItem(b),
    cookies: document.cookie
}), MARKER_A, MARKER_B)

describe('parallel mode storage isolation', () => {
    it('t1 writes storage markers', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        await browser.url(ORIGIN)
        await browser.execute((key) => {
            localStorage.setItem(key, 'a')
            document.cookie = `${key}=a; path=/`
        }, MARKER_A)
        expect((await readMarkers()).localA).toBe('a')
    })

    it('t2 writes storage markers', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        await browser.url(ORIGIN)
        await browser.execute((key) => {
            localStorage.setItem(key, 'b')
            document.cookie = `${key}=b; path=/`
        }, MARKER_B)
        expect((await readMarkers()).localB).toBe('b')
    })

    it('t3 sees markers only when the mode shares storage', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        await browser.url(ORIGIN)
        const markers = await readMarkers()
        const isolated = (browser.options as { mochaOpts?: { parallelMode?: string } }).mochaOpts?.parallelMode === 'userContexts'

        if (isolated) {
            expect(markers.localA).toBeNull()
            expect(markers.localB).toBeNull()
            expect(markers.cookies).not.toContain(MARKER_A)
            expect(markers.cookies).not.toContain(MARKER_B)
        } else {
            expect(markers.localA).toBe('a')
            expect(markers.localB).toBe('b')
            expect(markers.cookies).toContain(MARKER_A)
            expect(markers.cookies).toContain(MARKER_B)
        }
    })
})
