import { expectType } from 'tsd'
import { $ } from '@wdio/globals'
import type { RectReturn } from '@wdio/protocols'

;(async () => {
    const el = await $('foo')

    // types validations for getSize command
    expectType<Pick<RectReturn, 'width' | 'height'>> (await el.getSize())
    expectType<number> ((await el.getSize()).height)
    expectType<number> ((await el.getSize()).width)
    expectType<number> (await el.getSize('height'))
    expectType<number> (await el.getSize('width'))

    // types validations for getLocation command
    expectType<Pick<RectReturn, 'x' | 'y'>> (await el.getLocation())
    expectType<number> ((await el.getLocation()).x)
    expectType<number> ((await el.getLocation()).y)
    expectType<number> (await el.getLocation('x'))
    expectType<number> (await el.getLocation('y'))
})
