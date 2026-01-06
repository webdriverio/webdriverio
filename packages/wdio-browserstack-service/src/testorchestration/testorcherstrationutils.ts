import fs from 'node:fs'

import type { Options } from '@wdio/types'

import { BStackLogger } from '../bstackLogger.js'
import { isValidEnabledValue } from '../util.js'
import { SMART_SELECTION_MODE_RELEVANT_FIRST, SMART_SELECTION_MODE_RELEVANT_ONLY } from '../constants.js'

const RUN_SMART_SELECTION = 'runSmartSelection'

const ALLOWED_ORCHESTRATION_KEYS = [
    RUN_SMART_SELECTION
]

type SmartSelectionRepoInfo = {
    url?: string
    featureBranch?: string
    baseBranch?: string
    name?: string
    [key: string]: unknown
}

type SmartSelectionSource = string[] | SmartSelectionRepoInfo[] | null

type RunSmartSelectionConfig = {
    enabled?: boolean | string
    mode?: string
    source?: string | string[] | SmartSelectionRepoInfo[] | null
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
)

const asString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        return value
    }
    if (typeof value === 'number') {
        return value.toString()
    }
    return undefined
}

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
type OrchestrationConfig = Options.Testrunner | Record<string, unknown>

export class OrchestrationUtils {
    private static _instance: OrchestrationUtils | null = null
    private runSmartSelection: boolean
    private smartSelectionMode: string
    private testOrdering: TestOrdering
    private smartSelectionSource: SmartSelectionSource
    private projectName?: string
    private buildName?: string
    private buildIdentifier?: string

    /**
     * @param config Configuration object
     */
    constructor(config: OrchestrationConfig) {
        this.runSmartSelection = false
        this.smartSelectionMode = SMART_SELECTION_MODE_RELEVANT_FIRST
        this.testOrdering = new TestOrdering()
        this.smartSelectionSource = null // Store source paths if provided

        // Check both possible configuration paths: direct or nested in services
        const configRecord = isPlainObject(config) ? config : {}
        let testOrchOptions: Record<string, unknown> = isPlainObject(configRecord.testOrchestrationOptions)
            ? configRecord.testOrchestrationOptions
            : {}

        // If not found at top level, check if it's in the browserstack service config
        const services = Array.isArray(configRecord.services) ? configRecord.services : undefined
        if (Object.keys(testOrchOptions).length === 0 && Array.isArray(services)) {
            // Look for browserstack service configuration
            for (const service of services) {
                if (
                    Array.isArray(service) &&
                    service[0] === 'browserstack' &&
                    isPlainObject(service[1]) &&
                    isPlainObject(service[1].testOrchestrationOptions)
                ) {
                    testOrchOptions = service[1].testOrchestrationOptions
                    BStackLogger.debug('[constructor] Found testOrchestrationOptions in browserstack service config')
                    break
                }
            }
        }

        // Try to get runSmartSelection options
        const runSmartSelectionOpts: RunSmartSelectionConfig = isPlainObject(testOrchOptions[RUN_SMART_SELECTION])
            ? testOrchOptions[RUN_SMART_SELECTION] as RunSmartSelectionConfig
            : {}

        this._setRunSmartSelection(
            runSmartSelectionOpts.enabled ?? false,
            runSmartSelectionOpts.mode || SMART_SELECTION_MODE_RELEVANT_FIRST,
            runSmartSelectionOpts.source ?? null
        )
        // Extract build details from capabilities
        this._extractBuildDetails(config)
    }

    /**
     * Extract build details from capabilities
     */
    private _extractBuildDetails(config: OrchestrationConfig): void {
        try {
            const configRecord = isPlainObject(config) ? config : {}
            const capabilities = (configRecord as { capabilities?: unknown }).capabilities

            if (Array.isArray(capabilities)) {
                capabilities.forEach(capability => this._parseCapability(capability))
            } else if (isPlainObject(capabilities)) {
                // Handle multiremote capabilities
                Object.values(capabilities).forEach((caps) => {
                    if (isPlainObject(caps) && 'capabilities' in caps && isPlainObject(caps.capabilities)) {
                        this._parseCapability(caps.capabilities)
                    }
                })
            }

            BStackLogger.debug(`[_extractBuildDetails] Extracted - projectName: ${this.projectName}, buildName: ${this.buildName}, buildIdentifier: ${this.buildIdentifier}`)
        } catch (error) {
            BStackLogger.error(`[_extractBuildDetails] ${error}`)
        }
    }

    private _parseCapability(capability: unknown): void {
        if (!isPlainObject(capability)) {
            return
        }

        const bstackOptionsRaw = capability['bstack:options']

        if (isPlainObject(bstackOptionsRaw)) {
            const buildName = asString(bstackOptionsRaw.buildName)
            const projectName = asString(bstackOptionsRaw.projectName)
            const buildIdentifier = asString(bstackOptionsRaw.buildIdentifier)

            if (buildName) {
                this.buildName = buildName
            }
            if (projectName) {
                this.projectName = projectName
            }
            if (buildIdentifier) {
                this.buildIdentifier = buildIdentifier
            }
        } else {
            const legacyBuildIdentifier = asString(capability['browserstack.buildIdentifier'])
            const legacyBuildName = asString(capability.build)

            if (legacyBuildIdentifier) {
                this.buildIdentifier = legacyBuildIdentifier
            }
            if (legacyBuildName) {
                this.buildName = legacyBuildName
            }
        }
    }

