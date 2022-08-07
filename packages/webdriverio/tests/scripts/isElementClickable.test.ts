import { describe, it, vi, expect, beforeAll, afterEach, afterAll } from 'vitest'
import isElementClickable from '../../src/scripts/isElementClickable.js'

describe('isElementClickable script', () => {
    beforeAll(() => {
        global.window = {
            innerWidth: 800,
            innerHeight: 600
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
        } as any as Element
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
        } as any as Element
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
        } as any as Element
        // emulate old Edge
        // @ts-expect-error
        global.window.StyleMedia = (() => { }) as any

        let attempts = 0
        global.document = { elementFromPoint: () => {
            attempts += 1
            return { parentNode: attempts > 4 ? elemMock : {} }
        } } as any

        expect(isElementClickable(elemMock)).toBe(true)
        expect(elemMock.scrollIntoView).toBeCalledWith(false)
        expect(elemMock.scrollIntoView).toBeCalledWith(true)
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
        } as any as Element
        // emulate old Edge
        // @ts-expect-error
        global.window.StyleMedia = (() => { }) as any

        let attempts = 0
        global.document = { elementFromPoint: () => {
            attempts += 1
            return { parentNode: attempts > 4 ? elemMock : {} }
        } } as any

        expect(isElementClickable(elemMock)).toBe(true)
        expect(elemMock.scrollIntoView).toBeCalledWith(false)
        expect(elemMock.scrollIntoView).toBeCalledWith(true)
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
        } as any as Element
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
        } as any as Element
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
        } as any as Element
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
        } as any as Element
        global.document = { elementFromPoint: () => null } as any

        expect(isElementClickable(elemMock)).toBe(false)
        expect(elemMock.scrollIntoView).toBeCalledWith({ block: 'nearest', inline: 'nearest' })
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
        } as any as Element
        global.document = {
            elementFromPoint: () => ({
                shadowRoot: { elementFromPoint: () => null }
            })
        } as any

        expect(isElementClickable(elemMock)).toBe(false)
    })

    it('should be not clickable if not in viewport', () => {
        const elemMock: any = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 999
            }),
            getClientRects: () => [{}],
            scrollIntoView: () => vi.fn(),
            contains: () => false
        } as any as Element
        global.document = { elementFromPoint: () => elemMock } as any

        expect(isElementClickable(elemMock)).toBe(false)
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
