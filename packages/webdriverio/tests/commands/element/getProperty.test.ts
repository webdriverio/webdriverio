import path from 'node:path'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('getProperty test', () => {
    it('should allow to get the property of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getProperty('tagName')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/property/tagName')
        expect(property).toBe('BODY')
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
