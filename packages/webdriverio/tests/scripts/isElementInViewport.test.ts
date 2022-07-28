import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import isElementInViewport from '../../src/scripts/isElementInViewport.js'

describe('isElementInViewport script', () => {
    beforeAll(() => {
        global.window = {
            innerWidth: 800,
            innerHeight: 600
        } as any
    })

    it('should detect if in viewport (document)', () => {
        // @ts-ignore
        delete global.window.innerWidth
        // @ts-ignore
        delete global.window.innerHeight
        global.document = {
            documentElement: {
                clientWidth: 800,
                clientHeight: 600
            }
        } as any
        global.window = {} as any
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            })
        } as any as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(true)
    })

    it('should detect if in viewport (window)', () => {
        // @ts-expect-error
        delete global.document
        // @ts-ignore
        global.window.innerWidth = 800
        // @ts-ignore
        global.window.innerHeight = 600

        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            })
        } as any as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(true)
    })

    it('should return false if outside viewport (vertical)', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 601,
                left: 455
            })
        } as any as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    it('should return false if outside viewport (vertical)', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: -55,
                left: 455
            })
        } as any as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    it('should return false if outside viewport (horizontal)', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 801
            })
        } as any as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    it('should return false if outside viewport (horizontal)', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: -22
            })
        } as any as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    afterAll(() => {
        // @ts-expect-error
        delete global.window
    })
})
