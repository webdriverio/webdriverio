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
            scrollIntoView: () => {},
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
            scrollIntoView: () => {},
            contains: () => true
        }
        global.document = { elementFromPoint: () => 'some element' }

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
            scrollIntoView: () => {},
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
            scrollIntoView: () => {},
        }
        global.document = { elementFromPoint: () => null }

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
            scrollIntoView: () => {},
        }
        global.document = { elementFromPoint: () => elemMock }

        expect(isElementClickable(elemMock)).toBe(false)
    })
})
