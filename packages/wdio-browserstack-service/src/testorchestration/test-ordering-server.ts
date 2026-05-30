import path from 'node:path'

import { getHostInfo, getGitMetadataForAISelection } from './helpers.js'
import type { GitAISelectionResult } from './helpers.js'
import { RequestUtils } from './request-utils.js'
import APIUtils from '../cli/apiUtils.js'
import { BStackLogger } from '../bstackLogger.js'
import type { BrowserstackConfig } from '../types.js'

type SplitTestFile = {
    filePath?: string
}

type SplitTestsResponse = {
    timeout?: number
    timeoutInterval?: number
    resultUrl?: string | null
    timeoutUrl?: string | null
    tests?: SplitTestFile[]
}

type SplitTestsRequestData = {
    timeout: number
    timeoutInterval: number
    resultUrl: string | null
    timeoutUrl: string | null
}

type OrchestrationMetadata = {
    run_smart_selection?: {
        enabled?: boolean
        source?: string | Array<unknown>
    }
    [key: string]: unknown
}

type SplitTestsPayload = {
    tests: Array<{ filePath: string }>
    orchestrationStrategy: string
    orchestrationMetadata: OrchestrationMetadata
    nodeIndex: number
    totalNodes: number
    projectName: string
    buildName: string
    buildRunIdentifier: string
    hostInfo: ReturnType<typeof getHostInfo>
    prDetails: GitAISelectionResult[]
}

function isSplitTestsResponse(value: unknown): value is SplitTestsResponse {
    return typeof value === 'object' && value !== null
}

/**
 * Handles test ordering orchestration with the BrowserStack server.
 */
export class TestOrderingServer {
    private config: BrowserstackConfig
    private ORDERING_ENDPOINT: string
    private requestData: SplitTestsRequestData | null
    private defaultTimeout: number
    private defaultTimeoutInterval: number
    private splitTestsApiCallCount: number

    /**
     * @param config Test orchestration config
     */
    constructor(config: BrowserstackConfig) {
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
    async splitTests(testFiles: string[], orchestrationStrategy: string, orchestrationMetadata: string = '{}'): Promise<void> {
        BStackLogger.debug(`[splitTests] Initiating split tests with strategy: ${orchestrationStrategy}`)
        try {
            let prDetails: GitAISelectionResult[] = []
            const parsedMetadata = JSON.parse(orchestrationMetadata)
            const source = parsedMetadata.run_smart_selection?.source
            const isGithubAppApproach = Array.isArray(source) && source.length > 0 && source.every(src => src && typeof src === 'object' && !Array.isArray(src))
            if (parsedMetadata.run_smart_selection?.enabled && !isGithubAppApproach) {
                const multiRepoSource = parsedMetadata.run_smart_selection?.source
                prDetails = getGitMetadataForAISelection(multiRepoSource)
            }
            BStackLogger.debug(`PR Details for AI Selection: ${JSON.stringify(prDetails)}`)

            const payload: SplitTestsPayload = {
                tests: testFiles.map(f => ({ filePath: f })),
                orchestrationStrategy,
                orchestrationMetadata: parsedMetadata,
                nodeIndex: parseInt(process.env.BROWSERSTACK_NODE_INDEX || '0'),
                totalNodes: parseInt(process.env.BROWSERSTACK_TOTAL_NODE_COUNT || '1'),
                projectName: this.config.testObservabilityOptions?.projectName || '',
                buildName: this.config.testObservabilityOptions?.buildName || path.basename(process.cwd()),
                buildRunIdentifier: process.env.BROWSERSTACK_BUILD_RUN_IDENTIFIER || '',
                hostInfo: getHostInfo(),
                prDetails
            }
            BStackLogger.info(`[splitTests] Split tests payload: ${JSON.stringify(payload)}`)

            const response = await RequestUtils.testOrchestrationSplitTests(this.ORDERING_ENDPOINT, payload)
            if (isSplitTestsResponse(response)) {
                this.requestData = this._processSplitTestsResponse(response)
                BStackLogger.debug(`[splitTests] Split tests response: ${JSON.stringify(this.requestData)}`)
            } else if (response) {
                BStackLogger.error('[splitTests] Received unexpected response format from split tests request.')
            } else {
                BStackLogger.error('[splitTests] Failed to get split tests response.')
            }
        } catch (error) {
            BStackLogger.error(`[splitTests] Exception in sending test files:: ${error}`)
        }
    }

    /**
     * Processes the split tests API response and extracts relevant fields.
     */
    private _processSplitTestsResponse(response: SplitTestsResponse): SplitTestsRequestData {
        const timeout = typeof response.timeout === 'number' ? response.timeout : this.defaultTimeout
        const timeoutInterval = typeof response.timeoutInterval === 'number' ? response.timeoutInterval : this.defaultTimeoutInterval

        const normalizeUrl = (url: string | null | undefined) => {
            if (!url) {
                return null
            }
            return url.includes(`${APIUtils.DATA_ENDPOINT}/`)
                ? url.split(`${APIUtils.DATA_ENDPOINT}/`)[1]
                : url
        }

        const resultUrl = normalizeUrl(response.resultUrl)
        const timeoutUrl = normalizeUrl(response.timeoutUrl)

        if (
            response.timeout === undefined ||
            response.timeoutInterval === undefined ||
            response.timeoutUrl === undefined ||
            response.resultUrl === undefined
        ) {
            BStackLogger.debug('[process_split_tests_response] Received null value(s) for some attributes in split tests API response')
        }

        return {
            timeout,
            timeoutInterval,
            resultUrl,
            timeoutUrl
        }
    }

    /**
     * Retrieves the ordered test files from the orchestration server
     */
    async getOrderedTestFiles(): Promise<string[] | null> {
        if (!this.requestData) {
            BStackLogger.error('[getOrderedTestFiles] No request data available to fetch ordered test files.')
            return null
        }

        let testFilesJsonList: SplitTestFile[] | null = null
        const testFiles: string[] = []
        const startTimeMillis = Date.now()
        const timeoutInterval = this.requestData.timeoutInterval || this.defaultTimeoutInterval
        const timeoutMillis = (this.requestData.timeout || this.defaultTimeout) * 1000
        const timeoutUrl = this.requestData.timeoutUrl
        const resultUrl = this.requestData.resultUrl

        if (resultUrl === null && timeoutUrl === null) {
            return null
        }

        try {
            // Poll resultUrl until timeout or until tests are available
            while (resultUrl && (Date.now() - startTimeMillis) < timeoutMillis) {
                const response = await RequestUtils.getTestOrchestrationOrderedTests(resultUrl)
                if (isSplitTestsResponse(response) && Array.isArray(response.tests)) {
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
                if (isSplitTestsResponse(response) && Array.isArray(response.tests)) {
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
        } catch (error) {
            BStackLogger.error(`[getOrderedTestFiles] Exception in fetching ordered test files: ${error}`)
            return null
        }
    }

    /**
     * Returns the count of split tests API calls made.
     */
    getSplitTestsApiCallCount(): number {
        return this.splitTestsApiCallCount
    }
}

export default TestOrderingServer
