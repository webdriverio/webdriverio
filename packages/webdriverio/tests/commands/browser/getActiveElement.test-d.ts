import { describe, test, expectTypeOf } from 'vitest'
import type { ElementReference } from '@wdio/protocols'

describe('getActiveElement', () => {
    test('returns an element reference that can be passed to the $ command', () => {
        const browser = {} as WebdriverIO.Browser
        const activeElement = {} as Awaited<ReturnType<typeof browser.getActiveElement>>

        expectTypeOf(activeElement).toEqualTypeOf<ElementReference>()
        expectTypeOf(browser.$).toBeCallableWith(activeElement)
    })
})
