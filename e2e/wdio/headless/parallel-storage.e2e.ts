import { browser, expect } from '@wdio/globals'
import { PARALLEL_FIXTURE_ORIGIN } from '../parallelFixtureServer.js'

const ORIGIN = `${PARALLEL_FIXTURE_ORIGIN}/`
const MARKER_A = 'parallel-marker-a'
const MARKER_B = 'parallel-marker-b'
const WRITER_WAIT_MS = 30_000

// Tests share this module in parallel mode, so t3 must wait for both writers
// instead of relying on declaration order; a free slot can start t3 early.
const writerDone = (name: string) => {
    let settle!: (error?: unknown) => void
    const done = new Promise<void>((resolve, reject) => {
        settle = (error) => error === undefined ? resolve() : reject(error)
    })
    done.catch(() => {})
    const write = async (fn: () => Promise<void>) => {
        try {
            await fn()
            settle()
        } catch (error) {
            settle(new Error(`${name} failed`, { cause: error }))
            throw error
        }
    }
    return { done, write }
}
const writerA = writerDone('t1')
const writerB = writerDone('t2')

const waitForWriters = async () => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`writers t1/t2 did not finish within ${WRITER_WAIT_MS}ms (filtered out or hung?)`)), WRITER_WAIT_MS)
    })
    try {
        await Promise.race([Promise.all([writerA.done, writerB.done]), timeout])
    } finally {
        clearTimeout(timer)
    }
}

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
        await writerA.write(async () => {
            await browser.url(ORIGIN)
            await browser.execute((key) => {
                localStorage.setItem(key, 'a')
                document.cookie = `${key}=a; path=/`
            }, MARKER_A)
            expect((await readMarkers()).localA).toBe('a')
        })
    })

    it('t2 writes storage markers', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        await writerB.write(async () => {
            await browser.url(ORIGIN)
            await browser.execute((key) => {
                localStorage.setItem(key, 'b')
                document.cookie = `${key}=b; path=/`
            }, MARKER_B)
            expect((await readMarkers()).localB).toBe('b')
        })
    })

    it('t3 sees markers only when the mode shares storage', async function () {
        if (!browser.isBidi) {
            return this.skip()
        }
        await waitForWriters()
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
