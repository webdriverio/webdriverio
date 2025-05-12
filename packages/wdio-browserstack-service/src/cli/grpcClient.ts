import path from 'node:path'
import util, { promisify } from 'node:util'
import grpc from '@grpc/grpc-js'

import { SDKClient } from '../proto/sdk.js'
import { StartBinSessionRequest, StopBinSessionRequest, ConnectBinSessionRequest } from '../proto/sdk-messages.js'
import PerformanceTester from '../instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../instrumentation/performance/constants.js'
import { CLIUtils } from './cliUtils.js'
import { BStackLogger } from './cliLogger.js'

/**
 * GrpcClient - Singleton class for managing gRPC client connections
 *
 * This class uses the singleton pattern to ensure only one gRPC client instance exists
 * throughout the application lifecycle.
 */
export class GrpcClient {
    static #instance: GrpcClient|null = null

    binSessionId: string|undefined
    listenAddress: string|undefined
    channel: grpc.Channel|null = null
    client: SDKClient | null = null
    logger = BStackLogger

    constructor() {}

    /**
     * Get the singleton instance of GrpcClient
     * @returns {GrpcClient} The singleton instance
     */
    static getInstance() {
        if (!GrpcClient.#instance) {
            GrpcClient.#instance = new GrpcClient()
        }
        return GrpcClient.#instance
    }

    /**
     * Initialize the gRPC client connection
     * @param {string} host The gRPC server host
     * @param {number} port The gRPC server port
     */
    init(params: Record<string, string>) {
        const { id, listen } = params
        if (!id || !listen) {
            throw new Error(`Unable to find listen addr or bin session id binSessionId: ${id} listenAddr: ${listen}`)
        }

        this.binSessionId = id
        this.listenAddress = listen
        process.env.BROWSERSTACK_CLI_BIN_SESSION_ID = this.binSessionId
        process.env.BROWSERSTACK_CLI_BIN_LISTEN_ADDR = this.listenAddress
        this.connect()
        this.logger.info(`Initialized gRPC client with bin session id: ${this.binSessionId} and listen address: ${this.listenAddress}`)
    }

    /**
     * Connect to the gRPC server
     * @returns {void}
     */
    connect() {
        let listenAddress = this.listenAddress

        if (!listenAddress) {
            listenAddress = process.env.BROWSERSTACK_CLI_BIN_LISTEN_ADDR
        }

        if (!this.binSessionId) {
            this.binSessionId = this.binSessionId || process.env.BROWSERSTACK_CLI_BIN_SESSION_ID
        }

        if (!listenAddress) {
            throw new Error('Unable to determine gRPC server listen address')
        }

        // Create a channel
        this.channel = new grpc.Channel(
            listenAddress,
            grpc.credentials.createInsecure(),
            {
                'grpc.keepalive_time_ms': 10000
            }
        )

        // Create a client using the channel
        this.client = new SDKClient(
            listenAddress,
            grpc.credentials.createInsecure()
        )

        this.logger.info(`Connected to gRPC server at ${listenAddress}`)
    }

    async startBinSession() {
        PerformanceTester.start(PerformanceEvents.SDK_START_BIN_SESSION)
        this.logger.debug('startBinSession: Calling startBinSession')

        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }

            const packageInfo = CLIUtils.getSdkVersion()
            const automationFrameworkDetail = CLIUtils.getAutomationFrameworkDetail()
            const framework = automationFrameworkDetail.name

            // Create StartBinSessionRequest
            const request = StartBinSessionRequest.create({
                binSessionId: this.binSessionId,
                sdkLanguage: CLIUtils.getSdkLanguage(),
                sdkVersion: packageInfo.version,
                pathProject: process.cwd(),
                pathConfig: path.resolve(process.cwd(), 'browserstack.yml'),
                cliArgs: process.argv.slice(2),
                language: CLIUtils.getSdkLanguage(),
                testFramework: framework,
            })

            const startBinSessionPromise = promisify(this.client!.startBinSession).bind(this.client!)
            try {
                const response = await startBinSessionPromise(request)
                this.logger.info('StartBinSession successful')
                PerformanceTester.end(PerformanceEvents.SDK_START_BIN_SESSION)
                return response
            } catch (error: unknown) {
                this.logger.error(`StartBinSession error: ${util.format(error)}`)
                PerformanceTester.end(PerformanceEvents.SDK_START_BIN_SESSION, false, util.format(error))
                throw error
            }
        } catch (error) {
            this.logger.error(`Error in startBinSession: ${util.format(error)}`)
            PerformanceTester.end(PerformanceEvents.SDK_START_BIN_SESSION, false, util.format(error))
            throw error
        }
    }

    /**
     * Connect to the bin session
     * @returns {Promise<Object>} The response from the gRPC call
     */
    async connectBinSession() {
        PerformanceTester.start(PerformanceEvents.SDK_CONNECT_BIN_SESSION)
        this.logger.debug('Connecting bin session')

        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }

            const request = ConnectBinSessionRequest.create({
                binSessionId: this.binSessionId,
            })

            const connectBinSessionPromise = promisify(this.client!.connectBinSession).bind(this.client!)
            try {
                const response =  await connectBinSessionPromise(request)
                this.logger.info('ConnectBinSession successful')
                PerformanceTester.end(PerformanceEvents.SDK_CONNECT_BIN_SESSION)
                return response
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`ConnectBinSession error: ${errorMessage}`)
                PerformanceTester.end(PerformanceEvents.SDK_CONNECT_BIN_SESSION, false, errorMessage)
                throw error
            }
        } catch (error) {
            PerformanceTester.end(PerformanceEvents.SDK_CONNECT_BIN_SESSION, false, util.format(error))
            this.logger.error(`Error in connectBinSession: ${util.format(error)}`)
            throw error
        }
    }

    /**
     * Stop the bin session
     * @returns {Promise<void>}
     * @private
     */
    async stopBinSession() {
        PerformanceTester.start(PerformanceEvents.SDK_CLI_ON_STOP)
        this.logger.debug('Stopping bin session')

        try {
            if (!this.binSessionId) {
                throw new Error('Missing binSessionId')
            }

            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }

            const request = StopBinSessionRequest.create({
                binSessionId: this.binSessionId
            })

            // Get response from gRPC call
            const stopBinSessionPromise = promisify(this.client!.stopBinSession).bind(this.client!)
            try {
                const response = await stopBinSessionPromise(request)
                this.logger.info('StopBinSession successful')
                PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP)
                return response
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`StopBinSession error: ${errorMessage}`)
                PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP, false, errorMessage)
                throw error
            }
        } catch (error) {
            PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP, false, util.format(error))
            this.logger.error(`Error in stopBinSession: ${util.format(error)}`)
        }
    }

    /**
     * Get the gRPC channel
     * @returns {grpc.Channel} The gRPC channel
     */
    getClient() {
        return this.client
    }

    /**
     * Get the gRPC channel
     * @returns {grpc.Channel} The gRPC channel
     */
    getChannel() {
        return this.channel
    }
}
