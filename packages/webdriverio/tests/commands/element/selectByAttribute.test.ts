import path from 'node:path'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'
import { ELEMENT_KEY } from '../../../src/constants.js'
import * as utils from '../../../src/utils/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('selectByAttribute test', () => {
    const getElementFromResponseSpy = vi.spyOn(utils, 'getElementFromResponse')
    let browser: WebdriverIO.Browser
    let elem: any

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('some-elem-123')
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
        getElementFromResponseSpy.mockClear()
    })

    it('should select value by attribute when value is string', async () => {
        await elem.selectByAttribute('value', ' someValue1 ')

        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(vi.mocked(got).mock.calls[2][1]!.json.value)
            .toBe('./option[normalize-space(@value) = "someValue1"]|./optgroup/option[normalize-space(@value) = "someValue1"]')
        expect(vi.mocked(got).mock.calls[3][0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by attribute when value is number', async () => {
        await elem.selectByAttribute('value', 123)

        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(vi.mocked(got).mock.calls[2][1]!.json.value)
            .toBe('./option[normalize-space(@value) = "123"]|./optgroup/option[normalize-space(@value) = "123"]')
        expect(vi.mocked(got).mock.calls[3][0]!.pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should throw if option is not found', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()

        const mockElem = {
            options: {},
            selector: 'foobar2',
            elementId: 'some-elem-123',
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            findElementFromElement: vi.fn().mockReturnValue(Promise.resolve({ error: 'no such element' }))
        }
        // @ts-ignore mock feature
        mockElem.selectByAttribute = elem.selectByAttribute.bind(mockElem)

        try {
            // @ts-ignore mock feature
            await mockElem.selectByAttribute('value', 'non-existing-value')
        } catch (err: any) {
            expect(err.toString()).toBe('Error: Option with attribute "value=non-existing-value" not found.')
        }
    })
})
