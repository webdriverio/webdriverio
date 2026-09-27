import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'

import { installCommand, resolveOptionalDependency } from '@wdio/utils/node'

import { MIN_NODE_VERSION } from './constants.js'
import { ensureRuntimeDir, isPidAlive, listStates, removeStaleState } from './daemon/state.js'
import {
    APPIUM_DRIVERS, APPIUM_VERSION, PACKAGE_DEPENDENCIES, appiumCliPath,
    findBinary, findPackageRoot, listAppiumDrivers, type AppiumTarget
} from './deps.js'
import { usage } from './errors.js'
import type { ActionResult } from './types.js'
import { hasDisplay } from './targets/utils.js'

export interface DoctorCheck {
    id: string
    status: 'ok' | 'warn' | 'fail'
    message: string
    fix?: string
}

export interface DoctorContext {
    cwd: string
    env: NodeJS.ProcessEnv
    runtimeDir: string
}

interface DoctorHost {
    platform?: NodeJS.Platform
    nodeVersion?: string
}

const BROWSERS = ['chrome', 'firefox', 'edge', 'safari'] as const
const APPIUM_TARGETS = ['android', 'ios', 'macos', 'windows'] as const
const PROVIDERS = ['browserstack', 'saucelabs', 'testingbot', 'testmu'] as const

const BROWSER_BINARIES: Record<(typeof BROWSERS)[number], string[]> = {
    chrome: ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'chrome'],
    firefox: ['firefox'],
    edge: ['microsoft-edge', 'msedge'],
    safari: ['safari']
}

const CREDENTIALS: Record<(typeof PROVIDERS)[number], { label: string, env: [string, string] }> = {
    browserstack: { label: 'BrowserStack', env: ['BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY'] },
    saucelabs: { label: 'Sauce Labs', env: ['SAUCE_USERNAME', 'SAUCE_ACCESS_KEY'] },
    testingbot: { label: 'TestingBot', env: ['TESTINGBOT_KEY', 'TESTINGBOT_SECRET'] },
    testmu: { label: 'TestMu AI', env: ['LT_USERNAME', 'LT_ACCESS_KEY'] }
}

const KNOWN_TARGETS = new Set<string>([...BROWSERS, ...APPIUM_TARGETS, 'electron', 'tauri', 'dioxus', ...PROVIDERS])

const MARK = { ok: '✔', warn: '⚠', fail: '✖' } as const

function check (id: string, status: DoctorCheck['status'], message: string, fix?: string): DoctorCheck {
    return { id, status, message, ...(fix ? { fix } : {}) }
}

function ok (id: string, message: string) {
    return check(id, 'ok', message)
}

function warn (id: string, message: string, fix?: string) {
    return check(id, 'warn', message, fix)
}

function fail (id: string, message: string, fix?: string) {
    return check(id, 'fail', message, fix)
}

/**
 * True when `version` is older than `minimum` (numeric major.minor.patch).
 */
export function versionBelow (version: string, minimum: string) {
    const parse = (value: string) => value.replace(/^v/, '').split('.').slice(0, 3).map((part) => parseInt(part, 10) || 0)
    const left = parse(version)
    const right = parse(minimum)
    for (let i = 0; i < 3; i++) {
        const a = left[i] || 0
        const b = right[i] || 0
        if (a !== b) {
            return a < b
        }
    }
    return false
}

function format (checks: DoctorCheck[]) {
    return checks.map((row) => {
        const fix = row.fix ? ` → fix: ${row.fix}` : ''
        return `${MARK[row.status]} ${row.id} ${row.message}${fix}`
    }).join('\n')
}

function packageVersion (entry: string, name: string) {
    const root = findPackageRoot(entry, name)
    if (!root) {
        return undefined
    }
    try {
        const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8')).version
        return typeof version === 'string' ? version : undefined
    } catch {
        return undefined
    }
}

