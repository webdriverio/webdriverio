import path from 'node:path'
import fs from 'node:fs'
import { tmpdir } from 'node:os'

import type { Logger } from '@wdio/logger'
import logger from '@wdio/logger'

import { getHostInfo, getGitMetadataForAiSelection } from './helpers.js'
import { RequestUtils } from './request-utils.js'

const log = logger('wdio-browserstack-service:TestOrchestrationUtils')

const TEST_ORDERING_SUPPORTED_FRAMEWORKS = ['mocha', 'jasmine', 'cucumber']

const RUN_SMART_SELECTION = 'runSmartSelection'

const ALLOWED_ORCHESTRATION_KEYS = [
    RUN_SMART_SELECTION
]

/**
 * Class to handle test ordering functionality
 */
class TestOrdering {
    private enabled: boolean
    private name: string | null

    constructor() {
        this.enabled = false
        this.name = null
    }

    enable(name: string): void {
        this.enabled = true
        this.name = name
    }

    disable(): void {
        this.enabled = false
        this.name = null
    }

    getEnabled(): boolean {
        return this.enabled
    }

    getName(): string | null {
        return this.name
    }
}

/**
 * Utility class for test orchestration
 */
export class OrchestrationUtils {
    private static _instance: OrchestrationUtils | null = null
    private runSmartSelection: boolean
    private smartSelectionMode: string
    private testOrdering: TestOrdering
    private smartSelectionSource: string[] | Array<Record<string, any>> | null
    private logger: Logger
    private projectName?: string
    private buildName?: string
    private buildIdentifier?: string

    /**
     * @param config Configuration object
     */
    constructor(config: Record<string, any>) {
        this.logger = log
        this.runSmartSelection = false
        this.smartSelectionMode = 'relevantFirst'
        this.testOrdering = new TestOrdering()
        this.smartSelectionSource = null // Store source paths if provided

        // Check both possible configuration paths: direct or nested in services
        let testOrchOptions = config.testOrchestrationOptions || {}

        // If not found at top level, check if it's in the browserstack service config
        if (Object.keys(testOrchOptions).length === 0 && config.services && Array.isArray(config.services)) {
            // Look for browserstack service configuration
            for (const service of config.services) {
                if (Array.isArray(service) && service[0] === 'browserstack' && service[1] && service[1].testOrchestrationOptions) {
                    testOrchOptions = service[1].testOrchestrationOptions
                    this.logger.debug('[constructor] Found testOrchestrationOptions in browserstack service config')
                    break
                }
            }
        }

        // Try to get runSmartSelection options
        const runSmartSelectionOpts = testOrchOptions[RUN_SMART_SELECTION] || {}

        this._setRunSmartSelection(
            runSmartSelectionOpts.enabled || false,
            runSmartSelectionOpts.mode || 'relevantFirst',
            runSmartSelectionOpts.source || null
        )

        // Extract build details from capabilities
        this._extractBuildDetails(config)
    }

    /**
     * Extract build details from capabilities
     */
    private _extractBuildDetails(config: Record<string, any>): void {
        try {
            const capabilities = config.capabilities

            if (Array.isArray(capabilities)) {
                capabilities.forEach((capability: any) => {
                    if (!capability['bstack:options']) {
                        // Extract from legacy format
                        this.buildIdentifier = capability['browserstack.buildIdentifier']?.toString()
                        this.buildName = capability.build?.toString()
                    } else {
                        // Extract from bstack:options format
                        this.buildName = capability['bstack:options'].buildName
                        this.projectName = capability['bstack:options'].projectName
                        this.buildIdentifier = capability['bstack:options'].buildIdentifier
                    }
                })
            } else if (typeof capabilities === 'object' && capabilities) {
                // Handle multiremote capabilities
                Object.entries(capabilities).forEach(([, caps]: [string, any]) => {
                    if (caps.capabilities) {
                        if (!caps.capabilities['bstack:options']) {
                            this.buildIdentifier = caps.capabilities['browserstack.buildIdentifier']
                        } else {
                            const bstackOptions = caps.capabilities['bstack:options']
                            this.buildName = bstackOptions.buildName
                            this.projectName = bstackOptions.projectName
                            this.buildIdentifier = bstackOptions.buildIdentifier
                        }
                    }
                })
            }

            this.logger.debug(`[_extractBuildDetails] Extracted - projectName: ${this.projectName}, buildName: ${this.buildName}, buildIdentifier: ${this.buildIdentifier}`)
        } catch (e) {
            this.logger.error(`[_extractBuildDetails] ${e}`)
        }
    }

