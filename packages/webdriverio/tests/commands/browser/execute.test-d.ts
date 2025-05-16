import { expectTypeOf } from 'vitest'
import { remote } from '../../../src/index.js'

test('properly transforms element arguments', async () => {
    const browser = await remote({
        capabilities: {}
    })
    const elem = await browser.$('body')
    const result = await browser.execute((a, b, c, d) => {
        expectTypeOf(a).toEqualTypeOf<number>()
        expectTypeOf(b).toEqualTypeOf<string>()
        expectTypeOf(c).toEqualTypeOf<boolean>()
        expectTypeOf(d).toEqualTypeOf<HTMLElement>()
        return document.body
    }, 1, '2', true, elem)
    expectTypeOf(result).toEqualTypeOf<WebdriverIO.Element>()

    const result2 = await browser.execute(() => document.querySelector('div'))
    expectTypeOf(result2).toEqualTypeOf<WebdriverIO.Element | null>()

    const result3 = await browser.execute(() => 123)
    expectTypeOf(result3).toEqualTypeOf<number>()
})