    /**
     * Get or create an instance of OrchestrationUtils
     */
    static getInstance(config?: OrchestrationConfig): OrchestrationUtils | null {
        if (!OrchestrationUtils._instance && config) {
            OrchestrationUtils._instance = new OrchestrationUtils(config)
        }
        return OrchestrationUtils._instance
    }

    /**
     * Get orchestration data from config
     */
    static getOrchestrationData(config: OrchestrationConfig): Record<string, unknown> {
        const configRecord = isPlainObject(config) ? config : {}
        const orchestrationData = isPlainObject(configRecord.testOrchestrationOptions)
            ? configRecord.testOrchestrationOptions
            : {}
        const result: Record<string, unknown> = {}

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
    getSmartSelectionSource(): SmartSelectionSource {
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
    private _setRunSmartSelection(enabled: boolean | string, mode: string, source: string[] | SmartSelectionRepoInfo[] | string | null = null): void {
        try {
            // Properly validate enabled value - only accept true boolean or string "true"
            this.runSmartSelection = isValidEnabledValue(enabled)
            this.smartSelectionMode = mode
            this.smartSelectionSource = []

            // Log the configuration for debugging
            BStackLogger.debug(`Setting runSmartSelection: enabled=${this.runSmartSelection}, mode=${this.smartSelectionMode}`)
            if (this.runSmartSelection) {
                // Mode validation - only when smart selection is enabled
                const validModes = [SMART_SELECTION_MODE_RELEVANT_FIRST, SMART_SELECTION_MODE_RELEVANT_ONLY]
                if (!validModes.includes(this.smartSelectionMode)) {
                    BStackLogger.warn(`Invalid smart selection mode '${this.smartSelectionMode}' provided. Defaulting to '${SMART_SELECTION_MODE_RELEVANT_FIRST}'.`)
                    this.smartSelectionMode = SMART_SELECTION_MODE_RELEVANT_FIRST
                }
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
    private _loadSourceFromFile(filePath: string): SmartSelectionRepoInfo[] {
        if (!fs.existsSync(filePath)) {
            BStackLogger.error(`Source file '${filePath}' does not exist.`)
            return []
        }

        let data: unknown = null
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            data = JSON.parse(fileContent)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            BStackLogger.error(`Error parsing JSON from source file '${filePath}': ${message}`)
            return []
        }

        // Cache feature branch mappings from env to avoid repeated parsing
        let featureBranchEnvMap: Record<string, string> | null = null

        const loadFeatureBranchMaps = (): Record<string, string> => {
            const envVar = process.env.BROWSERSTACK_ORCHESTRATION_SMART_SELECTION_FEATURE_BRANCHES || ''
            let envMap: Record<string, string> = {}

            try {
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
            } catch (error) {
                BStackLogger.error(`Error parsing feature branch mappings: ${error}`)
            }

            BStackLogger.debug(`Feature branch mappings from env: ${JSON.stringify(envMap)}`)
            return envMap
        }

        featureBranchEnvMap = loadFeatureBranchMaps()

        const getFeatureBranch = (name: string, repoInfo: SmartSelectionRepoInfo): string | null => {
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
            const formattedData: SmartSelectionRepoInfo[] = []
            const namePattern = /^[A-Z0-9_]+$/

            for (const [name, repoInfo] of Object.entries(data)) {
                if (!isPlainObject(repoInfo)) {
                    continue
                }

                const typedRepoInfo = repoInfo as SmartSelectionRepoInfo

                // Validate that url is a string and is present
                if (!typedRepoInfo.url || typeof typedRepoInfo.url !== 'string') {
                    BStackLogger.warn(`Repository URL is missing or invalid for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                // Validate that baseBranch, if provided, is a string
                if (typedRepoInfo.baseBranch !== undefined && typeof typedRepoInfo.baseBranch !== 'string') {
                    BStackLogger.warn(`Base branch must be a string for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                // Validate that featureBranch, if provided, is a string
                if (typedRepoInfo.featureBranch !== undefined && typeof typedRepoInfo.featureBranch !== 'string') {
                    BStackLogger.warn(`Feature branch must be a string for source '${name}': ${JSON.stringify(repoInfo)}`)
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

                // Only consider url, baseBranch, and featureBranch - ignore all other keys
                const featureBranch = getFeatureBranch(name, typedRepoInfo)

                const filteredRepoInfo: SmartSelectionRepoInfo = {
                    name,
                    url: typedRepoInfo.url,
                    featureBranch: featureBranch ?? undefined
                }

                // Only add baseBranch if it's provided
                if (typedRepoInfo.baseBranch) {
                    filteredRepoInfo.baseBranch = typedRepoInfo.baseBranch
                }

                if (!filteredRepoInfo.featureBranch || filteredRepoInfo.featureBranch === '') {
                    BStackLogger.warn(`Feature branch not specified for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                if (filteredRepoInfo.baseBranch && filteredRepoInfo.baseBranch === filteredRepoInfo.featureBranch) {
                    BStackLogger.warn(`Feature branch and base branch cannot be the same for source '${name}': ${JSON.stringify(repoInfo)}`)
                    continue
                }

                formattedData.push(filteredRepoInfo)
            }

            return formattedData
        }

        if (Array.isArray(data)) {
            return data.filter(isPlainObject) as SmartSelectionRepoInfo[]
        }

        return []
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
    getTestOrchestrationMetadata(): Record<string, unknown> {
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
    getBuildStartData(): Record<string, unknown> {
        return {
            run_smart_selection: {
                enabled: this.getRunSmartSelection(),
                mode: this.getSmartSelectionMode()
                // Not sending "source" to TH builds
            }
        }
    }
}

export default OrchestrationUtils
