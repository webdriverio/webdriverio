import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { SESSION_MOCKS } from '../../../src/commands/browser/mock.js'

vi.mock('fetch')
vi.mock('devtools')
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
})
