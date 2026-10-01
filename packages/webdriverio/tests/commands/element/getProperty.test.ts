import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { expect, describe, it, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { getBrowsingContext } from '../../../src/browsingContext.js'
import { getContextManager } from '../../../src/session/context.js'
import { getElement } from '../../../src/utils/getElementObject.js'

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

    it('reads the property in the element\'s browsing context', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'bidi'
            }
        })
        vi.spyOn(getContextManager(browser), 'getCurrentContext').mockResolvedValue('top-context')
        const frame = getBrowsingContext(browser, 'frame-1', { isFrame: true, url: 'https://child.example' })
        const elem = getElement.call(frame, '#text', { [ELEMENT_KEY]: 'elem-1' })
        vi.spyOn(elem, 'execute').mockResolvedValue('center')
        const propertyCommand = vi.spyOn(elem, 'getElementProperty')

        await expect(elem.getProperty('value')).resolves.toBe('center')
        expect(elem.execute).toHaveBeenCalled()
        expect(propertyCommand).not.toHaveBeenCalled()
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})
