import fs from 'node:fs'
import path from 'node:path'

import getPort from 'get-port'

import { checkAppium, type AppiumTarget } from '../deps.js'
import { usage, notSupported } from '../errors.js'
import { parseRemoteUrl, type OpenArgs } from './utils.js'
import { macosCapabilities, windowsCapabilities, desktopLabel } from './desktop.js'
import type { PlanContext } from './index.js'
import type { TargetPlan } from '../types.js'

const REQUIRED_PLATFORM: Partial<Record<AppiumTarget, { platform: NodeJS.Platform, label: string }>> = {
    macos: { platform: 'darwin', label: 'macOS' },
    windows: { platform: 'win32', label: 'Windows' }
}

/** UiAutomator2 installs the server, then starts instrumentation. Both run inside the first POST. */
export const UIAUTOMATOR2_SERVER_INSTALL_TIMEOUT = 180_000
export const UIAUTOMATOR2_SERVER_LAUNCH_TIMEOUT = 240_000
/**
 * The parent readiness wait and the WebDriver request timeout start before
 * that POST. They have to outlast the install, the launch, and the handshake
 * around them, or the client gives up while Appium is still inside its limits.
 */
export const MOBILE_SESSION_START_TIMEOUT = UIAUTOMATOR2_SERVER_INSTALL_TIMEOUT + UIAUTOMATOR2_SERVER_LAUNCH_TIMEOUT + 60_000

const DRIVERS: Record<AppiumTarget, { automationName: string, label: string }> = {
    android: { automationName: 'UiAutomator2', label: 'android (UiAutomator2)' },
    ios: { automationName: 'XCUITest', label: 'ios (XCUITest)' },
    macos: { automationName: 'Mac2', label: 'macos (Mac2)' },
    windows: { automationName: 'Windows', label: 'windows (Windows)' }
}

function appPath (cwd: string, value: string) {
    if (/^(https?:|bs:|lt:|sauce-storage:|storage:)/i.test(value)) {
        return value
    }
    const resolved = path.resolve(cwd, value)
    if (!fs.existsSync(resolved)) {
        throw usage(`App not found: ${resolved}`)
    }
    return resolved
}

function mobileCapabilities (target: 'android' | 'ios', args: OpenArgs, cwd: string) {
    const browser = typeof args.browser === 'string' ? args.browser : ''
    const caps: Record<string, unknown> = {
        platformName: target === 'android' ? 'Android' : 'iOS',
        'appium:automationName': DRIVERS[target].automationName,
        'appium:deviceName': typeof args.device === 'string' && args.device ? args.device : (target === 'android' ? 'Android Emulator' : 'iPhone 16'),
        'appium:newCommandTimeout': 3600,
        ...(target === 'android'
            ? {
                'appium:autoGrantPermissions': true,
                // A software emulator spends its one core on boot and dexopt.
                // The hidden-API policy write, the settings app, and the
                // UiAutomator2 instrumentation then miss Appium's shorter
                // defaults, and the session dies before the app is on screen.
                'appium:ignoreHiddenApiPolicyError': true,
                'appium:disableWindowAnimation': true,
                'appium:adbExecTimeout': 60_000,
                // The server and the test apk are installed together. On a
                // one-core emulator that pair takes longer than Appium's
                // 20s default, and a short ceiling aborts the install while
                // package manager is still writing it.
                'appium:uiautomator2ServerInstallTimeout': UIAUTOMATOR2_SERVER_INSTALL_TIMEOUT,
                // Cold dexopt on a slow emulator is still running when
                // Appium's 30s default expires, and Appium then force-stops
                // the server it just started.
                'appium:uiautomator2ServerLaunchTimeout': UIAUTOMATOR2_SERVER_LAUNCH_TIMEOUT
            }
            : { 'appium:autoAcceptAlerts': false })
    }
    if (typeof args.platformVersion === 'string' && args.platformVersion) {
        caps['appium:platformVersion'] = args.platformVersion
    }
    if (typeof args.udid === 'string' && args.udid) {
        caps['appium:udid'] = args.udid
    }
    if (args.reset === false) {
        caps['appium:noReset'] = true
    }
    if (args.fullReset) {
        caps['appium:fullReset'] = true
    }
    if (typeof args.orientation === 'string' && args.orientation) {
        caps['appium:orientation'] = args.orientation.toUpperCase()
    }
    if (browser) {
        caps.browserName = browser
        return caps
    }
    if (typeof args.app === 'string' && args.app) {
        caps['appium:app'] = appPath(cwd, args.app)
    }
    if (target === 'android') {
        if (typeof args.package === 'string' && args.package) {
            caps['appium:appPackage'] = args.package
        }
        if (typeof args.activity === 'string' && args.activity) {
            caps['appium:appActivity'] = args.activity
        }
        if (!caps['appium:app'] && !caps['appium:appPackage']) {
            throw usage('Pass --app, --package or --browser for an Android session.', 'Example: `wdio session open android --app ./app.apk`.')
        }
    } else {
        if (typeof args.bundleId === 'string' && args.bundleId) {
            caps['appium:bundleId'] = args.bundleId
        }
        if (!caps['appium:app'] && !caps['appium:bundleId']) {
            throw usage('Pass --app, --bundle-id or --browser for an iOS session.', 'Example: `wdio session open ios --bundle-id com.example.app`.')
        }
    }
    return caps
}

export async function appiumTargetPlan (target: AppiumTarget, args: OpenArgs, ctx: PlanContext & { env: NodeJS.ProcessEnv }): Promise<TargetPlan> {
    const required = REQUIRED_PLATFORM[target]
    const host = ctx.platform || process.platform
    if (required && host !== required.platform && !args.provider && !args.appiumUrl) {
        throw notSupported(`"${target}" sessions require ${required.label}.`)
    }
    // A missing Appium install is the error to show first. Capability checks
    // (the app file exists, a bundle id was passed) run after that.
    let checked: Awaited<ReturnType<typeof checkAppium>> | undefined
    if (!(typeof args.appiumUrl === 'string' && args.appiumUrl) && !args.provider) {
        checked = await checkAppium(target, { cwd: ctx.cwd, env: ctx.env })
    }
    const capabilities = target === 'macos'
        ? macosCapabilities(args)
        : target === 'windows'
            ? windowsCapabilities(args, ctx.cwd)
            : mobileCapabilities(target, args, ctx.cwd)
    const native = target === 'macos' || target === 'windows'
    const web = Boolean(args.browser)
    let remote: TargetPlan['remote']
    let appium: TargetPlan['appium']
    if (typeof args.appiumUrl === 'string' && args.appiumUrl) {
        remote = parseRemoteUrl(args.appiumUrl)
        appium = { driver: DRIVERS[target].automationName.toLowerCase() }
    } else if (checked) {
        const port = await getPort()
        remote = { hostname: '127.0.0.1', port, path: '/' }
        appium = { main: checked.cli, driver: DRIVERS[target].automationName.toLowerCase(), port }
    }
    return {
        capabilities: capabilities as TargetPlan['capabilities'],
        label: native ? desktopLabel(target) : DRIVERS[target].label,
        platform: native ? 'desktop' : 'mobile',
        applies: web ? ['W'] : native ? ['D'] : ['M'],
        mode: 'remote',
        headless: false,
        appium,
        remote,
        notes: []
    }
}
