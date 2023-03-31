import path from 'node:path'
import { expect, describe, it, vi } from 'vitest'

import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('previous element sibling test', () => {
    it('should return previous sibling of an element', async () => {
        const browser = await remote({
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const subElem = await elem.$('#bar')
        const previousEl = await subElem.previousElement()

        expect(previousEl.elementId).toBe('some-previous-elem')
    })

    it('should throw error if no previous element exist', async () => {
        const browser = await remote({
            waitforInterval: 1,
            waitforTimeout: 1,
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$$('#foo')
        const prevElem = await elem[0].previousElement()

        const err = await prevElem.click().catch((err) => err)
        expect(err.message)
            .toContain('previous element of element with selector "#foo"')
    })
})
