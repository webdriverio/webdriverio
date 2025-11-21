import path from 'node:path'
import util, { promisify } from 'node:util'

import { CLIUtils } from './cliUtils.js'
import {
    SDKClient,
    grpcCredentials,
    grpcChannel,
    StartBinSessionRequestConstructor,
    StopBinSessionRequestConstructor,
    ConnectBinSessionRequestConstructor,
    TestFrameworkEventRequestConstructor,
    TestSessionEventRequestConstructor,
    ExecutionContextConstructor,
    LogCreatedEventRequestConstructor,
    // eslint-disable-next-line camelcase
    LogCreatedEventRequest_LogEntryConstructor,
    AutomationSessionConstructor,
    DriverInitRequestConstructor,
    FetchDriverExecuteParamsEventRequestConstructor
} from '@browserstack/wdio-browserstack-service'

// Type imports
import type {
    StartBinSessionRequest,
    ConnectBinSessionRequest,
    TestFrameworkEventRequest,
    TestSessionEventRequest,
    LogCreatedEventRequest,
    LogCreatedEventRequest_LogEntry as LogEntry,
    DriverInitRequest,
    FetchDriverExecuteParamsEventRequest,
    ConnectBinSessionResponse,
    StartBinSessionResponse,
    TestFrameworkEventResponse,
    TestSessionEventResponse,
    LogCreatedEventResponse,
    DriverInitResponse,
    FetchDriverExecuteParamsEventResponse,
    TestOrchestrationRequest,
    TestOrchestrationResponse
} from '@browserstack/wdio-browserstack-service'

