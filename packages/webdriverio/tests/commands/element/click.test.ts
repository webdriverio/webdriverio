import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { getBrowserObject } from '@wdio/utils'

import { remote } from '../../../src/index.js'
import { bidiAssertClickable, bidiGetRect, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('@wdio/utils', async (importOriginal) => {
    const actual = await importOriginal<{ getBrowserObject: (element: WebdriverIO.Element) => WebdriverIO.Browser }>()
    return { ...actual, getBrowserObject: vi.fn(actual.getBrowserObject) }
})
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiAssertClickable: vi.fn(async () => undefined), bidiGetRect: vi.fn(async () => ({ x: 0, y: 0, width: 100, height: 100 })) }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('click test', () => {
    it('should allow to left click on an element without passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        await elem.click()
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/click')
    })

    it('should allow to left click on an element by passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        await elem.click({ button: 'left' })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0]).toMatchSnapshot()

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 0 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as any).actions[0]).toMatchSnapshot()
    })

    it('should allow to right click on an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        await elem.click({ button: 'right' })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(
            JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0]
        ).toMatchSnapshot()

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 2 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(
            JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as any).actions[0]
        ).toMatchSnapshot()
    })

    it('should allow to middle click on an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        await elem.click({ button: 'middle' })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
            .toMatchSnapshot()

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 1 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as any).actions[0])
            .toMatchSnapshot()
    })

    it('should allow to left click on an element with an offset without passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        await elem.click({ y: 15 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions).toMatchSnapshot()
    })

    it('should allow to right click on an element with an offset and passing a button type', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        await elem.click({ button: 2, x: 20, y: 15 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[0].type)
            .toBe('pointerMove')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[0].x)
            .toBe(20)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[0].y)
            .toBe(15)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[2])
            .toStrictEqual({ type: 'pause', duration: 0 })
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[1])
            .toMatchSnapshot()
        expect(JSON.parse(vi.mocked(fetch).mock.calls[3][1]?.body as any).actions[0].actions[3])
            .toStrictEqual({ type: 'pointerUp', button: 2 })
    })

    it('should to send a duration to execute a longPress on a mobile device', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
            } as any
        })
        const elem = await browser.$('#foo')
        await elem.click({ duration: 1000 })
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0])
            .toMatchSnapshot()
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]?.body as any).actions[0].actions[2])
            .toStrictEqual({ type: 'pause', duration: 1000 })
    })

    it('should throw an error if the passed argument is not an options object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        await expect(elem.click([])).rejects.toThrow('Options must be an object')
    })

    it('should throw an error if no valid coordinates are passed', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        await expect(elem.click({ x: 'not-supported' })).rejects.toThrow('Coordinates must be integers')
    })

    it('should throw an error if no valid button type is passed', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')

        // @ts-expect-error invalid param
        await expect(elem.click({ button: 'not-supported' })).rejects.toThrow('Button type not supported.')
    })

    it('should not call releaseAction when skipRelease is true', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
            }
        })
        const elem = await browser.$('#foo')
        await elem.click({ button: 'right' })

        expect(vi.mocked(fetch).mock.calls.length)
            .toBe(4)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/actions')
        expect(vi.mocked(fetch).mock.calls[3][1]?.method)
            .toBe('DELETE')

        vi.mocked(fetch).mockClear()
        await elem.click({ button: 'right', skipRelease: true })
        expect(vi.mocked(fetch).mock.calls.length).toBe(1) // only action call
    })

    it('resolves the browser once on the BiDi path', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        const elem = await browser.$('#foo')

        const chain = { move: vi.fn(), down: vi.fn(), pause: vi.fn(), up: vi.fn(), perform: vi.fn().mockResolvedValue(undefined) }
        chain.move.mockReturnValue(chain)
        chain.down.mockReturnValue(chain)
        chain.pause.mockReturnValue(chain)
        chain.up.mockReturnValue(chain)
        vi.mocked(getBrowserObject).mockImplementation(() => (
            { isMobile: false, action: vi.fn().mockReturnValue(chain) } as any
        ))

        vi.mocked(isBidiCommandsEnabled).mockClear()
        await elem.click()
        const checkedBrowser = vi.mocked(isBidiCommandsEnabled).mock.calls[0][0] as any
        expect(checkedBrowser.action).toHaveBeenCalledOnce()
        expect(chain.perform).toHaveBeenCalledOnce()
    })

    describe('bidi commands enabled', () => {
        async function setup() {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            const elem = await browser.$('#foo')
            const chain = { move: vi.fn(), down: vi.fn(), pause: vi.fn(), up: vi.fn(), perform: vi.fn().mockResolvedValue(undefined) }
            for (const k of ['move', 'down', 'pause', 'up'] as const) { chain[k].mockReturnValue(chain) }
            const getElementRect = vi.fn().mockResolvedValue({ width: 100, height: 100 })
            vi.mocked(getBrowserObject).mockImplementation(() => (
                { isMobile: false, action: vi.fn().mockReturnValue(chain), getElementRect } as any
            ))
            return { elem, chain, getElementRect }
        }

        it('moves with duration 0 on the default click', async () => {
            const { elem, chain } = await setup()
            await elem.click()
            expect(chain.move).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0, duration: 0 }))
        })

        it('reads the rect for offsets through BiDi, not the classic endpoint', async () => {
            const { elem, getElementRect } = await setup()
            vi.mocked(bidiGetRect).mockClear()
            await elem.click({ x: 5 })
            expect(bidiGetRect).toHaveBeenCalledWith(elem)
            expect(getElementRect).not.toHaveBeenCalled()
        })

        it('keeps the default move duration for click({ x })', async () => {
            const { elem, chain } = await setup()
            await elem.click({ x: 5 })
            expect(chain.move.mock.calls[0][0]).not.toHaveProperty('duration')
        })

        it('keeps the default move duration for click({ button })', async () => {
            const { elem, chain } = await setup()
            await elem.click({ button: 'right' })
            expect(chain.move.mock.calls[0][0]).not.toHaveProperty('duration')
        })

        it('runs the intercept check once, before the actions, only on the default click', async () => {
            const { elem, chain } = await setup()
            const order: string[] = []
            vi.mocked(bidiAssertClickable).mockImplementationOnce(async () => { order.push('check') })
            chain.perform.mockImplementation(async () => { order.push('perform') })
            await elem.click()
            expect(bidiAssertClickable).toHaveBeenCalledOnce()
            expect(order).toEqual(['check', 'perform'])
            vi.mocked(bidiAssertClickable).mockClear()
            await elem.click({ x: 5 })
            expect(bidiAssertClickable).not.toHaveBeenCalled()
        })

        it('throws element click intercepted without performing actions or retrying', async () => {
            const { elem, chain } = await setup()
            const error = Object.assign(new Error('element click intercepted: Element <a> is not clickable at point (1, 2). Other element would receive the click: <div>'), { name: 'element click intercepted' })
            vi.mocked(bidiAssertClickable).mockRejectedValueOnce(error)
            await expect(elem.click()).rejects.toThrow('element click intercepted')
            expect(bidiAssertClickable).toHaveBeenCalledOnce()
            expect(chain.perform).not.toHaveBeenCalled()
        })

        it('does not perform actions when the target is not interactable', async () => {
            const { elem, chain } = await setup()
            const error = Object.assign(new Error('element not interactable: element has zero size'), { name: 'element not interactable' })
            vi.mocked(bidiAssertClickable).mockRejectedValueOnce(error)
            await expect(elem.click()).rejects.toThrow()
            expect(chain.perform).not.toHaveBeenCalled()
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
        vi.mocked(isBidiCommandsEnabled).mockReset().mockReturnValue(false)
        vi.mocked(getBrowserObject).mockReset()
        vi.mocked(bidiAssertClickable).mockClear()
    })
})
