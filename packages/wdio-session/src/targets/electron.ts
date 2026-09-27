import fs from 'node:fs'
import path from 'node:path'

import { importOptionalDependency, resolveOptionalDependency } from '@wdio/utils/node'

import { HINT_DOCTOR, checkDisplayServer, findPackageRoot, requirePackage } from '../deps.js'
import { usage } from '../errors.js'
import { hasDisplay, toArray, type OpenArgs } from './utils.js'
import type { OpenPlan, TargetPlan } from '../types.js'

const ENTRY_POINT = /\.(?:mjs|cjs|js)$/i

interface ElectronContext {
    cwd: string
    artifactsDir: string
    env?: NodeJS.ProcessEnv
    platform?: NodeJS.Platform
}

interface ElectronModule {
    startWdioSession: (capabilities: unknown, globalOptions?: { rootDir?: string }) => Promise<WebdriverIO.Browser>
    cleanupWdioSession: (browser: WebdriverIO.Browser) => Promise<void>
    createElectronCapabilities: (options: Record<string, unknown>) => Record<string, unknown>
}

function appArgs (args: OpenArgs) {
    return toArray(args.appArg)
}

async function installedElectronVersion (cwd: string) {
    const resolved = await resolveOptionalDependency('electron', { cwd, from: import.meta.url })
    if (!resolved) {
        return undefined
    }
    const root = findPackageRoot(resolved, 'electron')
    if (!root) {
        return undefined
    }
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8')) as { version?: string }
        return pkg.version
    } catch {
        return undefined
    }
}

/**
 * Plan an Electron session. A path ending in `.js`, `.mjs` or `.cjs` is an
 * unpackaged entry point; anything else is a packaged binary.
 */
export async function electronPlan (args: OpenArgs, ctx: ElectronContext): Promise<TargetPlan> {
    const app = typeof args.url === 'string' ? args.url : ''
    if (!app) {
        throw usage('Pass the Electron app path.', 'Example: `wdio session open electron ./main.js`.')
    }
    const resolved = path.resolve(ctx.cwd, app)
    if (!fs.existsSync(resolved)) {
        throw usage(`App not found: ${resolved}`)
    }
    const env = ctx.env || process.env
    const host = ctx.platform || process.platform
    await requirePackage('@wdio/electron-service', {
        cwd: ctx.cwd,
        feature: 'open an Electron session',
        from: import.meta.url,
        hint: HINT_DOCTOR('electron')
    })
    const entry = ENTRY_POINT.test(resolved)
    if (entry) {
        await requirePackage('electron', {
            cwd: ctx.cwd,
            feature: 'open an unpackaged Electron app',
            from: import.meta.url,
            hint: HINT_DOCTOR('electron')
        })
    }
    const mod = await importOptionalDependency('@wdio/electron-service', {
        feature: 'open an Electron session',
        cwd: ctx.cwd,
        from: import.meta.url
    }) as ElectronModule
    const logDir = path.join(ctx.artifactsDir, 'electron-logs')
    const options: Record<string, unknown> = {
        ...(entry ? { appEntryPoint: resolved } : { appBinaryPath: resolved }),
        appArgs: appArgs(args),
        logDir,
        captureMainProcessLogs: true
    }
    const capabilities = mod.createElectronCapabilities(options) as TargetPlan['capabilities'] & Record<string, unknown>
    /**
     * `@wdio/electron-service` forces the classic protocol
     * (`wdio:enforceWebDriverClassic`). Requesting BiDi makes Chromedriver
     * navigate the app window to `data:,`, which replaces the page.
     */
    capabilities.webSocketUrl = false
    const version = typeof args.electronVersion === 'string' && args.electronVersion
        ? args.electronVersion
        : entry
            ? await installedElectronVersion(ctx.cwd)
            : undefined
    if (version) {
        capabilities.browserVersion = version
    }
    if (typeof args.chromedriver === 'string' && args.chromedriver) {
        capabilities['wdio:chromedriverOptions'] = { binary: path.resolve(ctx.cwd, args.chromedriver) }
    }
    const display = host === 'linux' && !hasDisplay(env)
    if (display) {
        checkDisplayServer('open an Electron session', env)
    }
    return {
        capabilities,
        label: 'electron',
        platform: 'electron',
        applies: ['W'],
        mode: 'electron',
        headless: false,
        bidi: false,
        display,
        electron: {
            ...(entry ? { appEntryPoint: resolved } : { appBinaryPath: resolved }),
            appArgs: appArgs(args),
            logDir,
            ...(typeof args.chromedriver === 'string' && args.chromedriver ? { chromedriver: path.resolve(ctx.cwd, args.chromedriver) } : {}),
            ...(typeof args.electronVersion === 'string' && args.electronVersion ? { electronVersion: args.electronVersion } : {})
        },
        notes: ['Electron sessions use the classic WebDriver protocol.']
    }
}

function driverPid (browser: WebdriverIO.Browser) {
    const pid = (browser.capabilities as Record<string, unknown>)['wdio:driverPID']
    return typeof pid === 'number' ? pid : undefined
}

/**
 * Start an Electron session through `@wdio/electron-service` standalone mode.
 */
export async function launchElectron (plan: OpenPlan): Promise<{ browser: WebdriverIO.Browser, end: (died?: boolean) => Promise<void> }> {
    const mod = await importOptionalDependency('@wdio/electron-service', {
        feature: 'open an Electron session',
        cwd: plan.cwd,
        from: import.meta.url
    }) as ElectronModule
    const browser = await mod.startWdioSession([plan.capabilities], { rootDir: plan.cwd })
    const end = async (died?: boolean) => {
        if (died) {
            const pid = driverPid(browser)
            if (pid !== undefined) {
                try {
                    process.kill(pid, 'SIGKILL')
                } catch {
                    // already gone
                }
            }
            return
        }
        await mod.cleanupWdioSession(browser).catch(() => undefined)
        await browser.deleteSession()
    }
    return { browser, end }
}
