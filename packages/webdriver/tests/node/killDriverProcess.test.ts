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
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('waits for ChromeDriver to delete its profile before it kills the driver', () => {
        killDriverProcess({ 'wdio:driverPID': 42, 'goog:chromeOptions': {}, chrome: { userDataDir: profile } } as WebdriverIO.Capabilities, true)
        expect(kill).not.toBeCalled()

        exists.mockReturnValue(false)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        expect(exists).toBeCalledWith(profile)
    })

    it('also waits for the profile of Edge', () => {
        killDriverProcess({ 'wdio:driverPID': 42, 'ms:edge': { userDataDir: 'C:\\Temp\\scoped_dir1234_567' } } as unknown as WebdriverIO.Capabilities, true)
        expect(kill).not.toBeCalled()
        exists.mockReturnValue(false)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it('kills the driver after 2 s when the profile does not go', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true)
        vi.advanceTimersByTime(1990)
        expect(kill).not.toBeCalled()
        vi.advanceTimersByTime(20)
        expect(kill).toBeCalledTimes(1)
    })

    it('kills the driver at once without a ChromeDriver profile', () => {
        killDriverProcess({ 'wdio:driverPID': 42, browserName: 'firefox' }, true)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it('kills the driver at once when the profile is a folder of the user', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: 'C:\\profiles\\mine' } } as unknown as WebdriverIO.Capabilities, true)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        expect(exists).not.toBeCalled()
    })

    it('kills a waiting driver at once when the process exits', () => {
        killDriverProcess({ 'wdio:driverPID': 43, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, true)
        expect(kill).not.toBeCalled()
        const onExit = process.listeners('exit').find((listener) => listener.name === 'killWaitingDrivers')!
        onExit(0)
        expect(kill).toBeCalledWith(43, 'SIGKILL')

        // the wait that comes later does not kill it again
        exists.mockReturnValue(false)
        vi.advanceTimersByTime(10)
        expect(kill).toBeCalledTimes(1)
    })

    it('does not kill the driver with shutdownDriver: false', () => {
        killDriverProcess({ 'wdio:driverPID': 42, chrome: { userDataDir: profile } } as unknown as WebdriverIO.Capabilities, false)
        vi.advanceTimersByTime(3000)
        expect(kill).not.toBeCalled()
    })
})
