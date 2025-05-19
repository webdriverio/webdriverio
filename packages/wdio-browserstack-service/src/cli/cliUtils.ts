import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { platform, arch, homedir } from 'node:os'
import path from 'node:path'
import util, { promisify } from 'node:util'
import { exec } from 'node:child_process'
import type { ZipFile, Options as yauzlOptions } from 'yauzl'
import yauzl from 'yauzl'
import { fetch } from 'undici'
import { threadId } from 'worker_threads';

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { version: bstackServiceVersion } = require('../../package.json')

import PerformanceTester from '../instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../instrumentation/performance/constants.js'
import {
    isNullOrEmpty,
    nestedKeyValue,
    createDir,
    isWritable,
    setReadWriteAccess,
    isTrue,
    nodeRequest,
    getBrowserStackUser,
    getBrowserStackKey,
} from '../util.js'
import { BStackLogger } from './cliLogger.js'
import { UPDATED_CLI_ENDPOINT, BROWSERSTACK_API_URL } from '../constants.js'
import type { Options, Capabilities } from '@wdio/types'
import { Readable } from 'node:stream'
import type { BrowserstackConfig, BrowserstackOptions } from 'src/types.js'
const logger = BStackLogger

export class CLIUtils {
    static automationFrameworkDetail = {}
    static testFrameworkDetail = {}

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
    static getBinConfig(config: Options.Testrunner, capabilities: Capabilities.RemoteCapabilities, options: BrowserstackConfig & BrowserstackOptions) {
        const modifiedOpts: Record<string, unknown> = { ...options }
        if (modifiedOpts.opts) {
            modifiedOpts.browserstackLocalOptions = modifiedOpts.opts
            delete modifiedOpts.opts
        }
        const binconfig = {
            userName: config.user,
            accessKey: config.key,
            platforms: [],
            ...modifiedOpts,
            ...(config.commonCapabilities['bstack:options'] ?? {}),
        }
        if (Array.isArray(capabilities)) {
            for (const capability of capabilities) {
                const platform: Record<string, unknown> = {}
                Object.keys(capability)
                    .filter((key) => (key !== 'bstack:options'))
                    .forEach((key) => {
                        if (binconfig[key] === undefined) {
                            platform[key] = capability[key]
                        }
                    })

                Object.keys(capability['bstack:options'])
                    .forEach((key) => {
                        if (binconfig[key] === undefined) {
                            platform[key] = capability['bstack:options'][key]
                        }
                    })
                binconfig.platforms.push(platform)
            }
        }
        // BStackLogger.debug('--------bin config-----------')
        BStackLogger.debug(JSON.stringify(binconfig))
        return JSON.stringify(binconfig)
    }

    static getSdkVersion() {
        return bstackServiceVersion
    }

    static getSdkLanguage() {
        return 'wdio'
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
    };

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
            headers: {
                Authorization: `Basic ${Buffer.from(`${getBrowserStackUser(config)}:${getBrowserStackKey(config)}`).toString('base64')}`,
            },
        }
        const response = await nodeRequest(
            'GET',
            `${UPDATED_CLI_ENDPOINT}?${params.toString()}`,
            requestInit,
            BROWSERSTACK_API_URL
        )
        logger.debug(`response ${JSON.stringify(response)}`)
        return response
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
                fetch(binDownloadUrl, {
                    redirect: 'follow'
                }).then((response) => {
                    if (response.ok && response.body) {
                        const binaryName = null
                        Readable.fromWeb(response.body).pipe(downloadedFileStream)

                        downloadedFileStream.on('error', function (err: Error) {
                            logger.error('Got Error while downloading percy binary file' + err)
                            PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD, false, util.format(err))
                            reject(err)
                        })
                        CLIUtils.downloadFileStream(downloadedFileStream, binaryName, zipFilePath, cliDir, resolve, reject)
                    } else {
                        const err = 'Got Error in cli binary download response' + response.status
                        logger.error(err)
                        PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD, false, err)
                        reject(err)
                    }
                }).catch((err) => {
                    logger.error(`Got Error in cli binary downloading request ${util.format(err)}`)
                    PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD, false, util.format(err))
                    reject(err)
                })
                PerformanceTester.end(PerformanceEvents.SDK_CLI_DOWNLOAD)
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
            version: { [testFramework]: 'latest' }, // TODO: update static value
        }

        this.automationFrameworkDetail = {
            name: automationFramework,
            version: 'latest', // TODO: update static value
        }

        process.env.BROWSERSTACK_AUTOMATION_FRAMEWORK_DETAIL = JSON.stringify(this.automationFrameworkDetail)
        process.env.BROWSERSTACK_TEST_FRAMEWORK_DETAIL = JSON.stringify(this.testFrameworkDetail)
    }

    /**
     * Get the current instance name using thread id and processId
     * @returns {string}
     */
    static getCurrentInstanceName() {
        return `${process.pid}:${threadId}`;
    }
}
