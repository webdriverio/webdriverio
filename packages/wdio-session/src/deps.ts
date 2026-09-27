import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'

import { installCommand, resolveOptionalDependency } from '@wdio/utils/node'

import { SessionError } from './errors.js'

export type AppiumTarget = 'android' | 'ios' | 'macos' | 'windows'

export const APPIUM_VERSION = '^3'
const DRIVER_LIST_TIMEOUT = 5000

export const APPIUM_DRIVERS: Record<AppiumTarget, { driver: string, label: string, feature: string, install: string }> = {
    android: { driver: 'uiautomator2', label: 'Android', feature: 'open an Android session', install: 'npx appium driver install uiautomator2' },
    ios: { driver: 'xcuitest', label: 'iOS', feature: 'open an iOS session', install: 'npx appium driver install xcuitest' },
    macos: { driver: 'mac2', label: 'macOS', feature: 'open a macOS session', install: 'npx appium driver install mac2' },
    windows: { driver: 'windows', label: 'Windows', feature: 'open a Windows session', install: 'npx appium driver install --source=npm appium-windows-driver' }
}

export interface PackageDependency {
    package: string
    /**
     * features that need the package, used by `doctor`
     */
    features: string[]
    version?: string
    global?: boolean
}

/**
 * Optional packages from RFC §10.2. Binaries are checked with `checkBinary`.
 */
export const PACKAGE_DEPENDENCIES: PackageDependency[] = [
    { package: 'appium', features: ['android', 'ios', 'macos', 'windows'], version: APPIUM_VERSION, global: true },
    { package: '@wdio/electron-service', features: ['electron'] },
    { package: 'electron', features: ['electron'] },
    { package: '@wdio/tauri-service', features: ['tauri'] },
    { package: '@wdio/dioxus-service', features: ['dioxus'] },
    { package: '@wdio/visual-service', features: ['visual'] }
]

export const HINT_DOCTOR = (target?: string) => `Run \`wdio session doctor${target ? ` ${target}` : ''}\` to check your whole setup.`

function withVersion (pkg: string, version?: string) {
    return version ? `${pkg}@${version}` : pkg
}

export interface RequirePackageOptions {
    cwd: string
    /**
     * what the package is needed for, e.g. "open an Electron session"
     */
    feature: string
    version?: string
    global?: boolean
    /**
     * name used in the message instead of the package name
     */
    label?: string
    /**
     * extra install steps after the package install
     */
    then?: string[]
    hint?: string
}

/**
 * Resolve an optional package from the user's project or fail with
 * `MISSING_DEPENDENCY` (exit 3) and an install command for the project's
 * package manager.
 */
export async function requirePackage (pkg: string, opts: RequirePackageOptions): Promise<string> {
    const resolved = await resolveOptionalDependency(pkg, { cwd: opts.cwd, global: opts.global })
    if (resolved) {
        return resolved
    }
    throw new SessionError('MISSING_DEPENDENCY', `Cannot ${opts.feature}: ${opts.label || pkg} is not installed.`, {
        package: pkg,
        install: [installCommand(withVersion(pkg, opts.version), { cwd: opts.cwd }), ...(opts.then || [])],
        hint: opts.hint
    })
}

/**
 * Find the directory containing the `package.json` of a resolved entry.
 */
export function findPackageRoot (entry: string, name: string) {
    let dir = path.dirname(entry)
    while (true) {
        const pkgFile = path.join(dir, 'package.json')
        if (fs.existsSync(pkgFile)) {
            try {
                if (JSON.parse(fs.readFileSync(pkgFile, 'utf-8')).name === name) {
                    return dir
                }
            } catch {
                // keep walking up
            }
        }
        const parent = path.dirname(dir)
        if (parent === dir) {
            return undefined
        }
        dir = parent
    }
}

/**
 * Absolute path of the Appium CLI script for a resolved `appium` entry.
 */
export function appiumCliPath (entry: string) {
    const root = findPackageRoot(entry, 'appium')
    if (!root) {
        return entry
    }
    const { bin } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8')) as { bin?: string | Record<string, string> }
    const script = typeof bin === 'string' ? bin : bin?.appium
    return script ? path.join(root, script) : entry
}

