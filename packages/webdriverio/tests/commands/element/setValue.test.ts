import path from 'node:path'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

import { remote } from '../../../src/index.js'
import { setValue } from '../../../src/commands/element/setValue.js'

vi.mock('fetch')
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
    })

    const paths = () => vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname)

    it('should set the value clearing the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        const calls = paths()
        const clear = calls.indexOf('/session/foobar-123/element/some-elem-123/clear')
        expect(clear).toBeGreaterThan(-1)
        expect(calls[clear + 1]).toBe('/session/foobar-123/element/some-elem-123/value')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[clear + 1][1]!.body as any).text).toEqual('foobar')
    })

    it.each(['range', 'date', 'datetime-local', 'month', 'week', 'time', 'color'])('should set the value of a %s input directly', async (type) => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue(type)
        const execute = vi.spyOn(browser, 'execute').mockResolvedValue(true as never)

        await elem.setValue('2026-10-04')
        expect(execute).toHaveBeenCalledWith(expect.any(Function), elem, '2026-10-04')
        expect(paths()).not.toContain('/session/foobar-123/element/some-elem-123/clear')
        expect(paths()).not.toContain('/session/foobar-123/element/some-elem-123/value')
    })

    it('should pass numbers as strings', async () => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue('range')
        const execute = vi.spyOn(browser, 'execute').mockResolvedValue(true as never)

        await elem.setValue(67)
        expect(execute).toHaveBeenCalledWith(expect.any(Function), elem, '67')
    })

    it('should type into a disabled or read-only input, which reports the reason', async () => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue('date')
        vi.spyOn(browser, 'execute').mockResolvedValue(false as never)

        await elem.setValue('2026-10-04')
        expect(paths()).toContain('/session/foobar-123/element/some-elem-123/clear')
        expect(paths()).toContain('/session/foobar-123/element/some-elem-123/value')
    })

    it('should type into a text input', async () => {
        const elem = await browser.$('#foo')
        vi.spyOn(elem, 'getElementProperty').mockResolvedValue('text')
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
})
