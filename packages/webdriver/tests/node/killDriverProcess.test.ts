import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { killDriverProcess } from '../../src/node/utils.js'

vi.mock('@wdio/logger', () => ({ default: () => ({ info: vi.fn(), warn: vi.fn() }) }))

/**
 * ChromeDriver deletes the temporary profile it created a few ms after it
 * answered `deleteSession`; a driver killed before that leaves the profile
 */
describe('killDriverProcess', () => {
    const profile = '/tmp/org.chromium.Chromium.scoped_dir.abc123'
    let kill: ReturnType<typeof vi.spyOn>
    let exists: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.useFakeTimers()
        kill = vi.spyOn(process, 'kill').mockReturnValue(true)
        exists = vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    })

    afterEach(() => {
        // no driver of a failed test may wait until the real exit of the test worker
        exists.mockReturnValue(false)
        process.listeners('exit').find((listener) => listener.name === 'killWaitingDrivers')?.(0)
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('waits for ChromeDriver to delete its profile before it kills the driver', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        expect(kill).not.toBeCalled()

        exists.mockReturnValue(false)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        expect(exists).toBeCalledWith(profile)
    })

    it('also waits for the profile of Edge', () => {
        killDriverProcess({ 'wdio:driverPID': 42, msedge: { userDataDir: 'C:\\Temp\\scoped_dir1234_567' } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'MicrosoftEdge' })
        expect(kill).not.toBeCalled()
        exists.mockReturnValue(false)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it('kills the driver after 2 s when the profile does not go', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        vi.advanceTimersByTime(1990)
        expect(kill).not.toBeCalled()
        vi.advanceTimersByTime(20)
        expect(kill).toBeCalledTimes(1)
    })

    it('kills the driver at once without a ChromeDriver profile', () => {
        killDriverProcess({ 'wdio:driverPID': 42, browserName: 'firefox' }, true)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it('waits for a profile of any name that the driver created', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: '/var/folders/ns/T/.org.chromium.Chromium.wPrPpk' } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        expect(kill).not.toBeCalled()
        exists.mockReturnValue(false)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it.each([
        { browserName: 'chrome', 'goog:chromeOptions': { args: ['--user-data-dir=/tmp/scoped_dir_mine'] } },
        { alwaysMatch: { browserName: 'chrome', 'goog:chromeOptions': { args: ['user-data-dir=/tmp/scoped_dir_mine'] } } },
        { browserName: 'MicrosoftEdge', 'ms:edgeOptions': { args: ['--user-data-dir=/tmp/scoped_dir_mine'] } }
    ])('kills the driver at once when the user set the profile: %j', (requested) => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: '/tmp/scoped_dir_mine' } } as unknown as WebdriverIO.Capabilities, true, requested as WebdriverIO.Capabilities)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        expect(exists).not.toBeCalled()
    })

    it('kills the driver at once when the requested capabilities are not known', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it('waits for the profiles of two drivers at the same time', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        killDriverProcess({ 'wdio:driverPID': 43, chrome: { userDataDir: `${profile}2` } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        exists.mockImplementation((dir) => dir === `${profile}2`)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledTimes(1)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        exists.mockReturnValue(false)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledWith(43, 'SIGKILL')
    })

    it('waits a short time for the profile when the process exits during the wait', () => {
        killDriverProcess({ 'wdio:driverPID': 43, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        exists.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false)
        const onExit = process.listeners('exit').find((listener) => listener.name === 'killWaitingDrivers')!
        onExit(0)
        expect(exists.mock.calls.length).toBeGreaterThanOrEqual(3)
        expect(kill).toBeCalledWith(43, 'SIGKILL')
    })

    it('kills at exit after at most 200 ms when the profile does not go', () => {
        killDriverProcess({ 'wdio:driverPID': 43, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        const onExit = process.listeners('exit').find((listener) => listener.name === 'killWaitingDrivers')!
        const start = performance.now()
        onExit(0)
        expect(performance.now() - start).toBeLessThan(400)
        expect(kill).toBeCalledWith(43, 'SIGKILL')
    })

    it('kills a waiting driver when the process exits', () => {
        killDriverProcess({ 'wdio:driverPID': 43, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'chrome' })
        expect(kill).not.toBeCalled()
        exists.mockReturnValue(false)
        const onExit = process.listeners('exit').find((listener) => listener.name === 'killWaitingDrivers')!
        onExit(0)
        expect(kill).toBeCalledWith(43, 'SIGKILL')

        // the wait that comes later does not kill it again
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledTimes(1)
    })

    it('does not kill the driver with shutdownDriver: false', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, false, { browserName: 'chrome' })
        vi.advanceTimersByTime(3000)
        expect(kill).not.toBeCalled()
    })
})
