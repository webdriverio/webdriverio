import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('element', () => {
    it('retains a missing parent instead of querying a child in the browser', async () => {
        const browser = await remote({
            capabilities: { browserName: 'foobar' },
            waitforTimeout: 20,
            waitforInterval: 5
        })
        const parent = await browser.$('#nonexisting')
        const wait = vi.spyOn(parent, 'waitForExist')
        const child = await parent.$('#subfoo')

        expect(child.elementId).toBeUndefined()
        expect(child.parent).toBe(parent)
        expect(child.selector).toBe('#subfoo')
        expect(child.strict).toBe(false)
        expect(wait).not.toHaveBeenCalled()
    })

    it('does not send a missing parent as an undefined browser-runner scope', async () => {
        const browser = await remote({
            capabilities: { browserName: 'foobar' },
            waitforTimeout: 20,
            waitforInterval: 5
        })
        const parent = await browser.$('#nonexisting')
        const execute = vi.fn().mockResolvedValue({})
        const executeWithScope = vi.fn()
        const original = globalThis.wdio
        globalThis.wdio = { execute, executeWithScope } as unknown as typeof globalThis.wdio
        try {
            const child = await parent.$('#subfoo')
            expect(child.elementId).toBeUndefined()
            expect(child.parent).toBe(parent)
            expect(execute).toHaveBeenCalledTimes(1)
            expect(execute).toHaveBeenCalledWith('$', '#nonexisting', { strict: false })
            expect(executeWithScope).not.toHaveBeenCalled()
        } finally {
            globalThis.wdio = original
        }
    })

    it('finds a missing parent again before querying the child in its scope', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const parent = await browser.$('#nonexisting', { strict: false })
        expect((await parent.$('#subfoo')).elementId).toBeUndefined()

        const findParent = vi.spyOn(browser, 'findElement')
            .mockResolvedValue({ [ELEMENT_KEY]: 'some-elem-123' })
        const child = await parent.$('#subfoo')

        expect(findParent).toHaveBeenCalledWith('css selector', '#nonexisting')
        expect(parent.elementId).toBe('some-elem-123')
        expect(parent[ELEMENT_KEY]).toBe('some-elem-123')
        expect(parent.strict).toBe(false)
        expect(parent.error).toBeUndefined()
        expect(child.elementId).toBe('some-sub-elem-321')
        expect(child.parent).toBe(parent)
    })

    it('should fetch an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        expect(vi.mocked(fetch).mock.calls[1][1]!.method).toBe('POST')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(fetch).mock.calls[1][1]!.body)
            .toEqual(JSON.stringify({ using: 'css selector', value: '#foo' }))
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem[ELEMENT_KEY]).toBe('some-elem-123')
        expect(elem.ELEMENT).toBe(undefined)
        expect(vi.mocked(fetch).mock.calls[2][1]!.method).toBe('POST')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(vi.mocked(fetch).mock.calls[2][1]!.body)
            .toEqual(JSON.stringify({ using: 'css selector', value: '#subfoo' }))
        expect(subElem.elementId).toBe('some-sub-elem-321')
        expect(subElem[ELEMENT_KEY]).toBe('some-sub-elem-321')
        expect(subElem.ELEMENT).toBe(undefined)
    })

    it('should allow to transform protocol reference into a WebdriverIO element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$({ [ELEMENT_KEY]: 'foobar' })
        expect(subElem.elementId).toBe('foobar')
    })

    it('keeps prototype from browser object', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                // @ts-ignore mock feature
                mobileMode: true,
                'appium-version': '1.9.2'
            } as any
        })

        const elem = await browser.$('#foo')
        const subElem = await elem.$('#subfoo')
        expect(subElem.isMobile).toBe(true)
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
