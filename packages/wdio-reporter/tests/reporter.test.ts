import { describe, expect, vi, it, afterAll, afterEach } from 'vitest'

import { EventEmitter } from 'node:events'
import type { WriteStream } from 'node:fs'
import fs from 'node:fs'

import WDIOReporter, { getBrowserName, getBrowserNames, getSessionNames } from '../src/index.js'

vi.mock('node:fs', () => ({
    default: {
        createWriteStream: vi.fn().mockReturnValue({
            write: vi.fn(),
            end: vi.fn((cb) => cb())
        }),
        mkdirSync: vi.fn()
    }
}))

describe('WDIOReporter', () => {
    const eventsOnSpy = vi.spyOn(EventEmitter.prototype, 'on')

    it('marks its root suite, which has the tests and hooks outside every suite', () => {
        const reporter = new WDIOReporter({ logFile: '/some/logpath' })
        expect(reporter.currentSuites[0].isRoot).toBe(true)
        reporter.emit('suite:start', { type: 'suite:start', uid: 'suite-1', title: '(root)', fullTitle: '(root)', file: '/a.spec.js', cid: '0-0' })
        expect('isRoot' in reporter.currentSuites[1]).toBe(false)
        // only the base reporter marks its own root suite
        reporter.emit('suite:start', { type: 'suite:start', uid: 'suite-2', title: 'b', fullTitle: 'b', file: '/a.spec.js', cid: '0-0', isRoot: true })
        expect('isRoot' in reporter.currentSuites[2]).toBe(false)
    })

    it('constructor', () => {
        new WDIOReporter({ logFile: '/some/logpath' })
        expect(eventsOnSpy.mock.calls).toHaveLength(23)
        expect(eventsOnSpy).toBeCalledWith('context:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:beforeCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:beforeUserCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterUserCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:beforeAssertion', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterAssertion', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('runner:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('suite:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('suite:retry', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('hook:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('hook:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:start', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:pass', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:skip', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:fail', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:pending', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:retry', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('test:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('suite:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('runner:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:beforeCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterCommand', expect.any(Function))
    })

    it('should be by default synchronised', () => {
        const reporter = new WDIOReporter({ logFile: '/some/log/path' })
        expect(reporter.isSynchronised).toBe(true)
    })

    it('should provide a function to write to output stream', () => {
        const reporter = new WDIOReporter({ logFile: '/some/log/path' })
        reporter.write('foobar')
        expect(reporter.outputStream.write).toBeCalledWith('foobar')
    })

    it('should allow an own writeable stream', () => {
        const customLogStream = fs.createWriteStream('/foo/bar')
        const reporter = new WDIOReporter({ stdout: true, writeStream: customLogStream })
        reporter.write('foobar')

        expect(customLogStream.write).toBeCalledWith('foobar')
    })

    it('should set isContentPresent to true when content is passed to write()', () => {
        const options = { stdout: true, writeStream: { write: vi.fn() } as unknown as WriteStream }
        const reporter = new WDIOReporter(options)
        expect(reporter.isContentPresent).toBe(false)
        reporter.write('foobar')
        expect(reporter.isContentPresent).toBe(true)
    })

    describe('outputDir options', () => {
        it('should create directory if outputDir given and not existing', () => {
            const options = { outputDir: './tempDir', logFile: '' }
            new WDIOReporter(options)

            expect(fs.mkdirSync).toHaveBeenCalled()
            expect(fs.mkdirSync).toHaveBeenCalledWith('./tempDir', { recursive: true })
        })

        afterEach(() => {
            vi.mocked(fs.mkdirSync).mockClear()
        })
    })

    afterAll(() => {
        eventsOnSpy.mockRestore()
    })
})

describe('getBrowserNames', () => {
    it('gives the browser of a session', () => {
        expect(getBrowserNames({ browserName: 'chrome', browserVersion: '130' })).toEqual(['chrome'])
    })

    it('gives the browser of w3c capabilities', () => {
        expect(getBrowserNames({ alwaysMatch: { browserName: 'firefox' }, firstMatch: [] })).toEqual(['firefox'])
    })

    it('gives the app, else the device of an Appium session', () => {
        expect(getBrowserNames({ 'appium:deviceName': 'iPhone 15', 'appium:bundleId': 'com.example.app' })).toEqual(['com.example.app'])
        // Appium returns its capabilities without the `appium:` prefix
        expect(getBrowserNames({ platformName: 'iOS', deviceName: 'iPhone 15' } as WebdriverIO.Capabilities)).toEqual(['iPhone 15'])
    })

    it('gives one name for each multi-remote instance, in their order', () => {
        expect(getBrowserNames({
            myChrome: { browserName: 'chrome' },
            myPhone: { platformName: 'iOS', deviceName: 'iPhone 15' },
            otherChrome: { browserName: 'chrome' }
        }, true)).toEqual(['chrome', 'iPhone 15', 'chrome'])
    })

    it('reads the requested multi-remote capabilities of a session that did not start', () => {
        expect(getBrowserNames({
            myChrome: { capabilities: { browserName: 'chrome' } },
            myFirefox: { capabilities: { alwaysMatch: { browserName: 'firefox' } } }
        }, true)).toEqual(['chrome', 'firefox'])
    })

    it('leaves out a session with no browser and no device', () => {
        expect(getBrowserNames({ platformName: 'linux' })).toEqual([])
        expect(getBrowserNames(undefined)).toEqual([])
        expect(getBrowserNames({ a: { platformName: 'linux' }, b: { browserName: 'edge' } }, true)).toEqual(['edge'])
    })

    it('keeps the results of getBrowserName', () => {
        expect(getBrowserName({ browserName: 'chrome' })).toBe('chrome')
        expect(getBrowserName({ 'appium:app': '/path/to/my.app' })).toBe('my.app')
        expect(getBrowserName({})).toBe('')
    })
})

describe('getSessionNames', () => {
    const phone = { platformName: 'iOS', 'appium:deviceName': 'iPhone 17', 'appium:platformVersion': '18.2' }

    it('names an Appium app with its device and platform version', () => {
        expect(getSessionNames({ ...phone, 'appium:app': '/Users/me/MyApp.app' })).toEqual(['MyApp.app on iPhone 17 (iOS 18.2)'])
    })

    it('names a mobile browser with its device and platform version', () => {
        expect(getSessionNames({ ...phone, browserName: 'safari' })).toEqual(['safari on iPhone 17 (iOS 18.2)'])
    })

    it('leaves out the version when there is none', () => {
        expect(getSessionNames({ platformName: 'iOS', 'appium:deviceName': 'iPhone 17', 'appium:app': '/Users/me/MyApp.app' }))
            .toEqual(['MyApp.app on iPhone 17 (iOS)'])
    })

    it('names an Android app by its package', () => {
        expect(getSessionNames({
            platformName: 'Android', 'appium:deviceName': 'Pixel 9', 'appium:platformVersion': '15', 'appium:appPackage': 'com.example'
        })).toEqual(['com.example on Pixel 9 (Android 15)'])
    })

    it('reads the capabilities that Appium returns, without the prefix', () => {
        expect(getSessionNames({ platformName: 'iOS', deviceName: 'iPhone 17', platformVersion: '18.2', app: '/Users/me/MyApp.app' }))
            .toEqual(['MyApp.app on iPhone 17 (iOS 18.2)'])
    })

    it('does not change the name of a desktop browser', () => {
        expect(getSessionNames({ browserName: 'chrome', browserVersion: '130', platformName: 'mac' })).toEqual(['chrome'])
    })

    it('names a session with only a device', () => {
        expect(getSessionNames(phone)).toEqual(['iPhone 17 (iOS 18.2)'])
    })

    it('names a device with a version and no platform name', () => {
        expect(getSessionNames({ 'appium:deviceName': 'iPhone 17', 'appium:platformVersion': '18.2' })).toEqual(['iPhone 17 (18.2)'])
    })

    it('reads w3c capabilities', () => {
        expect(getSessionNames({ alwaysMatch: { ...phone, browserName: 'safari' }, firstMatch: [] })).toEqual(['safari on iPhone 17 (iOS 18.2)'])
    })

    it('gives one name for each multi-remote instance, in their order', () => {
        expect(getSessionNames({
            myChrome: { browserName: 'chrome' },
            myPhone: { capabilities: { ...phone, 'appium:app': '/Users/me/MyApp.app' } },
            otherChrome: { browserName: 'firefox' }
        }, true)).toEqual(['chrome', 'MyApp.app on iPhone 17 (iOS 18.2)', 'firefox'])
    })

    it('leaves out a session with no name', () => {
        expect(getSessionNames({})).toEqual([])
        expect(getSessionNames(undefined)).toEqual([])
        expect(getSessionNames({ platformName: 'linux' })).toEqual([])
    })

    describe('a remote app', () => {
        const url = 'https://user:secret@storage.example.com/builds/app.apk?token=abc123#part'
        const pixel = { platformName: 'Android', 'appium:deviceName': 'Pixel 9', 'appium:platformVersion': '15' }

        it('keeps only the file name of an app URL, without credentials, query and hash', () => {
            expect(getSessionNames({ ...pixel, 'appium:app': url })).toEqual(['app.apk on Pixel 9 (Android 15)'])
            expect(getSessionNames({ ...pixel, app: 'ftp://host/dir/my%20app.apk' })).toEqual(['my app.apk on Pixel 9 (Android 15)'])
            expect(getSessionNames({ ...pixel, 'appium:app': 'https://user:secret@apps.example.com/?token=abc123' })).toEqual(['apps.example.com on Pixel 9 (Android 15)'])
        })

        it('keeps only the file name in w3c, multi-remote and failed-start capabilities', () => {
            expect(getSessionNames({ alwaysMatch: { ...pixel, 'appium:app': url }, firstMatch: [] })).toEqual(['app.apk on Pixel 9 (Android 15)'])
            expect(getSessionNames({ phone: { capabilities: { ...pixel, 'appium:app': url } } }, true)).toEqual(['app.apk on Pixel 9 (Android 15)'])
        })

        it('keeps a file name that is not valid URL encoding', () => {
            expect(getSessionNames({ ...pixel, 'appium:app': 'https://u:p@host/a/100%.apk?token=1' })).toEqual(['100%.apk on Pixel 9 (Android 15)'])
        })

        it('keeps the other forms of an app', () => {
            expect(getSessionNames({ ...pixel, 'appium:app': 'sauce-storage:my-app.zip' })).toEqual(['my-app.zip on Pixel 9 (Android 15)'])
            expect(getSessionNames({ ...pixel, 'appium:app': '/Users/me/app.apk' })).toEqual(['app.apk on Pixel 9 (Android 15)'])
            expect(getSessionNames({ ...pixel, 'appium:app': 'bs://abcdef' })).toEqual(['bs://abcdef on Pixel 9 (Android 15)'])
        })

        it('names an app URL in getBrowserName and getBrowserNames by its file name', () => {
            expect(getBrowserName({ 'appium:app': url })).toBe('app.apk')
            expect(getBrowserName({ app: 'https://user:secret@apps.example.com/?token=abc123' } as WebdriverIO.Capabilities)).toBe('apps.example.com')
            expect(getBrowserNames({ 'appium:app': url })).toEqual(['app.apk'])
            expect(getBrowserNames({ a: { 'appium:app': url }, b: { browserName: 'chrome' } }, true)).toEqual(['app.apk', 'chrome'])
        })

        it('keeps the other forms of an app in getBrowserName', () => {
            expect(getBrowserName({ 'appium:app': 'sauce-storage:my-app.zip' })).toBe('my-app.zip')
            expect(getBrowserName({ 'appium:app': 'bs://abcdef' })).toBe('bs://abcdef')
            expect(getBrowserName({ 'appium:app': url, browserName: 'chrome' })).toBe('chrome')
            expect(getBrowserName({ 'appium:app': url, 'appium:bundleId': 'com.example.app' })).toBe('com.example.app')
        })
    })
})
