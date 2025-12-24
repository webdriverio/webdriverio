import { TestOrderingServer } from './test-ordering-server.js'
import { OrchestrationUtils } from './testorcherstrationutils.js'
import { GrpcClient } from '../cli/grpcClient.js'
import { BrowserstackCLI } from '../cli/index.js'
import { BStackLogger } from '../bstackLogger.js'
import type { BrowserstackConfig } from '../types.js'

type TestOrchestrationConfig = BrowserstackConfig & Record<string, unknown> & {
    projectName?: string
    buildName?: string
    testOrchestration?: {
        enabled?: boolean
    }
}

type OrderingInstrumentationValue = string | number | boolean | null

/**
 * Checks if a value is true
 */
function isTrue(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true'
    }
    return !!value
}

/**
 * Handles test orchestration operations
 */
export class TestOrchestrationHandler {
    private static _instance: TestOrchestrationHandler | null = null
    private config: TestOrchestrationConfig
    private testOrderingServerHandler: TestOrderingServer
    private orchestrationUtils: OrchestrationUtils | null
    private orderingInstrumentationData: Record<string, OrderingInstrumentationValue>
    private testOrderingApplied: boolean
    private isTestOrderingEnabled: boolean

    /**
     * @param config Service configuration
     */
    constructor(config: Record<string, unknown>) {
        this.config = config as TestOrchestrationConfig
        this.testOrderingServerHandler = new TestOrderingServer(this.config)
        this.orchestrationUtils = OrchestrationUtils.getInstance(config)
        this.orderingInstrumentationData = {}
        this.testOrderingApplied = false
        this.isTestOrderingEnabled = this.config.testOrchestration?.enabled || false
    }

    /**
     * Get or create an instance of TestOrchestrationHandler
     */
    static getInstance(config: Record<string, unknown>): TestOrchestrationHandler {
        if (TestOrchestrationHandler._instance === null && config !== null) {
            TestOrchestrationHandler._instance = new TestOrchestrationHandler(config)
        }
        return TestOrchestrationHandler._instance as TestOrchestrationHandler
    }

    /**
     * Checks if test ordering is enabled
     * Do not apply test ordering when:
     * - O11y is not enabled
     * - Ordering is not enabled
     * - projectName is None
     * - buildName is None
     */
    testOrderingEnabled(): boolean {
        return this.isTestOrderingEnabled
    }

    /**
     * Checks if observability is enabled
     */
    private _isObservabilityEnabled(): boolean {
        return isTrue(this.config.testObservability)
    }

    /**
     * Checks if test ordering checks should be logged
     */
    shouldLogTestOrderingChecks(): boolean {
        return (
            !this.testOrderingEnabled() &&
            this.orchestrationUtils !== null &&
            this.orchestrationUtils.testOrderingEnabled()
        )
    }

    /**
     * Logs test ordering checks
     */
    logTestOrderingChecks(): void {
        if (!this.shouldLogTestOrderingChecks()) {
            return
        }

        if (this.config.projectName === undefined || this.config.buildName === undefined) {
            BStackLogger.info("Test Reordering can't work as buildName or projectName is null. Please set a non-null value.")
        }

        if (!this._isObservabilityEnabled()) {
            BStackLogger.info("Test Reordering can't work as testReporting is disabled. Please enable it from browserstack.yml file.")
        }
    }

    /**
     * Reorders test files based on the orchestration strategy
     */
    async reorderTestFiles(testFiles: string[]): Promise<string[] | null> {
        try {
            if (!testFiles || testFiles.length === 0) {
                BStackLogger.debug('[reorderTestFiles] No test files provided for ordering.')
                return null
            }

            let orchestrationStrategy: string | null = null
            const orchestrationMetadata: Record<string, unknown> = this.orchestrationUtils?.getTestOrchestrationMetadata() || {}

            if (this.orchestrationUtils !== null) {
                orchestrationStrategy = this.orchestrationUtils.getTestOrderingName()
            }

            if (orchestrationStrategy === null) {
                BStackLogger.error('Orchestration strategy is None. Cannot proceed with test orchestration session.')
                return null
            }

            BStackLogger.info(`Reordering test files with orchestration strategy: ${orchestrationStrategy}`)
            let orderedTestFiles = []
            if (BrowserstackCLI.getInstance().isRunning()) {
                BStackLogger.info('Using CLI flow for test files orchestration.')
                orderedTestFiles = await GrpcClient.getInstance().testOrchestrationSession(testFiles, orchestrationStrategy, JSON.stringify(orchestrationMetadata))|| []
            } else {
                BStackLogger.info('Using SDK flow for test files orchestration.')
                await this.testOrderingServerHandler.splitTests(testFiles, orchestrationStrategy, JSON.stringify(orchestrationMetadata))
                orderedTestFiles = await this.testOrderingServerHandler.getOrderedTestFiles() || []
            }

            this.addToOrderingInstrumentationData('uploadedTestFilesCount', testFiles.length)
            this.addToOrderingInstrumentationData('nodeIndex', parseInt(process.env.BROWSERSTACK_NODE_INDEX || '0'))
            this.addToOrderingInstrumentationData('totalNodes', parseInt(process.env.BROWSERSTACK_NODE_COUNT || '1'))
            this.addToOrderingInstrumentationData('downloadedTestFilesCount', orderedTestFiles.length)
            this.addToOrderingInstrumentationData('splitTestsAPICallCount', this.testOrderingServerHandler.getSplitTestsApiCallCount())

            return orderedTestFiles
        } catch (error) {
            BStackLogger.debug(`[reorderTestFiles] Error in ordering test classes: ${error}`)
        }
        return null
    }

    /**
     * Adds data to the ordering instrumentation data
     */
    addToOrderingInstrumentationData(key: string, value: OrderingInstrumentationValue): void {
        this.orderingInstrumentationData[key] = value
    }

    /**
     * Gets the ordering instrumentation data
     */
    getOrderingInstrumentationData(): Record<string, OrderingInstrumentationValue> {
        return this.orderingInstrumentationData
    }
}

export default TestOrchestrationHandler
