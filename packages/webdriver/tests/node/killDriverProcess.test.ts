import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { killDriverProcess } from '../../src/node/utils.js'

const log = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn() }))
vi.mock('@wdio/logger', () => ({ default: () => log }))

/**
 * ChromeDriver deletes the temporary profile it created a few ms after it
 * answered `deleteSession`; a driver killed before that leaves the profile
 */
describe('killDriverProcess', () => {
    const profile = '/tmp/org.chromium.Chromium.scoped_dir.abc123'
    const requested = { browserName: 'chrome' } as WebdriverIO.Capabilities
    const session = (pid: number, userDataDir = profile) => ({ 'wdio:driverPID': pid, chrome: { userDataDir } }) as unknown as WebdriverIO.Capabilities
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

    it('waits for the driver to delete its profile, then kills the driver', async () => {
        let resolved = false
        const done = killDriverProcess(session(42), true, requested).then(() => { resolved = true })
        await vi.advanceTimersByTimeAsync(10)
        expect(kill).not.toBeCalled()
        // deleteSession waits on this promise: it stays pending until the kill
        expect(resolved).toBe(false)

        exists.mockReturnValue(false)
        await vi.advanceTimersByTimeAsync(10)
        await done
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        expect(exists).toBeCalledWith(profile)
    })

    it('also waits for the profile of Edge', async () => {
        const done = killDriverProcess({ 'wdio:driverPID': 42, msedge: { userDataDir: 'C:\\Temp\\scoped_dir1234_567' } } as unknown as WebdriverIO.Capabilities, true, { browserName: 'MicrosoftEdge' })
        await vi.advanceTimersByTimeAsync(10)
        expect(kill).not.toBeCalled()
        exists.mockReturnValue(false)
        await vi.advanceTimersByTimeAsync(10)
        await done
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it('waits for a profile of any name that the driver created', async () => {
        const done = killDriverProcess(session(42, '/var/folders/ns/T/.org.chromium.Chromium.wPrPpk'), true, requested)
        await vi.advanceTimersByTimeAsync(10)
        expect(kill).not.toBeCalled()
        exists.mockReturnValue(false)
        await vi.advanceTimersByTimeAsync(10)
        await done
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it.each([
        { alwaysMatch: { browserName: 'chrome' } },
        { alwaysMatch: {}, firstMatch: [{ browserName: 'chrome' }] }
    ])('waits with W3C requested capabilities: %j', async (requestedCapabilities) => {
        const done = killDriverProcess(session(42), true, requestedCapabilities as WebdriverIO.Capabilities)
        await vi.advanceTimersByTimeAsync(10)
        expect(kill).not.toBeCalled()
        exists.mockReturnValue(false)
        await vi.advanceTimersByTimeAsync(10)
        await done
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it('kills the driver after 2 s when the profile does not go', async () => {
        const done = killDriverProcess(session(42), true, requested)
        await vi.advanceTimersByTimeAsync(1990)
        expect(kill).not.toBeCalled()
        await vi.advanceTimersByTimeAsync(20)
        await done
        expect(kill).toBeCalledTimes(1)
        expect(log.warn).toBeCalledWith(`The driver did not delete its temporary profile ${profile} within 2000ms`)
    })

    it('waits for two drivers at the same time', async () => {
        const first = killDriverProcess(session(42), true, requested)
        const second = killDriverProcess(session(43, `${profile}2`), true, requested)
        exists.mockImplementation((dir) => dir === `${profile}2`)
        await vi.advanceTimersByTimeAsync(10)
        await first
        expect(kill).toBeCalledTimes(1)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        exists.mockReturnValue(false)
        await vi.advanceTimersByTimeAsync(10)
        await second
        expect(kill).toBeCalledWith(43, 'SIGKILL')
    })

    it('kills the driver at once without a driver profile', async () => {
        await killDriverProcess({ 'wdio:driverPID': 42, browserName: 'firefox' }, true, { browserName: 'firefox' })
        expect(kill).toBeCalledWith(42, 'SIGKILL')
    })

    it.each([
        { browserName: 'chrome', 'goog:chromeOptions': { args: ['--user-data-dir=/tmp/scoped_dir_mine'] } },
        { alwaysMatch: { browserName: 'chrome', 'goog:chromeOptions': { args: ['user-data-dir=/tmp/scoped_dir_mine'] } } },
        { alwaysMatch: { browserName: 'chrome' }, firstMatch: [{ 'goog:chromeOptions': { args: ['--user-data-dir=/tmp/scoped_dir_mine'] } }] },
        { browserName: 'MicrosoftEdge', 'ms:edgeOptions': { args: ['--user-data-dir=/tmp/scoped_dir_mine'] } }
    ])('kills the driver at once when the user set the profile: %j', async (requestedCapabilities) => {
        await killDriverProcess(session(42, '/tmp/scoped_dir_mine'), true, requestedCapabilities as WebdriverIO.Capabilities)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        expect(exists).not.toBeCalled()
    })

    it.each([
        ['not given', undefined],
        ['empty, from attach()', {}],
        ['the session capabilities, from attachToSession()', { browserName: 'chrome', chrome: { userDataDir: '/my/profile' } }]
    ])('kills the driver at once when the requested capabilities are %s', async (_, requestedCapabilities) => {
        await killDriverProcess(session(42, '/my/profile'), true, requestedCapabilities as WebdriverIO.Capabilities)
        expect(kill).toBeCalledWith(42, 'SIGKILL')
        expect(exists).not.toBeCalled()
    })

    it('does not kill the driver with shutdownDriver: false', async () => {
        await killDriverProcess(session(42), false, requested)
        await vi.advanceTimersByTimeAsync(3000)
        expect(kill).not.toBeCalled()
    })
})
