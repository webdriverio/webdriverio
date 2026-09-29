import fs from 'node:fs'
import path from 'node:path'

import { DEFAULT_IDLE_TIMEOUT, DEFAULT_LAUNCH_TIMEOUT } from '../constants.js'
import { usage } from '../errors.js'
import { parseDuration } from '../daemon/events.js'
import { BROWSER_TARGETS, browserPlan, type BrowserTarget } from './browser.js'
import { applyCloudProvider } from './cloud.js'
import { configPlan } from './config.js'
import { electronPlan } from './electron.js'
import { appiumTargetPlan } from './mobile.js'
import { deepMerge, parseCapabilitiesFlag, parseRemoteUrl, type OpenArgs } from './utils.js'
import { nativeWebviewPlan } from './webview.js'
import type { OpenPlan } from '../types.js'

export const DESKTOP_APP_TARGETS = ['electron', 'tauri', 'dioxus'] as const
export const APPIUM_TARGETS = ['android', 'ios', 'macos', 'windows'] as const
export const ALL_TARGETS = [...BROWSER_TARGETS, ...APPIUM_TARGETS, ...DESKTOP_APP_TARGETS]

export interface PlanContext {
    name: string
    cwd: string
    runtimeDir: string
    artifactsDir: string
    argv: string[]
    env?: NodeJS.ProcessEnv
    platform?: NodeJS.Platform
}

export function isConfigTarget (target: string) {
    return /\.(c|m)?(j|t)s$/.test(target) && !DESKTOP_APP_TARGETS.includes(target as typeof DESKTOP_APP_TARGETS[number])
}

/**
 * Turn `open` arguments into a plan the daemon can execute. Everything that
 * can fail without starting a browser (flags, dependencies, credentials)
 * fails here, in the CLI process.
 */
export async function buildPlan (args: OpenArgs, ctx: PlanContext): Promise<OpenPlan> {
    const env = ctx.env || process.env
    const target = String(args.target)
    const idleTimeout = parseDuration(args.idleTimeout === undefined ? DEFAULT_IDLE_TIMEOUT : String(args.idleTimeout))!
    const launchTimeout = typeof args.launchTimeout === 'number' ? args.launchTimeout : DEFAULT_LAUNCH_TIMEOUT
    const remote: OpenPlan['remote'] = {
        logLevel: typeof args.logLevel === 'string' ? args.logLevel : 'warn'
    }
    for (const key of ['hostname', 'protocol', 'path'] as const) {
        if (typeof args[key] === 'string') {
            remote[key] = args[key] as string
        }
    }
    if (typeof args.port === 'number') {
        remote.port = args.port
    }

    const base = {
        name: ctx.name,
        cwd: ctx.cwd,
        runtimeDir: ctx.runtimeDir,
        artifactsDir: ctx.artifactsDir,
        target,
        remote,
        bidi: args.bidi !== false,
        idleTimeout,
        launchTimeout,
        argv: ctx.argv,
        url: typeof args.url === 'string' ? args.url : undefined
    }

    let plan: OpenPlan
    if ((BROWSER_TARGETS as readonly string[]).includes(target)) {
        plan = { ...base, ...browserPlan(target as BrowserTarget, args, { cwd: ctx.cwd, platform: ctx.platform, env }) }
        if (args.provider) {
            plan = await applyCloudProvider(plan, args, env)
        }
    } else if ((APPIUM_TARGETS as readonly string[]).includes(target)) {
        const mobile = await appiumTargetPlan(target as typeof APPIUM_TARGETS[number], args, { ...ctx, env })
        plan = { ...base, url: undefined, ...mobile, remote: { ...base.remote, ...(mobile.remote || {}) } }
        if (target === 'android' || target === 'ios') {
            plan.url = args.browser && typeof args.url === 'string' ? args.url : undefined
            // UiAutomator2 installs a server and waits for io.appium.settings.
            // That is slower than a browser launch, and the 120s WebDriver
            // request timeout aborts it while Appium is still starting.
            // A retry of that POST starts a second session on the same
            // device, so the first attempt is the only one.
            if (typeof args.launchTimeout !== 'number') {
                plan.launchTimeout = 300_000
            }
            if (plan.remote.connectionRetryTimeout === undefined) {
                plan.remote = { ...plan.remote, connectionRetryTimeout: 300_000 }
            }
            if (plan.remote.connectionRetryCount === undefined) {
                plan.remote = { ...plan.remote, connectionRetryCount: 0 }
            }
        }
        if (args.provider) {
            plan = await applyCloudProvider(plan, args, env)
        }
    } else if (target === 'electron') {
        plan = { ...base, url: undefined, ...await electronPlan(args, { ...ctx, env }) }
    } else if (target === 'tauri' || target === 'dioxus') {
        const web = await nativeWebviewPlan(target, args, { ...ctx, env })
        plan = { ...base, url: undefined, ...web, remote: { ...base.remote, ...(web.remote || {}) } }
    } else if (isConfigTarget(target)) {
        const configPath = path.resolve(ctx.cwd, target)
        if (!fs.existsSync(configPath)) {
            throw usage(`Config file ${configPath} does not exist.`)
        }
        plan = { ...base, url: undefined, ...await configPlan(configPath, args, { ...ctx, env }) }
    } else {
        throw usage(`Unknown target "${target}".`, `Use one of ${ALL_TARGETS.join(', ')} or a path to a wdio config file.`)
    }

    const extra = parseCapabilitiesFlag(args.capabilities, ctx.cwd)
    if (Object.keys(extra).length) {
        plan.capabilities = deepMerge(plan.capabilities as Record<string, unknown>, extra) as OpenPlan['capabilities']
    }
    if (plan.bidi === false) {
        (plan.capabilities as Record<string, unknown>).webSocketUrl = false
    }
    return plan
}

export { parseRemoteUrl }
