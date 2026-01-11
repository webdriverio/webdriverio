import { expectTypeOf } from 'vitest'
import { $ } from '@wdio/globals'
import type { RectReturn } from '@wdio/protocols'

;(async () => {
    const el = {} as WebdriverIO.Element

    // types validations for getSize command
    expectTypeOf(await el.getSize()).toEqualTypeOf<Pick<RectReturn, 'width' | 'height'>>()
    expectTypeOf(await el.getSize()).toEqualTypeOf<{height: number, width: number}>()
    expectTypeOf(await el.getSize('height')).toEqualTypeOf<number>()
    expectTypeOf(await el.getSize('width')).toEqualTypeOf<number>()
    expectTypeOf(await el.getSize('width')).not.toEqualTypeOf<{height: number, width: number} & number>()

    // types validations for getLocation command
    expectTypeOf(await el.getLocation()).toEqualTypeOf<Pick<RectReturn, 'x' | 'y'>>()
    expectTypeOf((await el.getLocation()).x).toEqualTypeOf<number>()
    expectTypeOf((await el.getLocation()).y).toEqualTypeOf<number>()
    expectTypeOf(await el.getLocation('x')).toEqualTypeOf<number>()
    expectTypeOf(await el.getLocation('y')).toEqualTypeOf<number>()
    expectTypeOf(await el.getLocation()).not.toEqualTypeOf<{x: number, y: number} & number>()

    // types validations for getAttribute command
    expectTypeOf(await el.getAttribute('href')).toEqualTypeOf<string | null>()

    // types validations for getProperty command
    expectTypeOf(await el.getProperty('tagName')).toEqualTypeOf<unknown>()
})
