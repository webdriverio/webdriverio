import fs from 'node:fs/promises'
import os from 'node:os'
import cp, { type ChildProcess } from 'node:child_process'

import getPort from 'get-port'
import waitPort from 'wait-port'
import logger from '@wdio/logger'
import { deepmerge } from 'deepmerge-ts'
import type { Options } from '@wdio/types'

import { start as startSafaridriver, type SafaridriverOptions } from 'safaridriver'
import { start as startGeckodriver, type GeckodriverParameters } from 'geckodriver'
import { start as startEdgedriver, type EdgedriverParameters } from 'edgedriver'
import { install, computeExecutablePath, Browser, type InstallOptions } from '@puppeteer/browsers'

import type { Capabilities } from '@wdio/types'

import { parseParams, setupChrome, definesRemoteDriver, downloadProgressCallback } from './utils.js'
import { SUPPORTED_BROWSERNAMES } from '../constants.js'

const log = logger('webdriver')

export interface ExtendedCapabilities extends Capabilities.Capabilities, WDIODriverOptions {}
export type ChromedriverOptions = InstallOptions & Omit<EdgedriverParameters, 'port' | 'edgeDriverVersion' | 'customEdgeDriverPath'>

export interface WDIODriverOptions {
    'wdio:chromedriverOptions'?: ChromedriverOptions
    'wdio:safaridriverOptions'?: Omit<SafaridriverOptions, 'port'>
    'wdio:geckodriverOptions'?: Omit<GeckodriverParameters, 'port'>
    'wdio:edgedriverOptions'?: Omit<EdgedriverParameters, 'port'>
}

export async function startWebDriver (options: Options.WebDriver) {
    /**
     * in case we are running unit tests, just return
     */
    if (process.env.VITEST_WORKER_ID) {
        options.hostname = '0.0.0.0'
        options.port = 4321
        return
    }

    /**
     * if any of the connection parameter are set, don't start any driver
     */
    if (definesRemoteDriver(options)) {
        log.info(`Connecting to existing driver at ${options.protocol}://${options.hostname}:${options.port}${options.path}`)
        return
    }

    let driverProcess: ChildProcess
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
        /**
         * Chrome
         */
        const chromedriverOptions = caps['wdio:chromedriverOptions'] || ({} as ChromedriverOptions)
        const cacheDir = chromedriverOptions.cacheDir || options.cacheDir || os.tmpdir()
        const exist = await fs.access(cacheDir).then(() => true, () => false)
        if (!exist) {
            await fs.mkdir(cacheDir, { recursive: true })
        }

        const { executablePath, buildId, platform } = await setupChrome(caps, cacheDir)
        const chromedriverBinaryPath = computeExecutablePath({
            browser: Browser.CHROMEDRIVER,
            buildId,
            cacheDir
        })
        const hasChromedriverInstalled = await fs.access(chromedriverBinaryPath).then(() => true, () => false)
        if (!hasChromedriverInstalled) {
            log.info(`Downloading Chromedriver v${buildId}`)
            await install({
                ...chromedriverOptions,
                cacheDir,
                platform,
                buildId,
                browser: Browser.CHROMEDRIVER,
                downloadProgressCallback: (downloadedBytes, totalBytes) => downloadProgressCallback('Chrome', downloadedBytes, totalBytes)
            })
        } else {
            log.info(`Using Chromedriver v${buildId} from cache directory ${cacheDir}`)
        }
        caps['goog:chromeOptions'] = deepmerge(
            { binary: executablePath },
            caps['goog:chromeOptions'] || {}
        )
        chromedriverOptions.allowedOrigins = chromedriverOptions.allowedOrigins || ['*']
        chromedriverOptions.allowedIps = chromedriverOptions.allowedIps || ['']
        const driverParams = parseParams({ port, ...chromedriverOptions })
        driverProcess = cp.spawn(chromedriverBinaryPath, driverParams)
        driver = `ChromeDriver v${buildId} with params ${driverParams.join(' ')}`
    } else if (SUPPORTED_BROWSERNAMES.safari.includes(caps.browserName.toLowerCase())) {
        const safaridriverOptions = caps['wdio:safaridriverOptions'] || ({} as SafaridriverOptions)
        /**
         * Safari
         */
        driver = 'SafariDriver'
        driverProcess = startSafaridriver({
            useTechnologyPreview: Boolean(caps.browserName.match(/preview/i)),
            ...safaridriverOptions,
            port
        })

        /**
         * set "Host" header as it is required by Safaridriver
         */
        options.headers = deepmerge({ Host: 'localhost' }, (options.headers || {}))
    } else if (SUPPORTED_BROWSERNAMES.firefox.includes(caps.browserName.toLowerCase())) {
        /**
         * Firefox
         */
        const geckodriverOptions = caps['wdio:geckodriverOptions'] || ({} as GeckodriverParameters)
        const cacheDir = geckodriverOptions.cacheDir || options.cacheDir || os.tmpdir()
        driver = 'GeckoDriver'
        driverProcess = await startGeckodriver({ ...geckodriverOptions, cacheDir, port })
    } else if (SUPPORTED_BROWSERNAMES.edge.includes(caps.browserName.toLowerCase())) {
        /**
         * Microsoft Edge
         */
        const edgedriverOptions = caps['wdio:edgedriverOptions'] || ({} as EdgedriverParameters)
        const cacheDir = edgedriverOptions.cacheDir || options.cacheDir || os.tmpdir()
        driver = 'EdgeDriver'
        driverProcess = await startEdgedriver({ ...edgedriverOptions, cacheDir, port })

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

    options.hostname = '0.0.0.0'
    options.port = port
    log.info(`Started ${driver} in ${Date.now() - start}ms on port ${port}`)
    return driverProcess
}
