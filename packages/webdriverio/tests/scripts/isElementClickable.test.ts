import { describe, it, vi, expect, beforeAll, afterEach, afterAll } from 'vitest'
import isElementClickable from '../../src/scripts/isElementClickable.js'

/**
* A minimalistic scrollIntoView function that emulates browser behavior
* to be attached to the Element.prototype
* @param options - Scroll options or boolean for legacy behavior
*/
function scrollIntoView(options?: {
    block?: 'start' | 'center' | 'end'
    inline?: 'start' | 'center' | 'end'
} | boolean): void {
    const originalRect = this.getBoundingClientRect()
    const originalScrollY = window.scrollY
    const originalScrollX = window.scrollX

    // Handle boolean (legacy) parameter or no options
    const align = typeof options === 'boolean' || !options ?
        {
            block: 'start', inline: 'start'
        } :
        options

    const getHorizontalScroll = () => {
        switch (align.inline) {
        case 'center':
            return originalScrollX + originalRect.left - window.innerWidth/2 + originalRect.width/2
        case 'end':
            return originalScrollX + originalRect.right - window.innerWidth
        default:
            return originalScrollX + originalRect.left
        }
    }

    const getVerticalScroll = () => {
        switch (align.inline) {
        case 'center':
            return originalScrollY + originalRect.top - window.innerHeight/2 + originalRect.height/2
        case 'end':
            return originalScrollY + originalRect.bottom - window.innerHeight
        default:
            return originalScrollY + originalRect.top
        }
    }

    // Set the scroll position
    window.scroll(getHorizontalScroll(), getVerticalScroll())

    // Calculate scroll delta
    const deltaY = originalScrollY - window.scrollY
    const deltaX = originalScrollX - window.scrollX

    // Update element's apparent position after scrolling
    this.getBoundingClientRect = () => ({
        ...originalRect,
        top: originalRect.top + deltaY,
        left: originalRect.left + deltaX
    })
}

describe('isElementClickable script', () => {
    beforeAll(() => {
        global.window = {
            innerWidth: 800,
            innerHeight: 600,
            scrollX: 0,
            scrollY: 0,
            scroll(x:any, y: any) {
                this.scrollX = Math.max(0, x)
                this.scrollY = Math.max(0, y)
            }
        } as any
    })

    it('should be clickable if in viewport and elementFromPoint matches', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => vi.fn(),
            contains: () => false
        } as unknown as Element
        global.document = { elementFromPoint: () => elemMock } as any

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be clickable if in viewport and elementFromPoint is child of elem', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => vi.fn(),
            contains: () => true
        } as unknown as Element
        global.document = { elementFromPoint: () => 'some element' as any } as any

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be clickable if in viewport and elementFromPoint is child of elem [Edge]', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: vi.fn(),
            contains: () => { throw new Error('should not be called in old Edge!') }
        } as unknown as Element
        // emulate old Edge
        // @ts-expect-error
        global.window.StyleMedia = (() => { }) as any

        let attempts = 0
        global.document = { elementFromPoint: () => {
            attempts += 1
            return { parentNode: attempts > 3 ? elemMock : {} }
        } } as any

        expect(isElementClickable(elemMock)).toBe(true)
        expect(elemMock.scrollIntoView).toBeCalledWith(false)
    })

    it('should be clickable if in viewport and elementFromPoint if element is Document Fragment [Edge]', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            nodeType: 11,
            getClientRects: () => [{}],
            scrollIntoView: vi.fn(),
            contains: () => { throw new Error('should not be called in old Edge!') }
        } as unknown as Element
        // emulate old Edge
        // @ts-expect-error
        global.window.StyleMedia = (() => { }) as any

        let attempts = 0
        global.document = { elementFromPoint: () => {
            attempts += 1
            return { parentNode: attempts > 3 ? elemMock : {} }
        } } as any

        expect(isElementClickable(elemMock)).toBe(true)
        expect(elemMock.scrollIntoView).toBeCalledWith(false)
    })

    it('should be clickable if in viewport and elementFromPoint of the rect matches', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{
                height: 55,
                width: 2200,
                top: 33,
                left: 45500
            }],
            scrollIntoView: () => vi.fn(),
            contains: () => false
        } as unknown as Element
        global.document = {
            // only return elemMock in getOverlappingRects
            elementFromPoint: (x: number) => {
                return x > 45500 ? elemMock : null
            }
        } as any

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be clickable if in viewport and elementFromPoint matches [nested shadowRoot]', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => vi.fn(),
            contains: () => false
        } as unknown as Element
        global.document = {
            elementFromPoint: () => ({
                shadowRoot: {
                    elementFromPoint: () => ({
                        shadowRoot: { elementFromPoint: () => elemMock }
                    })
                }
            })
        } as any

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be not clickable if in viewport and elementFromPoint matches but is disabled', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => vi.fn(),
            contains: () => false,
            disabled: true
        } as unknown as Element
        global.document = { elementFromPoint: () => elemMock } as any

        expect(isElementClickable(elemMock)).toBe(false)
    })

    it("should be not clickable if in viewport but elementFromPoint doesn't match", () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: vi.fn(),
            contains: () => false
        } as unknown as Element
        global.document = { elementFromPoint: () => null } as any

        expect(isElementClickable(elemMock)).toBe(false)
        expect(elemMock.scrollIntoView).toBeCalledWith({ block: 'center', inline: 'center' })
    })

    it("should be not clickable if in viewport but elementFromPoint doesn't match [shadowRoot]", () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => vi.fn(),
            contains: () => false
        } as unknown as Element
        global.document = {
            elementFromPoint: () => ({
                shadowRoot: { elementFromPoint: () => null }
            })
        } as any

        expect(isElementClickable(elemMock)).toBe(false)
    })

    it('should be clickable if not in viewport', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 999
            }),
            getClientRects: () => [{}],
            scrollIntoView: scrollIntoView,
            contains: () => false
        } as unknown as Element
        global.document = { elementFromPoint: () => elemMock } as any

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should scroll to the initial position when element not in viewport', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 600,
                left: 999
            }),
            getClientRects: () => [{}],
            scrollIntoView: scrollIntoView,
            contains: () => false
        } as unknown as Element
        global.document = { elementFromPoint: () => elemMock } as any

        // page scrolled passed element scenario
        window.scroll(5000, 5000)
        isElementClickable(elemMock)
        expect(window.scrollX).toBe(5000)
        expect(window.scrollY).toBe(5000)
        // page scrolled to the beginning scenario
        window.scroll(0, 0)
        isElementClickable(elemMock)
        expect(window.scrollX).toBe(0)
        expect(window.scrollY).toBe(0)
    })

    afterEach(() => {
        // @ts-expect-error
        delete global.window.StyleMedia
    })

    afterAll(() => {
        // @ts-ignore
        delete global.window.innerWidth
        // @ts-ignore
        delete global.window.innerHeight
    })
})
