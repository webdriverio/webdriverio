import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { click } from '../../../src/commands/element/click.js'

vi.mock('fetch')
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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')

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
        vi.spyOn(browser, 'execute').mockResolvedValue('hit')
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

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })

    describe('bring the element under the pointer before a click with options', () => {
        const NEAREST = { block: 'nearest', inline: 'nearest' }
        const CENTER = { block: 'center', inline: 'center' }
        const setup = async () => {
            const browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
            const elem = await browser.$('#foo')
            const scrollIntoView = vi.spyOn(elem, 'scrollIntoView').mockResolvedValue(undefined)
            const execute = vi.spyOn(browser, 'execute')
            vi.mocked(fetch).mockClear()
            return { browser, elem, scrollIntoView, execute }
        }
        const scrollsOf = (execute: { mock: { calls: unknown[][] } }) => execute.mock.calls.map((call) => call[2])
        const actionCalls = () => vi.mocked(fetch).mock.calls
            .map((call, i) => ({ pathname: (call[0] as URL).pathname, method: call[1]?.method, order: vi.mocked(fetch).mock.invocationCallOrder[i] }))
            .filter(({ pathname }) => pathname === '/session/foobar-123/actions')

        it('should not scroll when the pointer already hits the element', async () => {
            const { elem, execute } = await setup()
            execute.mockResolvedValueOnce('hit')

            await elem.click({ button: 'left' })
            expect(scrollsOf(execute)).toEqual([null])
            expect(actionCalls().map(({ method }) => method)).toEqual(['POST', 'DELETE'])
        })

        it('should scroll the element just into view when the pointer misses it', async () => {
            const { elem, execute } = await setup()
            execute.mockResolvedValueOnce('missed').mockResolvedValueOnce('hit')

            await elem.click({ button: 'left' })
            expect(scrollsOf(execute)).toEqual([null, NEAREST])
            expect(execute.mock.invocationCallOrder[1]).toBeLessThan(actionCalls()[0].order)
        })

        it('should scroll the element to the center when it is still covered after the nearest scroll', async () => {
            const { elem, execute } = await setup()
            execute.mockResolvedValueOnce('missed').mockResolvedValueOnce('missed').mockResolvedValueOnce('missed')

            await elem.click({ button: 'left' })
            expect(scrollsOf(execute)).toEqual([null, NEAREST, CENTER])
            expect(execute.mock.invocationCallOrder[2]).toBeLessThan(actionCalls()[0].order)
            expect(actionCalls().filter(({ method }) => method === 'POST')).toHaveLength(1)
        })

        it('should not scroll an element without a box', async () => {
            const { elem, execute } = await setup()
            execute.mockResolvedValueOnce('no-box')

            await elem.click({ button: 'left' })
            expect(scrollsOf(execute)).toEqual([null])
            expect(actionCalls().filter(({ method }) => method === 'POST')).toHaveLength(1)
        })

        it('should keep held keys: the scroll sends no action before the click', async () => {
            const { elem, scrollIntoView, execute } = await setup()
            execute.mockResolvedValueOnce('missed').mockResolvedValueOnce('missed').mockResolvedValueOnce('hit')

            await elem.click({ button: 'left', skipRelease: true })
            expect(scrollIntoView).not.toHaveBeenCalled()
            expect(actionCalls().map(({ method }) => method)).toEqual(['POST'])
        })

        it('should still click when the element could not be checked or scrolled', async () => {
            const { elem, execute } = await setup()
            execute.mockRejectedValueOnce(new Error('stale element reference'))

            await elem.click({ button: 'left' })
            expect(actionCalls().filter(({ method }) => method === 'POST')).toHaveLength(1)

            execute.mockResolvedValueOnce('missed').mockRejectedValueOnce(new Error('stale element reference'))
            vi.mocked(fetch).mockClear()
            await elem.click({ button: 'left' })
            expect(actionCalls().filter(({ method }) => method === 'POST')).toHaveLength(1)
        })

        it('should not check or scroll for a click without options', async () => {
            const { elem, scrollIntoView, execute } = await setup()

            await elem.click()
            expect(execute).not.toHaveBeenCalled()
            expect(scrollIntoView).not.toHaveBeenCalled()
        })
    })

    const nativeScope = (context: Record<string, unknown>, perform = vi.fn()) => {
        const action = {
            move: vi.fn().mockReturnThis(),
            down: vi.fn().mockReturnThis(),
            pause: vi.fn().mockReturnThis(),
            up: vi.fn().mockReturnThis(),
            perform
        }
        return {
            elementId: 'native-elem',
            isMobile: true,
            ...context,
            execute: vi.fn(),
            scrollIntoView: vi.fn(),
            action: vi.fn(() => action),
            perform
        }
    }

    it.each([
        ['a native mobile context', { isNativeContext: true }],
        ['a Windows app', { isNativeContext: false, isWindowsApp: true }],
        ['a Mac app', { isNativeContext: false, isMacApp: true }]
    ])('should not check or scroll in %s', async (_, context) => {
        const scope = nativeScope(context)

        await click.call(scope as never, { button: 'left' })
        expect(scope.execute).not.toHaveBeenCalled()
        expect(scope.scrollIntoView).not.toHaveBeenCalled()
        expect(scope.perform).toHaveBeenCalled()
    })

    it('should check and scroll in a mobile browser', async () => {
        const scope = nativeScope({ isNativeContext: false })
        scope.execute.mockResolvedValueOnce('missed').mockResolvedValueOnce('hit')

        await click.call(scope as never, { button: 'left' })
        expect(scope.execute.mock.calls.map((call) => call[2])).toEqual([null, { block: 'nearest', inline: 'nearest' }])
        expect(scope.perform).toHaveBeenCalled()
    })

    it('should scroll to the center and click again when the pointer action fails', async () => {
        const perform = vi.fn()
            .mockRejectedValueOnce(new Error('move target out of bounds'))
            .mockResolvedValueOnce(undefined)
        const scope = nativeScope({ isMobile: false }, perform)
        scope.execute.mockResolvedValueOnce('hit')

        await click.call(scope as never, { button: 'left' })
        expect(scope.scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'center' })
        expect(perform).toHaveBeenCalledTimes(2)
    })
})
