import fs from 'node:fs'

import { BStackLogger } from '../bstackLogger.js'

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
    private projectName?: string
    private buildName?: string
    private buildIdentifier?: string

    /**
     * @param config Configuration object
     */
    constructor(config: Record<string, any>) {
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
                    BStackLogger.debug('[constructor] Found testOrchestrationOptions in browserstack service config')
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

            BStackLogger.debug(`[_extractBuildDetails] Extracted - projectName: ${this.projectName}, buildName: ${this.buildName}, buildIdentifier: ${this.buildIdentifier}`)
        } catch (e) {
            BStackLogger.error(`[_extractBuildDetails] ${e}`)
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
        BStackLogger.debug(`[setBuildDetails] Set - projectName: ${this.projectName}, buildName: ${this.buildName}, buildIdentifier: ${this.buildIdentifier}`)
    }

    /**
     * Set run smart selection
     */
    private _setRunSmartSelection(enabled: boolean, mode: string, source: string[] | string | null = null): void {
        try {
            this.runSmartSelection = Boolean(enabled)

            // Mode validation
            const validModes = ['relevantFirst', 'relevantOnly']
            if (!validModes.includes(mode)) {
                BStackLogger.warn(`Invalid smart selection mode '${mode}' provided. Defaulting to 'relevantFirst'.`)
                mode = 'relevantFirst'
            }
            this.smartSelectionMode = mode
            this.smartSelectionSource = []

            // Log the configuration for debugging
            BStackLogger.debug(`Setting runSmartSelection: enabled=${this.runSmartSelection}, mode=${this.smartSelectionMode}`)
            if (this.runSmartSelection) {
                if (source === null) {
                    this.smartSelectionSource = null
                    BStackLogger.debug('No source provided for smart selection; defaulting to null.')
                } else if (Array.isArray(source)) {
                    this.smartSelectionSource = source
                    BStackLogger.debug(`Smart selection source set to array: ${JSON.stringify(source)}`)
                } else if (typeof source === 'string' && source.endsWith('.json')) {
                    this.smartSelectionSource = this._loadSourceFromFile(source) || []
                    BStackLogger.debug(`Smart selection source loaded from file: ${source}`)
                }
                this._setTestOrdering()
            }
        } catch (e) {
            BStackLogger.error(`[_setRunSmartSelection] ${e}`)
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
            BStackLogger.error(`Source file '${filePath}' does not exist.`)
            return []
        }

        let data: any = null
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            data = JSON.parse(fileContent)
        } catch (error: any) {
            BStackLogger.error(`Error parsing JSON from source file '${filePath}': ${error.message}`)
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
                BStackLogger.error(`Error parsing feature branch mappings: ${error.message}`)
            }

            BStackLogger.debug(`Feature branch mappings from env: ${JSON.stringify(envMap)}`)
            return envMap
        }

        featureBranchEnvMap = loadFeatureBranchMaps()

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
                    BStackLogger.warn(`Repository URL is missing for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                // Validate name
                if (!namePattern.test(name)) {
                    BStackLogger.warn(`Invalid source identifier format for '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                // Validate length
                if (name.length > 30 || name.length < 1) {
                    BStackLogger.warn(`Source identifier '${name}' must have a length between 1 and 30 characters.`)
                    continue
                }

                const repoInfoCopy = { ...typedRepoInfo }
                repoInfoCopy.name = name
                repoInfoCopy.featureBranch = getFeatureBranch(name, typedRepoInfo)

                if (!repoInfoCopy.featureBranch || repoInfoCopy.featureBranch === '') {
                    BStackLogger.warn(`Feature branch not specified for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                if (repoInfoCopy.baseBranch && repoInfoCopy.baseBranch === repoInfoCopy.featureBranch) {
                    BStackLogger.warn(`Feature branch and base branch cannot be the same for source '${name}': ${JSON.stringify(repoInfo)}`)
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
}

export default OrchestrationUtils
