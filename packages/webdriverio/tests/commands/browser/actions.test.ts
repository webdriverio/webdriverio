import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'
import { setParallelContextStore, getParallelContextStore } from '../../../src/session/context.js'

const noopParallelContextStore = getParallelContextStore()

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('actions command', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    it('should support multiple actions', async () => {
        await browser.actions([
            browser.action('key', { id: 'foobar' })
                .down('f')
                .pause(100)
                .up('b')
            ,
            browser.action(
                'pointer',
                {
                    id: 'foobar',
                    parameters: { pointerType: 'pen' }
                }
            )
                .down({
                    button: 1,
                    width: 2,
                    height: 3,
                    pressure: 4,
                    tangentialPressure: 5,
                    tiltX: 6,
                    tiltY: 7,
                    twist: 8,
                    altitudeAngle: 9,
                    azimuthAngle: 10,
                })
                .pause(100)
                .move({
                    button: 0,
                    width: 1,
                    height: 2,
                    pressure: 3,
                    tangentialPressure: 4,
                    tiltX: 5,
                    tiltY: 6,
                    twist: 7,
                    altitudeAngle: 8,
                    azimuthAngle: 9,
                    x: 10,
                    y: 11,
                    duration: 12,
                    origin: 'viewport'
                })
                .up({ button: 2 })
                .cancel()
            ,
            browser.action('wheel', { id: 'foobar' })
                .pause(100)
                .scroll({
                    x: 0,
                    y: 1,
                    deltaX: 2,
                    deltaY: 3,
                    duration: 4
                })
        ])

        const calls = vi.mocked(fetch).mock.calls
        expect(calls).toHaveLength(2)
        const [
            [performActionUrl, performActionParam],
            [releaseActionUrl, releaseActionParam]
        ] = calls as any
        expect(performActionUrl.pathname).toBe('/session/foobar-123/actions')
        expect(releaseActionUrl.pathname).toBe('/session/foobar-123/actions')
        expect(performActionParam.method).toBe('POST')
        expect(releaseActionParam.method).toBe('DELETE')
        expect(JSON.parse(performActionParam.body)).toMatchSnapshot()
    })
})

describe('actions command in a parallel test scope', () => {
    const parallelStore = new AsyncLocalStorage<string>()
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        setParallelContextStore(parallelStore)
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: { browserName: 'bidi' }
        })
    })

    afterAll(() => {
        setParallelContextStore(noopParallelContextStore)
    })

    it('routes through BiDi input with the store context', async () => {
        const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
        const release = vi.spyOn(browser, 'inputReleaseActions').mockResolvedValue({})
        const classicPerform = vi.spyOn(browser, 'performActions')

        await parallelStore.run('ctx-1', () => browser.actions([
            browser.action('key', { id: 'k' }).down('f').up('f')
        ]))

        expect(perform).toHaveBeenCalledWith(expect.objectContaining({ context: 'ctx-1' }))
        expect(release).toHaveBeenCalledWith({ context: 'ctx-1' })
        expect(classicPerform).not.toHaveBeenCalled()
    })

    it('keeps the classic path outside the scope', async () => {
        const perform = vi.spyOn(browser, 'inputPerformActions').mockResolvedValue({})
        perform.mockClear()
        const classicPerform = vi.spyOn(browser, 'performActions').mockResolvedValue(undefined as any)

        await browser.actions([browser.action('key', { id: 'k' }).down('f').up('f')])

        expect(classicPerform).toHaveBeenCalledTimes(1)
        expect(perform).not.toHaveBeenCalled()
    })
})
