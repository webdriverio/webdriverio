import { TestOrderingServer } from './test-ordering-server.js'
import { OrchestrationUtils } from './testorcherstrationutils.js'
import { GrpcClient } from '../cli/grpcClient.js'
import { BrowserstackCLI } from '../cli/index.js'
import { BStackLogger } from '../bstackLogger.js'

/**
 * Checks if a value is true
 */
function isTrue(value: any): boolean {
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
    private config: Record<string, any>
    private testOrderingServerHandler: TestOrderingServer
    private orchestrationUtils: OrchestrationUtils | null
    private orderingInstrumentationData: Record<string, any>
    private testOrderingApplied: boolean
    private isTestOrderingEnabled: boolean

    /**
     * @param config Service configuration
     */
    constructor(config: Record<string, any>) {
        this.config = config
        this.testOrderingServerHandler = new TestOrderingServer(this.config)
        this.orchestrationUtils = OrchestrationUtils.getInstance(config)
        this.orderingInstrumentationData = {}
        this.testOrderingApplied = false
        this.isTestOrderingEnabled = config.testOrchestration?.enabled || false
    }

    /**
     * Get or create an instance of TestOrchestrationHandler
     */
    static getInstance(config: Record<string, any>): TestOrchestrationHandler {
        if (TestOrchestrationHandler._instance === null && config !== null) {
            TestOrchestrationHandler._instance = new TestOrchestrationHandler(config)
        }
        return TestOrchestrationHandler._instance as TestOrchestrationHandler
    }

    /**
     * Checks if observability is enabled
     */
    private _isObservabilityEnabled(): boolean {
        return isTrue(this.config.testObservability)
    }

    /**
     * Logs test ordering checks
     */
    logTestOrderingChecks(): void {
        if (this.config.projectName === undefined || this.config.buildName === undefined) {
            BStackLogger.info("Test Reordering can't work as buildName or projectName is null. Please set a non-null value.")
        }

        if (!this._isObservabilityEnabled()) {
            BStackLogger.info("Test Reordering can't work as testReporting is disabled. Please enable it from browserstack.yml file.")
        }
    }

    /**
     * Checks if test ordering is applied
     */
    isTestOrderingApplied(): boolean {
        return this.testOrderingApplied
    }

    /**
     * Sets whether test ordering is applied
     */
    setTestOrderingApplied(orderingApplied: boolean): void {
        this.testOrderingApplied = orderingApplied
        this.addToOrderingInstrumentationData('applied', orderingApplied)
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

            let orchestrationStrategy = null
            const orchestrationMetadata = this.orchestrationUtils?.getTestOrchestrationMetadata() || {}

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
        } catch (e) {
            BStackLogger.debug(`[reorderTestFiles] Error in ordering test classes: ${e}`)
        }
        return null
    }

    /**
     * Adds data to the ordering instrumentation data
     */
    addToOrderingInstrumentationData(key: string, value: any): void {
        this.orderingInstrumentationData[key] = value
    }

    /**
     * Gets the ordering instrumentation data
     */
    getOrderingInstrumentationData(): Record<string, any> {
        return this.orderingInstrumentationData
    }
}

export default TestOrchestrationHandler
