import type { Logger } from '@wdio/logger'

import { TestOrderingServer } from './test-ordering-server.js'
import { OrchestrationUtils } from './testorcherstrationutils.js'
import { GrpcClient } from '../cli/grpcClient.js'
import { BrowserstackCLI } from '../cli/index.js'

// Constants
const TEST_ORDERING_SUPPORTED_FRAMEWORKS = ['mocha', 'jasmine', 'cucumber']
const O11Y_SUPPORTED_FRAMEWORKS = ['mocha', 'jasmine', 'cucumber']

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
    private logger: Logger
    private testOrderingServerHandler: TestOrderingServer
    private orchestrationUtils: OrchestrationUtils | null
    private orderingInstrumentationData: Record<string, any>
    private testOrderingApplied: boolean
    private isTestOrderingEnabled: boolean

    /**
     * @param config Service configuration
     * @param logger Logger instance
     */
    constructor(config: Record<string, any>, logger: Logger) {
        this.config = config
        this.logger = logger
        this.testOrderingServerHandler = new TestOrderingServer(this.config, logger)
        this.orchestrationUtils = new OrchestrationUtils(config)
        this.orderingInstrumentationData = {}
        this.testOrderingApplied = false
        this.isTestOrderingEnabled = config.testOrchestration?.enabled || false
    }

    /**
     * Get or create an instance of TestOrchestrationHandler
     */
    static getInstance(config: Record<string, any>, logger: Logger): TestOrchestrationHandler {
        if (TestOrchestrationHandler._instance === null && config !== null) {
            TestOrchestrationHandler._instance = new TestOrchestrationHandler(config, logger)
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
        return this.isTestOrderingEnabled && this.isFrameworkVersionSupportedForTestOrdering()
    }

    /**
     * Checks if the framework version is supported for test ordering
     */
    isFrameworkVersionSupportedForTestOrdering(): boolean {
        return TEST_ORDERING_SUPPORTED_FRAMEWORKS.includes(this.config.framework)
    }

    /**
     * Checks if observability is enabled
     */
    private _isObservabilityEnabled(): boolean {
        let defaultVal = false
        for (const fw of O11Y_SUPPORTED_FRAMEWORKS) {
            if ((this.config.framework || '').includes(fw)) {
                defaultVal = true
                break
            }
        }
        return isTrue(this.config.testObservability !== undefined ? this.config.testObservability : defaultVal)
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
            this.logger.info("Test Reordering can't work as buildName or projectName is null. Please set a non-null value.")
        }

        if (!this._isObservabilityEnabled()) {
            this.logger.info("Test Reordering can't work as testReporting is disabled. Please enable it from browserstack.yml file.")
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
                this.logger.debug('[reorderTestFiles] No test files provided for ordering.')
                return null
            }

            let orchestrationStrategy = null
            const orchestrationMetadata = this.orchestrationUtils?.getTestOrchestrationMetadata() || {}

            if (this.orchestrationUtils !== null) {
                orchestrationStrategy = this.orchestrationUtils.getTestOrderingName()
            }

            if (orchestrationStrategy === null) {
                this.logger.error('Orchestration strategy is None. Cannot proceed with test orchestration session.')
                return null
            }

            this.logger.info(`Reordering test files with orchestration strategy: ${orchestrationStrategy}`)
            let orderedTestFiles = []
            if (BrowserstackCLI.getInstance().isRunning()) {
                this.logger.info('Using CLI flow for test files orchestration.')
                orderedTestFiles = await GrpcClient.getInstance().testOrchestrationSession(testFiles, orchestrationStrategy, orchestrationMetadata)|| []
            } else {
                this.logger.info('Using SDK flow for test files orchestration.')
                await this.testOrderingServerHandler.splitTests(testFiles, orchestrationStrategy, orchestrationMetadata)
                orderedTestFiles = await this.testOrderingServerHandler.getOrderedTestFiles() || []
            }

            this.addToOrderingInstrumentationData('uploadedTestFilesCount', testFiles.length)
            this.addToOrderingInstrumentationData('nodeIndex', parseInt(process.env.BROWSERSTACK_NODE_INDEX || '0'))
            this.addToOrderingInstrumentationData('totalNodes', parseInt(process.env.BROWSERSTACK_NODE_COUNT || '1'))
            this.addToOrderingInstrumentationData('downloadedTestFilesCount', orderedTestFiles.length)
            this.addToOrderingInstrumentationData('splitTestsAPICallCount', this.testOrderingServerHandler.getSplitTestsApiCallCount())

            return orderedTestFiles
        } catch (e) {
            this.logger.debug(`[reorderTestFiles] Error in ordering test classes: ${e}`)
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