    /**
     * Get or create an instance of OrchestrationUtils
     */
    static getInstance(config?: Record<string, any>): OrchestrationUtils | null {
        if (!OrchestrationUtils._instance && config) {
            OrchestrationUtils._instance = new OrchestrationUtils(config)
        }
        return OrchestrationUtils._instance
    }

    /**
     * Get orchestration data from config
     */
    static getOrchestrationData(config: Record<string, any>): Record<string, any> {
        const orchestrationData = config.testOrchestrationOptions || {}
        const result: Record<string, any> = {}

        Object.entries(orchestrationData).forEach(([key, value]) => {
            if (ALLOWED_ORCHESTRATION_KEYS.includes(key)) {
                result[key] = value
            }
        })

        return result
    }

    /**
     * Check if the abort build file exists
     */
    static checkAbortBuildFileExists(): boolean {
        const buildUuid = process.env.BROWSERSTACK_TESTHUB_UUID
        const filePath = path.join(tmpdir(), `abort_build_${buildUuid}`)
        return fs.existsSync(filePath)
    }

    /**
     * Write failure to file
     */
    static writeFailureToFile(testName: string): void {
        const buildUuid = process.env.BROWSERSTACK_TESTHUB_UUID
        const failedTestsFile = path.join(tmpdir(), `failed_tests_${buildUuid}.txt`)

        fs.appendFileSync(failedTestsFile, `${testName}\n`)
    }

    /**
     * Get run smart selection setting
     */
    getRunSmartSelection(): boolean {
        return this.runSmartSelection
    }

    /**
     * Get smart selection mode
     */
    getSmartSelectionMode(): string {
        return this.smartSelectionMode
    }

    /**
     * Get smart selection source
     */
    getSmartSelectionSource(): string[] | Array<Record<string, any>> | null {
        return this.smartSelectionSource
    }

    /**
     * Get project name
     */
    getProjectName(): string | undefined {
        return this.projectName
    }

    /**
     * Get build name
     */
    getBuildName(): string | undefined {
        return this.buildName
    }

    /**
     * Get build identifier
     */
    getBuildIdentifier(): string | undefined {
        return this.buildIdentifier
    }

    /**
     * Set build details
     */
    setBuildDetails(projectName?: string, buildName?: string, buildIdentifier?: string): void {
        this.projectName = projectName
        this.buildName = buildName
        this.buildIdentifier = buildIdentifier
        this.logger.debug(`[setBuildDetails] Set - projectName: ${this.projectName}, buildName: ${this.buildName}, buildIdentifier: ${this.buildIdentifier}`)
    }

    /**
     * Set run smart selection
     */
    private _setRunSmartSelection(enabled: boolean, mode: string, source: string[] | string | null = null): void {
        try {
            this.runSmartSelection = Boolean(enabled)
            this.smartSelectionMode = mode

            // Log the configuration for debugging
            this.logger.debug(`Setting runSmartSelection: enabled=${this.runSmartSelection}, mode=${this.smartSelectionMode}`)

            // Normalize source to always be a list of paths
            if (source === null) {
                this.smartSelectionSource = null
            } else if (Array.isArray(source)) {
                this.smartSelectionSource = source
            } else if (typeof source === 'string' && source.endsWith('.json')) {
                this.smartSelectionSource = this._loadSourceFromFile(source) || []
            }

            this._setTestOrdering()
        } catch (e) {
            this.logger.error(`[_setRunSmartSelection] ${e}`)
        }
    }

