import fs from 'node:fs'
import path from 'node:path'
import cp, { type ChildProcess } from 'node:child_process'

import getPort from 'get-port'
import waitPort from 'wait-port'
import logger from '@wdio/logger'
import split2 from 'split2'
import { deepmerge } from 'deepmerge-ts'

import { start as startSafaridriver, type SafaridriverOptions as SafaridriverParameters } from 'safaridriver'
import { start as startGeckodriver, type GeckodriverParameters } from 'geckodriver'
import { start as startEdgedriver, findEdgePath, type EdgedriverParameters } from 'edgedriver'
import type { InstallOptions } from '@puppeteer/browsers'

import type { Capabilities } from '@wdio/types'

import { parseParams, setupPuppeteerBrowser, setupChromedriver, getCacheDir } from './utils.js'
import { isChrome, isFirefox, isEdge, isSafari, isAppiumCapability } from '../utils.js'
import { SUPPORTED_BROWSERNAMES } from '../constants.js'

export type ChromedriverParameters = Partial<InstallOptions> & Omit<EdgedriverParameters, 'port' | 'edgeDriverVersion' | 'customEdgeDriverPath'>
declare global {
    namespace WebdriverIO {
        interface ChromedriverOptions extends ChromedriverParameters {}
        interface GeckodriverOptions extends Omit<GeckodriverParameters, 'port'> {}
        interface EdgedriverOptions extends Omit<EdgedriverParameters, 'port'> {}
        interface SafaridriverOptions extends Omit<SafaridriverParameters, 'port'> {}
    }
}

const log = logger('@wdio/utils')
const DRIVER_WAIT_TIMEOUT = 10 * 1000 // 10s

