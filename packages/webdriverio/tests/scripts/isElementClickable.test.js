import isElementClickable from '../../src/scripts/isElementClickable'

describe('isElementClickable script', () => {
    beforeAll(() => {
        global.window = {
            innerWidth: 800,
            innerHeight: 600
        }
    })

    it('should be clickable if in viewport and elementFromPoint matches', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => jest.fn(),
            contains: () => false
        }
        global.document = { elementFromPoint: () => elemMock }

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be clickable if in viewport and elementFromPoint is child of elem', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => jest.fn(),
            contains: () => true
        }
        global.document = { elementFromPoint: () => 'some element' }

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be clickable if in viewport and elementFromPoint is child of elem [Edge]', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: jest.fn(),
            contains: () => { throw new Error('should not be called in old Edge!') }
        }
        // emulate old Edge
        global.window.StyleMedia = () => { }

        let attempts = 0
        global.document = { elementFromPoint: () => {
            attempts += 1
            return { parentNode: attempts > 4 ? elemMock : {} }
        } }

        expect(isElementClickable(elemMock)).toBe(true)
        expect(elemMock.scrollIntoView).toBeCalledWith(false)
        expect(elemMock.scrollIntoView).toBeCalledWith(true)
    })

    it('should be clickable if in viewport and elementFromPoint if element is Document Fragment [Edge]', () => {
        const elemMock = {
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
            scrollIntoView: jest.fn(),
            contains: () => { throw new Error('should not be called in old Edge!') }
        }
        // emulate old Edge
        global.window.StyleMedia = () => { }

        let attempts = 0
        global.document = { elementFromPoint: () => {
            attempts += 1
            return { parentNode: attempts > 4 ? elemMock : {} }
        } }

        expect(isElementClickable(elemMock)).toBe(true)
        expect(elemMock.scrollIntoView).toBeCalledWith(false)
        expect(elemMock.scrollIntoView).toBeCalledWith(true)
    })

    it('should be clickable if in viewport and elementFromPoint of the rect matches', () => {
        const elemMock = {
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
            scrollIntoView: () => jest.fn(),
            contains: () => false
        }
        global.document = {
            // only return elemMock in getOverlappingRects
            elementFromPoint: (x) => {
                return x > 45500 ? elemMock : null
            }
        }

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be clickable if in viewport and elementFromPoint matches [nested shadowRoot]', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => jest.fn(),
            contains: () => false
        }
        global.document = {
            elementFromPoint: () => ({
                shadowRoot: {
                    elementFromPoint: () => ({
                        shadowRoot: { elementFromPoint: () => elemMock }
                    })
                }
            })
        }

        expect(isElementClickable(elemMock)).toBe(true)
    })

    it('should be not clickable if in viewport and elementFromPoint matches but is disabled', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => jest.fn(),
            contains: () => false,
            disabled: true
        }
        global.document = { elementFromPoint: () => elemMock }

        expect(isElementClickable(elemMock)).toBe(false)
    })

    it("should be not clickable if in viewport but elementFromPoint doesn't match", () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: jest.fn(),
            contains: () => false
        }
        global.document = { elementFromPoint: () => null }

        expect(isElementClickable(elemMock)).toBe(false)
        expect(elemMock.scrollIntoView).toBeCalledWith({ block: 'nearest', inline: 'nearest' })
        expect(elemMock.scrollIntoView).toBeCalledWith({ block: 'center', inline: 'center' })
    })

    it("should be not clickable if in viewport but elementFromPoint doesn't match [shadowRoot]", () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            }),
            clientHeight: 55,
            clientWidth: 22,
            getClientRects: () => [{}],
            scrollIntoView: () => jest.fn(),
            contains: () => false
        }
        global.document = {
            elementFromPoint: () => ({
                shadowRoot: { elementFromPoint: () => null }
            })
        }

        expect(isElementClickable(elemMock)).toBe(false)
    })

    it('should be not clickable if not in viewport', () => {
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 999
            }),
            getClientRects: () => [{}],
            scrollIntoView: () => jest.fn(),
            contains: () => false
        }
        global.document = { elementFromPoint: () => elemMock }

        expect(isElementClickable(elemMock)).toBe(false)
    })

    afterEach(() => {
        delete global.window.StyleMedia
    })

    afterAll(() => {
        delete global.window.innerWidth
        delete global.window.innerHeight
    })
})