    /**
     * Parse JSON source configuration file and format it for smart selection.
     *
     * @param filePath - Path to the JSON configuration file
     * @returns Formatted list of repository configurations
     */
    private _loadSourceFromFile(filePath: string): Array<Record<string, any>> {
        if (!fs.existsSync(filePath)) {
            this.logger.error(`Source file '${filePath}' does not exist.`)
            return []
        }

        let data: any = null
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            data = JSON.parse(fileContent)
        } catch (error: any) {
            this.logger.error(`Error parsing JSON from source file '${filePath}': ${error.message}`)
            return []
        }

        // Cache feature branch mappings from env to avoid repeated parsing
        let featureBranchEnvMap: Record<string, string> | null = null

        const loadFeatureBranchMaps = (): Record<string, string> => {
            let envMap: Record<string, string> = {}

            try {
                const envVar = process.env.BROWSERSTACK_ORCHESTRATION_SMART_SELECTION_FEATURE_BRANCHES || ''

                envMap = envVar.startsWith('{') && envVar.endsWith('}')
                    ? JSON.parse(envVar)
                    : envVar.split(',')
                        .filter(item => item.includes(':'))
                        .reduce((acc: Record<string, string>, item: string) => {
                            const [key, value] = item.split(':')
                            if (key && value) {
                                acc[key.trim()] = value.trim()
                            }
                            return acc
                        }, {})
            } catch (error: any) {
                this.logger.error(`Error parsing feature branch mappings: ${error.message}`)
            }

            this.logger.debug(`Feature branch mappings from env: ${JSON.stringify(envMap)}`)
            return envMap
        }

        if (featureBranchEnvMap === null) {
            featureBranchEnvMap = loadFeatureBranchMaps()
        }

        const getFeatureBranch = (name: string, repoInfo: Record<string, any>): string | null => {
            // 1. Check in environment variable map
            if (featureBranchEnvMap && featureBranchEnvMap[name]) {
                return featureBranchEnvMap[name]
            }
            // 2. Check in repo_info
            if (repoInfo.featureBranch) {
                return repoInfo.featureBranch
            }
            return null
        }

        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const formattedData: Array<Record<string, any>> = []
            const namePattern = /^[A-Z0-9_]+$/