export async function startWebDriver (options: Capabilities.RemoteConfig) {
    /**
     * in case we are running unit tests, just return
     */
    if (process.env.WDIO_SKIP_DRIVER_SETUP) {
        options.hostname = 'localhost'
        options.port = 4321
        return
    }

    let driverProcess: ChildProcess
    let driver = ''
    const start = Date.now()
    const caps = (options.capabilities as Capabilities.W3CCapabilities).alwaysMatch || options.capabilities as WebdriverIO.Capabilities

    /**
     * session might be a mobile session so don't do anything
     */
    if (isAppiumCapability(caps)) {
        return
    }

    if (!caps.browserName) {
        throw new Error(
            'No "browserName" defined in capabilities nor hostname or port found!\n' +
            'If you like to run a local browser session make sure to pick from one of ' +
            `the following browser names: ${Object.values(SUPPORTED_BROWSERNAMES).flat(Infinity)}`
        )
    }

    const port = await getPort()
    const cacheDir = getCacheDir(options, caps)
    if (isChrome(caps.browserName)) {
        /**
         * Chrome
         */
        const chromedriverOptions = caps['wdio:chromedriverOptions'] || ({} as WebdriverIO.ChromedriverOptions)
        /**
         * support for custom chromedriver path via environment variable like
         * other drivers do as well
         */
        const chromedriverBinary = chromedriverOptions.binary || process.env.CHROMEDRIVER_PATH
        const { executablePath: chromeExecuteablePath, browserVersion } = await setupPuppeteerBrowser(cacheDir, caps)
        const { executablePath: chromedriverExcecuteablePath } = chromedriverBinary
            ? { executablePath: chromedriverBinary }
            : await setupChromedriver(cacheDir, browserVersion)

        caps['goog:chromeOptions'] = deepmerge(
            { binary: chromeExecuteablePath },
            caps['goog:chromeOptions'] || {}
        )
        chromedriverOptions.allowedOrigins = chromedriverOptions.allowedOrigins || ['*']
        chromedriverOptions.allowedIps = chromedriverOptions.allowedIps || ['0.0.0.0']
        const driverParams = parseParams({ port, ...chromedriverOptions })
        driverProcess = cp.spawn(chromedriverExcecuteablePath, driverParams)
        driver = `Chromedriver v${browserVersion} with params ${driverParams.join(' ')}`
    } else if (isSafari(caps.browserName)) {
        const safaridriverOptions = caps['wdio:safaridriverOptions'] || ({} as WebdriverIO.SafaridriverOptions)
        /**
         * Safari
         */
        driver = 'SafariDriver'
        driverProcess = startSafaridriver({
            useTechnologyPreview: Boolean(caps.browserName.match(/preview/i)),
            ...safaridriverOptions,
            port
        })
    } else if (isFirefox(caps.browserName)) {
        /**
         * Firefox
         */
        const { executablePath } = await setupPuppeteerBrowser(cacheDir, caps)
        caps['moz:firefoxOptions'] = deepmerge(
            { binary: executablePath },
            caps['moz:firefoxOptions'] || {}
        )

        /**
         * the "binary" parameter refers to the driver binary in the WebdriverIO.GeckodriverOptions and
         * to the Firefox binary in the driver option
         */
        delete caps.browserVersion
        const { binary, ...geckodriverOptions } = caps['wdio:geckodriverOptions'] || ({} as WebdriverIO.GeckodriverOptions)
        if (binary) {
            geckodriverOptions.customGeckoDriverPath = binary
        }

        driver = 'GeckoDriver'
        driverProcess = await startGeckodriver({ ...geckodriverOptions, cacheDir, port, allowHosts: ['localhost'] })
    } else if (isEdge(caps.browserName)) {
        /**
         * Microsoft Edge
         */
        const { binary, ...edgedriverOptions } = caps['wdio:edgedriverOptions'] || ({} as WebdriverIO.EdgedriverOptions)
        if (binary) {
            edgedriverOptions.customEdgeDriverPath = binary
        }

        driver = 'EdgeDriver'
        driverProcess = await startEdgedriver({ ...edgedriverOptions, cacheDir, port, allowedIps: ['0.0.0.0'] }).catch((err) => {
            log.warn(`Couldn't start EdgeDriver: ${err.message}, retry ...`)
            return startEdgedriver({ ...edgedriverOptions, cacheDir, port })
        })

        /**
         * Microsoft Edge is very particular when it comes to browser names
         */
        caps.browserName = 'MicrosoftEdge'

        /**
         * on Linux set the path to the Edge binary if not already set
         */
        if (!caps['ms:edgeOptions']?.binary) {
            caps['ms:edgeOptions'] = caps['ms:edgeOptions'] || {}
            caps['ms:edgeOptions'].binary = findEdgePath()
            log.info(`Found Edge binary at ${caps['ms:edgeOptions'].binary}`)
        }
    } else {
        throw new Error(
            `Unknown browser name "${caps.browserName}". Make sure to pick from one of the following ` +
            Object.values(SUPPORTED_BROWSERNAMES).flat(Infinity)
        )
    }

    const logIdentifier = driver.split(' ').shift()?.toLowerCase() || 'driver'
    if (options.outputDir) {
        const logFileName = process.env.WDIO_WORKER_ID
            ? `wdio-${process.env.WDIO_WORKER_ID}-${logIdentifier}.log`
            : `wdio-${logIdentifier}-${port}.log`
        const logFile = path.resolve(options.outputDir, logFileName)
        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        driverProcess.stdout?.pipe(logStream)
        driverProcess.stderr?.pipe(logStream)
    } else {
        const driverLog = logger(logIdentifier)
        driverProcess.stdout?.pipe(split2()).on('data', driverLog.info.bind(driverLog))
        driverProcess.stderr?.pipe(split2()).on('data', driverLog.warn.bind(driverLog))
    }

    await waitPort({ port, output: 'silent', timeout: DRIVER_WAIT_TIMEOUT })
        .catch((e) => { throw new Error(`Timed out to connect to ${driver}: ${e.message}`) })

    options.hostname = 'localhost'
    options.port = port
    log.info(`Started ${driver} in ${Date.now() - start}ms on port ${port}`)
    return driverProcess
}
