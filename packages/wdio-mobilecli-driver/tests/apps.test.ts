import path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'

import MobilecliDriver from '../src/index.js'
import { installAndLaunchApp, installApp, launchApp } from '../src/apps.js'
import { RpcClient } from '../src/rpc.js'
import { ANDROID_DEVICE, IOS_DEVICE, ServerError, deviceHandlers, getRequests, mockServer } from './__fixtures__/server.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const APP_PATH = '/apps/ios.simulator.wdio.native.app.zip'
const APP = { packageName: 'org.reactjs.native.example.wdiodemoapp', version: '1.0.8' }

/**
 * the answer of `device.apps.install`, see `InstallAppResult` in
 * `mobilecli/commands/apps.go`
 */
const installed = (app?: object) => ({
    message: `Installed app from '${APP_PATH}' on device ${IOS_DEVICE.id}`,
    ...(app ? { app } : {})
})

const rpc = () => new RpcClient('http://localhost:12000/rpc', 1000)

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('installApp', () => {
    it('installs the app on the device and returns what mobilecli read from the file', async () => {
        const fetchMock = mockServer({ 'device.apps.install': () => installed(APP) })

        expect(await installApp(rpc(), IOS_DEVICE.id, APP_PATH)).toEqual(APP)
        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.apps.install', params: { deviceId: IOS_DEVICE.id, path: APP_PATH } }
        ])
    })

    it('returns nothing if mobilecli could not read the app file', async () => {
        mockServer({ 'device.apps.install': () => installed() })

        expect(await installApp(rpc(), IOS_DEVICE.id, APP_PATH)).toBe(undefined)
    })

    it('gives the install the time of the setting installTimeout, not the timeout of other calls', async () => {
        mockServer({ 'device.apps.install': () => installed(APP) })
        const timeout = vi.spyOn(AbortSignal, 'timeout')

        await installApp(rpc(), IOS_DEVICE.id, APP_PATH)
        expect(timeout).toHaveBeenLastCalledWith(190000)

        await installApp(new RpcClient('http://localhost:12000/rpc', 600000), IOS_DEVICE.id, APP_PATH)
        expect(timeout).toHaveBeenLastCalledWith(190000)

        await installApp(rpc(), IOS_DEVICE.id, APP_PATH, 300000)
        expect(timeout).toHaveBeenLastCalledWith(300000)
    })

    it('waits less with a shorter setting installTimeout', async () => {
        mockServer({ 'device.apps.install': () => installed(APP) })
        const timeout = vi.spyOn(AbortSignal, 'timeout')

        await installApp(new RpcClient('http://localhost:12000/rpc', 120000), IOS_DEVICE.id, APP_PATH, 30000)

        expect(timeout).toHaveBeenLastCalledWith(30000)
    })

    it('throws the reason of mobilecli if the install fails', async () => {
        mockServer({
            'device.apps.install': () => {
                throw new ServerError(`failed to install app on device ${IOS_DEVICE.id}: failed to stat path: no such file`)
            }
        })

        await expect(installApp(rpc(), IOS_DEVICE.id, '/nope.zip'))
            .rejects.toThrow(`failed to install app on device ${IOS_DEVICE.id}: failed to stat path: no such file`)
    })

    it.each([undefined, '', 42, {}])('does not call the server with the path %j', async (appPath) => {
        const fetchMock = mockServer({})

        await expect(installApp(rpc(), IOS_DEVICE.id, appPath as string))
            .rejects.toThrow('The path of the app to install has to be a string, got: ')
        expect(fetchMock).not.toHaveBeenCalled()
    })
})

/**
 * the answer of `device.apps.foreground`
 */
const inForeground = (packageName = APP.packageName) => () => ({ packageName, appName: 'wdiodemoapp', version: '1.0.8' })