            for (const [name, repoInfo] of Object.entries(data)) {
                if (typeof repoInfo !== 'object' || repoInfo === null) {
                    continue
                }

                const typedRepoInfo = repoInfo as Record<string, any>

                if (!typedRepoInfo.url) {
                    this.logger.warn(`Repository URL is missing for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                // Validate name
                if (!namePattern.test(name)) {
                    this.logger.warn(`Invalid source identifier format for '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                // Validate length
                if (name.length > 30 || name.length < 1) {
                    this.logger.warn(`Source identifier '${name}' must have a length between 1 and 30 characters.`)
                    continue
                }

                const repoInfoCopy = { ...typedRepoInfo }
                repoInfoCopy.name = name
                repoInfoCopy.featureBranch = getFeatureBranch(name, typedRepoInfo)

                if (!repoInfoCopy.featureBranch || repoInfoCopy.featureBranch === '') {
                    this.logger.warn(`Feature branch not specified for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                if (repoInfoCopy.baseBranch && repoInfoCopy.baseBranch === repoInfoCopy.featureBranch) {
                    this.logger.warn(`Feature branch and base branch cannot be the same for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                formattedData.push(repoInfoCopy)
            }

            return formattedData
        }

        return Array.isArray(data) ? data : []
    }

    /**
     * Set test ordering based on priorities
     */
    private _setTestOrdering(): void {
        if (this.runSmartSelection) { // Highest priority
            this.testOrdering.enable(RUN_SMART_SELECTION)
        } else {
            this.testOrdering.disable()
        }
    }

    /**
     * Check if test ordering is enabled
     */
    testOrderingEnabled(): boolean {
        return this.testOrdering.getEnabled()
    }

    /**
     * Get test ordering name
     */
    getTestOrderingName(): string | null {
        if (this.testOrdering.getEnabled()) {
            return this.testOrdering.getName()
        }
        return null
    }

    /**
     * Get test orchestration metadata
     */
    getTestOrchestrationMetadata(): Record<string, any> {
        const data = {
            'run_smart_selection': {
                'enabled': this.getRunSmartSelection(),
                'mode': this.getSmartSelectionMode(),
                'source': this.getSmartSelectionSource()
            }
        }
        return data
    }

    /**
     * Get build start data
     */
    getBuildStartData(): Record<string, any> {
        const testOrchestrationData: Record<string, any> = {}

        testOrchestrationData.run_smart_selection = {
            'enabled': this.getRunSmartSelection(),
            'mode': this.getSmartSelectionMode()
            // Not sending "source" to TH builds
        }

        return testOrchestrationData
    }

    /**
     * Collects build data by making a call to the collect-build-data endpoint
     */
    async collectBuildData(config: Record<string, any>): Promise<Record<string, any> | null> {
        // Return early if smart selection is not enabled or applicable
        if (!(TEST_ORDERING_SUPPORTED_FRAMEWORKS.includes(config.framework) && this.getRunSmartSelection())) {
            return null
        }

        const buildUuid = process.env.BROWSERSTACK_TESTHUB_UUID
        this.logger.debug(`[collectBuildData] Collecting build data for build UUID: ${buildUuid}`)

        try {
            const endpoint = `testorchestration/api/v1/builds/${buildUuid}/collect-build-data`

            // Extract testObservabilityOptions from the complex config structure
            let testObservabilityOptions: Record<string, any> = {}
            let testOrchestrationOptions: Record<string, any> = {}

            try {
                // Check if config has services array
                if (config.services && Array.isArray(config.services)) {
                    // Look for browserstack service configuration
                    for (const service of config.services) {
                        if (Array.isArray(service) && service[0] === 'browserstack' && service[1]) {
                            // Extract testObservabilityOptions from the browserstack service config
                            testObservabilityOptions = service[1].testObservabilityOptions || {}
                            testOrchestrationOptions = service[1].testOrchestrationOptions || {}
                            break
                        }
                    }
                }

                this.logger.debug(`[collectBuildData] Found testObservabilityOptions: ${JSON.stringify(testObservabilityOptions)}`)
            } catch (e) {
                this.logger.error(`[collectBuildData] Error extracting testObservabilityOptions: ${e}`)
            }

            const multiRepoSource = testOrchestrationOptions.runSmartSelection?.source || []
            let prDetails: any[] = []
            const isGithubAppApproach = Array.isArray(multiRepoSource) && multiRepoSource.length > 0 && multiRepoSource.every(src => src && typeof src === 'object' && !Array.isArray(src))
            if (!testOrchestrationOptions.runSmartSelection?.enabled || isGithubAppApproach) {
                this.logger.info('[collectBuildData] Smart selection is not enabled or using GitHub App approach. Skipping PR details collection.')
                prDetails = getGitMetadataForAiSelection(multiRepoSource)
            }
            this.logger.info(`PR Details for AI Selection in data collection: ${JSON.stringify(prDetails)}`)
            const payload = {
                projectName: testObservabilityOptions.projectName || '',
                buildName: testObservabilityOptions.buildName || path.basename(process.cwd()),
                buildRunIdentifier: process.env.BROWSERSTACK_BUILD_RUN_IDENTIFIER || '',
                nodeIndex: parseInt(process.env.BROWSERSTACK_NODE_INDEX || '0', 10),
                totalNodes: parseInt(process.env.BROWSERSTACK_TOTAL_NODE_COUNT || '1', 10),
                hostInfo: getHostInfo(),
                prDetails
            }

            // console.log('Build data payload:', JSON.stringify(payload, null, 2))

            // this.logger.debug(`[collectBuildData] Sending build data payload: ${JSON.stringify(payload)}`)

            const response = await RequestUtils.postCollectBuildData(endpoint, payload)

            if (response) {
                this.logger.debug(`[collectBuildData] Build data collection response: ${JSON.stringify(response)}`)
                return response
            }
            this.logger.error(`[collectBuildData] Failed to collect build data for build UUID: ${buildUuid}`)
            return null

        } catch (e) {
            this.logger.error(`[collectBuildData] Exception in collecting build data for build UUID ${buildUuid}: ${e}`)
            return null
        }
    }
}

export default OrchestrationUtils
