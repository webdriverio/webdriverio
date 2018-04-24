/**
 * @jest-environment node
 */

import isDisplayedInViewport from '../../src/scripts/isDisplayedInViewport'

describe('isDisplayedInViewport script', () => {
    it('should detect if in viewport correctly', () => {
        global.document = {
            documentElement: {
                clientWidth: 800,
                clientHeight: 600
            }
        }
        global.window = {
            getComputedStyle: jest.fn().mockReturnValue({
                display: 'inline-block',
                visibility: 'visible',
                opacity: .8
            })
        }
        const elemMock = {
            getBoundingClientRect: () => ({
                bottom: 55,
                right: 22,
                top: 33,
                left: 555
            }),
            parentNode: {
                getBoundingClientRect: () => ({
                    bottom: 55,
                    right: 22,
                    top: 33,
                    left: 555
                })
            }
        }

        expect(isDisplayedInViewport(elemMock)).toBe(true)
    })

    it('should detect if in viewport correctly', () => {
        global.document = {
            documentElement: {
                clientWidth: 800,
                clientHeight: 600
            }
        }
        global.window = {
            getComputedStyle: jest.fn().mockReturnValue({
                display: 'inline-block',
                visibility: 'visible',
                opacity: .8
            })
        }
        const elemMock = {
            getBoundingClientRect: () => ({
                bottom: 55,
                right: 22,
                top: 33,
                left: 555
            }),
            parentNode: {
                getBoundingClientRect: () => ({
                    bottom: 55,
                    right: 2112,
                    top: 33,
                    left: 855
                }),
                parentNode: {
                    getBoundingClientRect: () => {}
                }
            }
        }

        expect(isDisplayedInViewport(elemMock)).toBe(false)
    })
})
