import path from 'node:path'
import { expect, describe, it, vi, beforeAll, beforeEach } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('scrollIntoView test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
    })

    it('scrolls by default the element to the top', async () => {
        await elem.scrollIntoView()
        expect(got.mock.calls.slice(-2, -1)[0][1].json).toMatchSnapshot()
    })

    it('scrolls element when using boolean scroll options', async () => {
        await elem.scrollIntoView(true)
        expect(got.mock.calls.slice(-2, -1)[0][1].json).toMatchSnapshot()
        got.mockClear()
        await elem.scrollIntoView(false)
        expect(got.mock.calls.slice(-2, -1)[0][1].json).toMatchSnapshot()
    })

    it('scrolls element using scroll into view options', async () => {
        await elem.scrollIntoView({ block: 'center', inline: 'center' })
        expect(got.mock.calls.slice(-2, -1)[0][1].json).toMatchSnapshot()
    })

    beforeEach(() => {
        got.mockClear()
    })
})
