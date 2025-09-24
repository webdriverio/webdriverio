import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { platform, arch, homedir } from 'node:os'
import path from 'node:path'
import util, { promisify } from 'node:util'
import { exec } from 'node:child_process'
import { Readable } from 'node:stream'
import type { ZipFile, Options as yauzlOptions } from 'yauzl'
import yauzl from 'yauzl'
import { threadId } from 'node:worker_threads'

import { _fetch as fetch } from '../fetchWrapper.js'

import {
    isNullOrEmpty,
    nestedKeyValue,
    createDir,
    isWritable,
    setReadWriteAccess,
    isTrue,
    getBrowserStackUser,
    getBrowserStackKey,
    isFalse,
    isTurboScale,
    shouldAddServiceVersion,
} from '../util.js'
import PerformanceTester from '../instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../instrumentation/performance/constants.js'
import { BStackLogger as logger } from './cliLogger.js'
import { UPDATED_CLI_ENDPOINT, BSTACK_SERVICE_VERSION } from '../constants.js'
import type { Options, Capabilities } from '@wdio/types'
import type { BrowserstackConfig, BrowserstackOptions, TestObservabilityOptions } from '../types.js'
import { TestFrameworkConstants } from './frameworks/constants/testFrameworkConstants.js'
import APIUtils from './apiUtils.js'

type State = {
    value: number
    toString(): string
}

export class CLIUtils {
    static automationFrameworkDetail = {}
    static testFrameworkDetail = {}
    static CLISupportedFrameworks = ['mocha']

    static isDevelopmentEnv() {
        return process.env.BROWSERSTACK_CLI_ENV === 'development'
    }

    static getCLIParamsForDevEnv(): Record<string, string> {
        return {
            id: process.env.BROWSERSTACK_CLI_ENV || '',
            listen: `unix:/tmp/sdk-platform-${process.env.BROWSERSTACK_CLI_ENV}.sock`
        }
    }

    /**
     * Build config object for binary session request
     * @returns {string}
     * @throws {Error}
     */
    static getBinConfig(config: Options.Testrunner, capabilities: Capabilities.TestrunnerCapabilities | WebdriverIO.Capabilities, options: BrowserstackConfig & BrowserstackOptions, buildTag?: string) {
        const modifiedOpts: Record<string, unknown> = { ...options }
        if (modifiedOpts.opts) {
            modifiedOpts.browserStackLocalOptions = modifiedOpts.opts
            delete modifiedOpts.opts
        }

        modifiedOpts.testContextOptions = {
            skipSessionName: isFalse(modifiedOpts.setSessionName),
            skipSessionStatus: isFalse(modifiedOpts.setSessionStatus),
            sessionNameOmitTestTitle: modifiedOpts.sessionNameOmitTestTitle || false,
            sessionNamePrependTopLevelSuiteTitle: modifiedOpts.sessionNamePrependTopLevelSuiteTitle || false,
            sessionNameFormat: modifiedOpts.sessionNameFormat || ''
        }

        const commonBstackOptions = (() => {
            if (
                capabilities &&
                !Array.isArray(capabilities) &&
                typeof capabilities === 'object' &&
                'bstack:options' in (capabilities as Record<string, unknown>)
            ) {
                // Cast after guard to satisfy TypeScript
                return (capabilities as { ['bstack:options']?: Record<string, unknown> })['bstack:options'] || {}
            }
            return {}
        })()

        const isNonBstackA11y = isTurboScale(options) || !shouldAddServiceVersion(config as Options.Testrunner, options.testObservability)
        const observabilityOptions: TestObservabilityOptions = options.testObservabilityOptions || {}
        const binconfig: Record<string, unknown> = {
            userName: observabilityOptions.user || config.user,
            accessKey: observabilityOptions.key || config.key,
            platforms: [],
            isNonBstackA11yWDIO: isNonBstackA11y,
            ...modifiedOpts,
            ...commonBstackOptions,
        }

        binconfig.buildName = observabilityOptions.buildName || binconfig.buildName
        binconfig.projectName = observabilityOptions.projectName || binconfig.projectName
        binconfig.buildTag = this.getObservabilityBuildTags(observabilityOptions, buildTag) || []

        let caps = capabilities
        if (capabilities && !Array.isArray(capabilities)) {
            caps = [capabilities]
        }
        if (Array.isArray(caps)) {
            for (const cap of caps) {
                const platform: Record<string, unknown> = {}
                const capability = cap as Record<string, unknown>

                Object.keys(capability)
                    .filter((key) => (key !== 'bstack:options'))
                    .forEach((key) => {
                        platform[key] = capability[key]
                    })

                if (capability['bstack:options']) {
                    Object.keys(capability['bstack:options'] as Record<string, unknown>)
                        .forEach((key) => {
                            platform[key] = (capability['bstack:options'] as Record<string, unknown>)[key]
                        })
                }
                (binconfig.platforms as Array<unknown>).push(platform)
            }
        }
        return JSON.stringify(binconfig)
    }

