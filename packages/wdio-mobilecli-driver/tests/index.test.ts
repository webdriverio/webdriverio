import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import MobilecliDriver from '../src/index.js'
import { ANDROID_DEVICE, IOS_DEVICE, getRequests, mockDevices } from './__fixtures__/server.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

interface Client {
    sessionId: string
    capabilities: WebdriverIO.Capabilities
    requestedCapabilities: WebdriverIO.Capabilities
    options: Record<string, unknown>
    isMobile: boolean
    isIOS: boolean
    isAndroid: boolean
    getWindowHandle (): Promise<string>
    deleteSession (): Promise<null>
    myCommand (): string
}

const newSession = (...args: Parameters<typeof MobilecliDriver.newSession>) => (
    MobilecliDriver.newSession(...args) as Promise<Client>
)

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('MobilecliDriver', () => {
    it('has the functions WebdriverIO calls on an automation protocol driver', () => {
        expect(MobilecliDriver.newSession).toBeTypeOf('function')
        expect(MobilecliDriver.attachToSession).toBeTypeOf('function')
        expect(MobilecliDriver.reloadSession).toBeTypeOf('function')
    })

    it('says that attaching and reloading are not supported yet', async () => {
        expect(() => MobilecliDriver.attachToSession())
            .toThrow('attachToSession: @wdio/mobilecli-driver does not support this yet')
        await expect(MobilecliDriver.reloadSession())
            .rejects.toThrow('reloadSession: @wdio/mobilecli-driver does not support this yet')
    })

    describe('newSession', () => {
        it('connects to the device of mobilecli:udid', async () => {
            const fetchMock = mockDevices(IOS_DEVICE, ANDROID_DEVICE)

            const client = await newSession({
                capabilities: { platformName: 'iOS', 'mobilecli:udid': IOS_DEVICE.id }
            })

            expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:12000/rpc')
            expect(getRequests(fetchMock)).toEqual([
                { method: 'device.resolve', params: { deviceId: IOS_DEVICE.id } },
                { method: 'device.info', params: { deviceId: IOS_DEVICE.id } }
            ])
            expect(client.sessionId).toMatch(/^[0-9a-f-]{36}$/)
            expect(client.capabilities).toEqual({ platformName: 'iOS', 'mobilecli:udid': IOS_DEVICE.id })
            expect(client.requestedCapabilities).toEqual({ platformName: 'iOS', 'mobilecli:udid': IOS_DEVICE.id })
        })

        it('connects to the only online device and fills the capabilities from it', async () => {
            const fetchMock = mockDevices(ANDROID_DEVICE)

            const client = await newSession({ capabilities: {} })

            expect(getRequests(fetchMock)).toEqual([
                { method: 'device.resolve', params: {} },
                { method: 'device.info', params: { deviceId: ANDROID_DEVICE.id } }
            ])
            expect(client.capabilities).toEqual({ platformName: 'Android', 'mobilecli:udid': ANDROID_DEVICE.id })
            expect(client.requestedCapabilities).toEqual({})
        })

        it('sets the mobile flags of WebdriverIO from the device', async () => {
            mockDevices(IOS_DEVICE)
            const ios = await newSession({ capabilities: {} })
            expect([ios.isMobile, ios.isIOS, ios.isAndroid]).toEqual([true, true, false])

            mockDevices(ANDROID_DEVICE)
            const android = await newSession({ capabilities: {} })
            expect([android.isMobile, android.isIOS, android.isAndroid]).toEqual([true, false, true])
        })

        it('gives every session its own id', async () => {
            mockDevices(IOS_DEVICE)
            const first = await newSession({ capabilities: {} })
            const second = await newSession({ capabilities: {} })
            expect(first.sessionId).not.toBe(second.sessionId)
        })

        it('reads capabilities in the W3C form', async () => {
            const fetchMock = mockDevices(IOS_DEVICE, ANDROID_DEVICE)

            const client = await newSession({
                capabilities: {
                    alwaysMatch: { platformName: 'Android' },
                    firstMatch: [{ 'mobilecli:udid': ANDROID_DEVICE.id }]
                }
            })

            expect(getRequests(fetchMock)[0]).toEqual({ method: 'device.resolve', params: { deviceId: ANDROID_DEVICE.id } })
            expect(client.capabilities).toEqual({ platformName: 'Android', 'mobilecli:udid': ANDROID_DEVICE.id })
        })

        it('uses the connection options of WebdriverIO for the server', async () => {
            const fetchMock = mockDevices(IOS_DEVICE)

            const client = await newSession({
                protocol: 'https',
                hostname: 'devices.example.com',
                port: 13000,
                capabilities: {}
            })

            expect(fetchMock.mock.calls[0][0]).toBe('https://devices.example.com:13000/rpc')
            expect(client.options).toEqual(expect.objectContaining({ hostname: 'devices.example.com', port: 13000 }))
        })

        it('adds the commands of WebdriverIO and calls the modifier', async () => {
            mockDevices(IOS_DEVICE)
            const modifier = vi.fn((client) => client)

            const client = await newSession(
                { capabilities: {} },
                modifier,
                { myCommand: { value: () => 'my command' } }
            )

            expect(client.myCommand()).toBe('my command')
            expect(modifier).toHaveBeenCalledTimes(1)
        })

        it('fails if the device is not of the requested platform', async () => {
            const fetchMock = mockDevices(ANDROID_DEVICE)

            await expect(newSession({ capabilities: { platformName: 'iOS' } })).rejects.toThrow(
                `The capability "platformName" is "iOS", but the device ${ANDROID_DEVICE.id} is an Android device. ` +
                'Set "mobilecli:udid" to a device of that platform, see "mobilecli devices".'
            )
            expect(getRequests(fetchMock).map(({ method }) => method)).toEqual(['device.resolve'])
        })

        it('fails with the reason of mobilecli if the device is not found', async () => {
            mockDevices(IOS_DEVICE)

            await expect(newSession({ capabilities: { 'mobilecli:udid': 'nope' } }))
                .rejects.toThrow('error finding device: device not found: nope')
        })

        it('says which capability to set if more than one device is online', async () => {
            mockDevices(IOS_DEVICE, ANDROID_DEVICE)

            await expect(newSession({ capabilities: { platformName: 'iOS' } })).rejects.toThrow(
                'error finding device: multiple devices found (2), please specify --device or MOBILECLI_DEVICE with one of: ' +
                `[${IOS_DEVICE.id}, ${ANDROID_DEVICE.id}]. In WebdriverIO, set the capability "mobilecli:udid" to one of them.`
            )
        })

        it('fails with a hint if the server is not running', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

            await expect(newSession({ capabilities: {} })).rejects.toThrow(
                'Could not reach the mobilecli server at http://localhost:12000/rpc. ' +
                'Install mobilecli ("npm install -g mobilecli") and start the server with "mobilecli server start".'
            )
        })
    })

    describe('a session', () => {
        it('answers what WebdriverIO asks for when a session starts', async () => {
            mockDevices(IOS_DEVICE)
            const client = await newSession({ capabilities: {} })
            expect(await client.getWindowHandle()).toBe('NATIVE_APP')
        })

        it('ends without a call to the server', async () => {
            const fetchMock = mockDevices(IOS_DEVICE)
            const client = await newSession({ capabilities: {} })
            fetchMock.mockClear()

            expect(await client.deleteSession()).toBe(null)
            expect(fetchMock).not.toHaveBeenCalled()
            await expect(client.getWindowHandle())
                .rejects.toThrow(`Can not run "getWindowHandle": the session ${client.sessionId} has ended`)
        })
    })
})
