import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('waitForClickable', () => {
    const duration = 1000
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should call waitUntil', async () => {
        const cb = vi.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : vi.fn(((cb))),
            options : { waitforInterval: 5, waitforTimeout: duration }
        } as any as WebdriverIO.Element

        await elem.waitForClickable()

        expect(cb).toBeCalled()
        expect(vi.mocked(elem.waitUntil).mock.calls).toMatchSnapshot()
    })

    it('should call isClickable and return true immediately if true', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isClickable : vi.fn(() => true),
            options : { waitforTimeout : 500, waitforInterval: 50 },
        } as any as WebdriverIO.Element
        const result = await elem.waitForClickable({ timeout: duration })

        expect(result).toBe(true)
    })

    it('should call isClickable and return true if eventually true', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isClickable : vi.fn()
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => true),
            options : { waitforTimeout : 50, waitforInterval: 5 },
        } as any as WebdriverIO.Element

        const result = await elem.waitForClickable({ timeout: duration })
        expect(result).toBe(true)
    })

    it('should call isClickable and return false', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isClickable : vi.fn(() => false),
            options : { waitforTimeout : 500, waitforInterval: 50 },
        } as any as WebdriverIO.Element

        try {
            await elem.waitForClickable({ timeout: duration })
        } catch (err: any) {
            expect(err.message).toBe(`element ("#foo") still not clickable after ${duration}ms`)
        }
    })

    it('should not call isClickable and return false if never found', async () => {
        const tmpElem = await browser.$('#foo')
        const elem: any = {
            selector : '#foo',
            parent: { $: vi.fn(() => { return elem}) },
            waitForClickable : tmpElem.waitForClickable,
            waitUntil : tmpElem.waitUntil,
            isDisplayed : tmpElem.isDisplayed,
            isClickable : tmpElem.isClickable,
            options : { waitforTimeout : 500, waitforInterval: 50 },
        }

        try {
            await elem.waitForClickable({ timeout: duration })
        } catch (err: any) {
            expect(err.message).toBe(`element ("#foo") still not clickable after ${duration}ms`)
        }
    })

    it('should do reverse', async () => {
        const cb = vi.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : vi.fn(((cb))),
            isClickable : vi.fn(() => true),
            options : { waitforTimeout : 500, waitforInterval: 50 },
        } as any as WebdriverIO.Element

        await elem.waitForClickable({ reverse: true })

        expect(vi.mocked(elem.waitUntil).mock.calls).toMatchSnapshot()
    })

    it('should call isClickable and return false with custom error', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isClickable : vi.fn(() => false),
            options : { waitforTimeout : 500, waitforInterval: 50 },
        } as any as WebdriverIO.Element

        try {
            await elem.waitForClickable({ timeout: duration, timeoutMsg: 'Element foo never clickable' })
        } catch (err: any) {
            expect(err.message).toBe('Element foo never clickable')
        }
    })
})
