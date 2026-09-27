import path from 'node:path'

import { usage } from '../errors.js'
import { toArray, type OpenArgs } from './utils.js'

export function macosCapabilities (args: OpenArgs): Record<string, unknown> {
    const bundleId = typeof args.bundleId === 'string' ? args.bundleId : ''
    if (!bundleId) {
        throw usage('Pass --bundle-id for a macOS session.', 'Example: `wdio session open macos --bundle-id com.apple.TextEdit`.')
    }
    return {
        platformName: 'mac',
        'appium:automationName': 'Mac2',
        'appium:bundleId': bundleId,
        'appium:newCommandTimeout': 3600
    }
}

export function windowsCapabilities (args: OpenArgs, cwd: string): Record<string, unknown> {
    const given = typeof args.app === 'string' ? args.app : ''
    const app = !given || given === 'Root' ? 'Root' : path.resolve(cwd, given)
    const caps: Record<string, unknown> = {
        platformName: 'windows',
        'appium:automationName': 'Windows',
        'appium:app': app,
        'appium:newCommandTimeout': 3600
    }
    if (args.appArg) {
        caps['appium:appArguments'] = toArray(args.appArg).join(' ')
    }
    return caps
}

export function desktopLabel (target: 'macos' | 'windows') {
    return target === 'macos' ? 'macos (Mac2)' : 'windows (Windows)'
}
