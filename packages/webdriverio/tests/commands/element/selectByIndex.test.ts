import path from 'node:path'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

import { remote } from '../../../src/index.js'
import * as utils from '../../../src/utils/index.js'
import { bidiSelectByIndex, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiSelectByIndex: vi.fn() }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('selectByIndex test', () => {
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
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
    })

    it('waits for a late option on the BiDi path', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        vi.mocked(bidiSelectByIndex)
            .mockResolvedValueOnce({ selected: false, count: 1 })
            .mockResolvedValueOnce({ selected: true, count: 3 })
        await elem.selectByIndex(2)
        expect(bidiSelectByIndex).toHaveBeenCalledTimes(2)
    })

    it('throws the classic message with the option count on the BiDi path', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        vi.mocked(bidiSelectByIndex).mockResolvedValue({ selected: false, count: 2 })
        await expect(elem.selectByIndex(5))
            .rejects.toThrow('Option with index "5" not found. Select element only contains 2 option elements')
    })

    it('throws the empty-select message on the BiDi path', async () => {
        vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
        vi.mocked(bidiSelectByIndex).mockResolvedValue({ selected: false, count: 0 })
        await expect(elem.selectByIndex(0))
            .rejects.toThrow('Select element doesn\'t contain any option element')
    })

    describe.each(['option', 'optgroup', 'select'] as const)('disabled %s on the BiDi path', (source) => {
        it('throws at once instead of waiting for the timeout', async () => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            vi.mocked(bidiSelectByIndex).mockResolvedValueOnce({ selected: false, count: 3, disabled: source })
            const start = Date.now()
            const err = await elem.selectByIndex(1).catch((e: Error) => e)
            expect(err.message).toContain('selectByIndex cannot select option with index "1"')
            expect(err.message).toContain('wdio:experimentalBiDiCommands')
            expect(err.message).toContain('enable the element in the page before selecting, or select a different option')
            expect(err.message).toContain({ option: 'option itself is disabled', optgroup: 'disabled <optgroup>', select: '<select> element is disabled' }[source])
            expect(err.message).not.toContain('waitUntil')
            expect(bidiSelectByIndex).toHaveBeenCalledTimes(1)
            expect(Date.now() - start).toBeLessThan(90)
        })
    })

    it('should select by index', async () => {
        await elem.selectByIndex(1)
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/elements')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[4][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-456/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-elem-456',
            index: 1
        })
    })

    it('should throw an error when index < 0', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        try {
            await elem.selectByIndex(-2)
        } catch (err: any) {
            expect(err.toString()).toBe('Error: Index needs to be 0 or any other positive number')
        }
    })

    it('should throw if there are no options elements', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        const mockElem = {
            options: {},
            selector: 'foobar2',
            elementId: 'some-elem-123',
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            waitUntil: vi.fn().mockRejectedValue(new Error('Select element doesn\'t contain any option element')),
            findElementsFromElement: vi.fn().mockReturnValue(Promise.resolve([]))
        }
        // @ts-ignore mock feature
        mockElem.selectByIndex = elem.selectByIndex.bind(mockElem)

        try {
            await elem.selectByIndex.call(mockElem, 0)
        } catch (err: any) {
            expect(err.toString()).toBe('Error: Select element doesn\'t contain any option element')
        }
    })

    it('should throw if index is out of range', async () => {
        const mockElem = {
            options: {},
            selector: 'foobar',
            findElementsFromElement: vi.fn().mockReturnValue(Promise.resolve([{ elem: 1 }]))
        }
        // @ts-ignore mock feature
        mockElem.selectByIndex = elem.selectByIndex.bind(mockElem)

        // @ts-expect-error
        const err = await mockElem.selectByIndex(2).catch((err: any) => err)
        expect(err.toString()).toBe('Error: Can\'t call selectByIndex on element with selector "foobar" because element wasn\'t found')
    })

    it('should throw if index is out of range', { timeout: 10000 }, async function () {
        const err = await elem.selectByIndex(3).catch((err: any) => err)
        expect(err.toString()).toBe('Error: Option with index "3" not found. Select element only contains 3 option elements')
    })
})
