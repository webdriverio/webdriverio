import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import cp from 'node:child_process'

import getPort from 'get-port'
import waitPort from 'wait-port'
import logger from '@wdio/logger'
import WebDriver from 'webdriver'
// @ts-expect-error
import { getChromeVersion } from '@testim/chrome-version'

import { start as startSafaridriver, type SafaridriverOptions } from 'safaridriver'
import { start as startGeckodriver, type GeckodriverParameters } from 'geckodriver'
import { start as startEdgedriver, type EdgedriverParameters } from 'edgedriver'
import { install, getInstalledBrowsers, Browser, type InstallOptions } from '@puppeteer/browsers'

import type { Capabilities } from '@wdio/types'

import detectBackend from './detectBackend.js'
import { parseParams } from './utils.js'
import { SUPPORTED_BROWSERNAMES } from '../constants.js'
import type { RemoteOptions } from '../types'

const log = logger('webdriver')
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export interface ExtendedCapabilities extends Capabilities.Capabilities, WDIODriverOptions {}
export type ChromedriverOptions = InstallOptions & Omit<EdgedriverParameters, 'port'>

export interface WDIODriverOptions {
    'wdio:chromedriverOptions'?: ChromedriverOptions
    'wdio:safaridriverOptions'?: Omit<SafaridriverOptions, 'port'>
    'wdio:geckodriverOptions'?: Omit<GeckodriverParameters, 'port'>
    'wdio:edgedriverOptions'?: Omit<EdgedriverParameters, 'port'>
}

export async function getProtocolDriver (options: RemoteOptions) {
    /**
     * return `devtools` if explicitly set
     */
    if (options.automationProtocol === 'devtools') {
        try {
            const DevTools = await import('devtools')
            log.info('Starting session using Chrome DevTools as automation protocol and Puppeteer as driver')
            return { Driver: DevTools.default, options }
        } catch (err: unknown) {
            throw new Error(
                'Failed to import "devtools" as automation protocol driver!\n' +
                'Make sure to have it installed as dependency (`npm i devtools`)!\n' +
                `Error: ${(err as Error).message}`
            )
        }
    }

    /**
     * update connection parameters if we are running in a cloud
     */
    if (typeof options.user === 'string' && typeof options.key === 'string') {
        Object.assign(options, detectBackend(options))
    }

    /**
     * No need to start any driver if user has defined some sort of connection parameters.
     * In this case we assume that the user has already started a driver.
     * Note: we ignore "path" and "protocol" here as this is usually not used by users
     */
    if (options.hostname || options.port) {
        log.info(`Connecting to ${options.hostname}:${options.port}`)
        return { Driver: WebDriver, options }
    }

    const connectionDetails = await startWebDriver(options)
    Object.assign(options, detectBackend(connectionDetails))
    return { Driver: WebDriver, options }
}

export async function startWebDriver (options: RemoteOptions) {
    let driverProcess: cp.ChildProcess
    let driver = ''
    const start = Date.now()
    const caps: ExtendedCapabilities = (options.capabilities as Capabilities.W3CCapabilities).alwaysMatch || options.capabilities as Capabilities.Capabilities

    /**
     * session might be a mobile session so don't do anything
     */
    if (!caps.browserName) {
        throw new Error(
            'No "browserName" defined in capabilities nor hostname or port found!\n' +
            'If you like to run a mobile session with Appium, make sure to set "hostname" and "port" in your ' +
            'WebdriverIO options. If you like to run a local browser session make sure to pick from one of ' +
            `the following browser names: ${Object.values(SUPPORTED_BROWSERNAMES).flat(Infinity)}`
        )
    }

    const port = await getPort()
    if (caps.browserName.toLowerCase() === 'chrome') {
        const chromeVersion = await getChromeVersion().catch(() => undefined) as string | undefined
        const chromedriverOptions = caps['wdio:chromedriverOptions'] || ({} as ChromedriverOptions)
        const cacheDir = chromedriverOptions.cacheDir || path.resolve(__dirname, '..', '..', '.chromedriver')
        const exist = await fs.access(cacheDir).then(() => true, () => false)

        if (!exist) {
            await fs.mkdir(cacheDir, { recursive: true })
        }

        const installedBrowsers = await getInstalledBrowsers({ cacheDir })
        const cachedChromeBrowserVersion: string | undefined = caps.browserVersion && installedBrowsers.find((browser) => (
            browser.browser === Browser.CHROME &&
            browser.buildId.startsWith(caps.browserVersion!)
        ))?.buildId
        const buildId = caps.browserVersion || chromeVersion || 'stable'

        let chromedriver = installedBrowsers.find((browser) => (
            browser.browser === Browser.CHROMEDRIVER &&
            browser.buildId.startsWith(buildId)
        ))
        if (!chromedriver) {
            chromedriver = await install({
                ...chromedriverOptions,
                cacheDir,
                buildId,
                browser: Browser.CHROMEDRIVER,
                downloadProgressCallback: () => {}
            })
        }

        if (!cachedChromeBrowserVersion && !chromeVersion) {
            await install({
                ...chromedriverOptions,
                cacheDir,
                buildId: caps.browserVersion || buildId,
                browser: Browser.CHROME,
                downloadProgressCallback: () => {}
            })
        }

        /**
         * this is currently necessary due to https://github.com/puppeteer/puppeteer/issues/10587
         */
        const chromedriverDir = (await fs.readdir(chromedriver.path)).find((entry) => entry.startsWith('chromedriver'))
        const absoluteChromedriverPath = path.join(chromedriver.path, chromedriverDir!, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''))

        driverProcess = cp.spawn(absoluteChromedriverPath, parseParams({ port, ...chromedriverOptions }))
        driver = `ChromeDriver v${buildId}`
    } else if (caps.browserName.toLowerCase() === 'safari') {
        driver = 'SafariDriver'
        driverProcess = startSafaridriver({
            ...(caps['wdio:safaridriverOptions'] || {}),
            port
        })
    } else if (caps.browserName.toLowerCase() === 'firefox') {
        driver = 'GeckoDriver'
        driverProcess = await startGeckodriver({
            ...(caps['wdio:geckodriverOptions'] || {}),
            port
        })
    } else if (['microsoftedge', 'edge'].includes(caps.browserName.toLowerCase())) {
        driver = 'EdgeDriver'
        driverProcess = await startEdgedriver({
            ...(caps['wdio:geckodriverOptions'] || {}),
            port
        })
    } else {
        throw new Error(
            `Unknown browser name "${caps.browserName}". Make sure to pick from one of the following ` +
            Object.values(SUPPORTED_BROWSERNAMES).flat(Infinity)
        )
    }

    await waitPort({ port, output: 'silent' })
    log.info(`Started ${driver} in ${Date.now() - start}ms on port ${port}`)
    return { port, hostname: '0.0.0.0', driverProcess }
}
