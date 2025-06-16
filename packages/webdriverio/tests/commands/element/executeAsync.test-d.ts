import { expectTypeOf } from 'vitest'
import { remote } from '../../../src/index.js'

test('properly transforms element arguments', async () => {
    const browser = await remote({
        capabilities: {}
    })
    const elem = await browser.$('body')

    const result: WebdriverIO.Element = await elem.executeAsync((el, a, b, c, d, done) => {
        expectTypeOf(el).toEqualTypeOf<HTMLElement>()
        expectTypeOf(a).toEqualTypeOf<number>()
        expectTypeOf(b).toEqualTypeOf<string>()
        expectTypeOf(c).toEqualTypeOf<boolean>()
        expectTypeOf(d).toEqualTypeOf<HTMLElement>()
        done(document.body)
    }, 1, '2', true, elem)
    expectTypeOf(result).toEqualTypeOf<WebdriverIO.Element>()

    const el: WebdriverIO.Element | null = await elem.executeAsync((el, done) => {
        done(document.querySelector('body'))
    })
    expectTypeOf(el).toEqualTypeOf<WebdriverIO.Element | null>()

    const result2: WebdriverIO.Element | null = await elem.executeAsync((el, done) => done(document.querySelector('div')))
    expectTypeOf(result2).toEqualTypeOf<WebdriverIO.Element | null>()

    const result3: number = await elem.executeAsync((el, done) => done(123))
    expectTypeOf(result3).toEqualTypeOf<number>()
})