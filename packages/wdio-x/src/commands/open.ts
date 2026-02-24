import type { ArgumentsCamelCase, Argv } from 'yargs'
import type { Capabilities } from '@wdio/types'
import { remote } from 'webdriverio'

import { writeSession, readSession, getSessionDir } from '../session.js'

export const command = 'open [url]'
export const desc = 'Open a browser session and navigate to a URL'

export const builder = (yargs: Argv) => {
    return yargs
        .positional('url', {
            type: 'string',
            describe: 'URL to navigate to',
        })
        .option('browser', {
            alias: 'b',
            type: 'string',
            default: 'chrome',
            describe: 'Browser to use (chrome, firefox, edge, safari)',
        })
        .option('app', {
            type: 'string',
            describe: 'Path to mobile app (.apk, .ipa, .app)',
        })
        .option('device', {
            alias: 'd',
            type: 'string',
            describe: 'Device name for mobile testing',
        })
        .option('platform', {
            type: 'string',
            describe: 'Mobile platform (android, ios)',
        })
        .option('port', {
            alias: 'p',
            type: 'number',
            describe: 'WebDriver/Appium server port',
        })
        .option('hostname', {
            type: 'string',
            describe: 'WebDriver/Appium server hostname',
        })
}

interface OpenArgs {
    url?: string
    browser: string
    session: string
    app?: string
    device?: string
    platform?: string
    port?: number
    hostname?: string
    _sessionsDir?: string
}

export async function handler (argv: ArgumentsCamelCase<OpenArgs>) {
    const sessionName = argv.session as string
    const sessionsDir = (argv._sessionsDir as string) || getSessionDir()

    const existing = await readSession(sessionName, sessionsDir)
    if (existing) {
        console.log(`Session "${sessionName}" already exists (${existing.url}). Use --session=<name> for a new one, or run: wdiox close`)
        return
    }

    const capabilities: Record<string, unknown> = {}

    const isMobile = !!argv.app
    if (isMobile) {
        capabilities['appium:app'] = argv.app
        capabilities['appium:deviceName'] = argv.device || 'emulator-5554'
        capabilities['appium:newCommandTimeout'] = 300
        // Auto-detect platform from app extension if not specified
        const platform = argv.platform
            || (argv.app?.endsWith('.apk') ? 'android' : 'ios')
        capabilities.platformName = platform === 'ios' ? 'iOS' : 'Android'
        capabilities['appium:automationName'] = platform === 'ios' ? 'XCUITest' : 'UiAutomator2'
    } else {
        capabilities.browserName = argv.browser
    }

    const remoteOpts: Record<string, unknown> = { capabilities }
    // For mobile / Appium, explicit connection is required
    if (argv.hostname || argv.port || isMobile) {
        remoteOpts.hostname = argv.hostname || 'localhost'
        remoteOpts.port = argv.port || (isMobile ? 4723 : 4444)
        remoteOpts.path = '/'
    }

    const browser = await remote(remoteOpts as unknown as Capabilities.WebdriverIOConfig)

    if (argv.url) {
        await browser.url(argv.url)
    }

    const opts = browser.options as Capabilities.WebdriverIOConfig
    await writeSession(sessionName, {
        sessionId: browser.sessionId,
        hostname: opts?.hostname || 'localhost',
        port: opts?.port || 4444,
        capabilities: browser.capabilities as Record<string, unknown>,
        created: new Date().toISOString(),
        url: argv.url || '',
    }, sessionsDir)

    console.log(`Session "${sessionName}" started.`)
}