/**
 * Names of the installed Appium drivers, or `undefined` when Appium could not
 * tell (the driver check is then skipped and Appium reports it at session start).
 */
export function listAppiumDrivers (appiumCli: string, env = process.env): Promise<string[] | undefined> {
    return new Promise((resolve) => {
        execFile(process.execPath, [appiumCli, 'driver', 'list', '--installed', '--json'], { timeout: DRIVER_LIST_TIMEOUT, env }, (err, stdout) => {
            if (err) {
                return resolve(undefined)
            }
            resolve(parseDriverList(String(stdout)))
        })
    })
}

export function parseDriverList (stdout: string): string[] | undefined {
    const start = stdout.indexOf('{')
    if (start === -1) {
        return undefined
    }
    try {
        const parsed = JSON.parse(stdout.slice(start))
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? Object.keys(parsed) : undefined
    } catch {
        return undefined
    }
}

export interface AppiumCheck {
    /**
     * Appium CLI script, run with `node` to start the server
     */
    cli: string
    drivers?: string[]
}

/**
 * Check Appium and the driver a target needs. Skipped entirely when a
 * running server is used (`--appium-url`) or a cloud provider runs the session.
 */
export async function checkAppium (target: AppiumTarget, opts: { cwd: string, env?: NodeJS.ProcessEnv }): Promise<AppiumCheck> {
    const { driver, label, feature, install } = APPIUM_DRIVERS[target]
    const entry = await requirePackage('appium', {
        cwd: opts.cwd,
        feature,
        label: 'Appium',
        version: APPIUM_VERSION,
        global: true,
        then: [install],
        hint: HINT_DOCTOR(target)
    })
    const cli = appiumCliPath(entry)
    const drivers = await listAppiumDrivers(cli, opts.env)
    if (drivers && !drivers.includes(driver)) {
        throw new SessionError('MISSING_APPIUM_DRIVER', `Appium is installed but the ${label} driver "${driver}" is not.`, {
            package: driver,
            install: [install],
            hint: HINT_DOCTOR(target)
        })
    }
    return { cli, drivers }
}

/**
 * Find an executable on `PATH`.
 */
export function findBinary (name: string, env = process.env, platform = process.platform) {
    const exts = platform === 'win32' ? (env.PATHEXT || '.EXE;.CMD;.BAT').split(';').map((ext) => ext.toLowerCase()) : ['']
    for (const dir of (env.PATH || '').split(path.delimiter)) {
        if (!dir) {
            continue
        }
        for (const ext of exts) {
            const candidate = path.join(dir, name + ext)
            try {
                fs.accessSync(candidate, fs.constants.X_OK)
                if (fs.statSync(candidate).isFile()) {
                    return candidate
                }
            } catch {
                // not here
            }
        }
    }
    return undefined
}

export function checkBinary (name: string, opts: { feature: string, install: string[], hint?: string, env?: NodeJS.ProcessEnv }) {
    const found = findBinary(name, opts.env)
    if (!found) {
        throw new SessionError('MISSING_BINARY', `Cannot ${opts.feature}: ${name} was not found on PATH.`, {
            package: name,
            install: opts.install,
            hint: opts.hint
        })
    }
    return found
}

/**
 * Linux desktop targets without a display need Xvfb (or weston) for
 * `@wdio/display-server`.
 */
export function checkDisplayServer (feature: string, env = process.env) {
    if (findBinary('Xvfb', env) || findBinary('weston', env)) {
        return
    }
    throw new SessionError('MISSING_BINARY', `Cannot ${feature}: no display is available and neither Xvfb nor weston is installed.`, {
        package: 'xvfb',
        install: ['sudo apt-get install -y xvfb'],
        hint: 'Or set DISPLAY to an existing X server.'
    })
}

/**
 * `visual` actions need `@wdio/visual-service` in the project that runs the
 * CLI or the project the session was opened in.
 */
export async function checkVisualDependency (cwd: string, sessionCwd?: string) {
    for (const dir of new Set([cwd, sessionCwd].filter(Boolean) as string[])) {
        if (await resolveOptionalDependency('@wdio/visual-service', { cwd: dir })) {
            return
        }
    }
    await requirePackage('@wdio/visual-service', { cwd: sessionCwd || cwd, feature: 'compare screenshots', label: '@wdio/visual-service' })
}
