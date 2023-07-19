import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import cp from 'node:child_process'

import getPort from 'get-port'
import waitPort from 'wait-port'
import logger from '@wdio/logger'
import WebDriver from 'webdriver'
import { deepmerge } from 'deepmerge-ts'

import { start as startSafaridriver, type SafaridriverOptions } from 'safaridriver'
import { start as startGeckodriver, type GeckodriverParameters } from 'geckodriver'
import { start as startEdgedriver, type EdgedriverParameters } from 'edgedriver'
import { install, computeExecutablePath, Browser, type InstallOptions } from '@puppeteer/browsers'

import type { Capabilities } from '@wdio/types'

import detectBackend from './detectBackend.js'
import { parseParams, setupChrome } from './utils.js'
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
    if (SUPPORTED_BROWSERNAMES.chrome.includes(caps.browserName.toLowerCase())) {
        const chromedriverOptions = caps['wdio:chromedriverOptions'] || ({} as ChromedriverOptions)
        const cacheDir = chromedriverOptions.cacheDir || path.resolve(__dirname, '..', '..', '.chrome')
        const exist = await fs.access(cacheDir).then(() => true, () => false)
        if (!exist) {
            await fs.mkdir(cacheDir, { recursive: true })
        }

        const { executablePath, buildId, platform } = await setupChrome(caps, cacheDir)
        log.info(`Downloading Chromedriver v${buildId}`)
        await install({
            ...chromedriverOptions,
            cacheDir,
            platform,
            buildId,
            browser: Browser.CHROMEDRIVER,
            downloadProgressCallback: () => {}
        })
        const chromedriverBinaryPath = computeExecutablePath({
            browser: Browser.CHROMEDRIVER,
            buildId,
            cacheDir
        })
        caps['goog:chromeOptions'] = deepmerge(
            { binary: executablePath },
            caps['goog:chromeOptions'] || {}
        )
        chromedriverOptions.allowedOrigins = ['*']
        chromedriverOptions.allowedIps = ['']
        const driverParams = parseParams({ port, ...chromedriverOptions })
        driverProcess = cp.spawn(chromedriverBinaryPath, driverParams)
        driver = `ChromeDriver v${buildId} with params ${driverParams.join(' ')}`
    } else if (SUPPORTED_BROWSERNAMES.safari.includes(caps.browserName.toLowerCase())) {
        driver = 'SafariDriver'
        driverProcess = startSafaridriver({
            ...(caps['wdio:safaridriverOptions'] || {}),
            port
        })

        /**
         * set "Host" header as it is required by Safaridriver
         */
        options.headers = deepmerge({ Host: 'localhost' }, (options.headers || {}))
    } else if (SUPPORTED_BROWSERNAMES.firefox.includes(caps.browserName.toLowerCase())) {
        driver = 'GeckoDriver'
        driverProcess = await startGeckodriver({
            ...(caps['wdio:geckodriverOptions'] || {}),
            port
        })
    } else if (SUPPORTED_BROWSERNAMES.edge.includes(caps.browserName.toLowerCase())) {
        const edgedriverOptions = caps['wdio:chromedriverOptions'] || ({} as ChromedriverOptions)
        edgedriverOptions.allowedOrigins = ['*']
        edgedriverOptions.allowedIps = ['']
        driver = 'EdgeDriver'
        driverProcess = await startEdgedriver({ ...edgedriverOptions, port })

        /**
         * Microsoft Edge is very particular when it comes to browser names
         */
        caps.browserName = 'MicrosoftEdge'
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
