import logger from '@wdio/logger'

import { DEFAULT_SETTINGS, DEFAULT_WAIT_INTERVAL } from './constants.js'
import { RpcError, type RpcClient } from './rpc.js'
import type { ForegroundApp, InstalledApp, InstallResult, Settings } from './types.js'

const log = logger('@wdio/mobilecli-driver')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * the device that an app is installed on and started on
 */
interface AppDevice {
    id: string
    platform: string
}

/**
 * Install an app on a device. An app that is already installed is replaced
 * and keeps its data.
 * @param  appPath  path of the app on the machine of the mobilecli server:
 *                  an `.apk` for Android, an `.app` folder or a `.zip` with
 *                  one for an iOS simulator, an `.ipa` for an iOS device
 * @param  timeout  how long the install may take, `installTimeout` of the
 *                  capability `mobilecli:options`
 * @return what mobilecli read from the app file, `undefined` if it could
 *         not read it
 */
export async function installApp (rpc: RpcClient, deviceId: string, appPath: string, timeout = DEFAULT_SETTINGS.installTimeout): Promise<InstalledApp | undefined> {
    if (typeof appPath !== 'string' || !appPath) {
        throw new Error(`The path of the app to install has to be a string, got: ${JSON.stringify(appPath)}`)
    }

    log.info(`Install ${appPath} on ${deviceId}`)
    const result = await rpc.call<InstallResult>(
        'device.apps.install',
        { deviceId, path: appPath },
        Math.max(rpc.timeout, timeout)
    )
    return result?.app?.packageName ? result.app : undefined
}

/**
 * the app in the foreground (`device.apps.foreground`): iOS and Android
 * both name its id `packageName`, older versions of mobilecli `bundleId`
 */
function getForegroundId (app: ForegroundApp | undefined) {
    return app?.bundleId ?? app?.packageName ?? ''
}

/**
 * Start an app and wait until it is in the foreground. It is
 * `device.launchApp()` of Mobilewright, with the steps of its mobilecli
 * driver:
 * - on iOS, ask for the foreground app once before the start. That starts
 *   the agent of mobilecli on the device, which would otherwise start right
 *   after the app and send the app to the background.
 * - start the app (`device.apps.launch`)
 * - ask for the foreground app every 100 ms, until it is this app or
 *   `appLaunchTimeout` is up
 *
 * As in Mobilewright, the driver goes on with a warning if mobilecli can
 * not say which app is in the foreground: that fails on some Android
 * devices, although the app did start.
 */
export async function launchApp (rpc: RpcClient, device: AppDevice, packageName: string, timeout = DEFAULT_SETTINGS.appLaunchTimeout) {
    const deviceId = device.id
    if (device.platform === 'ios') {
        await rpc.call('device.apps.foreground', { deviceId }).catch(() => undefined)
    }

    log.info(`Launch ${packageName} on ${deviceId}`)
    await rpc.callWithRetry('device.apps.launch', { deviceId, bundleId: packageName })

    const deadline = Date.now() + timeout
    while (true) {
        let foreground: ForegroundApp | undefined
        try {
            foreground = await rpc.call<ForegroundApp>('device.apps.foreground', { deviceId })
        } catch (err) {
            if (err instanceof RpcError && err.message.includes('could not determine foreground app')) {
                log.warn(`Could not check that ${packageName} is in the foreground, a known problem of mobilecli on some Android devices. The session goes on.`)
                return
            }
            throw err
        }

        if (getForegroundId(foreground) === packageName) {
            log.info(`${packageName} is in the foreground`)
            return
        }
        if (Date.now() >= deadline) {
            throw new Error(
                `The app ${packageName} was started, but it was not in the foreground within ${timeout}ms ` +
                `(in the foreground: ${getForegroundId(foreground) || 'nothing'}). ` +
                'Give it more time with "appLaunchTimeout" in the capability "mobilecli:options".'
            )
        }
        await sleep(DEFAULT_WAIT_INTERVAL)
    }
}

/**
 * Install the app of the capability `mobilecli:app` and start it, so that
 * the session starts in the app.
 */
export async function installAndLaunchApp (
    rpc: RpcClient,
    device: AppDevice,
    appPath: string,
    { installTimeout, appLaunchTimeout }: Pick<Settings, 'installTimeout' | 'appLaunchTimeout'> = DEFAULT_SETTINGS
) {
    const app = await installApp(rpc, device.id, appPath, installTimeout)
    if (!app) {
        log.warn(
            `The app ${appPath} is installed, but mobilecli could not read its id from the file. ` +
            'The app is not started.'
        )
        return undefined
    }

    await launchApp(rpc, device, app.packageName, appLaunchTimeout)
    return app
}
