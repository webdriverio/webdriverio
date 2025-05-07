import path from 'node:path'
import util from 'node:util'
import type { ServiceError } from '@grpc/grpc-js'
import grpc from '@grpc/grpc-js'

import { SDKClient } from '../generated/sdk.js'
import type { ConnectBinSessionResponse, StartBinSessionResponse, StopBinSessionResponse } from '../generated/sdk-messages.js'
import { StartBinSessionRequest, StopBinSessionRequest, ConnectBinSessionRequest } from '../generated/sdk-messages.js'
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
        this.logger.info('startBinSession: Calling startBinSession')

        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }

            const packageInfo = CLIUtils.getSdkVersion()
            const automationFrameworkDetail = CLIUtils.getAutomationFrameworkDetail()
            const framework = automationFrameworkDetail.name
            // const frameworkVersion = automationFrameworkDetail.version

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
            // request.setBinSessionId(this.binSessionId!);
            // request.setSdkLanguage(CLIUtils.getSdkLanguage());
            // request.setSdkVersion(packageInfo.version);
            // request.setPathProject(process.cwd());
            // request.setPathConfig(path.resolve(process.cwd(), 'browserstack.yml'));

            // const envVarsMap = request.envVarsMap();
            // Object.entries(process.env).forEach(([key, value]) => {
            //     if (value !== undefined && value !== null) {
            //         envVarsMap.set(key, value);
            //     }
            // });

            // request.setCliArgsList(process.argv.slice(2));
            // request.setLanguage(CLIUtils.getSdkLanguage());
            // request.setTestFramework(framework);

            // const frameworkVersionsMap = request.getFrameworkVersionsMap();
            // frameworkVersionsMap.set(framework, frameworkVersion || '');

            // request.addFrameworks(framework, frameworkVersion);
            // request.setFrameworksList([framework]);

            return new Promise((resolve, reject) => {
                this.client!.startBinSession(request, (error: ServiceError, response: StartBinSessionResponse) => {
                    if (error) {
                        this.logger.error(`StartBinSession error: ${error.message}`)
                        reject(error)
                        PerformanceTester.end(PerformanceEvents.SDK_START_BIN_SESSION, false, util.format(error))
                        return
                    }

                    this.logger.info('StartBinSession successful')
                    PerformanceTester.end(PerformanceEvents.SDK_START_BIN_SESSION)
                    resolve(response)
                })
            })
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
        this.logger.info('Connecting bin session')

        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }

            const request = ConnectBinSessionRequest.create({
                binSessionId: this.binSessionId,
            })
            // request.setBinSessionId(this.binSessionId!);

            const response = await new Promise((resolve, reject) => {
                this.client!.connectBinSession(request, (error: ServiceError, response: ConnectBinSessionResponse) => {
                    if (error) {
                        this.logger.error(`ConnectBinSession error: ${error.message}`)
                        reject(error)
                        PerformanceTester.end(PerformanceEvents.SDK_CONNECT_BIN_SESSION, false, util.format(error))
                        return
                    }

                    this.logger.info('ConnectBinSession successful')
                    PerformanceTester.end(PerformanceEvents.SDK_CONNECT_BIN_SESSION)
                    resolve(response)
                })
            })

            this.logger.debug(`connect-bin-session response: ${util.format(response)}`)
            return response
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
        this.logger.info('Stopping bin session')

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
            // request.setBinSessionId(this.binSessionId);

            // Get response from gRPC call
            const response = await new Promise((resolve, reject) => {
                this.client!.stopBinSession(request, (error: ServiceError, response: StopBinSessionResponse) => {
                    if (error) {
                        this.logger.error(`StopBinSession error: ${error.message}`)
                        reject(error)
                        PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP, false, util.format(error))
                        return
                    }

                    this.logger.info('StopBinSession successful')
                    PerformanceTester.end(PerformanceEvents.SDK_CLI_ON_STOP)
                    resolve(response)
                })
            })

            this.logger.debug(`stop-bin-session response: ${util.format(response)}`)
            return response
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
