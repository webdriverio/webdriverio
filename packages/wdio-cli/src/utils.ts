
import pickBy from 'lodash.pickby'
import logger from '@wdio/logger'
import { SevereServiceError } from 'webdriverio'
import { ConfigParser } from '@wdio/config/node'
import { CAPABILITY_KEYS } from '@wdio/protocols'
import type { Capabilities, Services } from '@wdio/types'

import {
    ANDROID_CONFIG,
    IOS_CONFIG,
} from './constants.js'
import type {
    OnCompleteResult,
    ReplCommandArguments,
} from './types.js'

const log = logger('@wdio/cli:utils')

export class HookError extends SevereServiceError {
    public origin: string
    constructor(message: string, origin: string) {
        super(message)
        this.origin = origin
    }
}

/**
 * run service launch sequences
 */
export async function runServiceHook(
    launcher: Services.ServiceInstance[],
    hookName: keyof Services.HookFunctions,
    ...args: unknown[]
) {
    const start = Date.now()
    return Promise.all(launcher.map(async (service: Services.ServiceInstance) => {
        try {
            if (typeof service[hookName] === 'function') {
                await (service[hookName] as Function)(...args)
            }
        } catch (err) {
            const message = `A service failed in the '${hookName}' hook\n${(err as Error).stack}\n\n`

            if (err instanceof SevereServiceError || (err as Error).name === 'SevereServiceError') {
                return { status: 'rejected', reason: message, origin: hookName }
            }

            log.error(`${message}Continue...`)
        }
    })).then(results => {
        if (launcher.length) {
            log.debug(`Finished to run "${hookName}" hook in ${Date.now() - start}ms`)
        }

        const rejectedHooks = results.filter(p => p && p.status === 'rejected')
        if (rejectedHooks.length) {
            return Promise.reject(new HookError(`\n${rejectedHooks.map(p => p && p.reason).join()}\n\nStopping runner...`, hookName))
        }
    })
}

/**
 * Run hook in service launcher
 * @param {Array|Function} hook - can be array of functions or single function
 * @param {object} config
 * @param {object} capabilities
 */
export async function runLauncherHook(hook: Function | Function[], ...args: unknown[]) {
    if (typeof hook === 'function') {
        hook = [hook]
    }

    const catchFn = (e: Error) => {
        log.error(`Error in hook: ${e.stack}`)
        if (e instanceof SevereServiceError) {
            throw new HookError(e.message, (hook as Function[])[0].name)
        }
    }

    return Promise.all(hook.map((hook) => {
        try {
            return hook(...args)
        } catch (err) {
            return catchFn(err as Error)
        }
    })).catch(catchFn)
}

/**
 * Run onCompleteHook in Launcher
 * @param {Array|Function} onCompleteHook - can be array of functions or single function
 * @param {*} config
 * @param {*} capabilities
 * @param {*} exitCode
 * @param {*} results
 */
export async function runOnCompleteHook(
    onCompleteHook: Function | Function[],
    config: WebdriverIO.Config,
    capabilities: Capabilities.TestrunnerCapabilities,
    exitCode: number,
    results: OnCompleteResult
) {
    if (typeof onCompleteHook === 'function') {
        onCompleteHook = [onCompleteHook]
    }

    return Promise.all(onCompleteHook.map(async (hook) => {
        try {
            await hook(exitCode, config, capabilities, results)
            return 0
        } catch (err) {
            log.error(`Error in onCompleteHook: ${(err as Error).stack}`)
            if (err instanceof SevereServiceError) {
                throw new HookError(err.message, 'onComplete')
            }
            return 1
        }
    }))
}

/**
 * get runner identification by caps
 */
export function getRunnerName(caps: WebdriverIO.Capabilities = {}) {
    let runner =
        caps.browserName ||
        caps.platformName ||
        caps['appium:platformName'] ||
        caps['appium:appPackage'] ||
        caps['appium:appWaitActivity'] ||
        caps['appium:app']

    // MultiRemote
    if (!runner) {
        runner = Object.values(caps).length === 0 || Object.values(caps).some(cap => !cap.capabilities) ? 'undefined' : 'MultiRemote'
    }

    return runner
}

export function findInConfig(config: string, type: string) {
    let regexStr = `[\\/\\/]*[\\s]*${type}s: [\\s]*\\[([\\s]*['|"]\\w*['|"],*)*[\\s]*\\]`

    if (type === 'framework') {
        regexStr = `[\\/\\/]*[\\s]*${type}: ([\\s]*['|"]\\w*['|"])`
    }

    const regex = new RegExp(regexStr, 'gmi')
    return config.match(regex)
}