    static getSdkVersion() {
        return BSTACK_SERVICE_VERSION
    }

    static getSdkLanguage() {
        return 'ECMAScript'
    }

    static async setupCliPath(config: Options.Testrunner): Promise<string|null> {
        logger.debug('Configuring Cli path.')
        const developmentBinaryPath = process.env.SDK_CLI_BIN_PATH || null
        if (!isNullOrEmpty(developmentBinaryPath)) {
            logger.debug(`Development Cli Path: ${developmentBinaryPath}`)
            return developmentBinaryPath
        }

        try {
            const cliDir = this.getCliDir()
            if (isNullOrEmpty(cliDir)) {
                throw new Error('No writable directory available for the CLI')
            }
            const existingCliPath = this.getExistingCliPath(cliDir)
            const finalBinaryPath = await this.checkAndUpdateCli(existingCliPath, cliDir, config)
            logger.debug(`Resolved binary path: ${finalBinaryPath}`)
            return finalBinaryPath
        } catch (err) {
            logger.debug(`Error in setting up cli path directory, Exception: ${util.format(err)}`)
        }
        return null
    }

    static async checkAndUpdateCli(existingCliPath: string, cliDir: string, config: Options.Testrunner): Promise<string|null> {
        PerformanceTester.start(PerformanceEvents.SDK_CLI_CHECK_UPDATE)
        logger.info(`Current CLI Path Found: ${existingCliPath}`)
        const queryParams: Record<string, string> = {
            sdk_version: CLIUtils.getSdkVersion(),
            os: platform(),
            os_arch: arch(),
            cli_version: '0',
            sdk_language: this.getSdkLanguage(),
        }
        if (!isNullOrEmpty(existingCliPath)) {
            queryParams.cli_version = await this.runShellCommand(`${existingCliPath} version`)
        }
        const response = await this.requestToUpdateCLI(queryParams, config)
        if (nestedKeyValue(response, ['updated_cli_version'])) {
            logger.debug(`Need to update binary, current binary version: ${queryParams.cli_version}`)

            const browserStackBinaryUrl = process.env.BROWSERSTACK_BINARY_URL || null
            if (!isNullOrEmpty(browserStackBinaryUrl)) {
                logger.debug(`Using BROWSERSTACK_BINARY_URL: ${browserStackBinaryUrl}`)
                response.url = browserStackBinaryUrl
            }

            const finalBinaryPath = await this.downloadLatestBinary(nestedKeyValue(response, ['url']), cliDir)
            PerformanceTester.end(PerformanceEvents.SDK_CLI_CHECK_UPDATE)
            return finalBinaryPath
        }
        PerformanceTester.end(PerformanceEvents.SDK_CLI_CHECK_UPDATE)
        return existingCliPath
    }

    static getCliDir() {
        const writableDir = this.getWritableDir()
        try {
            if (isNullOrEmpty(writableDir)) {
                throw new Error('No writable directory available for the CLI')
            }
            const cliDirPath = path.join(writableDir!, 'cli')
            if (!fs.existsSync(cliDirPath)) {
                createDir(cliDirPath)
            }
            return cliDirPath
        } catch (err) {
            logger.error(`Error in getting writable directory, writableDir=${util.format(err)}`)
            return ''
        }
    }

    static getWritableDir() {
        const writableDirOptions = [
            process.env.BROWSERSTACK_FILES_DIR,
            path.join(homedir(), '.browserstack'),
            path.join('tmp', '.browserstack'),
        ]

        for (const path of writableDirOptions) {
            if (isNullOrEmpty(path)) {
                continue
            }
            try {
                if (fs.existsSync(path!)) {
                    logger.debug(`File ${path} already exist`)
                    if (!isWritable(path!)) {
                        logger.debug(`Giving write permission to ${path}`)
                        const success = setReadWriteAccess(path!)
                        if (!isTrue(success)) {
                            logger.warn(`Unable to provide write permission to ${path}`)
                        }
                    }
                } else {
                    logger.debug(`File does not exist: ${path}`)
                    createDir(path!)
                    logger.debug(`Giving write permission to ${path}`)
                    const success = setReadWriteAccess(path!)
                    if (!isTrue(success)) {
                        logger.warn(`Unable to provide write permission to ${path}`)
                    }
                }
                return path
            } catch (err) {
                logger.error(`Unable to get writable directory, exception ${util.format(err)}`)
            }
        }
        return null
    }

