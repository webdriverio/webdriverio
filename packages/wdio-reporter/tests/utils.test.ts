import path from 'node:path'
import url from 'node:url'
import { describe, expect, vi, it } from 'vitest'

import supportsColor from '../src/supportsColor.js'
import { sanitizeString, sanitizeCaps, pad, color, knownFramework, hookCountsAsFailure, isContextlessAllHook, specFilePath, relativeSpecFile } from '../src/utils.js'
import * as reporterExports from '../src/index.js'

vi.mock('../src/supportsColor.js', () => {
    return {
        default: new Proxy({
            stdout: false
        }, {
            get: (ctx, prop) => {
                if (prop === 'stdout') {
                    return ctx.stdout
                }
                if (prop === 'set') {
                    return (val: boolean) => {
                        ctx.stdout = val
                    }
                }
            }
        })
    }
})

describe('utils', () => {
    it('sanitizeString', () => {
        expect(sanitizeString('Chrome v64 Windows XP my-awesome.app'))
            .toBe('chromev64windowsxpmy-awesome_app')
    })

    it('sanitizeCaps', () => {
        expect(sanitizeCaps()).toBe('')
        expect(sanitizeCaps({
            browserName: 'chrome',
            platform: 'Windows 10',
            version: 'latest',
            'appium:app': 'my-awesome.app'
        })).toBe('chrome.latest.windows10.my-awesome_app')
        expect(sanitizeCaps({
            browserName: 'chrome',
            platformName: 'Windows 10',
            browserVersion: 'latest'
        })).toBe('chrome.latest.windows10')
        expect(sanitizeCaps({
            deviceName: 'Android Emulator',
            platformName: 'Android',
            'appium:platformVersion': '6.4',
            'appium:app': 'my-awesome.apk'
        })).toBe('android.androidemulator.6_4.my-awesome_apk')
    })

    it('sanitizeCaps drops the credentials, the query and the hash of an app URL', () => {
        const phone = { deviceName: 'Pixel 9', platformName: 'Android', 'appium:platformVersion': '15' }
        expect(sanitizeCaps({ ...phone, 'appium:app': 'https://user:secret@storage.example.com/builds/app.apk?token=abc123#part' }))
            .toBe('android.pixel9.15.app_apk')
        expect(sanitizeCaps({ browserName: 'chrome', 'appium:app': 'https://host/app.apk?token=abc123' })).toBe('chrome.app_apk')
        expect(sanitizeCaps({ browserName: 'chrome', 'appium:app': 'https://user:secret@apps.example.com/?token=abc123' })).toBe('chrome.apps_example_com')
        expect(sanitizeCaps({ ...phone, 'appium:app': 'sauce-storage:my-app.zip' })).toBe('android.pixel9.15.sauce-storage:my-app_zip')
        expect(sanitizeCaps({ ...phone, 'appium:app': 'bs://abcdef' })).toBe('android.pixel9.15.abcdef')
    })

    it('pad', () => {
        expect(pad('foobar', 10)).toBe('    foobar')
    })

    it('color', () => {
        expect(color('fast', 'foobar')).toBe('foobar')
        // @ts-ignore
        supportsColor.set(true)
        expect(color('fast', 'foobar')).toBe('\u001b[90mfoobar\u001b[0m')
    })
})

// the forms of initializePlugin (wdio-utils initializePlugin.ts): a short name in any case, the scoped package
describe('knownFramework', () => {
    it.each([
        ['cucumber', 'cucumber'], ['Cucumber', 'cucumber'], ['@wdio/cucumber-framework', 'cucumber'],
        ['mocha', 'mocha'], ['MOCHA', 'mocha'], ['@wdio/mocha-framework', 'mocha'],
        ['jasmine', 'jasmine'], ['@wdio/jasmine-framework', 'jasmine'],
        ['vitest', 'vitest'], ['@wdio/vitest-framework', 'vitest'],
    ])('gives %s as %s', (name, expected) => {
        expect(knownFramework(name)).toBe(expected)
    })

    it.each([undefined, '', '@serenity-js/webdriverio', 'my-custom-framework', '/abs/path/to/framework.js', 'file:///abs/framework.js'])('gives no known framework for %s', (name) => {
        expect(knownFramework(name)).toBeUndefined()
    })
})

describe('specFilePath', () => {
    it('gives a file URL as a path', () => {
        const file = path.resolve('project', 'a.spec.js')
        expect(specFilePath(url.pathToFileURL(file).href)).toBe(file)
    })
    // an encoded `/` is not valid in a file path on any platform
    it('keeps a URL that names no path', () => {
        expect(specFilePath('file:///project/a%2Fb.spec.js')).toBe('file:///project/a%2Fb.spec.js')
    })
    it('is exported for the reporters', () => {
        expect(reporterExports.specFilePath).toBe(specFilePath)
    })
})

describe('relativeSpecFile', () => {
    const cwd = path.resolve('project')
    it('gives the path of a spec file in the working folder from there', () => {
        expect(relativeSpecFile(path.join(cwd, 'specs', 'a.spec.js'), cwd)).toBe(path.join('specs', 'a.spec.js'))
    })
    it.each([
        ['outside the working folder', path.resolve(cwd, '..', 'other', 'a.spec.js')],
        ['in a folder whose name starts with the name of the working folder', `${cwd}lication${path.sep}a.spec.js`],
        ['that is relative', path.join('specs', 'a.spec.js')],
        ['that is the working folder', cwd]
    ])('gives nothing for a spec file %s', (_, file) => {
        expect(relativeSpecFile(file, cwd)).toBeUndefined()
    })
})

describe('hookCountsAsFailure', () => {
    const error = new Error('boom')
    it('counts a failed hook', () => {
        expect(hookCountsAsFailure({ error })).toBe(true)
    })
    it('does not count a passed hook', () => {
        expect(hookCountsAsFailure({})).toBe(false)
    })
    it('does not count a hook whose error is the failure of a test or of a retried attempt', () => {
        expect(hookCountsAsFailure({ error, failedTestUid: 'test-1' })).toBe(false)
        expect(hookCountsAsFailure({ error, retried: true })).toBe(false)
    })
})

describe('isContextlessAllHook', () => {
    it('is true only for a beforeAll / afterAll with hookKind and no context', () => {
        expect(isContextlessAllHook({ hookKind: 'beforeAll' })).toBe(true)
        expect(isContextlessAllHook({ hookKind: 'afterAll' })).toBe(true)
        expect(isContextlessAllHook({ hookKind: 'afterAll', contextId: 'c1' })).toBe(false)
        expect(isContextlessAllHook({ hookKind: 'beforeEach' })).toBe(false)
        expect(isContextlessAllHook({})).toBe(false)
    })
})
