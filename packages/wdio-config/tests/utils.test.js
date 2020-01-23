import { removeLineNumbers, validObjectOrArray } from '../src/utils'

describe('utils', () => {
    describe('removeLineNumbers', () => {
        it('should properly remove line numbers in unix paths', () => {
            expect(removeLineNumbers('/test/f.feature:19:4')).toBe('/test/f.feature')
            expect(removeLineNumbers('/test/f.feature:9')).toBe('/test/f.feature')
        })

        it('should properly remove line numbers in windows paths', () => {
            expect(removeLineNumbers('c:\\test\\f.feature:9:14')).toBe('c:\\test\\f.feature')
            expect(removeLineNumbers('c:\\test\\f.feature:19')).toBe('c:\\test\\f.feature')
        })

        it('should do nothing if there is no line number in path (win)', () => {
            expect(removeLineNumbers('c:\\test\\f.feature')).toBe('c:\\test\\f.feature')
        })

        it('should do nothing if there is no line number in path (nix)', () => {
            expect(removeLineNumbers('/test/f.feature')).toBe('/test/f.feature')
        })
    })

    describe('validObjectOrArray', () => {
        describe('objects', () => {
            it('returns true if not empty', () => {
                expect(validObjectOrArray({ foo: 'bar' })).toBeTruthy()
            })

            it('returns false if empty', () => {
                expect(validObjectOrArray({})).toBeFalsy()
            })
        })

        describe('arrays', () => {
            it('returns true if not empty', () => {
                expect(validObjectOrArray(['foo', 'bar'])).toBeTruthy()
            })

            it('returns false if empty', () => {
                expect(validObjectOrArray([])).toBeFalsy()
            })
        })
    })
})
