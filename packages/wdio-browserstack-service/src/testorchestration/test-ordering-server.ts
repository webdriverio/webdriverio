import path from 'node:path'

import { getHostInfo, getGitMetadataForAISelection } from './helpers.js'
import { RequestUtils } from './request-utils.js'
import APIUtils from '../cli/apiUtils.js'
import { BStackLogger } from '../bstackLogger.js'

/**
 * Handles test ordering orchestration with the BrowserStack server.
 */
export class TestOrderingServer {
    private config: Record<string, any>
    private ORDERING_ENDPOINT: string
    private requestData: Record<string, any> | null
    private defaultTimeout: number
    private defaultTimeoutInterval: number
    private splitTestsApiCallCount: number

    /**
     * @param config Test orchestration config
     */
    constructor(config: Record<string, any>) {
        this.config = config
        this.ORDERING_ENDPOINT = 'testorchestration/api/v1/split-tests'
        this.requestData = null
        this.defaultTimeout = 60
        this.defaultTimeoutInterval = 5
        this.splitTestsApiCallCount = 0
    }

    /**
     * Initiates the split tests request and stores the response data for polling.
     */
    async splitTests(testFiles: string[], orchestrationStrategy: string, orchestrationMetadata: string = '{}') {
        BStackLogger.debug(`[splitTests] Initiating split tests with strategy: ${orchestrationStrategy}`)
        try {
            let prDetails: any[] = []
            const parsedMetadata = JSON.parse(orchestrationMetadata)
            const source = parsedMetadata.run_smart_selection?.source
            const isGithubAppApproach = Array.isArray(source) && source.length > 0 && source.every(src => src && typeof src === 'object' && !Array.isArray(src))
            if (parsedMetadata.run_smart_selection?.enabled && !isGithubAppApproach) {
                const multiRepoSource = parsedMetadata.run_smart_selection?.source
                prDetails = getGitMetadataForAISelection(multiRepoSource)
            }
            BStackLogger.info(`PR Details for AI Selection: ${JSON.stringify(prDetails)}`)

            const payload = {
                tests: testFiles.map(f => ({ filePath: f })),
                orchestrationStrategy,
                orchestrationMetadata: parsedMetadata,
                nodeIndex: parseInt(process.env.BROWSERSTACK_NODE_INDEX || '0'),
                totalNodes: parseInt(process.env.BROWSERSTACK_TOTAL_NODE_COUNT || '1'),
                projectName: this.config.testObservabilityOptions.projectName || '',
                buildName: this.config.testObservabilityOptions.buildName || path.basename(process.cwd()),
                buildRunIdentifier: process.env.BROWSERSTACK_BUILD_RUN_IDENTIFIER || '',
                hostInfo: getHostInfo(),
                prDetails
            }

            const response = await RequestUtils.testOrchestrationSplitTests(this.ORDERING_ENDPOINT, payload)
            if (response) {
                this.requestData = this._processSplitTestsResponse(response)
                BStackLogger.debug(`[splitTests] Split tests response: ${JSON.stringify(this.requestData)}`)
            } else {
                BStackLogger.error('[splitTests] Failed to get split tests response.')
            }
        } catch (e) {
            BStackLogger.error(`[splitTests] Exception in sending test files:: ${e}`)
        }
    }

    /**
     * Processes the split tests API response and extracts relevant fields.
     */
    private _processSplitTestsResponse(response: any) {
        const responseData: Record<string, any> = {}
        responseData.timeout = response.timeout !== undefined ? response.timeout : this.defaultTimeout
        responseData.timeoutInterval = response.timeoutInterval !== undefined ? response.timeoutInterval : this.defaultTimeoutInterval

        const resultUrl = response.resultUrl
        const timeoutUrl = response.timeoutUrl

        // Remove the API prefix if present
        if (resultUrl) {
            responseData.resultUrl = resultUrl.includes(`${APIUtils.DATA_ENDPOINT}/`)
                ? resultUrl.split(`${APIUtils.DATA_ENDPOINT}/`)[1]
                : resultUrl
        } else {
            responseData.resultUrl = null
        }

        if (timeoutUrl) {
            responseData.timeoutUrl = timeoutUrl.includes(`${APIUtils.DATA_ENDPOINT}/`)
                ? timeoutUrl.split(`${APIUtils.DATA_ENDPOINT}/`)[1]
                : timeoutUrl
        } else {
            responseData.timeoutUrl = null
        }

        if (
            response.timeout === undefined ||
            response.timeoutInterval === undefined ||
            response.timeoutUrl === undefined ||
            response.resultUrl === undefined
        ) {
            BStackLogger.debug('[process_split_tests_response] Received null value(s) for some attributes in split tests API response')
        }
        return responseData
    }

    /**
     * Retrieves the ordered test files from the orchestration server
     */
    async getOrderedTestFiles() {
        if (!this.requestData) {
            BStackLogger.error('[getOrderedTestFiles] No request data available to fetch ordered test files.')
            return null
        }

        let testFilesJsonList = null
        const testFiles = []
        const startTimeMillis = Date.now()
        const timeoutInterval = parseInt(String(this.requestData.timeoutInterval || this.defaultTimeoutInterval), 10)
        const timeoutMillis = parseInt(String(this.requestData.timeout || this.defaultTimeout), 10) * 1000
        const timeoutUrl = this.requestData.timeoutUrl
        const resultUrl = this.requestData.resultUrl

        if (resultUrl === null && timeoutUrl === null) {
            return null
        }

        try {
            // Poll resultUrl until timeout or until tests are available
            while (resultUrl && (Date.now() - startTimeMillis) < timeoutMillis) {
                const response = await RequestUtils.getTestOrchestrationOrderedTests(resultUrl)
                if (response && response.tests) {
                    testFilesJsonList = response.tests
                }
                this.splitTestsApiCallCount++
                if (testFilesJsonList) {
                    break
                }
                await new Promise(resolve => setTimeout(resolve, timeoutInterval * 1000))
                BStackLogger.debug(`[getOrderedTestFiles] Fetching ordered tests from result URL after waiting for ${timeoutInterval} seconds.`)
            }

            // If still not available, try timeoutUrl
            if (timeoutUrl && !testFilesJsonList) {
                BStackLogger.debug('[getOrderedTestFiles] Fetching ordered tests from timeout URL')
                const response = await RequestUtils.getTestOrchestrationOrderedTests(timeoutUrl)
                if (response && response.tests) {
                    testFilesJsonList = response.tests
                }
            }

            // Extract file paths
            if (testFilesJsonList && testFilesJsonList.length > 0) {
                for (const testData of testFilesJsonList) {
                    const filePath = testData.filePath
                    if (filePath) {
                        testFiles.push(filePath)
                    }
                }
            }

            if (!testFilesJsonList) {
                return null
            }

            BStackLogger.debug(`[getOrderedTestFiles] Ordered test files received: ${JSON.stringify(testFiles)}`)
            return testFiles
        } catch (e) {
            BStackLogger.error(`[getOrderedTestFiles] Exception in fetching ordered test files: ${e}`)
            return null
        }
    }

    /**
     * Returns the count of split tests API calls made.
     */
    getSplitTestsApiCallCount() {
        return this.splitTestsApiCallCount
    }
}

export default TestOrderingServer
