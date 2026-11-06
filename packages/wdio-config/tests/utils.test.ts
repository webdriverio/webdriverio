import path from 'node:path'
import url from 'node:url'
import { describe, it, expect } from 'vitest'

import { isCloudCapability, removeLineNumbers, validObjectOrArray, applyHeadlessFlag } from '../src/utils.js'
import { makeRelativeToCWD } from '../src/node/utils.js'

describe('applyHeadlessFlag', () => {
    it('should add headless flags for Chrome', () => {
        const caps = { browserName: 'chrome', 'goog:chromeOptions': { args: ['--foo'] } }
        expect(applyHeadlessFlag(caps, true)).toEqual({
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['--foo', '--headless', '--disable-gpu'] }
        })
    })

    it('should strip headless flags for Chrome', () => {
        const caps = { browserName: 'chrome', 'goog:chromeOptions': { args: ['--foo', '--headless=new', 'headless', '--disable-gpu'] } }
        expect(applyHeadlessFlag(caps, false)).toEqual({
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['--foo', '--disable-gpu'] }
        })
    })

    it('should add headless flag for Firefox', () => {
        const caps = { browserName: 'firefox', 'moz:firefoxOptions': { args: ['-foo'] } }
        expect(applyHeadlessFlag(caps, true)).toEqual({
            browserName: 'firefox',
            'moz:firefoxOptions': { args: ['-foo', '-headless'] }
        })
    })

    it('should strip headless flag for Firefox', () => {
        const caps = { browserName: 'firefox', 'moz:firefoxOptions': { args: ['-foo', '-headless', '--headless'] } }
        expect(applyHeadlessFlag(caps, false)).toEqual({
            browserName: 'firefox',
            'moz:firefoxOptions': { args: ['-foo'] }
        })
    })

    it('should work with Microsoft Edge', () => {
        const caps = { browserName: 'microsoftedge', 'ms:edgeOptions': { args: ['--foo'] } }
        expect(applyHeadlessFlag(caps, true)).toEqual({
            browserName: 'microsoftedge',
            'ms:edgeOptions': { args: ['--foo', '--headless'] }
        })
    })

    it('should handle W3C alwaysMatch capabilities', () => {
        const caps = { alwaysMatch: { browserName: 'chrome', 'goog:chromeOptions': { args: ['--foo'] } }, firstMatch: [] }
        applyHeadlessFlag(caps as any, true)
        expect(caps.alwaysMatch['goog:chromeOptions']).toEqual({ args: ['--foo', '--headless', '--disable-gpu'] })
    })

    it('should not add duplicate headless flags when --headless=new is already present for Chrome', () => {
        const caps = { browserName: 'chrome', 'goog:chromeOptions': { args: ['--foo', '--headless=new'] } }
        expect(applyHeadlessFlag(caps, true)).toEqual({
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['--foo', '--headless=new', '--disable-gpu'] }
        })
    })

    it('should apply headless flag to multiremote/object-style capabilities', () => {
        const caps: any = {
            chromeBrowser: {
                browserName: 'chrome',
                'goog:chromeOptions': { args: ['--foo'] }
            },
            firefoxBrowser: {
                browserName: 'firefox',
                'moz:firefoxOptions': { args: ['-foo'] }
            }
        }
        applyHeadlessFlag(caps, true)
        expect(caps.chromeBrowser['goog:chromeOptions']).toEqual({
            args: ['--foo', '--headless', '--disable-gpu']
        })
        expect(caps.firefoxBrowser['moz:firefoxOptions']).toEqual({
            args: ['-foo', '-headless']
        })
    })

    it('should apply headless flag to the capabilities of each multi-remote instance', () => {
        const caps: any = {
            browserA: {
                capabilities: { browserName: 'chrome', 'goog:chromeOptions': { args: ['--foo'] } }
            },
            browserB: {
                capabilities: { browserName: 'firefox' }
            },
            browserC: {
                capabilities: { alwaysMatch: { browserName: 'chrome' }, firstMatch: [] }
            }
        }
        applyHeadlessFlag(caps, true)
        expect(caps.browserA.capabilities['goog:chromeOptions']).toEqual({
            args: ['--foo', '--headless', '--disable-gpu']
        })
        expect(caps.browserB.capabilities['moz:firefoxOptions']).toEqual({
            args: ['-headless']
        })
        expect(caps.browserC.capabilities.alwaysMatch['goog:chromeOptions']).toEqual({
            args: ['--headless', '--disable-gpu']
        })
    })
})

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

    describe('makeRelativeToCWD', () => {
        it('should resolve relative paths and glob patterns with forward or backward slashes from CWD', () => {
            expect(makeRelativeToCWD([
                'tests/filters/*.spec.ts',
                './tests/filters/test1.spec.ts',
                'tests\\filters\\*.spec.ts',
                ['./nested/*.spec.ts'],
                'mocha.test01*.js',
                'keyword'
            ])).toEqual([
                path.resolve(process.cwd(), 'tests/filters/*.spec.ts'),
                path.resolve(process.cwd(), './tests/filters/test1.spec.ts'),
                path.resolve(process.cwd(), 'tests\\filters\\*.spec.ts'),
                [path.resolve(process.cwd(), './nested/*.spec.ts')],
                'mocha.test01*.js',
                'keyword'
            ])
        })

        it('should convert file URLs to file paths', () => {
            const fileUrl = url.pathToFileURL(path.resolve(process.cwd(), 'tests/test1.spec.ts')).href
            expect(makeRelativeToCWD([fileUrl])).toEqual([
                url.fileURLToPath(fileUrl)
            ])
        })
    })
})
