import util from 'node:util'
import { spawn } from 'node:child_process'

import PerformanceTester from '../instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../instrumentation/performance/constants.js'
import { CLIUtils } from './cliUtils.js'
import { BStackLogger } from './cliLogger.js'
import { GrpcClient } from './grpcClient.js'
import { TestHubModule } from './modules/TestHubModule.js'

import type { ChildProcess } from 'node:child_process'
import type BrowserStackConfig from '../config.js'
import type { StartBinSessionResponse } from 'src/generated/sdk-messages.js'
import type { BaseModule } from './modules/BaseModule.js'

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
    config:object
    cliArgs:object
    browserstackConfig: BrowserStackConfig|{}
    process: ChildProcess | null = null
    isMainConnected = false
    isChildConnected = false
    binSessionId: string | null = null
    modules: Record<string, BaseModule> = {}
    testFramework = null
    cliParams: Record<string, string> | null = null
    automationFramework = null
    SDK_CLI_BIN_PATH: string | null = null
    logger = BStackLogger

    constructor() {
        this.initialized = false
        this.config = {}
        this.cliArgs = {}
        this.browserstackConfig = {}
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
    async bootstrap() {
        PerformanceTester.start(PerformanceEvents.SDK_CLI_ON_BOOTSTRAP)
        BrowserstackCLI.enabled = true
        try {
            const binSessionId = process.env.BROWSERSTACK_CLI_BIN_SESSION_ID || null
            this.setupAutomationFramework()
            this.setupTestFramework()

            if (binSessionId) {
                await this.startChild(binSessionId)
                PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_BOOTSTRAP)
                return
            }

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
        this.isMainConnected = true

    }

    /**
     * Load modules
     * @param {Object} startBinResponse - StartBinSession response
     */
    loadModules(startBinResponse: StartBinSessionResponse) {
        // Defer imports to avoid circular dependencies
        this.logger.info('loadModules: Loading modules')
        this.binSessionId = startBinResponse.binSessionId
        this.logger.info(`loadModules: binSessionId=${this.binSessionId}`)

        this.setConfig(startBinResponse)

        if (!this.isChildConnected) {
            // this.setCliArgs(startBinResponse)
        }

        if (startBinResponse.testhub) {
            this.modules[TestHubModule.MODULE_NAME] = new TestHubModule(startBinResponse.testhub)
        }

        this.configureModules()
    }

    /**
     * Configure modules
     * @returns {Promise<void>}
     */
    async configureModules() {
        this.logger.info('configureModules: Configuring modules')
        for (const moduleName in this.modules) {
            const module = this.modules[moduleName]
            this.logger.info(`configureModules: Configuring module=${moduleName}`)
            await module.configure(this.binSessionId!, 0, GrpcClient.getInstance().client, this.config)
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
        this.logger.info(`spawning command='${cmd}'`)
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
        this.logger.info('stop: CLI stop triggered')
        try {

            await this.unConfigureModules()

            //   grpc channel close
            //   if (this.channel) {
            //     // In Node.js, we would use something like:
            //     await new Promise((resolve) => {
            //       this.channel.close(() => {
            //         this.logger.info('stop: channel closed');
            //         resolve();
            //       });
            //     });
            //     // Allow 5 seconds for shutdown like in Java
            //     await new Promise(resolve => setTimeout(resolve, 5000));
            //   }

            if (this.process && this.process.pid) {
                this.logger.info('stop: shutting down CLI')
                this.process.kill()

                // Wait for process to fully exit
                await new Promise<void>((resolve) => {
                    let exited = false

                    // Listen for exit event
                    this.process!.on('exit', () => {
                        this.logger.info('stop: CLI process exited')
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
                    }, 3000)
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
        this.logger.info('Unconfiguring modules')
        // Add implementation based on your requirements
    }

    /**
     * Load CLI parameters from the output
     * @param {Object} params - Parameters parsed from CLI output
     * @private
     */
    loadCliParams(params: Record<string, string>) {
        this.logger.info(`CLI params loaded: ${JSON.stringify(params)}`)
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
    setBrowserstackConfig(browserstackConfig:BrowserStackConfig) {
        this.browserstackConfig = browserstackConfig
    }

    /**
     * Get the CLI binary path
     * @returns {string} The CLI binary path
     */
    async getCliBinPath() {
        if (!this.SDK_CLI_BIN_PATH) {
            this.SDK_CLI_BIN_PATH = await CLIUtils.setupCliPath(this.browserstackConfig)
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
            this.logger.info(`loadModules: config=${JSON.stringify(this.config)}`)
        } catch (error) {
            this.logger.error(`setConfig: error=${util.format(error)}`)
        }
    }

    /**
     * Setup the test framework
     * @returns {void}
     */
    setupTestFramework() {
        // const testFrameworkDetail = CLIUtils.getTestFrameworkDetail()
    }

    /**
     * Setup the automation framework
     * @returns {void}
     */
    setupAutomationFramework() {
        // const automationFrameworkDetail = CLIUtils.getAutomationFrameworkDetail()
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
