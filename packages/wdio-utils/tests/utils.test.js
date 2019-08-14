import { isFunctionAsync } from '../src'

describe('isFunctionAsync', () => {
    it('should return true if function is async', () => {
        expect(isFunctionAsync(async () => {})).toBe(true)
    })

    it('should return true if function name is async', () => {
        expect(isFunctionAsync(function async () {})).toBe(true)
    })

    it('should return false if function is not async', () => {
        expect(isFunctionAsync(() => {})).toBe(false)
    })

    it('should return false if some special object is passed instead of function', () => {
        expect(isFunctionAsync({})).toBe(false)
    })
})
