import path from 'node:path'
import { expect, test, beforeEach, vi } from 'vitest'
import puppeteer from 'puppeteer-core'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('puppeteer-core')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

// @ts-ignore mock feature
const cdpSession = new puppeteer.CDPSessionMock()

beforeEach(() => {
    vi.mocked(fetch).mockClear()
    cdpSession.send.mockClear()
})

test('should fail if wrong params applied', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    // @ts-expect-error wrong parameter
    const err: Error = await browser.throttleCPU().catch((err: Error) => err)
    expect(err.message).toContain('Invalid factor for "throttleCPU". Expected it to be a number (int)')
})

test('should slowdown the CPU by a factor of 2', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    await browser.throttleCPU(2)
    expect(cdpSession.send.mock.calls).toMatchSnapshot()
})