export async function getCapabilities(arg: ReplCommandArguments) {
    const optionalCapabilites = {
        platformVersion: arg.platformVersion,
        udid: arg.udid,
        ...(arg.deviceName && { deviceName: arg.deviceName })
    }
    /**
     * Parsing of option property and constructing desiredCapabilities
     * for Appium session. Could be application(1) or browser(2-3) session.
     */
    if (/.*\.(apk|app|ipa)$/.test(arg.option)) {
        return {
            capabilities: {
                app: arg.option,
                ...(arg.option.endsWith('apk') ? ANDROID_CONFIG : IOS_CONFIG),
                ...optionalCapabilites,
            }
        }
    } else if (/android/.test(arg.option)) {
        return { capabilities: { browserName: 'Chrome', ...ANDROID_CONFIG, ...optionalCapabilites } }
    } else if (/ios/.test(arg.option)) {
        return { capabilities: { browserName: 'Safari', ...IOS_CONFIG, ...optionalCapabilites } }
    } else if (/(js|ts)$/.test(arg.option)) {
        const config = new ConfigParser(arg.option)
        try {
            await config.initialize()
        } catch (e) {
            throw Error((e as { code: string }).code === 'MODULE_NOT_FOUND' ? `Config File not found: ${arg.option}` :
                `Could not parse ${arg.option}, failed with error: ${(e as Error).message}`)
        }
        if (typeof arg.capabilities === 'undefined') {
            throw Error('Please provide index/named property of capability to use from the capabilities array/object in wdio config file')
        }
        let requiredCaps = config.getCapabilities()
        requiredCaps = (
            // multi capabilities
            (requiredCaps as (Capabilities.RequestedStandaloneCapabilities)[])[parseInt(arg.capabilities, 10)] ||
            // multiremote
            (requiredCaps as Capabilities.RequestedMultiremoteCapabilities)[arg.capabilities]?.capabilities
        )
        const requiredW3CCaps = pickBy(requiredCaps, (_: never, key: string) => CAPABILITY_KEYS.includes(key) || key.includes(':'))
        if (!Object.keys(requiredW3CCaps).length) {
            throw Error(`No capability found in given config file with the provided capability indexed/named property: ${arg.capabilities}. Please check the capability in your wdio config file.`)
        }
        return { capabilities: { ...(requiredW3CCaps as Capabilities.W3CCapabilities) } }
    }
    return { capabilities: { browserName: arg.option } }
}

const cucumberTypes: Record<string, string> = {
    paths: 'array',
    backtrace: 'boolean',
    dryRun: 'boolean',
    forceExit: 'boolean',
    failFast: 'boolean',
    format: 'array',
    formatOptions: 'object',
    import: 'array',
    language: 'string',
    name: 'array',
    order: 'string',
    publish: 'boolean',
    requireModule: 'array',
    retry: 'number',
    retryTagFilter: 'string',
    strict: 'boolean',
    tags: 'string',
    worldParameters: 'object',
    timeout: 'number',
    scenarioLevelReporter: 'boolean',
    tagsInTitle: 'boolean',
    ignoreUndefinedDefinitions: 'boolean',
    failAmbiguousDefinitions: 'boolean',
    tagExpression: 'string',
    profiles: 'array',
    file: 'string'
}

const mochaTypes: Record<string, string> = {
    require: 'array',
    compilers: 'array',
    allowUncaught: 'boolean',
    asyncOnly: 'boolean',
    bail: 'boolean',
    checkLeaks: 'boolean',
    delay: 'boolean',
    fgrep: 'string',
    forbidOnly: 'boolean',
    forbidPending: 'boolean',
    fullTrace: 'boolean',
    global: 'array',
    grep: 'string',
    invert: 'boolean',
    retries: 'number',
    timeout: 'number',
    ui: 'string'
}

const jasmineTypes: Record<string, string> = {
    defaultTimeoutInterval: 'number',
    helpers: 'array',
    requires: 'array',
    random: 'boolean',
    seed: 'string',
    failFast: 'boolean',
    failSpecWithNoExpectations: 'boolean',
    oneFailurePerSpec: 'boolean',
    grep: 'string',
    invertGrep: 'boolean',
    cleanStack: 'boolean',
    stopOnSpecFailure: 'boolean',
    stopSpecOnExpectationFailure: 'boolean',
    requireModule: 'array',
}

type CLIParams = { [x: string]: boolean | string | number | (string | boolean | number)[] }

export function coerceOpts (
    types: Record<string, string>,
    opts: CLIParams
) {
    for (const key in opts) {
        if (types[key] === 'boolean' && typeof opts[key] === 'string') {
            opts[key] = opts[key] === 'true'
        } else if (types[key] === 'number') {
            opts[key] = Number(opts[key])
        } else if (types[key] === 'array') {
            opts[key] = Array.isArray(opts[key]) ? opts[key] : [opts[key]]
        } else if (types[key] === 'object' && typeof opts[key] === 'string') {
            opts[key] = JSON.parse(opts[key])
        }
    }
    return opts
}

export function coerceOptsFor(framework: 'cucumber' | 'mocha' | 'jasmine') {
    if (framework === 'cucumber') {
        return coerceOpts.bind(null, cucumberTypes)
    } else if (framework === 'mocha') {
        return coerceOpts.bind(null, mochaTypes)
    } else if (framework === 'jasmine') {
        return coerceOpts.bind(null, jasmineTypes)
    }

    throw new Error(`Unsupported framework "${framework}"`)
}

enum NodeVersion {
    'major' = 0,
    'minor' = 1,
    'patch' = 2
}

export function nodeVersion(type: keyof typeof NodeVersion): number {
    return process.versions.node.split('.').map(Number)[NodeVersion[type]]
}
