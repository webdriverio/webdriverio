import { expectTypeOf, describe, it } from 'vitest'
import { $ } from '@wdio/globals'
import type { RectReturn } from '@wdio/protocols'

describe('WebdriverIO commands', async () => {
    const chainableEl = $('foo')
    const el = await chainableEl.getElement()

    it('getSize', async () => {
        expectTypeOf(await el.getSize()).toEqualTypeOf<Pick<RectReturn, 'width' | 'height'>>()
        expectTypeOf(await el.getSize()).toEqualTypeOf<{height: number, width: number}>()
        expectTypeOf(await el.getSize('height')).toEqualTypeOf<number>()
        expectTypeOf(await el.getSize('width')).toEqualTypeOf<number>()
        expectTypeOf(await el.getSize('width')).not.toEqualTypeOf<{height: number, width: number} & number>()

        expectTypeOf(await chainableEl.getSize()).toEqualTypeOf<Pick<RectReturn, 'width' | 'height'>>()
        expectTypeOf(await chainableEl.getSize()).toEqualTypeOf<{height: number, width: number}>()
        expectTypeOf(await chainableEl.getSize('height')).toEqualTypeOf<number>()
        expectTypeOf(await chainableEl.getSize('width')).toEqualTypeOf<number>()
        expectTypeOf(await chainableEl.getSize('width')).not.toEqualTypeOf<{height: number, width: number} & number>()
    })

    it('getLocation', async () => {
        expectTypeOf(await el.getLocation()).toEqualTypeOf<Pick<RectReturn, 'x' | 'y'>>()
        expectTypeOf((await el.getLocation()).x).toEqualTypeOf<number>()
        expectTypeOf((await el.getLocation()).y).toEqualTypeOf<number>()
        expectTypeOf(await el.getLocation('x')).toEqualTypeOf<number>()
        expectTypeOf(await el.getLocation('y')).toEqualTypeOf<number>()
        expectTypeOf(await el.getLocation()).not.toEqualTypeOf<{x: number, y: number} & number>()

        expectTypeOf(await chainableEl.getLocation()).toEqualTypeOf<Pick<RectReturn, 'x' | 'y'>>()
        expectTypeOf((await chainableEl.getLocation()).x).toEqualTypeOf<number>()
        expectTypeOf((await chainableEl.getLocation()).y).toEqualTypeOf<number>()
        expectTypeOf(await chainableEl.getLocation('x')).toEqualTypeOf<number>()
        expectTypeOf(await chainableEl.getLocation('y')).toEqualTypeOf<number>()
        expectTypeOf(await chainableEl.getLocation()).not.toEqualTypeOf<{x: number, y: number} & number>()
    })

    it('getAttribute', async () => {
        expectTypeOf(await el.getAttribute('href')).toEqualTypeOf<string | null>()
    })

    it('getProperty', async () => {
        expectTypeOf(await el.getProperty('tagName')).toEqualTypeOf<unknown>()
    })

    it('getElementProperty', async () => {
        expectTypeOf(await el.getElementProperty(el.elementId, 'tagName')).toEqualTypeOf<unknown>()
    })
})