function idsFor (target: string | undefined, platform: NodeJS.Platform) {
    const base = ['node', 'webdriverio', 'runtime-dir', 'sessions']
    const display = platform === 'linux' ? ['display'] : []
    if (!target) {
        return [
            ...base,
            ...BROWSERS.map((name) => `browser:${name}`),
            ...display,
            'appium',
            ...APPIUM_TARGETS.map((name) => `appium-driver:${APPIUM_DRIVERS[name].driver}`),
            'android-sdk',
            ...(platform === 'darwin' ? ['xcode'] : []),
            ...PACKAGE_DEPENDENCIES.filter((dep) => dep.package !== 'appium').map((dep) => `package:${dep.package}`),
            'binary:tauri-driver',
            'binary:ffmpeg',
            ...PROVIDERS.map((name) => `credentials:${name}`)
        ]
    }
    const ids = [...base]
    if ((BROWSERS as readonly string[]).includes(target)) {
        ids.push(`browser:${target}`, ...display)
    } else if (target === 'android') {
        ids.push('appium', 'appium-driver:uiautomator2', 'android-sdk')
    } else if (target === 'ios') {
        ids.push('appium', 'appium-driver:xcuitest', ...(platform === 'darwin' ? ['xcode'] : []))
    } else if (target === 'macos') {
        ids.push('appium', 'appium-driver:mac2')
    } else if (target === 'windows') {
        ids.push('appium', 'appium-driver:windows')
    } else if (target === 'electron') {
        ids.push('package:@wdio/electron-service', 'package:electron')
    } else if (target === 'tauri') {
        ids.push('package:@wdio/tauri-service', 'binary:tauri-driver', ...display)
    } else if (target === 'dioxus') {
        ids.push('package:@wdio/dioxus-service', ...display)
    } else if ((PROVIDERS as readonly string[]).includes(target)) {
        ids.push(`credentials:${target}`)
    }
    return ids
}

function findBrowser (name: (typeof BROWSERS)[number], env: NodeJS.ProcessEnv, platform: NodeJS.Platform) {
    for (const bin of BROWSER_BINARIES[name]) {
        const found = findBinary(bin, env, platform)
        if (found) {
            return found
        }
    }
    if (name === 'safari' && platform === 'darwin') {
        const app = '/Applications/Safari.app/Contents/MacOS/Safari'
        if (fs.existsSync(app)) {
            return app
        }
    }
    return undefined
}

async function checkNode (host: DoctorHost): Promise<DoctorCheck> {
    const version = host.nodeVersion || process.versions.node
    if (versionBelow(version, MIN_NODE_VERSION)) {
        return fail('node', `${version} is older than ${MIN_NODE_VERSION}`, `Install Node.js ${MIN_NODE_VERSION} or newer`)
    }
    return ok('node', version)
}

async function checkWebdriverIO (ctx: DoctorContext): Promise<DoctorCheck> {
    const resolved = await resolveOptionalDependency('webdriverio', { cwd: ctx.cwd, from: import.meta.url })
    if (!resolved) {
        return fail('webdriverio', 'not installed', installCommand('webdriverio', { cwd: ctx.cwd }))
    }
    return ok('webdriverio', packageVersion(resolved, 'webdriverio') || 'installed')
}

function checkRuntimeDir (ctx: DoctorContext): DoctorCheck {
    try {
        const dir = ensureRuntimeDir(ctx.runtimeDir)
        const probe = path.join(dir, `.doctor-${process.pid}`)
        fs.writeFileSync(probe, 'ok')
        fs.rmSync(probe, { force: true })
        return ok('runtime-dir', dir)
    } catch (err) {
        return fail('runtime-dir', `not writable (${(err as Error).message})`)
    }
}

function checkSessions (ctx: DoctorContext): DoctorCheck[] {
    const stale = listStates(ctx.runtimeDir).filter((state) => {
        const spawning = state.status === 'starting' && (state.pid === null || isPidAlive(state.pid))
        const live = state.status === 'ready' && isPidAlive(state.pid)
        return !spawning && !live
    })
    if (!stale.length) {
        return [ok('sessions', 'no stale sessions')]
    }
    return stale.map((state) => {
        removeStaleState(ctx.runtimeDir, state)
        return warn('sessions', `removed stale session "${state.name}"`)
    })
}

