import path from 'node:path'
import { expect, describe, it, vi, beforeEach } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('waitForExists', () => {
    const timeout = 1000
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should use default waitFor options', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForExist: tmpElem.waitForExist,
            waitUntil: vi.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout }
        } as unknown as WebdriverIO.Element

        await elem.waitForExist()
        expect(vi.mocked(elem.waitUntil).mock.calls).toMatchSnapshot()
    })

    it('should allow to set custom error', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForExist: tmpElem.waitForExist,
            waitUntil: vi.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout }
        } as unknown as WebdriverIO.Element

        await elem.waitForExist({
            timeout,
            reverse: true,
            timeoutMsg: 'my custom error'
        })
        expect(vi.mocked(elem.waitUntil).mock.calls).toMatchSnapshot()
    })

    it('should maintain elementId for shadow element', async () => {
        const elem = await browser.$('#foo')
        const shadowElem = await elem.shadow$('#bar')
        const isExistingSpy = vi.spyOn(shadowElem, 'isExisting').mockResolvedValue(true)

        expect(shadowElem.elementId).toBe('some-shadow-sub-elem-321')
        await shadowElem.waitForExist({ timeout })
        expect(shadowElem.elementId).toBe('some-shadow-sub-elem-321')
        expect(isExistingSpy).toHaveBeenCalledTimes(1)
    })
})
