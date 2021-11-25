import path from 'path'
import { isCloudCapability, removeLineNumbers, validObjectOrArray, ensureAbsolutePathForSpecs } from '../src/utils'

const FIXTURES_PATH = path.resolve(__dirname, '__fixtures__')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2 = path.resolve(FIXTURES_PATH, 'test-a.feature:2')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2_RELATIVE_PATH = path.join('packages', 'wdio-config', 'tests', '__fixtures__', 'test-a.feature:2')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12 = path.resolve(FIXTURES_PATH, 'test-a.feature:2:12')
const FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12_RELATIVE_PATH = path.join('packages', 'wdio-config', 'tests', '__fixtures__', 'test-a.feature:2:12')

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

    describe('isCloudCapability', () => {
        it('should detect Browserstack capabilities', ()  => {
            expect(isCloudCapability({ 'bstack:options': {} })).toBe(true)
        })

        it('should detect Saucelabs capabilities', ()  => {
            expect(isCloudCapability({ 'sauce:options': {} })).toBe(true)
        })

        it('should detect Testingbot capabilities', ()  => {
            expect(isCloudCapability({ 'tb:options': {} })).toBe(true)
        })

        it('should detect non-cloud capabilities', ()  => {
            expect(isCloudCapability({ 'selenoid:options': {} })).toBe(false)
        })

        it('should handle null or empty capabilities', ()  => {
            expect(isCloudCapability({})).toBe(false)
        })
    })

    describe('ensureAbsolutePathForSpecs', () => {
        it('should properly add absolute path for spec with absolute path and line number', () => {
            expect(ensureAbsolutePathForSpecs([FIXTURES_CUCUMBER_FEATURE_A_LINE_2])).toContainEqual(FIXTURES_CUCUMBER_FEATURE_A_LINE_2)
        })

        it('should properly add absolute path for spec with relative path and line number', () => {
            expect(ensureAbsolutePathForSpecs([FIXTURES_CUCUMBER_FEATURE_A_LINE_2_RELATIVE_PATH])).toContainEqual(FIXTURES_CUCUMBER_FEATURE_A_LINE_2)
        })

        it('should properly add absolute path for spec with absolute path and line numbers', () => {
            expect(ensureAbsolutePathForSpecs([FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12])).toContainEqual(FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12)
        })

        it('should properly add absolute path for spec with relative path and line numbers', () => {
            expect(ensureAbsolutePathForSpecs([FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12_RELATIVE_PATH])).toContainEqual(FIXTURES_CUCUMBER_FEATURE_A_LINE_2_AND_12)
        })
    })

})
