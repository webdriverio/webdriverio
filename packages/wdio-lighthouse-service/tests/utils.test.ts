import path from 'node:path'
import { expect, test, vi } from 'vitest'

import { sumByKey, setUnsupportedCommand, isSupportedUrl } from '../src/utils.js'
import type { RequestPayload } from '../src/handler/network.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

test('sumByKey', () => {
    expect(sumByKey([{
        size: 1
    } as unknown as RequestPayload, {
        size: 2
    } as unknown as RequestPayload, {
        size: 3
    } as unknown as RequestPayload], 'size')).toBe(6)
})

test('setUnsupportedCommand', () => {
    const browser = { addCommand: vi.fn() }
    setUnsupportedCommand(browser as unknown as WebdriverIO.Browser)
    expect(browser.addCommand).toHaveBeenCalledWith('getMetrics', expect.any(Function), expect.any(Object))
    expect(browser.addCommand).toHaveBeenCalledWith('getPerformanceScore', expect.any(Function), expect.any(Object))
    const fn = browser.addCommand.mock.calls[0][1]
    expect(fn).toThrow()
})

test('isSupportedUrl', () => {
    expect(isSupportedUrl('https://webdriver.io')).toBe(true)
    expect(isSupportedUrl('data:,')).toBe(false)
    expect(isSupportedUrl('about:blank')).toBe(false)
    expect(isSupportedUrl('chrome-extension://abc')).toBe(false)
})