describe('launchApp', () => {
    it('starts the app and waits until it is in the foreground, as device.launchApp() of Mobilewright', async () => {
        const answers = ['com.apple.springboard', 'com.apple.springboard', APP.packageName]
        const fetchMock = mockServer({
            'device.apps.launch': () => undefined,
            'device.apps.foreground': () => ({ packageName: answers.shift() })
        })

        await launchApp(rpc(), ANDROID_DEVICE, APP.packageName)

        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.apps.launch', params: { deviceId: ANDROID_DEVICE.id, bundleId: APP.packageName } },
            { method: 'device.apps.foreground', params: { deviceId: ANDROID_DEVICE.id } },
            { method: 'device.apps.foreground', params: { deviceId: ANDROID_DEVICE.id } },
            { method: 'device.apps.foreground', params: { deviceId: ANDROID_DEVICE.id } }
        ])
    })

    it('asks for the foreground app on iOS before the start, so the agent of mobilecli does not send the app to the background', async () => {
        const fetchMock = mockServer({
            'device.apps.launch': () => undefined,
            'device.apps.foreground': inForeground()
        })

        await launchApp(rpc(), IOS_DEVICE, APP.packageName)

        expect(getRequests(fetchMock).map(({ method }) => method)).toEqual([
            'device.apps.foreground', 'device.apps.launch', 'device.apps.foreground'
        ])
    })

    it('starts the app on iOS if mobilecli can not say what is in the foreground before the start', async () => {
        let started = false
        mockServer({
            'device.apps.launch': () => {
                started = true
            },
            'device.apps.foreground': () => {
                if (!started) {
                    throw new ServerError('no foreground app')
                }
                return inForeground()()
            }
        })

        await expect(launchApp(rpc(), IOS_DEVICE, APP.packageName)).resolves.toBe(undefined)
    })

    it('knows the foreground app by its bundleId too', async () => {
        mockServer({
            'device.apps.launch': () => undefined,
            'device.apps.foreground': () => ({ bundleId: APP.packageName })
        })

        await expect(launchApp(rpc(), ANDROID_DEVICE, APP.packageName)).resolves.toBe(undefined)
    })

    it('fails if the app is not in the foreground when the time is up', async () => {
        mockServer({
            'device.apps.launch': () => undefined,
            'device.apps.foreground': inForeground('com.apple.springboard')
        })

        await expect(launchApp(rpc(), ANDROID_DEVICE, APP.packageName, 150)).rejects.toThrow(
            `The app ${APP.packageName} was started, but it was not in the foreground within 150ms ` +
            '(in the foreground: com.apple.springboard). ' +
            'Give it more time with "appLaunchTimeout" in the capability "mobilecli:options".'
        )
    })

    it('goes on if mobilecli can not determine the foreground app, a known problem on some Android devices', async () => {
        const fetchMock = mockServer({
            'device.apps.launch': () => undefined,
            'device.apps.foreground': () => {
                throw new ServerError('could not determine foreground app')
            }
        })

        await expect(launchApp(rpc(), ANDROID_DEVICE, APP.packageName)).resolves.toBe(undefined)
        expect(getRequests(fetchMock)).toHaveLength(2)
    })

    it('fails on any other error of the foreground app', async () => {
        mockServer({
            'device.apps.launch': () => undefined,
            'device.apps.foreground': () => {
                throw new ServerError('device is offline')
            }
        })

        await expect(launchApp(rpc(), ANDROID_DEVICE, APP.packageName)).rejects.toThrow('device is offline')
    })
})

describe('installAndLaunchApp', () => {
    it('starts the app with the id that mobilecli read from the file', async () => {
        const fetchMock = mockServer({
            'device.apps.install': () => installed(APP),
            'device.apps.launch': () => undefined,
            'device.apps.foreground': inForeground()
        })

        expect(await installAndLaunchApp(rpc(), ANDROID_DEVICE, APP_PATH)).toEqual(APP)
        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.apps.install', params: { deviceId: ANDROID_DEVICE.id, path: APP_PATH } },
            { method: 'device.apps.launch', params: { deviceId: ANDROID_DEVICE.id, bundleId: APP.packageName } },
            { method: 'device.apps.foreground', params: { deviceId: ANDROID_DEVICE.id } }
        ])
    })

    it('does not start an app without an id', async () => {
        const fetchMock = mockServer({ 'device.apps.install': () => installed() })

        expect(await installAndLaunchApp(rpc(), IOS_DEVICE, APP_PATH)).toBe(undefined)
        expect(getRequests(fetchMock).map(({ method }) => method)).toEqual(['device.apps.install'])
    })
})

