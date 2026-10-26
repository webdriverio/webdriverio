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

    it('constructor', () => {
        new WDIOReporter({ logFile: '/some/logpath' })
        expect(eventsOnSpy.mock.calls).toHaveLength(21)
        expect(eventsOnSpy).toBeCalledWith('context:end', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:beforeCommand', expect.any(Function))
        expect(eventsOnSpy).toBeCalledWith('client:afterCommand', expect.any(Function))
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
})
