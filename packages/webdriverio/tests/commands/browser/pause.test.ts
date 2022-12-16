import path from 'node:path'
import { expect, describe, beforeEach, afterEach, it, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.useFakeTimers()
vi.spyOn(global, 'setTimeout')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('pause test', () => {
    let browser: WebdriverIO.Browser
    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should pause for value provided as arg', async () => {
        browser.pause(500) // expect 500ms pause
        expect(setTimeout)
            .toHaveBeenLastCalledWith(expect.any(Function), 500)
    })

    it('should pause for default value', async () => {
        // @ts-ignore test invalid input
        browser.pause() // expect 1s pause
        expect(setTimeout)
            .toHaveBeenLastCalledWith(expect.any(Function), 1000)
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