    static getExistingCliPath(cliDir: string) {
        try {
            // Check if the path exists and is a directory
            if (!fs.existsSync(cliDir) || !fs.statSync(cliDir).isDirectory()) {
                return ''
            }

            // List all files in the directory that start with "binary-"
            const allBinaries = fs
                .readdirSync(cliDir)
                .map((file: string) => path.join(cliDir, file))
                .filter((filePath: string) => fs.statSync(filePath).isFile() && path.basename(filePath).startsWith('binary-'))

            if (allBinaries.length > 0) {
                // Get the latest binary by comparing the last modified time
                const latestBinary = allBinaries
                    .map((filePath: string) => ({
                        filePath,
                        mtime: fs.statSync(filePath).mtime,
                    }))
                    .reduce((latest: { filePath: string; mtime: Date } | null, current: { filePath: string; mtime: Date }) => {
                        if (!latest || !latest.mtime) {
                            return current
                        }

                        if (current.mtime > latest.mtime) {
                            return current
                        }

                        return latest
                    }, null)
                return latestBinary ? latestBinary.filePath : ''
            }

            return '' // No binary present
        } catch (err) {
            logger.error(`Error while reading CLI path: ${util.format(err)}`)
            return ''
        }
    }

    static requestToUpdateCLI = async (queryParams: Record<string, string>, config: Options.Testrunner) => {
        const params = new URLSearchParams(queryParams)
        const requestInit: RequestInit = {
            method: 'GET',
            headers: {
                Authorization: `Basic ${Buffer.from(`${getBrowserStackUser(config)}:${getBrowserStackKey(config)}`).toString('base64')}`,
            },
        }
        const response = await fetch(`${APIUtils.BROWSERSTACK_AUTOMATE_API_URL}/${UPDATED_CLI_ENDPOINT}?${params.toString()}`, requestInit)
        const jsonResponse = await response.json()
        logger.debug(`response ${JSON.stringify(jsonResponse)}`)
        return jsonResponse
    }

    static runShellCommand(cmdCommand: string, workingDir = ''): Promise<string> {
        return new Promise((resolve) => {
            const process = exec(
                cmdCommand,
                { cwd: workingDir, timeout: 5000 },
                (error: Error, stdout: string, stderr: string) => {
                    if (error) {
                        resolve(stderr.trim() || 'SHELL_EXECUTE_ERROR')
                    } else {
                        resolve(stdout.trim())
                    }
                }
            )

            // Ensure the process is killed if it exceeds the timeout
            process.on('error', () => {
                resolve('SHELL_EXECUTE_ERROR')
            })
        })
    }

