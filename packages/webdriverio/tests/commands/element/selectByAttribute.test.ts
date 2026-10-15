import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

import { remote } from '../../../src/index.js'
import * as utils from '../../../src/utils/index.js'
import { bidiSelectByAttribute, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiSelectByAttribute: vi.fn() }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('selectByAttribute test', () => {
    const getElementFromResponseSpy = vi.spyOn(utils, 'getElementFromResponse')
    let browser: WebdriverIO.Browser
    let elem: any

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            waitforTimeout: 100,
            waitforInterval: 10,
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('some-elem-123')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
        getElementFromResponseSpy.mockClear()
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
    })

    it('waits for a late option on the BiDi path', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        vi.mocked(bidiSelectByAttribute).mockResolvedValueOnce({ selected: false, count: 0 }).mockResolvedValueOnce({ selected: true, count: 1 })
        await elem.selectByAttribute('value', 'late')
        expect(bidiSelectByAttribute).toHaveBeenCalledTimes(2)
        expect(bidiSelectByAttribute).toHaveBeenCalledWith(elem, 'value', 'late')
    })

    it('throws the classic message on the BiDi path when the option is missing', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        vi.mocked(bidiSelectByAttribute).mockResolvedValue({ selected: false, count: 0 })
        await expect(elem.selectByAttribute('value', 'nope')).rejects.toThrow('Option with attribute "value=nope" not found.')
    })

    describe.each(['option', 'optgroup', 'select'] as const)('disabled %s on the BiDi path', (source) => {
        it('throws at once instead of waiting for the timeout', async () => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            vi.mocked(bidiSelectByAttribute).mockResolvedValueOnce({ selected: false, count: 3, disabled: source })
            const start = Date.now()
            const err = await elem.selectByAttribute('value', 'a1').catch((e: Error) => e)
            expect(err.message).toContain('selectByAttribute cannot select option with attribute "value=a1"')
            expect(err.message).toContain('wdio:experimentalBiDiCommands')
            expect(err.message).toContain('enable the element in the page before selecting, or select a different option')
            expect(err.message).toContain({ option: 'option itself is disabled', optgroup: 'disabled <optgroup>', select: '<select> element is disabled' }[source])
            expect(err.message).not.toContain('waitUntil')
            expect(bidiSelectByAttribute).toHaveBeenCalledTimes(1)
            expect(Date.now() - start).toBeLessThan(90)
        })
    })

    it('should select value by attribute when value is string', async () => {
        await elem.selectByAttribute('value', ' someValue1 ')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value).toBe(
            './option[normalize-space(@value) = "someValue1"]|./optgroup/option[normalize-space(@value) = "someValue1"]'
        )
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by attribute when value is number', async () => {
        await elem.selectByAttribute('value', 123)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value)
            .toBe('./option[normalize-space(@value) = "123"]|./optgroup/option[normalize-space(@value) = "123"]')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[3][0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should throw if option is not found', async () => {
        const mockElem = {
            options: {},
            selector: 'foobar2',
            elementId: 'some-elem-123',
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            waitUntil: vi.fn().mockRejectedValue(new Error('Option with attribute "value=non-existing-value" not found.')),
            findElementFromElement: vi.fn().mockReturnValue(Promise.resolve({ error: 'no such element' }))
        }
        // @ts-ignore mock feature
        mockElem.selectByAttribute = elem.selectByAttribute.bind(mockElem)

        // @ts-expect-error
        const err = await mockElem.selectByAttribute('value', 'non-existing-value').catch((err: any) => err)
        expect(err.toString()).toBe('Error: Option with attribute "value=non-existing-value" not found.')
    })
})
