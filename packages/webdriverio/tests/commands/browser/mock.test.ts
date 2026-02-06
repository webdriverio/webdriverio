import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'
import WebDriverInterception from '../../../src/utils/interception/index.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('mock', () => {
    let browser: WebdriverIO.Browser

    it('should throw if Bidi is not used', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'chrome'
            }
        })

        await expect(() => browser.mock('')).rejects.toThrow(/only supported/)
    })

    it('can initiate a mock', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })

        const mock = browser.mock('**/*').catch(() => { /* ignore */ })
        expect(SESSION_MOCKS[browser.sessionId]).toContain(mock)
    })

    it('should restore existing mock with same definition', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })

        const firstMock = {
            restore: vi.fn().mockResolvedValue(undefined),
            isSameDefinition: vi.fn().mockReturnValue(true)
        }
        const secondMock = {
            restore: vi.fn().mockResolvedValue(undefined),
            isSameDefinition: vi.fn().mockReturnValue(true)
        }
        const initiateSpy = vi.spyOn(WebDriverInterception, 'initiate')
            .mockResolvedValueOnce(firstMock as any)
            .mockResolvedValueOnce(secondMock as any)

        const createdFirstMock = await browser.mock('**/foo', { method: 'GET' })
        const createdSecondMock = await browser.mock('**/foo', { method: 'GET' })

        expect(initiateSpy).toHaveBeenCalledTimes(2)
        expect(firstMock.restore).toHaveBeenCalledTimes(1)
        expect(createdFirstMock).not.toBe(createdSecondMock)
        const allContexts = Object.values(SESSION_MOCKS)
        const totalMocks = allContexts.reduce((acc, mocks) => acc + mocks.size, 0)
        expect(totalMocks).toBe(1)
        expect(allContexts.some((mocks) => mocks.has(createdSecondMock as any))).toBe(true)
        initiateSpy.mockRestore()
    })
})