function checkBrowser (name: (typeof BROWSERS)[number], env: NodeJS.ProcessEnv, platform: NodeJS.Platform): DoctorCheck {
    const id = `browser:${name}`
    if (name === 'safari' && platform !== 'darwin') {
        return fail(id, 'Safari requires macOS')
    }
    const found = findBrowser(name, env, platform)
    if (found) {
        return ok(id, found)
    }
    return warn(id, 'downloaded on first use')
}

function checkDisplay (env: NodeJS.ProcessEnv): DoctorCheck {
    if (hasDisplay(env)) {
        return ok('display', 'display is available')
    }
    const xvfb = findBinary('Xvfb', env)
    if (xvfb) {
        return ok('display', xvfb)
    }
    const weston = findBinary('weston', env)
    if (weston) {
        return ok('display', weston)
    }
    return warn('display', 'no display and neither Xvfb nor weston is installed', 'sudo apt-get install -y xvfb')
}

interface AppiumInfo {
    missing: boolean
    version?: string
    drivers?: string[]
}

async function inspectAppium (ctx: DoctorContext): Promise<{ info: AppiumInfo, row: DoctorCheck }> {
    // Project and global installs only. Appium next to this package is an
    // optional peer of the CLI, not the user's Android setup.
    const resolved = await resolveOptionalDependency('appium', { cwd: ctx.cwd, global: true })
    const fix = installCommand(`appium@${APPIUM_VERSION}`, { cwd: ctx.cwd })
    if (!resolved) {
        return { info: { missing: true }, row: fail('appium', 'not installed', fix) }
    }
    const version = packageVersion(resolved, 'appium')
    if (!version) {
        return { info: { missing: false }, row: fail('appium', 'installed, but its version could not be read', fix) }
    }
    const drivers = await listAppiumDrivers(appiumCliPath(resolved), ctx.env)
    if (versionBelow(version, '3.0.0')) {
        return { info: { missing: false, version, drivers }, row: fail('appium', `${version} is older than 3`, fix) }
    }
    return { info: { missing: false, version, drivers }, row: ok('appium', version) }
}

function checkDriver (target: AppiumTarget, info: AppiumInfo): DoctorCheck {
    const { driver, label, install } = APPIUM_DRIVERS[target]
    const id = `appium-driver:${driver}`
    if (info.missing) {
        return fail(id, `${label} driver "${driver}" is not installed`, install)
    }
    if (!info.drivers) {
        return warn(id, 'could not list installed Appium drivers')
    }
    if (!info.drivers.includes(driver)) {
        return fail(id, `${label} driver "${driver}" is not installed`, install)
    }
    return ok(id, driver)
}

function checkAndroidSdk (env: NodeJS.ProcessEnv): DoctorCheck {
    const home = env.ANDROID_HOME || env.ANDROID_SDK_ROOT
    const adb = findBinary('adb', env)
    if (home && adb) {
        return ok('android-sdk', home)
    }
    const missing = [
        home ? '' : 'ANDROID_HOME or ANDROID_SDK_ROOT',
        adb ? '' : 'adb on PATH'
    ].filter(Boolean).join(' and ')
    return fail('android-sdk', `missing ${missing}`, 'Install Android SDK platform-tools and set ANDROID_HOME')
}

function checkXcode (): Promise<DoctorCheck> {
    return new Promise((resolve) => {
        execFile('xcrun', ['simctl', 'help'], { timeout: 10_000 }, (err) => {
            resolve(err ? fail('xcode', 'xcrun simctl help failed', 'Install Xcode and run xcode-select --install') : ok('xcode', 'simctl'))
        })
    })
}

async function checkPackage (name: string, ctx: DoctorContext, required: boolean): Promise<DoctorCheck> {
    const id = `package:${name}`
    const resolved = await resolveOptionalDependency(name, { cwd: ctx.cwd, from: import.meta.url })
    const fix = installCommand(name, { cwd: ctx.cwd })
    if (!resolved) {
        return (required ? fail : warn)(id, `${name} is not installed`, fix)
    }
    return ok(id, packageVersion(resolved, name) || 'installed')
}