describe('the capability mobilecli:app', () => {
    it('installs and starts the app on the device of the session', async () => {
        const fetchMock = mockServer({
            ...deviceHandlers(IOS_DEVICE, ANDROID_DEVICE),
            'device.apps.install': () => installed(APP),
            'device.apps.launch': () => undefined,
            'device.apps.foreground': inForeground()
        })

        const client = await MobilecliDriver.newSession({
            capabilities: { 'mobilecli:udid': IOS_DEVICE.id, 'mobilecli:app': APP_PATH }
        }) as { capabilities: WebdriverIO.Capabilities }

        expect(getRequests(fetchMock)).toEqual([
            { method: 'device.resolve', params: { deviceId: IOS_DEVICE.id } },
            { method: 'device.info', params: { deviceId: IOS_DEVICE.id } },
            { method: 'device.apps.install', params: { deviceId: IOS_DEVICE.id, path: APP_PATH } },
            { method: 'device.apps.foreground', params: { deviceId: IOS_DEVICE.id } },
            { method: 'device.apps.launch', params: { deviceId: IOS_DEVICE.id, bundleId: APP.packageName } },
            { method: 'device.apps.foreground', params: { deviceId: IOS_DEVICE.id } }
        ])
        expect(client.capabilities).toEqual({
            platformName: 'iOS',
            'mobilecli:udid': IOS_DEVICE.id,
            'mobilecli:app': APP_PATH
        })
    })

    it('gives the install the time of the setting installTimeout', async () => {
        mockServer({
            ...deviceHandlers(IOS_DEVICE),
            'device.apps.install': () => installed(APP),
            'device.apps.launch': () => undefined,
            'device.apps.foreground': inForeground()
        })
        const timeout = vi.spyOn(AbortSignal, 'timeout')

        await MobilecliDriver.newSession({
            capabilities: { 'mobilecli:app': APP_PATH, 'mobilecli:options': { installTimeout: 400000 } }
        })

        expect(timeout).toHaveBeenCalledWith(400000)
    })

    it('does not start the session if the app is not in the foreground within appLaunchTimeout', async () => {
        mockServer({
            ...deviceHandlers(IOS_DEVICE),
            'device.apps.install': () => installed(APP),
            'device.apps.launch': () => undefined,
            'device.apps.foreground': inForeground('com.apple.springboard')
        })

        await expect(MobilecliDriver.newSession({
            capabilities: { 'mobilecli:app': APP_PATH, 'mobilecli:options': { appLaunchTimeout: 100 } }
        })).rejects.toThrow(`The app ${APP.packageName} was started, but it was not in the foreground within 100ms`)
    })

    it('installs the app of the firstMatch entry that matches a device', async () => {
        const fetchMock = mockServer({
            ...deviceHandlers(ANDROID_DEVICE),
            'device.apps.install': () => installed({ packageName: 'com.wdiodemoapp' }),
            'device.apps.launch': () => undefined,
            'device.apps.foreground': inForeground('com.wdiodemoapp')
        })

        await MobilecliDriver.newSession({
            capabilities: {
                alwaysMatch: {},
                firstMatch: [
                    { platformName: 'iOS', 'mobilecli:app': APP_PATH },
                    { platformName: 'Android', 'mobilecli:app': '/apps/android.apk' }
                ]
            }
        })

        expect(getRequests(fetchMock).slice(-3)).toEqual([
            { method: 'device.apps.install', params: { deviceId: ANDROID_DEVICE.id, path: '/apps/android.apk' } },
            { method: 'device.apps.launch', params: { deviceId: ANDROID_DEVICE.id, bundleId: 'com.wdiodemoapp' } },
            { method: 'device.apps.foreground', params: { deviceId: ANDROID_DEVICE.id } }
        ])
    })

    it('does not start the session if the app can not be installed', async () => {
        mockServer({
            ...deviceHandlers(IOS_DEVICE),
            'device.apps.install': () => {
                throw new ServerError('failed to install app on device: failed to stat path: no such file')
            }
        })

        await expect(MobilecliDriver.newSession({ capabilities: { 'mobilecli:app': '/nope.zip' } }))
            .rejects.toThrow('failed to install app on device: failed to stat path: no such file')
    })

    it('does not start the session if the app can not be started', async () => {
        mockServer({
            ...deviceHandlers(IOS_DEVICE),
            'device.apps.install': () => installed(APP),
            'device.apps.launch': () => {
                throw new ServerError('failed to launch app: exit status 4')
            }
        })

        await expect(MobilecliDriver.newSession({ capabilities: { 'mobilecli:app': APP_PATH } }))
            .rejects.toThrow('failed to launch app: exit status 4')
    })
})
