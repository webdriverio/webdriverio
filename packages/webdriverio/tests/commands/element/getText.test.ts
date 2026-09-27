import path from 'node:path'
import { expect, describe, it, afterEach, beforeAll, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getText test', () => {
    let browser: WebdriverIO.Browser
    let elem: any

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
    })

    it('should allow to get the text of an element', async () => {
        await elem.getText()
        expect(fetch).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ pathname: '/session/foobar-123/element/some-elem-123/text' }),
            expect.anything()
        )
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