function checkBinaryRow (name: string, env: NodeJS.ProcessEnv, required: boolean, fix: string): DoctorCheck {
    const id = `binary:${name}`
    const found = findBinary(name, env)
    if (found) {
        return ok(id, found)
    }
    return (required ? fail : warn)(id, `${name} was not found on PATH`, fix)
}

function checkCredentials (provider: (typeof PROVIDERS)[number], env: NodeJS.ProcessEnv): DoctorCheck {
    const spec = CREDENTIALS[provider]
    const id = `credentials:${provider}`
    const missing = spec.env.filter((key) => !env[key])
    if (missing.length) {
        return fail(id, `${spec.label} needs ${spec.env.join(' and ')}`)
    }
    return ok(id, `${spec.label} credentials are set`)
}

const DRIVER_TARGETS = Object.fromEntries(APPIUM_TARGETS.map((target) => [APPIUM_DRIVERS[target].driver, target])) as Record<string, AppiumTarget>

/**
 * `wdio session doctor [target]`. Without a target every check runs; with a
 * target only what that target needs. Exit 1 when any check fails.
 */
export async function runDoctor (args: Record<string, unknown>, ctx: DoctorContext, host: DoctorHost = {}): Promise<ActionResult> {
    const target = typeof args.target === 'string' && args.target ? args.target : undefined
    if (target && !KNOWN_TARGETS.has(target)) {
        throw usage(`Unknown doctor target "${target}".`, `Use ${[...KNOWN_TARGETS].join(', ')}.`)
    }
    const platform = host.platform || process.platform
    const wanted = new Set(idsFor(target, platform))
    const strict = Boolean(target)
    const checks: DoctorCheck[] = []

    if (wanted.has('node')) {
        checks.push(await checkNode(host))
    }
    if (wanted.has('webdriverio')) {
        checks.push(await checkWebdriverIO(ctx))
    }
    if (wanted.has('runtime-dir')) {
        checks.push(checkRuntimeDir(ctx))
    }
    if (wanted.has('sessions')) {
        checks.push(...checkSessions(ctx))
    }
    for (const name of BROWSERS) {
        if (wanted.has(`browser:${name}`)) {
            checks.push(checkBrowser(name, ctx.env, platform))
        }
    }
    if (wanted.has('display')) {
        checks.push(checkDisplay(ctx.env))
    }

    let appium: AppiumInfo = { missing: true }
    if ([...wanted].some((id) => id === 'appium' || id.startsWith('appium-driver:'))) {
        const inspected = await inspectAppium(ctx)
        appium = inspected.info
        if (wanted.has('appium')) {
            checks.push(inspected.row)
        }
    }
    for (const id of wanted) {
        if (id.startsWith('appium-driver:')) {
            const driver = id.slice('appium-driver:'.length)
            const appiumTarget = DRIVER_TARGETS[driver]
            if (appiumTarget) {
                checks.push(checkDriver(appiumTarget, appium))
            }
        }
    }
    if (wanted.has('android-sdk')) {
        checks.push(checkAndroidSdk(ctx.env))
    }
    if (wanted.has('xcode')) {
        checks.push(await checkXcode())
    }
    for (const dep of PACKAGE_DEPENDENCIES) {
        if (dep.package === 'appium' || !wanted.has(`package:${dep.package}`)) {
            continue
        }
        checks.push(await checkPackage(dep.package, ctx, strict))
    }
    if (wanted.has('binary:tauri-driver')) {
        checks.push(checkBinaryRow('tauri-driver', ctx.env, strict, 'cargo install tauri-driver --locked'))
    }
    if (wanted.has('binary:ffmpeg')) {
        checks.push(checkBinaryRow('ffmpeg', ctx.env, false, 'sudo apt-get install -y ffmpeg'))
    }
    for (const provider of PROVIDERS) {
        if (wanted.has(`credentials:${provider}`)) {
            checks.push(checkCredentials(provider, ctx.env))
        }
    }

    const failed = checks.some((row) => row.status === 'fail')
    return {
        text: format(checks),
        data: { ok: !failed, checks, exitCode: failed ? 1 : 0 }
    }
}
