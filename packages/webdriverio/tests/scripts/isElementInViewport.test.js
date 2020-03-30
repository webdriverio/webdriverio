import isElementInViewport from '../../src/scripts/isElementInViewport'

describe('isElementInViewport script', () => {
    beforeAll(() => {
        global.window = {
            innerWidth: 800,
            innerHeight: 600
        }
    })

    it('should detect if in viewport (document)', () => {
        delete global.window.innerWidth
        delete global.window.innerHeight
        global.document = {
            documentElement: {
                clientWidth: 800,
                clientHeight: 600
            }
        }
        global.window = {}
        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            })
        }

        expect(isElementInViewport(elemMock)).toBe(true)
    })

    it('should detect if in viewport (window)', () => {
        delete global.document
        global.window.innerWidth = 800
        global.window.innerHeight = 600

        const elemMock = {
            getBoundingClientRect: () => ({
                height: 55,
                width: 22,
                top: 33,
                left: 455
            })
        }

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
        }

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
        }

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
        }

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
        }

        expect(isElementInViewport(elemMock)).toBe(false)
    })

    afterAll(() => {
        delete global.window
    })
})
