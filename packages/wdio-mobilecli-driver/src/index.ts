import { randomUUID } from 'node:crypto'

import logger from '@wdio/logger'
import { webdriverMonad, sessionEnvironmentDetector } from '@wdio/utils'
import { getEnvironmentVars } from 'webdriver'
import type { Automation, Capabilities } from '@wdio/types'

import { getProtocolCommands } from './commands.js'
import { DEFAULT_REQUEST_TIMEOUT, PACKAGE_NAME, PLATFORM_NAMES } from './constants.js'
import { RpcClient, RpcError, getServerUrl } from './rpc.js'
import type { DeviceInfo, DeviceInfoResult, Options, ResolvedDevice, Session } from './types.js'

const log = logger('@wdio/mobilecli-driver')

/**
 * Automation protocol driver that runs WebdriverIO commands through mobilecli.
 * WebdriverIO loads it when `automationProtocol` is `@wdio/mobilecli-driver`
 * and calls these static functions in place of the ones of `webdriver`.
 */
export default class MobilecliDriver {
    /**
     * Start a session: connect to a running mobilecli server and to a device
     * that it knows. mobilecli has no sessions, so the session id is made up
     * by the driver. Nothing is started or installed on the device.
     */
    static async newSession (
        options: Options,
        modifier?: (...args: unknown[]) => unknown,
        userPrototype: Record<string, unknown> = {},
        customCommandWrapper?: (...args: unknown[]) => unknown,
        implicitWaitExclusionList: string[] = []
    ) {
        if (options.logLevel && !options.logLevels?.[PACKAGE_NAME]) {
            logger.setLevel(PACKAGE_NAME, options.logLevel)
        }

        const requestedCapabilities = { ...options.capabilities } as Capabilities.RequestedStandaloneCapabilities
        const rpc = new RpcClient(
            getServerUrl(options),
            options.connectionRetryTimeout || DEFAULT_REQUEST_TIMEOUT,
            options.headers
        )

        log.info(`Initiate new session using mobilecli at ${rpc.url}`)
        const { requested, device } = await findDevice(rpc, getCapabilityCandidates(requestedCapabilities))
        const capabilities: WebdriverIO.Capabilities = {
            ...requested,
            platformName: PLATFORM_NAMES[device.platform] || device.platform,
            'mobilecli:udid': device.id
        }

        const session: Session = { id: randomUUID(), rpc, device, timeouts: {}, ended: false }
        const environment = sessionEnvironmentDetector({ capabilities, requestedCapabilities })
        const monad = webdriverMonad(
            { ...options, capabilities, requestedCapabilities },
            modifier,
            {
                ...getProtocolCommands(session),
                ...getEnvironmentVars(environment),
                ...userPrototype as PropertyDescriptorMap
            }
        )

        log.info(`Session ${session.id} runs on ${device.name} (${device.platform} ${device.version || ''}, ${device.id})`)
        return monad(session.id, customCommandWrapper, implicitWaitExclusionList)
    }

    static attachToSession (): never {
        throw new Error(`attachToSession: ${PACKAGE_NAME} does not support this yet`)
    }

    static async reloadSession (): Promise<never> {
        throw new Error(`reloadSession: ${PACKAGE_NAME} does not support this yet`)
    }
}

/**
 * the type check that the class has the functions WebdriverIO calls
 */
MobilecliDriver satisfies Automation.Driver<Options>

/**
 * a device that does not fit the capabilities, so the next candidate is tried
 */
class NoMatchError extends Error {}

/**
 * `capabilities` can have the W3C form with `alwaysMatch` and `firstMatch`.
 * Then every entry of `firstMatch`, merged with `alwaysMatch`, is a set of
 * capabilities that the session may start with.
 */
function getCapabilityCandidates (capabilities: Capabilities.RequestedStandaloneCapabilities): WebdriverIO.Capabilities[] {
    if (!('alwaysMatch' in capabilities) && !('firstMatch' in capabilities)) {
        return [capabilities as WebdriverIO.Capabilities]
    }
    const { alwaysMatch = {}, firstMatch = [] } = capabilities as Capabilities.W3CCapabilities
    return (firstMatch.length ? firstMatch : [{}]).map((entry) => ({ ...alwaysMatch, ...entry }))
}

/**
 * Connect to the device of the first candidate that fits one, in the order
 * of `firstMatch`. A candidate does not fit if mobilecli finds no device for
 * it or if its device is of another platform. Any other failure, e.g. a
 * server that is not running, ends the search.
 */
async function findDevice (rpc: RpcClient, candidates: WebdriverIO.Capabilities[]) {
    const mismatches: string[] = []
    for (const requested of candidates) {
        try {
            return { requested, device: await connectToDevice(rpc, requested) }
        } catch (err) {
            if (!(err instanceof NoMatchError)) {
                throw err
            }
            if (candidates.length === 1) {
                throw new Error(err.message, { cause: err.cause })
            }
            mismatches.push(`${JSON.stringify(requested)}: ${err.message}`)
        }
    }
    throw new Error(`None of the "firstMatch" capabilities matches a device:\n- ${mismatches.join('\n- ')}`)
}

/**
 * Find the device of the session and make sure that mobilecli can drive it.
 * - `device.resolve` picks the device of `mobilecli:udid`, or the only device
 *   that is online if no id is given
 * - `device.info` starts the agent of mobilecli on the device, so a device
 *   that can not be driven fails here and not at the first command
 */
async function connectToDevice (rpc: RpcClient, requested: WebdriverIO.Capabilities): Promise<DeviceInfo> {
    const udid = requested['mobilecli:udid']
    const resolved = await rpc.call<ResolvedDevice>('device.resolve', udid ? { deviceId: udid } : {}).catch((err: Error) => {
        /**
         * only an answer of mobilecli says that there is no device for these
         * capabilities, e.g. "device not found"
         */
        if (!(err instanceof RpcError)) {
            throw err
        }
        /**
         * mobilecli answers with a hint for its command line
         */
        const hint = !udid && err.message.includes('multiple devices found')
            ? '. In WebdriverIO, set the capability "mobilecli:udid" to one of them.'
            : ''
        throw new NoMatchError(err.message + hint, { cause: err })
    })

    const platformName = requested.platformName
    if (platformName && platformName.toLowerCase() !== resolved.platform.toLowerCase()) {
        throw new NoMatchError(
            `The capability "platformName" is "${platformName}", but the device ${resolved.id} is an ` +
            `${PLATFORM_NAMES[resolved.platform] || resolved.platform} device. ` +
            'Set "mobilecli:udid" to a device of that platform, see "mobilecli devices".'
        )
    }

    const { device } = await rpc.call<DeviceInfoResult>('device.info', { deviceId: resolved.id })
    return device
}
