import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import cp, { type ChildProcess } from 'node:child_process'

import getPort from 'get-port'
import waitPort from 'wait-port'
import logger from '@wdio/logger'
import { deepmerge } from 'deepmerge-ts'

import { start as startSafaridriver, type SafaridriverOptions as SafaridriverParameters } from 'safaridriver'
import { start as startGeckodriver, type GeckodriverParameters } from 'geckodriver'
import { start as startEdgedriver, findEdgePath, type EdgedriverParameters } from 'edgedriver'
import type { InstallOptions } from '@puppeteer/browsers'

import type { Capabilities, Options } from '@wdio/types'

import {
    parseParams, setupChrome, definesRemoteDriver, setupChromedriver,
    isChrome, isFirefox, isEdge, isSafari, getCacheDir
} from './utils.js'
import { SUPPORTED_BROWSERNAMES } from '../constants.js'

export type ChromedriverParameters = InstallOptions & Omit<EdgedriverParameters, 'port' | 'edgeDriverVersion' | 'customEdgeDriverPath'>
declare global {
    namespace WebdriverIO {
        interface ChromedriverOptions extends ChromedriverParameters {}
        interface GeckodriverOptions extends Omit<GeckodriverParameters, 'port'> {}
        interface EdgedriverOptions extends Omit<EdgedriverParameters, 'port'> {}
        interface SafaridriverOptions extends Omit<SafaridriverParameters, 'port'> {}
    }
}

const log = logger('@wdio/utils')

export async function startWebDriver (options: Options.WebDriver) {
    /**
     * in case we are running unit tests, just return
     */
    if (process.env.WDIO_SKIP_DRIVER_SETUP) {
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
    const caps = (options.capabilities as Capabilities.W3CCapabilities).alwaysMatch || options.capabilities as Capabilities.Capabilities

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
    const cacheDir = getCacheDir(options, caps)
    if (isChrome(caps.browserName)) {
        /**
         * Chrome
         */
        const chromedriverOptions = caps['wdio:chromedriverOptions'] || ({} as WebdriverIO.ChromedriverOptions)
        const { executablePath: chromeExecuteablePath, browserVersion } = await setupChrome(cacheDir, caps)
        const { executablePath: chromedriverExcecuteablePath } = await setupChromedriver(cacheDir, browserVersion)

        caps['goog:chromeOptions'] = deepmerge(
            { binary: chromeExecuteablePath },
            caps['goog:chromeOptions'] || {}
        )
        chromedriverOptions.allowedOrigins = chromedriverOptions.allowedOrigins || ['*']
        chromedriverOptions.allowedIps = chromedriverOptions.allowedIps || ['']
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

        /**
         * set "Host" header as it is required by Safaridriver
         */
        options.headers = deepmerge({ Host: 'localhost' }, (options.headers || {}))
    } else if (isFirefox(caps.browserName)) {
        /**
         * Firefox
         */
        const geckodriverOptions = caps['wdio:geckodriverOptions'] || ({} as GeckodriverParameters)
        driver = 'GeckoDriver'
        driverProcess = await startGeckodriver({ ...geckodriverOptions, cacheDir, port })
    } else if (isEdge(caps.browserName)) {
        /**
         * Microsoft Edge
         */
        const edgedriverOptions = caps['wdio:edgedriverOptions'] || ({} as EdgedriverParameters)
        driver = 'EdgeDriver'
        driverProcess = await startEdgedriver({ ...edgedriverOptions, cacheDir, port }).catch((err) => {
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
        if (!caps['ms:edgeOptions']?.binary && os.platform() !== 'darwin' && os.platform() !== 'win32') {
            caps['ms:edgeOptions'] = caps['ms:edgeOptions'] || {}
            caps['ms:edgeOptions'].binary = findEdgePath()
        }
    } else {
        throw new Error(
            `Unknown browser name "${caps.browserName}". Make sure to pick from one of the following ` +
            Object.values(SUPPORTED_BROWSERNAMES).flat(Infinity)
        )
    }

    if (options.outputDir) {
        const logIdentifier = driver.split(' ').shift()?.toLowerCase()
        const logFileName = process.env.WDIO_WORKER_ID
            ? `wdio-${process.env.WDIO_WORKER_ID}-${logIdentifier}.log`
            : `wdio-${logIdentifier}-${port}.log`
        const logFile = path.resolve(options.outputDir, logFileName)
        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        driverProcess.stdout?.pipe(logStream)
        driverProcess.stderr?.pipe(logStream)
    }

    await waitPort({ port, output: 'silent' })

    options.hostname = '0.0.0.0'
    options.port = port
    log.info(`Started ${driver} in ${Date.now() - start}ms on port ${port}`)
    return driverProcess
}
