import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolve } from 'import-meta-resolve'
import { isCloudCapability, removeLineNumbers, validObjectOrArray, loadTypeScriptCompiler, objectToEnv } from '../src/utils.js'

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn().mockResolvedValue('/some/path')
}))

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

    describe('loadTypeScriptCompiler', () => {
        beforeEach(() => {
            vi.mocked(resolve).mockClear()
        })

        it('should return true if tsconfig exists', async () => {
            expect(await loadTypeScriptCompiler({})).toBe(true)
            expect(resolve).toBeCalledTimes(1)
        })

        it('should return false if tsconfig exists', async () => {
            vi.mocked(resolve).mockRejectedValue(new Error('ups'))
            expect(await loadTypeScriptCompiler({})).toBe(false)
            expect(resolve).toBeCalledTimes(1)
        })

        it('should return false if WDIO_WORKER_ID is set', async () => {
            process.env.WDIO_WORKER_ID = '1'
            vi.mocked(resolve).mockRejectedValue(new Error('ups'))
            expect(await loadTypeScriptCompiler({})).toBe(false)
            expect(resolve).toBeCalledTimes(0)
        })
    })

    it('objectToEnv', () => {
        objectToEnv({
            wdioFoo: true,
            wdioBar: 'foobar',
            wdioArray: ['foo', 'bar'],
            wdioObject: { foo: 'bar' },
            wdioRegex: /foo/,
            wdioFalse: false
        })
        expect(process.env.WDIO_FOO).toBe('1')
        expect(process.env.WDIO_BAR).toBe('foobar')
        expect(process.env.WDIO_ARRAY).toBe('foo,bar')
        expect(process.env.WDIO_OBJECT).toBe('{"foo":"bar"}')
        expect(process.env.WDIO_REGEX).toBe('/foo/')
        expect(process.env.WDIO_FALSE).toBeUndefined()
    })
})
