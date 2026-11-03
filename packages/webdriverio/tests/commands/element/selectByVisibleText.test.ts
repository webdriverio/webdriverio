import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

import { remote } from '../../../src/index.js'
import * as utils from '../../../src/utils/index.js'
import { bidiSelectByVisibleText, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiSelectByVisibleText: vi.fn(async () => ({ selected: true, count: 1 })) }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('selectByVisibleText test', () => {
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

    it('should select value by visible text', async () => {
        await elem.selectByVisibleText(' someValue1 ')
        const optionSelection = './option[. = "someValue1"]|./option[normalize-space(text()) = "someValue1"]'
        const optgroupSelection = './optgroup/option[. = "someValue1"]|./optgroup/option[normalize-space(text()) = "someValue1"]'
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value).toBe(
            `${optionSelection}|${optgroupSelection}`
        )
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls.at(-1)![0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by visible text with spaces', async () => {
        await elem.selectByVisibleText('some Value1')
        const optionSelection = './option[. = "some Value1"]|./option[normalize-space(text()) = "some Value1"]'
        const optgroupSelection = './optgroup/option[. = "some Value1"]|./optgroup/option[normalize-space(text()) = "some Value1"]'
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls.at(-1)![0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('waits for a late option on the BiDi path', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        vi.mocked(bidiSelectByVisibleText).mockResolvedValueOnce({ selected: false, count: 0 }).mockResolvedValueOnce({ selected: true, count: 1 })
        await elem.selectByVisibleText('late')
        expect(bidiSelectByVisibleText).toHaveBeenCalledTimes(2)
    })

    it('throws the classic message on the BiDi path when the option is missing', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        vi.mocked(bidiSelectByVisibleText).mockResolvedValue({ selected: false, count: 0 })
        await expect(elem.selectByVisibleText('nope')).rejects.toThrow('Option with text "nope" not found.')
        vi.mocked(bidiSelectByVisibleText).mockResolvedValue({ selected: true, count: 1 })
    })

    describe.each(['option', 'optgroup', 'select'] as const)('disabled %s on the BiDi path', (source) => {
        it('throws at once instead of waiting for the timeout', async () => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            vi.mocked(bidiSelectByVisibleText).mockResolvedValueOnce({ selected: false, count: 3, disabled: source })
            const start = Date.now()
            const err = await elem.selectByVisibleText('uno').catch((e: Error) => e)
            expect(err.message).toContain('selectByVisibleText cannot select option with text "uno"')
            expect(err.message).toContain('wdio:experimentalBiDiCommands')
            expect(err.message).toContain('enable the element in the page before selecting, or select a different option')
            expect(err.message).toContain({ option: 'option itself is disabled', optgroup: 'disabled <optgroup>', select: '<select> element is disabled' }[source])
            expect(err.message).not.toContain('waitUntil')
            expect(bidiSelectByVisibleText).toHaveBeenCalledTimes(1)
            expect(Date.now() - start).toBeLessThan(90)
        })
    })

    it('collapses every whitespace run on the BiDi path', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        await elem.selectByVisibleText(' foo  bar \t baz ')
        expect(bidiSelectByVisibleText).toHaveBeenCalledWith(elem, 'foo bar baz')
    })

    it('should select value by visible text with leading and trailing white-space', async () => {
        await elem.selectByVisibleText(' someValue1 ')
        const optionSelection = './option[. = "someValue1"]|./option[normalize-space(text()) = "someValue1"]'
        const optgroupSelection = './optgroup/option[. = "someValue1"]|./optgroup/option[normalize-space(text()) = "someValue1"]'
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls.at(-1)![0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by visible text with sequences of whitespace characters', async () => {
        await elem.selectByVisibleText('some    Value1')
        const optionSelection = './option[. = "some Value1"]|./option[normalize-space(text()) = "some Value1"]'
        const optgroupSelection = './optgroup/option[. = "some Value1"]|./optgroup/option[normalize-space(text()) = "some Value1"]'
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls.at(-1)![0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by visible text with quotes', async () => {
        await elem.selectByVisibleText('"someValue1""')
        const optionSelection = './option[. = \'"someValue1""\']|./option[normalize-space(text()) = \'"someValue1""\']'
        const optgroupSelection = './optgroup/option[. = \'"someValue1""\']|./optgroup/option[normalize-space(text()) = \'"someValue1""\']'
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls.at(-1)![0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should convert number to string when selecting', async () => {
        await elem.selectByVisibleText(123)
        const optionSelection = './option[. = "123"]|./option[normalize-space(text()) = "123"]'
        const optgroupSelection = './optgroup/option[. = "123"]|./optgroup/option[normalize-space(text()) = "123"]'
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(JSON.parse(vi.mocked(fetch).mock.calls[2][1]!.body as any).value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls.at(-1)![0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should throw if option is not found', async () => {
        const mockElem = {
            $: vi.fn().mockReturnValue(Promise.resolve({
                isExisting: vi.fn().mockResolvedValue(false),
                waitForExist: vi.fn().mockReturnValue(Promise.reject(new Error('Option with text "non-existing-option" not found.')))
            })),
            execute: vi.fn().mockResolvedValue(null),
            elementClick: vi.fn().mockReturnValue(Promise.resolve()),
            options: {},
            selector: 'foobar2',
            elementId: 'some-elem-123',
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            findElementFromElement: vi.fn().mockReturnValue(Promise.resolve({ error: 'no such element' }))
        }
        // @ts-ignore mock feature
        mockElem.selectByVisibleText = elem.selectByVisibleText.bind(mockElem)

        // @ts-expect-error
        const err = await mockElem.selectByVisibleText('non-existing-option').catch((err: any) => err)
        expect(err.toString()).toBe('Error: Option with text "non-existing-option" not found.')
    })

    it('finds the option through the select when its XPath finds nothing, e.g. in a shadow root', async () => {
        const waitForExist = vi.fn()
        const mockElem = {
            $: vi.fn().mockResolvedValue({ isExisting: vi.fn().mockResolvedValue(false), waitForExist }),
            execute: vi.fn().mockResolvedValue({ elementId: 'shadow-option-1' }),
            elementClick: vi.fn().mockResolvedValue(undefined),
            options: {},
            selector: 'foobar2',
            elementId: 'some-elem-123'
        }
        // @ts-ignore mock feature
        mockElem.selectByVisibleText = elem.selectByVisibleText.bind(mockElem)

        // @ts-expect-error
        await mockElem.selectByVisibleText(' Used ')
        expect(mockElem.execute).toHaveBeenCalledWith(expect.any(Function), mockElem, 'Used')
        expect(mockElem.elementClick).toHaveBeenCalledWith('shadow-option-1')
        expect(waitForExist).not.toHaveBeenCalled()
    })

    it('takes the option as a raw WebDriver element reference too', async () => {
        const mockElem = {
            $: vi.fn().mockResolvedValue({ isExisting: vi.fn().mockResolvedValue(false), waitForExist: vi.fn() }),
            execute: vi.fn().mockResolvedValue({ [ELEMENT_KEY]: 'shadow-option-2' }),
            elementClick: vi.fn().mockResolvedValue(undefined),
            options: {},
            selector: 'foobar2',
            elementId: 'some-elem-123'
        }
        // @ts-ignore mock feature
        mockElem.selectByVisibleText = elem.selectByVisibleText.bind(mockElem)

        // @ts-expect-error
        await mockElem.selectByVisibleText('Used')
        expect(mockElem.elementClick).toHaveBeenCalledWith('shadow-option-2')
    })
})
