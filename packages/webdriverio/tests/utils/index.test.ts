import { describe, it, expect, vi } from 'vitest'

import { findElement } from '../../src/utils/index.js'
import { ELEMENT_KEY } from '../../src/constants.js'

vi.mock('is-plain-obj', () => ({
    default: vi.fn().mockReturnValue(false)
}))

describe('findElement', () => {
    it('should find element using JS function', async () => {
        const elemRes = { [ELEMENT_KEY]: 'element-0' }
        const browser: any = {
            elementId: 'source-elem',
            execute: vi.fn().mockReturnValue(elemRes)
        }
        expect(await findElement.call(browser, () => 'testme')).toEqual(elemRes)
        expect(browser.execute).toBeCalledWith(expect.any(String), browser)
    })

    it('should find element using JS function with referenceId', async () => {
        const elemRes = { [ELEMENT_KEY]: 'element-0' }
        const browser: any = {
            elementId: 'source-elem',
            execute: vi.fn().mockReturnValue(elemRes)
        }
        const domNode = { nodeType: 1, nodeName: 'DivElement' }
        // @ts-expect-error
        globalThis.window = {}
        expect(await findElement.call(browser, domNode)).toEqual(elemRes)
        expect(browser.execute).toBeCalledWith(
            expect.any(String),
            browser,
            expect.any(String)
        )
    })
})