    static downloadLatestBinary = async (binDownloadUrl: string, cliDir: string): Promise<string|null> => {
        PerformanceTester.start(PerformanceEvents.SDK_CLI_DOWNLOAD)
        logger.debug(`Downloading SDK binary from: ${binDownloadUrl}`)
        try {
            const zipFilePath = path.join(cliDir, 'downloaded_file.zip')
            const downloadedFileStream = fs.createWriteStream(zipFilePath)
            return new Promise<string|null>((resolve, reject) => {
                const binaryName = null

                const processDownload = async () => {
                    const response = await fetch(binDownloadUrl)
                    if (!response.body) {
                        throw new Error('No response body received')
                    }

                    downloadedFileStream.on('error', function (err: Error) {
                        logger.error('Got Error while downloading cli binary file' + err)
                        PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD, false, util.format(err))
                        reject(err)
                    })

                    try {
                        const arrayBuffer = await response.arrayBuffer()
                        const buffer = Buffer.from(arrayBuffer)
                        const nodeStream = Readable.from(buffer)

                        nodeStream.pipe(downloadedFileStream)

                        // Set up the downloadFileStream handler before pipeline
                        CLIUtils.downloadFileStream(downloadedFileStream, binaryName, zipFilePath, cliDir, resolve, reject)
                        PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD)
                    } catch (err) {
                        logger.error(`Got Error in cli binary downloading request ${util.format(err)}`)
                        PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD, false, util.format(err))
                        reject(err as Error)
                    }
                }

                processDownload()
            })
        } catch (err) {
            PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD, false, util.format(err))
            logger.debug(`Failed to download binary, Exception: ${util.format(err)}`)
            return null
        }
    }

    static downloadFileStream(downloadedFileStream: fs.WriteStream, binaryName: string|null, zipFilePath: string, cliDir: string, resolve: (path: string) => void, reject: (reason?: Error) => void) {
        downloadedFileStream.on('close', async function () {
            const yauzlOpenPromise = promisify(yauzl.open) as (path: string, options: yauzlOptions) => Promise<ZipFile>
            try {
                const zipfile = await yauzlOpenPromise(zipFilePath, { lazyEntries: true })
                zipfile.readEntry()
                zipfile.on('entry', async (entry) => {
                    if (!binaryName) {binaryName = entry.fileName}
                    if (/\/$/.test(entry.fileName)) {
                        // Directory file names end with '/'.
                        zipfile.readEntry()
                    } else {
                        // file entry
                        const writeStream = fs.createWriteStream(path.join(cliDir, entry.fileName))
                        const openReadStreamPromise = promisify(zipfile.openReadStream).bind(zipfile)
                        try {
                            const readStream = await openReadStreamPromise(entry)
                            readStream.on(
                                'end',
                                function () {
                                    writeStream.close()
                                    zipfile.readEntry()
                                }
                            )
                            readStream.pipe(
                                writeStream
                            )
                        } catch (zipErr) {
                            reject(zipErr as Error)
                        }

                        if (entry.fileName === binaryName) {
                            zipfile.close()
                        }
                    }
                })

                zipfile.on('error', (zipErr) => {
                    reject(zipErr as Error)
                })

                zipfile.once('end', () => {
                    fsp.unlink(zipFilePath)
                        .catch(() => {
                            logger.warn(`Failed to delete zip file: ${zipFilePath}`)
                        })
                    fsp.chmod(`${cliDir}/${binaryName}`, '0755')
                        .then(() => {
                            resolve(`${cliDir}/${binaryName}`)
                        }).catch((err) => {
                            reject(err)
                        })
                    zipfile.close()
                })
            } catch (err) {
                reject(err as Error)
            }
        })
    }

    static getTestFrameworkDetail() {
        if (process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL) {
            return JSON.parse(process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL)
        }
        return this.testFrameworkDetail
    }

    static getAutomationFrameworkDetail() {
        if (process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL) {
            return JSON.parse(process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL)
        }
        return this.automationFrameworkDetail
    }

    static setFrameworkDetail(testFramework: string, automationFramework: string) {
        if (!testFramework || !automationFramework) {
            logger.debug(`Test or Automation framework not provided testFramework=${testFramework}, automationFramework=${automationFramework}`)
        }

        this.testFrameworkDetail = {
            name: testFramework,
            version: { [testFramework]: CLIUtils.getSdkVersion() },
        }

        this.automationFrameworkDetail = {
            name: automationFramework,
            version: { [automationFramework]: CLIUtils.getSdkVersion() },
        }

        process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL = JSON.stringify(this.automationFrameworkDetail)
        process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL = JSON.stringify(this.testFrameworkDetail)
    }

    /**
     * Get the current instance name using thread id and processId
     * @returns {string}
     */
    static getCurrentInstanceName() {
        return `${process.pid}:${threadId}`
    }

    /**
     *
     * @param {TestFrameworkState | AutomationFrameworkState} frameworkState
     * @param {HookState} hookState
     * @returns {string}
     */
    static getHookRegistryKey(frameworkState: State, hookState: State) {
        return `${frameworkState}:${hookState}`
    }

    static matchHookRegex(hookState: string) {
        const pattern = new RegExp(TestFrameworkConstants.HOOK_REGEX)

        return pattern.test(hookState)
    }

    static getObservabilityBuildTags(observabilityOptions: TestObservabilityOptions, bstackBuildTag?: string) {
        if (process.env.TEST_OBSERVABILITY_BUILD_TAG) {
            return process.env.TEST_OBSERVABILITY_BUILD_TAG.split(',')
        }
        if (observabilityOptions.buildTag) {
            return observabilityOptions.buildTag
        }
        if (bstackBuildTag) {
            return [bstackBuildTag]
        }
        return []
    }

    static checkCLISupportedFrameworks(framework: string | undefined) {
        if (framework === undefined) {
            return false
        }
        return this.CLISupportedFrameworks.includes(framework)
    }

}
