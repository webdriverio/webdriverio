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
        } as unknown as HTMLElement

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
        } as unknown as HTMLElement

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
        } as unknown as HTMLElement

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
        } as unknown as HTMLElement

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
        } as unknown as HTMLElement

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
        } as unknown as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    it('should return false if element top equals viewport height (boundary condition)', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 600,
                left: 455
            })
        } as unknown as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    it('should return false if element left equals viewport width (boundary condition)', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 800
            })
        } as unknown as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    it('should return true if element is at the edge of viewport (partially visible)', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 599,
                left: 799
            })
        } as unknown as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(true)
    })

    it('should return false for footer far below small viewport (issue #14855)', () => {
        // Simulate small viewport like in the bug report: 500x200
        // @ts-ignore
        global.window.innerWidth = 500
        // @ts-ignore
        global.window.innerHeight = 200

        const elemMock = {
            getBoundingClientRect: () => ({
                height: 100,
                width: 500,
                top: 1000, // Footer is way below viewport
                left: 0
            })
        } as unknown as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    it('should return true for header in small viewport (issue #14855)', () => {
        // Simulate small viewport like in the bug report: 500x200
        // @ts-ignore
        global.window.innerWidth = 500
        // @ts-ignore
        global.window.innerHeight = 200

        const elemMock = {
            getBoundingClientRect: () => ({
                height: 100,
                width: 500,
                top: 50, // Header is visible in viewport
                left: 0
            })
        } as unknown as HTMLElement

        expect(isElementInViewport(elemMock)).toBe(true)
    })

    afterAll(() => {
        // @ts-expect-error
        delete global.window
    })
})

