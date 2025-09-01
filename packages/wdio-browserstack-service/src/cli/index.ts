import util from 'node:util'
import { spawn } from 'node:child_process'

import { CLIUtils } from './cliUtils.js'
import PerformanceTester from '../instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../instrumentation/performance/constants.js'
import { BStackLogger } from './cliLogger.js'
import { GrpcClient } from './grpcClient.js'
import AutomateModule from './modules/automateModule.js'
import TestHubModule from './modules/testHubModule.js'

import type { ChildProcess } from 'node:child_process'
import type { StartBinSessionResponse } from '@browserstack/wdio-browserstack-service'
import type BaseModule from './modules/baseModule.js'
import { BROWSERSTACK_ACCESSIBILITY, BROWSERSTACK_OBSERVABILITY, BROWSERSTACK_TESTHUB_JWT, BROWSERSTACK_TESTHUB_UUID, CLI_STOP_TIMEOUT, TESTOPS_BUILD_COMPLETED_ENV, TESTOPS_SCREENSHOT_ENV } from '../constants.js'
import type { Options } from '@wdio/types'
import TestOpsConfig from '../testOps/testOpsConfig.js'
import WdioMochaTestFramework from './frameworks/wdioMochaTestFramework.js'
import WdioAutomationFramework from './frameworks/wdioAutomationFramework.js'
import WebdriverIOModule from './modules/webdriverIOModule.js'
import AccessibilityModule from './modules/accessibilityModule.js'
import { isTurboScale, processAccessibilityResponse, shouldAddServiceVersion } from '../util.js'
import ObservabilityModule from './modules/observabilityModule.js'
import type { BrowserstackConfig, BrowserstackOptions, LaunchResponse } from '../types.js'
import PercyModule from './modules/percyModule.js'
import APIUtils from './apiUtils.js'

interface GRRUrls {
    automate: {
        hub: string
        cdp: string
        api: string
        upload: string
    }
    appAutomate: {
        hub: string
        cdp: string
        api: string
        upload: string
    }
    percy: {
        api: string
    }
    turboScale: {
        api: string
    }
    accessibility: {
        api: string
    }
    appAccessibility: {
        api: string
    }
    observability: {
        api: string
        upload: string
    }
    configServer: {
        api: string
    }
    edsInstrumentation: {
        api: string
    }
}

/**
 * BrowserstackCLI - Singleton class for managing CLI operations
 *
 * This class uses the singleton pattern to ensure only one instance exists
 * throughout the application lifecycle.
 */
export class BrowserstackCLI {
    static #instance: BrowserstackCLI|null = null
    static enabled = false
    initialized:boolean
    config:Record<string, unknown>
    wdioConfig: string
    cliArgs:object
    browserstackConfig: Options.Testrunner|{}
    process: ChildProcess | null = null
    isMainConnected = false
    isChildConnected = false
    binSessionId: string | null = null
    modules: Record<string, BaseModule> = {}
    testFramework: WdioMochaTestFramework|null = null
    cliParams: Record<string, string> | null = null
    automationFramework: WdioAutomationFramework|null = null
    SDK_CLI_BIN_PATH: string | null = null
    logger = BStackLogger
    options: BrowserstackConfig & BrowserstackOptions | {}

    constructor() {
        this.initialized = false
        this.config = {}
        this.cliArgs = {}
        this.browserstackConfig = {}
        this.wdioConfig = ''
        this.options = {}
    }

    /**
     * Get the singleton instance of BrowserstackCLI
     * @returns {BrowserstackCLI} The singleton instance
     */
    static getInstance() {
        if (!BrowserstackCLI.#instance) {
            BrowserstackCLI.#instance = new BrowserstackCLI()
        }
        return BrowserstackCLI.#instance
    }

