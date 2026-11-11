import path from 'node:path'

import { DEFAULT_VIEWPORT } from '../constants.js'
import { notSupported, usage } from '../errors.js'
import { hasDisplay, parseViewport, toArray, type OpenArgs } from './utils.js'
import type { OpenPlan } from '../types.js'

export const BROWSER_TARGETS = ['chrome', 'firefox', 'edge', 'safari'] as const
export type BrowserTarget = typeof BROWSER_TARGETS[number]

const BROWSER_NAMES: Record<BrowserTarget, string> = {
    chrome: 'chrome',
    firefox: 'firefox',
    edge: 'MicrosoftEdge',
    safari: 'safari'
}

type PlanPart = Pick<OpenPlan, 'capabilities' | 'label' | 'platform' | 'applies' | 'mode' | 'headless' | 'viewport' | 'detach' | 'display' | 'notes'>

export function browserPlan (target: BrowserTarget, args: OpenArgs, { cwd, platform = process.platform, env = process.env }: { cwd: string, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv }): PlanPart {
    const notes: string[] = []
    if (target === 'safari' && platform !== 'darwin') {
        throw notSupported('Safari sessions require macOS.')
    }
    const attach = args.attach ? String(args.attach) : undefined
    if (attach && target !== 'chrome' && target !== 'edge') {
        throw usage('--attach is only supported for chrome and edge.')
    }
    // `--headless` is the default; it's accepted because agents and people reach for it
    let headless = args.headless === true || !(args.headed || env.WDIO_SESSION_HEADED === '1')
    if (target === 'safari' && headless) {
        headless = false
        notes.push('Safari has no headless mode, opening a visible window.')
    }
    if (attach) {
        headless = false
    }
    const viewport = parseViewport(args.viewport) || DEFAULT_VIEWPORT
    const extraArgs = toArray(args.arg)
    const fsPath = platform === 'win32' ? path.win32 : path.posix
    const capabilities: Record<string, unknown> = {
        browserName: BROWSER_NAMES[target],
        webSocketUrl: args.bidi !== false && target !== 'safari',
        /**
         * With the default `normal` strategy the driver holds every command
         * until the page and all its ads and trackers have loaded, which on
         * busy sites takes tens of seconds or minutes. `eager` waits for the
         * document only; `open` and `navigate` then give the page a few more
         * seconds to finish (see `waitForLoad`). `--capabilities` can override it.
         */
        pageLoadStrategy: 'eager'
    }
    if (args.browserVersion) {
        capabilities.browserVersion = String(args.browserVersion)
    }

    if (target === 'chrome' || target === 'edge') {
        const key = target === 'chrome' ? 'goog:chromeOptions' : 'ms:edgeOptions'
        const options: Record<string, unknown> = {}
        if (attach) {
            options.debuggerAddress = /^\d+$/.test(attach) ? `localhost:${attach}` : attach.replace(/^https?:\/\//, '').replace(/\/$/, '')
        } else {
            const browserArgs = [
                // WebGL stays on: maps, charts and 3D pages need it. Without a GPU
                // (CI, containers) Chrome renders it in software only when allowed to
                ...(headless ? ['--headless=new', '--enable-unsafe-swiftshader'] : []),
                `--window-size=${viewport.width},${viewport.height}`,
                ...(args.profile ? [`--user-data-dir=${fsPath.resolve(cwd, String(args.profile))}`] : []),
                // keeps `navigator.webdriver` false; Chrome honors one such switch, so a user's own wins
                ...(extraArgs.some((arg) => arg.startsWith('--disable-blink-features')) ? [] : ['--disable-blink-features=AutomationControlled']),
                ...extraArgs
            ]
            options.args = browserArgs
        }
        if (args.binary) {
            options.binary = fsPath.resolve(cwd, String(args.binary))
        }
        capabilities[key] = options
    } else if (target === 'firefox') {
        const options: Record<string, unknown> = {
            args: [
                ...(headless ? ['-headless'] : []),
                `--width=${viewport.width}`,
                `--height=${viewport.height}`,
                ...(args.profile ? ['-profile', fsPath.resolve(cwd, String(args.profile))] : []),
                ...extraArgs
            ]
        }
        if (args.binary) {
            options.binary = fsPath.resolve(cwd, String(args.binary))
        }
        capabilities['moz:firefoxOptions'] = options
    }

    return {
        capabilities: capabilities as OpenPlan['capabilities'],
        label: target,
        platform: 'browser',
        applies: ['W'],
        mode: 'remote',
        headless,
        viewport: attach ? undefined : viewport,
        detach: Boolean(attach),
        display: !headless && platform === 'linux' && !hasDisplay(env),
        notes
    }
}