import PerformanceTester from '../instrumentation/performance/performance-tester.js'
import { EVENTS as PerformanceEvents } from '../instrumentation/performance/constants.js'
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
    channel: any|null = null
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
        this.channel = new grpcChannel(
            listenAddress,
            grpcCredentials.createInsecure(),
            {
                'grpc.keepalive_time_ms': 10000
            }
        )

        // Create a client using the channel
        this.client = new SDKClient(
            listenAddress,
            grpcCredentials.createInsecure(),
            {}
        )

        this.logger.info(`Connected to gRPC server at ${listenAddress}`)
    }

    async startBinSession(wdioConfig: string) {
        PerformanceTester.start(PerformanceEvents.SDK_START_BIN_SESSION)
        this.logger.debug('startBinSession: Calling startBinSession')

        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }

            const packageVersion = CLIUtils.getSdkVersion()
            const automationFrameworkDetail = CLIUtils.getAutomationFrameworkDetail()
            const testFrameworkDetail = CLIUtils.getTestFrameworkDetail()
            const frameworkVersions = {
                ...automationFrameworkDetail.version,
                ...testFrameworkDetail.version
            }

            // Create StartBinSessionRequest
            const request = StartBinSessionRequestConstructor.create({
                binSessionId: this.binSessionId,
                sdkLanguage: CLIUtils.getSdkLanguage(),
                sdkVersion: packageVersion,
                pathProject: process.cwd(),
                pathConfig: path.resolve(process.cwd(), 'browserstack.yml'),
                cliArgs: process.argv.slice(2),
                frameworks: [automationFrameworkDetail.name, testFrameworkDetail.name],
                frameworkVersions,
                language: CLIUtils.getSdkLanguage(),
                testFramework: testFrameworkDetail.name,
                wdioConfig: wdioConfig,
            })

            const startBinSessionPromise = promisify(this.client!.startBinSession).bind(this.client!) as (arg0: StartBinSessionRequest) => Promise<StartBinSessionResponse>
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

            const request = ConnectBinSessionRequestConstructor.create({
                binSessionId: this.binSessionId,
            })

            const connectBinSessionPromise = promisify(this.client!.connectBinSession).bind(this.client!) as (arg0: ConnectBinSessionRequest) => Promise<ConnectBinSessionResponse>
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

            const request = StopBinSessionRequestConstructor.create({
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

    async testSessionEvent(data: Omit<TestSessionEventRequest, 'binSessionId'>) {
        this.logger.info('Sending TestSessionEvent')

        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }
            const { platformIndex, testFrameworkName, testFrameworkVersion, testFrameworkState, testHookState, testUuid, automationSessions, capabilities, executionContext } = data
            const sessions = automationSessions.map((automationSession) => {
                return AutomationSessionConstructor.create({
                    provider: automationSession.provider,
                    frameworkName: automationSession.frameworkName,
                    frameworkVersion: automationSession.frameworkVersion,
                    frameworkSessionId: automationSession.frameworkSessionId,
                    ref: automationSession.ref,
                    hubUrl: automationSession.hubUrl
                })
            })
            const executionContextBuilder = ExecutionContextConstructor.create({
                processId: executionContext?.processId,
                threadId: executionContext?.threadId,
                hash: executionContext?.hash
            })
            const request = TestSessionEventRequestConstructor.create({
                binSessionId: this.binSessionId,
                platformIndex: platformIndex,
                testFrameworkName: testFrameworkName,
                testFrameworkVersion: testFrameworkVersion,
                testFrameworkState: testFrameworkState,
                testHookState: testHookState,
                testUuid: testUuid,
                capabilities: capabilities,
                automationSessions: sessions,
                executionContext: executionContextBuilder,
            })

            const testSessionEventPromise = promisify(this.client!.testSessionEvent).bind(this.client!) as (arg0: TestSessionEventRequest) => Promise<TestSessionEventResponse>
            try {
                const response = await testSessionEventPromise(request)
                this.logger.info('testSessionEvent successful')
                return response
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`testSessionEvent error: ${errorMessage}`)
                throw error
            }
        } catch (error) {
            this.logger.error(`Error in TestSessionEvent: ${util.format(error)}`)
            throw error
        }
    }

    /**
     *
     * Send TestFrameworkEvent
     */

    async testFrameworkEvent(data: Omit<TestFrameworkEventRequest, 'binSessionId'>) {
        this.logger.info('Sending TestFrameworkEvent')
        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }
            const { platformIndex, testFrameworkName, testFrameworkVersion, testFrameworkState, testHookState, startedAt, endedAt, uuid, eventJson, executionContext } = data
            const executionContextBuilder = ExecutionContextConstructor.create({
                processId: executionContext?.processId,
                threadId: executionContext?.threadId,
                hash: executionContext?.hash
            })
            const request = TestFrameworkEventRequestConstructor.create({
                binSessionId: this.binSessionId,
                platformIndex: platformIndex,
                testFrameworkName: testFrameworkName,
                testFrameworkVersion: testFrameworkVersion,
                testFrameworkState: testFrameworkState,
                testHookState: testHookState,
                startedAt: startedAt,
                endedAt: endedAt,
                uuid: uuid,
                eventJson: eventJson,
                executionContext: executionContextBuilder,
            })

            const testFrameworkEventPromise = promisify(this.client!.testFrameworkEvent).bind(this.client!) as (arg0: TestFrameworkEventRequest) => Promise<TestFrameworkEventResponse>
            try {
                const response = await testFrameworkEventPromise(request)
                this.logger.info('testFrameworkEvent successful')
                return response
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`testFrameworkEvent error: ${errorMessage}`)
                throw error
            }
        } catch (error) {
            this.logger.error(`Error in TestFrameworkEvent: ${util.format(error)}`)
            throw error
        }
    }

    /**
     *
     * Send driverInitEvent
     */

    async driverInitEvent(data: Omit<DriverInitRequest, 'binSessionId'>) {
        this.logger.info('Sending driverInitEvent')
        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }
            const { platformIndex, ref, userInputParams } = data
            const request = DriverInitRequestConstructor.create({
                binSessionId: this.binSessionId,
                platformIndex: platformIndex,
                ref: ref,
                userInputParams: userInputParams,
            })

            const driverInitEventPromise = promisify(this.client!.driverInit).bind(this.client!) as (arg0: DriverInitRequest) => Promise<DriverInitResponse>
            try {
                const response = await driverInitEventPromise(request)
                this.logger.info('driverInitEvent successful')
                return response
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`driverInitEvent error: ${errorMessage}`)
                throw error
            }
        } catch (error) {
            this.logger.error(`Error in driverInitEvent: ${util.format(error)}`)
            throw error
        }
    }

    async logCreatedEvent(data: Omit<LogCreatedEventRequest, 'binSessionId'>) {
        this.logger.info('Sending LogCreatedEvent')
        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }
            const { platformIndex, logs, executionContext } = data
            const executionContextBuilder = ExecutionContextConstructor.create({
                processId: executionContext?.processId,
                threadId: executionContext?.threadId,
                hash: executionContext?.hash
            })
            // eslint-disable-next-line camelcase
            const logEntries: LogEntry[] = []
            for (const log of logs) {
                // eslint-disable-next-line camelcase
                const logEntry = LogCreatedEventRequest_LogEntryConstructor.create({
                    testFrameworkName: log.testFrameworkName,
                    testFrameworkVersion: log.testFrameworkVersion,
                    testFrameworkState: log.testFrameworkState,
                    uuid: log.uuid,
                    kind: log.kind,
                    message: log.message,
                    timestamp: log.timestamp,
                    level: log.level,
                })
                logEntries.push(logEntry)
            }
            const request = LogCreatedEventRequestConstructor.create({
                binSessionId: this.binSessionId,
                platformIndex: platformIndex,
                logs: logEntries,
                executionContext: executionContextBuilder,
            })

            const logCreatedEventPromise = promisify(this.client!.logCreatedEvent).bind(this.client!) as (arg0: LogCreatedEventRequest) => Promise<LogCreatedEventResponse>
            try {
                this.logger.debug('logCreatedEvent payload:' + JSON.stringify(request))
                const response = await logCreatedEventPromise(request)
                this.logger.info('logCreatedEvent successful')
                return response
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`logCreatedEvent error: ${errorMessage}`)
                throw error
            }
        } catch (error) {
            this.logger.error(`Error in LogCreatedEvent: ${util.format(error)}`)
            throw error
        }
    }

    async fetchDriverExecuteParamsEvent(data: Omit<FetchDriverExecuteParamsEventRequest, 'binSessionId'>) {
        this.logger.info('Sending fetchDriverExecuteParamsEvent')
        try {
            if (!this.client) {
                this.logger.info('No gRPC client not initialized.')
            }
            const { product, scriptName } = data
            const request = FetchDriverExecuteParamsEventRequestConstructor.create({
                binSessionId: this.binSessionId,
                product: product,
                scriptName: scriptName,
            })

            const fetchDriverExecuteParamsEventPromise = promisify(this.client!.fetchDriverExecuteParamsEvent).bind(this.client!) as (arg0: FetchDriverExecuteParamsEventRequest) => Promise<FetchDriverExecuteParamsEventResponse>
            try {
                const response = await fetchDriverExecuteParamsEventPromise(request)
                this.logger.info('fetchDriverExecuteParamsEvent successful')
                return response
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`fetchDriverExecuteParamsEvent error: ${errorMessage}`)
                throw error
            }
        } catch (error) {
            this.logger.error(`Error in fetchDriverExecuteParamsEvent: ${util.format(error)}`)
            throw error
        }
    }

    /**
     * Send TestOrchestration request to get ordered test files
     * @param {string[]} testFiles - Array of test file paths
     * @param {string} orchestrationStrategy - The orchestration strategy to use
     * @param {string} orchestrationMetadata - Additional metadata for orchestration
     * @returns {Promise<string[]|null>} Array of ordered test files or null if failed
     */
    async testOrchestrationSession(testFiles: string[], orchestrationStrategy: string, orchestrationMetadata: string): Promise<string[] | null> {

        try {
            if (!this.client) {
                this.logger.error('gRPC client is not initialized. Cannot perform test orchestration.')
                return null
            }

            if (!this.binSessionId) {
                this.logger.error('binSessionId is not available. Cannot perform test orchestration.')
                return null
            }

            // Create TestOrchestrationRequest
            const request: TestOrchestrationRequest = {
                binSessionId: this.binSessionId,
                orchestrationStrategy: orchestrationStrategy,
                testFiles: testFiles,
                orchestrationMetadata: orchestrationMetadata
            }

            const testOrchestrationPromise = promisify(this.client!.testOrchestration).bind(this.client!) as (arg0: TestOrchestrationRequest) => Promise<TestOrchestrationResponse>

            try {
                const response = await testOrchestrationPromise(request)
                this.logger.debug(`test-orchestration-session=${JSON.stringify(response)}`)

                if (response.success) {
                    return Array.from(response.orderedTestFiles || [])
                }

                this.logger.warn('Test orchestration was not successful')
                return null
            } catch (error: unknown) {
                const errorMessage = util.format(error)
                this.logger.error(`TestOrchestration error: ${errorMessage}`)
                throw error
            }
        } catch (error) {
            this.logger.error(`Error in testOrchestrationSession: ${util.format(error)}`)
            return null
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
