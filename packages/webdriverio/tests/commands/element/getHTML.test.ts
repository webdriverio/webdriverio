import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getHTML test', () => {
    it('should allow get html of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        // @ts-expect-error mock feature
        elem.elementId = {
            outerHTML: '<some>outer html</some>',
            innerHTML: 'some inner html'
        }

        let result = await elem.getHTML()
        expect(vi.mocked(got).mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/execute/sync')
        expect(result).toBe('<some>outer html</some>')

        result = await elem.getHTML(false)
        expect(result).toBe('some inner html')
    })

    afterEach(() => {
        vi.mocked(got).mockClear()
    })
})
