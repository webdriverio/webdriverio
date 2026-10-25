import path from 'node:path'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

import { remote } from '../../../src/index.js'
import { setValue } from '../../../src/commands/element/setValue.js'
import { Key } from '../../../src/constants.js'
import { bidiGetProperty, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiGetProperty: vi.fn() }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('setValue', () => {
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
        vi.restoreAllMocks()
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
        vi.mocked(bidiGetProperty).mockReset()
    })

    const paths = () => vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname)

    it('should set the value clearing the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        const calls = paths()
        const clear = calls.indexOf('/session/foobar-123/element/some-elem-123/clear')
        expect(clear).toBeGreaterThan(-1)
        const typed = calls.indexOf('/session/foobar-123/element/some-elem-123/value', clear)
        expect(typed).toBeGreaterThan(clear)
        expect(JSON.parse(vi.mocked(fetch).mock.calls[typed][1]!.body as any).text).toEqual('foobar')
    })

    it('should select and delete a value the page put back after clearing', async () => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockImplementation(async (_id: string, name: string) => name === 'type' ? 'text' : 'Phoenix, AZ')
        const execute = vi.spyOn(browser, 'execute').mockResolvedValue(undefined as never)
        const keys = vi.spyOn(browser, 'keys').mockResolvedValue(undefined as never)

        await elem.setValue('90210')
        expect(execute).toHaveBeenCalledWith(expect.any(Function), elem)
        expect(keys).toHaveBeenNthCalledWith(1, [Key.Ctrl, 'a'])
        expect(keys).toHaveBeenNthCalledWith(2, Key.Backspace)
        expect(JSON.parse(vi.mocked(fetch).mock.calls.at(-1)![1]!.body as any).text).toEqual('90210')
    })

    it.each(['range', 'date', 'datetime-local', 'month', 'week', 'time', 'color'])('should set the value of a %s input directly', async (type) => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue(type)
        const execute = vi.spyOn(browser, 'execute').mockResolvedValue('set' as never)

        await elem.setValue('2026-10-04')
        expect(execute).toHaveBeenCalledWith(expect.any(Function), elem, '2026-10-04')
        expect(paths()).not.toContain('/session/foobar-123/element/some-elem-123/clear')
        expect(paths()).not.toContain('/session/foobar-123/element/some-elem-123/value')
    })

    it.each(['date', 'datetime-local', 'month', 'week', 'time'])('should throw when the browser rejects the value of a %s input', async (type) => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue(type)
        vi.spyOn(browser, 'execute').mockResolvedValue('rejected' as never)

        await expect(elem.setValue('garbage')).rejects.toThrow('The browser rejected the value "garbage"')
        expect(paths()).not.toContain('/session/foobar-123/element/some-elem-123/clear')
        expect(paths()).not.toContain('/session/foobar-123/element/some-elem-123/value')
    })

    describe('in-page setter', () => {
        /**
         * runs the function `setValue` sends to the browser against a fake input
         * that, like a date input, resets to '' for a value it can't parse
         */
        const run = async (input: { disabled?: boolean, accepts?: (v: string) => boolean }, value: string) => {
            const events: string[] = []
            class FakeInput {
                _value = 'previous'
                disabled = input.disabled ?? false
                readOnly = false
                get value () { return this._value }
                set value (v: string) { this._value = v === 'previous' || (input.accepts ?? (() => true))(v) ? v : '' }
                dispatchEvent (e: { type: string }) { events.push(e.type) }
            }
            vi.stubGlobal('HTMLInputElement', FakeInput)
            vi.stubGlobal('Event', class { constructor (public type: string) {} })
            const fake = new FakeInput()
            const elem = await browser.$('#foo')
            vi.spyOn(elem, 'getElementProperty').mockResolvedValue('date')
            let result: string | undefined
            vi.spyOn(browser, 'execute').mockImplementation(async (fn: any, _el: unknown, v: string) => (result = fn(fake, v)))
            await elem.setValue(value).catch(() => undefined)
            delete (globalThis as any).HTMLInputElement
            delete (globalThis as any).Event
            return { result, state: { value: fake.value, events } }
        }

        it('should restore the previous value and skip the events when the value is rejected', async () => {
            const { result, state } = await run({ accepts: (v) => v === '2026-10-04' }, 'garbage')
            expect(result).toBe('rejected')
            expect(state.value).toBe('previous')
            expect(state.events).toEqual([])
        })

        it('should fire input and change events when the value is accepted', async () => {
            const { result, state } = await run({ accepts: (v) => v === '2026-10-04' }, '2026-10-04')
            expect(result).toBe('set')
            expect(state.value).toBe('2026-10-04')
            expect(state.events).toEqual(['input', 'change'])
        })

        it('should accept an empty value to clear the input', async () => {
            const { result, state } = await run({ accepts: () => false }, '')
            expect(result).toBe('set')
            expect(state.value).toBe('')
        })

        it('should skip a disabled input', async () => {
            const { result } = await run({ disabled: true }, '2026-10-04')
            expect(result).toBe('skipped')
        })
    })

    it('should pass numbers as strings', async () => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue('range')
        const execute = vi.spyOn(browser, 'execute').mockResolvedValue('set' as never)

        await elem.setValue(67)
        expect(execute).toHaveBeenCalledWith(expect.any(Function), elem, '67')
    })

    it('should type into a disabled or read-only input, which reports the reason', async () => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue('date')
        vi.spyOn(browser, 'execute').mockResolvedValue('skipped' as never)

        await elem.setValue('2026-10-04')
        expect(paths()).toContain('/session/foobar-123/element/some-elem-123/clear')
        expect(paths()).toContain('/session/foobar-123/element/some-elem-123/value')
    })

    it('should type into a text input', async () => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockImplementation(async (_id: string, name: string) => name === 'type' ? 'text' : '')
        const execute = vi.spyOn(browser, 'execute')

        await elem.setValue('foobar')
        expect(execute).not.toHaveBeenCalled()
        expect(paths()).toContain('/session/foobar-123/element/some-elem-123/value')
    })

    it('should type into native app elements without reading their type', async () => {
        const scope = {
            elementId: 'native-elem',
            isMobile: true,
            isNativeContext: true,
            getElementProperty: vi.fn(),
            clearValue: vi.fn(),
            addValue: vi.fn()
        }
        await setValue.call(scope as never, 'foobar')
        expect(scope.getElementProperty).not.toHaveBeenCalled()
        expect(scope.clearValue).toHaveBeenCalled()
        expect(scope.addValue).toHaveBeenCalledWith('foobar', undefined)
    })

    describe('with BiDi commands enabled', () => {
        beforeEach(() => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        })

        it('should set a date input directly without classic property reads', async () => {
            const elem = await browser.$('#foo')
            const classic = vi.spyOn(elem, 'getElementProperty')
            vi.mocked(bidiGetProperty).mockResolvedValue('date')
            const execute = vi.spyOn(browser, 'execute').mockResolvedValue('set' as never)

            await elem.setValue('2026-10-04')
            expect(bidiGetProperty).toHaveBeenCalledWith(elem, 'type')
            expect(classic).not.toHaveBeenCalled()
            expect(execute).toHaveBeenCalledWith(expect.any(Function), elem, '2026-10-04')
            expect(paths()).not.toContain('/session/foobar-123/element/some-elem-123/value')
        })

        it('should clear a stubborn value read through BiDi', async () => {
            const elem = await browser.$('#foo')
            const classic = vi.spyOn(elem, 'getElementProperty')
            vi.mocked(bidiGetProperty).mockImplementation(async (_el, name) => name === 'type' ? 'text' : 'Phoenix, AZ')
            vi.spyOn(browser, 'execute').mockResolvedValue(undefined as never)
            const keys = vi.spyOn(browser, 'keys').mockResolvedValue(undefined as never)

            await elem.setValue('90210')
            expect(bidiGetProperty).toHaveBeenCalledWith(elem, 'value')
            expect(classic).not.toHaveBeenCalled()
            expect(keys).toHaveBeenNthCalledWith(1, [Key.Ctrl, 'a'])
            expect(keys).toHaveBeenNthCalledWith(2, Key.Backspace)
        })

        it('should fall back to typing when the BiDi read fails', async () => {
            const elem = await browser.$('#foo')
            vi.mocked(bidiGetProperty).mockRejectedValue(new Error('no such node'))
            vi.spyOn(browser, 'execute').mockResolvedValue(undefined as never)
            const keys = vi.spyOn(browser, 'keys')

            await elem.setValue('foobar')
            expect(keys).not.toHaveBeenCalled()
            expect(bidiGetProperty).toHaveBeenCalledTimes(2)
        })
    })
})
