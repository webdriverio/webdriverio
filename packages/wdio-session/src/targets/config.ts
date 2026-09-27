import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { ConfigParser } from '@wdio/config/node'

const require = createRequire(import.meta.url)

import { usage } from '../errors.js'
import { hasDisplay, isPlainObject, parseViewport, type OpenArgs } from './utils.js'
import type { Applies, OpenPlan, PlatformKind, RemoteOptions, TargetPlan } from '../types.js'

const STANDARD_CAPS = new Set([
    'browserName', 'browserVersion', 'platformName', 'acceptInsecureCerts',
    'pageLoadStrategy', 'proxy', 'setWindowRect', 'timeouts', 'strictFileInteractability',
    'unhandledPromptBehavior', 'webSocketUrl'
])

const SUPPORTED_SERVICES = new Set(['visual', 'electron', 'tauri', 'dioxus', 'appium'])

interface PlanContext {
    cwd: string
    env?: NodeJS.ProcessEnv
    platform?: NodeJS.Platform
}

function optionArgs (caps: Record<string, unknown>, key: string) {
    const options = caps[key]
    if (!isPlainObject(options) || !Array.isArray(options.args)) {
        return []
    }
    return options.args.map(String)
}

function wantsHeadless (caps: Record<string, unknown>, args: OpenArgs, env: NodeJS.ProcessEnv) {
    if (args.headed || env.WDIO_SESSION_HEADED === '1') {
        return false
    }
    const argsList = [
        ...optionArgs(caps, 'goog:chromeOptions'),
        ...optionArgs(caps, 'ms:edgeOptions'),
        ...optionArgs(caps, 'moz:firefoxOptions')
    ]
    return argsList.some((arg) => /headless/i.test(arg))
}

function serviceName (entry: unknown) {
    if (typeof entry === 'string') {
        return { name: entry, options: {} as Record<string, unknown> }
    }
    if (Array.isArray(entry) && typeof entry[0] === 'string') {
        return { name: entry[0], options: isPlainObject(entry[1]) ? entry[1] : {} }
    }
    return undefined
}

/**
 * Index into a capabilities array, or a name in a multi-remote object,
 * matching `wdio repl`.
 */
export function pickCapability (capabilities: unknown, selector: unknown) {
    const which = selector === undefined || selector === null ? '' : String(selector)
    if (!which) {
        throw usage('Name the capability to open.', 'Example: `wdio session open ./wdio.conf.ts 0`.')
    }
    if (Array.isArray(capabilities)) {
        const index = /^\d+$/.test(which) ? Number(which) : -1
        const cap = capabilities[index]
        if (!isPlainObject(cap)) {
            throw usage(`No capability at index ${which} (${capabilities.length} in the config).`)
        }
        return cap
    }
    if (isPlainObject(capabilities)) {
        const entry = capabilities[which]
        const cap = isPlainObject(entry) && isPlainObject(entry.capabilities) ? entry.capabilities : entry
        if (!isPlainObject(cap)) {
            throw usage(`No capability named "${which}".`)
        }
        return cap
    }
    throw usage('The config has no capabilities.')
}

export function webdriverCaps (cap: Record<string, unknown>) {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(cap)) {
        if (STANDARD_CAPS.has(key) || key.includes(':')) {
            out[key] = value
        }
    }
    if (!Object.keys(out).length) {
        throw usage('That capability has no WebDriver capabilities.')
    }
    return out
}

function classify (caps: Record<string, unknown>, configPath: string): { label: string, platform: PlatformKind, applies: Applies[] } {
    const platformName = String(caps.platformName || caps['appium:platformName'] || '').toLowerCase()
    if (platformName === 'android' || platformName === 'ios') {
        return { label: platformName, platform: 'mobile', applies: caps.browserName ? ['W', 'M'] : ['M'] }
    }
    if (platformName === 'mac' || platformName === 'windows') {
        return { label: platformName, platform: 'desktop', applies: ['D'] }
    }
    const browserName = typeof caps.browserName === 'string' ? caps.browserName : ''
    return {
        label: browserName || path.basename(configPath),
        platform: 'browser',
        applies: ['W']
    }
}

function remoteFrom (config: Record<string, unknown>, args: OpenArgs): RemoteOptions {
    const remote: RemoteOptions = {
        logLevel: typeof args.logLevel === 'string' ? args.logLevel : typeof config.logLevel === 'string' ? config.logLevel : 'warn'
    }
    const stringKeys = ['hostname', 'path', 'protocol', 'user', 'key', 'baseUrl'] as const
    for (const key of stringKeys) {
        if (typeof args[key] === 'string') {
            remote[key] = args[key]
        } else if (typeof config[key] === 'string' && config[key]) {
            remote[key] = config[key] as string
        }
    }
    if (typeof args.port === 'number') {
        remote.port = args.port
    } else if (typeof config.port === 'number') {
        remote.port = config.port
    }
    if (typeof config.waitforTimeout === 'number') {
        remote.waitforTimeout = config.waitforTimeout
    }
    if (typeof config.connectionRetryTimeout === 'number') {
        remote.connectionRetryTimeout = config.connectionRetryTimeout
    }
    return remote
}

async function loadConfig (configPath: string) {
    // Importing tsx registers its loader, so only TypeScript configs should load it.
    if (/\.(c|m)?tsx?$/.test(configPath)) {
        await import(pathToFileURL(require.resolve('tsx')).href)
    }
    const parser = new ConfigParser(configPath)
    try {
        await parser.initialize()
    } catch (err) {
        throw usage(`Could not load ${configPath}: ${(err as Error).message}`)
    }
    return parser
}

export async function configPlan (configPath: string, args: OpenArgs, ctx: PlanContext): Promise<TargetPlan> {
    const env = ctx.env || process.env
    const parser = await loadConfig(configPath)
    const config = parser.getConfig() as unknown as Record<string, unknown>
    const caps = webdriverCaps(pickCapability(parser.getCapabilities(), args.url))
    const kind = classify(caps, configPath)
    const notes: string[] = []
    let visualOptions: Record<string, unknown> | undefined
    const services = Array.isArray(config.services) ? config.services : []
    for (const entry of services) {
        const service = serviceName(entry)
        if (!service) {
            continue
        }
        if (!SUPPORTED_SERVICES.has(service.name)) {
            notes.push(`Ignoring service "${service.name}"; wdio session only applies visual, electron, tauri, dioxus and appium service options.`)
            continue
        }
        if (service.name === 'visual') {
            visualOptions = service.options
        }
    }
    const headless = wantsHeadless(caps, args, env)
    const host = ctx.platform || process.platform
    return {
        capabilities: caps as OpenPlan['capabilities'],
        label: kind.label,
        platform: kind.platform,
        applies: kind.applies,
        mode: 'remote',
        headless,
        viewport: parseViewport(args.viewport),
        display: !headless && host === 'linux' && !hasDisplay(env),
        notes,
        remote: remoteFrom(config, args),
        configPath,
        ...(visualOptions ? { visualOptions } : {})
    }
}
