import path from 'node:path'
import { expect, describe, it, vi, beforeAll, afterEach } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('waitUntil', () => {
    let browser: WebdriverIO.Browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('Should throw an error if an invalid condition is used', async () => {
        const el = await browser.$('foo')
        const result = await el.waitUntil(async () => true)
        expect(result).toBe(true)
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