    /**
     * Bootstrap the CLI
     * Initializes and starts the CLI based on environment settings
     * @returns {Promise<void>}
     */
    async bootstrap(options: BrowserstackConfig & BrowserstackOptions, config?: Options.Testrunner, wdioConfig='') {
        PerformanceTester.start(PerformanceEvents.SDK_CLI_ON_BOOTSTRAP)
        BrowserstackCLI.enabled = true
        this.options = options
        if (config) {
            BrowserstackCLI.getInstance().setBrowserstackConfig(config)
        }
        try {
            const binSessionId = process.env.BROWSERSTACK_CLI_BIN_SESSION_ID || null

            if (binSessionId) {
                await this.startChild(binSessionId)
                PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_BOOTSTRAP)
                return
            }

            this.wdioConfig = wdioConfig
            await this.startMain()
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.stack || error.message : String(error)
            this.logger.error(`bootstrap: failed to bootstrap ${errorMessage}`)
            await this.stop()
            PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_BOOTSTRAP, false, util.format(error))

        }
    }

    /**
     * Start as a main process
     * @returns {Promise<void>}
     */
    async startMain() {
        this.logger.info('startMain: Starting main process')
        await this.start()
        this.logger.debug('startMain: main-process started')
        const response = await GrpcClient.getInstance().startBinSession(this.wdioConfig)
        BStackLogger.debug(`start: startBinSession response=${JSON.stringify(response)}`)
        this.loadModules(response)
        this.isMainConnected = true

    }

    /**
     * Load modules
     * @param {Object} startBinResponse - StartBinSession response
     */
    loadModules(startBinResponse: StartBinSessionResponse) {
        // Defer imports to avoid circular dependencies
        this.binSessionId = startBinResponse.binSessionId
        this.logger.info(`loadModules: binSessionId=${this.binSessionId}`)

        this.setConfig(startBinResponse)
        APIUtils.updateURLSForGRR(this.config.apis as GRRUrls)

        this.setupTestFramework()
        this.setupAutomationFramework()

        this.modules[WebdriverIOModule.MODULE_NAME] = new WebdriverIOModule()
        this.modules[AutomateModule.MODULE_NAME] = new AutomateModule(this.browserstackConfig as Options.Testrunner)

        if (startBinResponse.testhub) {
            process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
            if (startBinResponse.testhub.jwt) {
                process.env[BROWSERSTACK_TESTHUB_JWT] = startBinResponse.testhub.jwt
            }
            if (startBinResponse.testhub.buildHashedId) {
                process.env[BROWSERSTACK_TESTHUB_UUID] = startBinResponse.testhub.buildHashedId
                TestOpsConfig.getInstance().buildHashedId = startBinResponse.testhub.buildHashedId
            }

            if (startBinResponse.observability?.success) {
                process.env[BROWSERSTACK_OBSERVABILITY] = 'true'
                if (startBinResponse.observability.options?.allowScreenshots) {
                    process.env[TESTOPS_SCREENSHOT_ENV] = startBinResponse.observability.options.allowScreenshots.toString()
                }
                this.modules[ObservabilityModule.MODULE_NAME] = new ObservabilityModule(startBinResponse.observability)
            }

            this.modules[TestHubModule.MODULE_NAME] = new TestHubModule(startBinResponse.testhub)

            if (startBinResponse.accessibility?.success){
                process.env[BROWSERSTACK_ACCESSIBILITY] = 'true'
                const options = this.options as BrowserstackConfig & BrowserstackOptions
                const isNonBstackA11y = isTurboScale(options) || !shouldAddServiceVersion(this.browserstackConfig as Options.Testrunner, options.testObservability)
                processAccessibilityResponse(startBinResponse as unknown as LaunchResponse, this.options as BrowserstackConfig & BrowserstackOptions)
                this.modules[AccessibilityModule.MODULE_NAME] = new AccessibilityModule(startBinResponse.accessibility, isNonBstackA11y)
            }
        }
        if (startBinResponse.percy?.success) {
            this.modules[PercyModule.MODULE_NAME] = new PercyModule(startBinResponse.percy)
        }
        this.configureModules()
    }

    /**
     * Configure modules
     * @returns {Promise<void>}
     */
    async configureModules() {
        this.logger.debug('configureModules: Configuring modules')
        for (const moduleName in this.modules) {
            const module = this.modules[moduleName]
            const platformIndex = process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0
            this.logger.debug(`configureModules: Configuring module=${moduleName} platformIndex=${platformIndex}`)
            await module.configure(this.binSessionId!, platformIndex, GrpcClient.getInstance().client, this.config)
        }
    }

    /**
     * Start the CLI process and return a promise that resolves when it's ready
     * @returns {Promise<void>}
     * @throws {Error} If the process fails to start
     */
    async start() {
        PerformanceTester.start(PerformanceEvents.SDK_CLI_START)
        if (CLIUtils.isDevelopmentEnv()) {
            this.loadCliParams(CLIUtils.getCLIParamsForDevEnv())
            PerformanceTester.end(PerformanceEvents.SDK_CLI_START)
            return Promise.resolve()
        }

        // Skip if process is already running
        if (this.process && this.process.connected) {
            PerformanceTester.end(PerformanceEvents.SDK_CLI_START)
            return Promise.resolve()
        }

        const SDK_CLI_BIN_PATH = await this.getCliBinPath()
        const cmd:Array<string> = [SDK_CLI_BIN_PATH, 'sdk']
        this.logger.debug(`spawning command='${cmd}'`)
        // Create a child process
        this.process = spawn(cmd[0], cmd.slice(1), {
            env: process.env
        })

        // Check if process started successfully
        if (!this.process.pid) {
            throw new Error('failed to start CLI, no PID found')
        }

        // Return a promise that resolves when CLI is ready
        return new Promise<void>((resolve, reject) => {
            const cliOut: Record<string, string> = {}

            this.process!.stdout!.on('data', (data: Buffer) => {
                const lines = data.toString().trim().split('\n')

                for (const line of lines) {
                    // Parse key=value pairs
                    if (/^(id|listen|port)=.*$/.test(line)) {
                        const [key, value] = line.split('=', 2)
                        if (value !== undefined) {
                            cliOut[key] = value
                        }
                    }

                    // Check for ready message
                    if (line.toLowerCase().includes('ready')) {
                        this.loadCliParams(cliOut)
                        PerformanceTester.end(PerformanceEvents.SDK_CLI_START)
                        resolve()
                        return
                    }
                }
            })

            this.process!.stderr!.on('data', (data: Buffer) => {
                this.logger.error(`CLI stderr: ${data.toString().trim()}`)
            })

            this.process!.on('error', (err: Error) => {
                cliOut.error = `Error in start: ${err.message}`
                PerformanceTester.end(PerformanceEvents.SDK_CLI_START, false, err)
                reject(new Error(`Failed to start CLI process: ${err.message}`))
            })

            this.process!.on('close', (code: number) => {
                if (code !== 0) {
                    reject(new Error(`CLI process exited with code ${code}`))
                }
            })
        })
    }

    /**
     * Stop the CLI
     * @returns {Promise<void>}
     */
    async stop() {
        PerformanceTester.start(PerformanceEvents.SDK_CLI_ON_STOP)
        this.logger.debug('stop: CLI stop triggered')
        try {
            if (this.isMainConnected) {
                const response = await GrpcClient.getInstance().stopBinSession()
                BStackLogger.debug(`stop: stopBinSession response=${JSON.stringify(response)}`)
            }

            await this.unConfigureModules()

            if (this.process && this.process.pid) {
                this.logger.debug('stop: shutting down CLI')
                this.process.kill()

                // Wait for process to fully exit
                await new Promise<void>((resolve) => {
                    let exited = false

                    // Listen for exit event
                    this.process!.on('exit', () => {
                        this.logger.debug('stop: CLI process exited')
                        exited = true
                        PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP)

                        resolve()
                    })

                    // Set a timeout in case process doesn't exit cleanly
                    setTimeout(() => {
                        if (!exited) {
                            this.logger.warn('stop: process exit timeout, forcing kill')
                            this.process!.kill('SIGKILL')
                            PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP)
                            resolve()
                        }
                    }, CLI_STOP_TIMEOUT)
                })
            }
        } catch (error: unknown) {
            PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP, false, util.format(error))
            const errorMessage = error instanceof Error ? error.stack || error.message : String(error)
            this.logger.error(`stop: error in stop session exception=${errorMessage}`)
        }
    }

    /**
     * Unconfigure modules
     * @returns {Promise<void>}
     * @private
     */
    async unConfigureModules() {
        this.logger.debug('Unconfiguring modules')
        for (const moduleName in this.modules) {
            const module = this.modules[moduleName]
            const platformIndex = process.env.WDIO_WORKER_ID ? parseInt(process.env.WDIO_WORKER_ID.split('-')[0]) : 0
            await module.configure(null, platformIndex, GrpcClient.getInstance().client)
        }
    }

    /**
     * Load CLI parameters from the output
     * @param {Object} params - Parameters parsed from CLI output
     * @private
     */
    loadCliParams(params: Record<string, string>) {
        this.logger.debug(`CLI params loaded: ${JSON.stringify(params)}`)
        this.cliParams = params
        GrpcClient.getInstance().init(params)
    }

    /**
     * Start as a child process with the specified binSessionId
     * @param {string} binSessionId - session ID to connect to the CLI process
     * @returns {Promise<void>}
     */
    async startChild(binSessionId: string) {
        PerformanceTester.start(PerformanceEvents.SDK_CONNECT_BIN_SESSION)
        try {
            this.logger.info(`Starting as child process with session ID: ${binSessionId}`)
            GrpcClient.getInstance().connect()
            const response = await GrpcClient.getInstance().connectBinSession()
            this.logger.info(`Connected to bin session: ${JSON.stringify(response)}`)
            this.loadModules(response)
            this.isChildConnected = true
            PerformanceTester.end(PerformanceEvents.SDK_CONNECT_BIN_SESSION)
        } catch (error) {
            PerformanceTester.end(PerformanceEvents.SDK_CONNECT_BIN_SESSION, false, util.format(error))
            this.logger.error(`Failed to start as child process: ${util.format(error)}`)
        }
    }

    /**
     * Check if the CLI is running
     * @returns {boolean} True if the CLI is running
     */
    isRunning() {
        return (
            // is Dev mode
            CLIUtils.isDevelopmentEnv() ||
            // Main process connection check
            (this.isMainConnected && this.process !== null && this.process.exitCode === null && GrpcClient.getInstance().getClient() !== null && GrpcClient.getInstance()!.getChannel()!.getConnectivityState(false) !== 4) ||
            // Child process connection check
            (this.isChildConnected && GrpcClient.getInstance().getChannel() !== null && GrpcClient.getInstance()!.getChannel()!.getConnectivityState(false) !== 4)
        )
    }

    /**
     * Get the Browserstack configuration
     * @returns {Object} The Browserstack configuration
     */
    getBrowserstackConfig() {
        return this.browserstackConfig
    }

    /**
     * Set the Browserstack configuration
     * @param {Object}
     * @returns {void}
     */
    setBrowserstackConfig(browserstackConfig:Options.Testrunner) {
        this.browserstackConfig = browserstackConfig
    }

    /**
     * Get the CLI binary path
     * @returns {string} The CLI binary path
     */
    async getCliBinPath() {
        if (!this.SDK_CLI_BIN_PATH) {
            this.SDK_CLI_BIN_PATH = await CLIUtils.setupCliPath(this.browserstackConfig as Options.Testrunner)
        }
        return this.SDK_CLI_BIN_PATH || '' // TODO: Type hack
    }

    /**
     * Check if the CLI is enabled
     * @returns {boolean} True if the CLI is enabled
     */
    isCliEnabled() {
        return BrowserstackCLI.enabled
    }

    /**
     * Get the configuration
     * @returns {Object} The configuration
     */
    getConfig() {
        return this.config
    }

    /**
    * Set the configuration
    * @param {Object}
    * @returns {void}
    */
    setConfig(response: StartBinSessionResponse) {
        try {
            this.config = JSON.parse(response.config)
            this.logger.debug(`loadModules: config=${JSON.stringify(this.config)}`)
        } catch (error) {
            this.logger.error(`setConfig: error=${util.format(error)}`)
        }
    }

    /**
     * Setup the test framework
     * @returns {void}
     */
    setupTestFramework() {
        const testFrameworkDetail = CLIUtils.getTestFrameworkDetail()
        if (testFrameworkDetail.name.toLowerCase() === 'webdriverio-mocha') {
            this.testFramework = new WdioMochaTestFramework([testFrameworkDetail.name], testFrameworkDetail.version, this.binSessionId as string)
        }
    }

    /**
     * Setup the automation framework
     * @returns {void}
     */
    setupAutomationFramework() {
        const automationFrameworkDetail = CLIUtils.getAutomationFrameworkDetail()
        if (automationFrameworkDetail.name.toLowerCase() === 'webdriverio') {
            this.automationFramework = new WdioAutomationFramework(automationFrameworkDetail.name, automationFrameworkDetail.version)
        }
    }

    /**
     * Get the test framework
     * @returns {Object} The test framework
     */
    getTestFramework() {
        return this.testFramework
    }

    /**
     * Get the automation framework
     * @returns {Object} The automation framework
     */
    getAutomationFramework() {
        return this.automationFramework
    }
}
