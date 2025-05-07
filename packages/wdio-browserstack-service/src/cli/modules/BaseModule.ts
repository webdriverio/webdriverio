import { BStackLogger } from '../cliLogger.js'

/**
 * Base class for BrowserStack modules
 */
export class BaseModule {
    name: string
    binSessionId: string|null
    platformIndex: number
    config: Record<string, unknown>
    client: unknown
    /**
     * Create a new BaseModule
     */
    constructor() {
        this.name = 'BaseModule'
        this.binSessionId = null
        this.platformIndex = 0
        this.config = {}
        this.client = null
    }

    /**
     * Ensure that a bin session ID is available
     * @throws {Error} If binSessionId is missing
     */
    ensureBinSession() {
        if (!this.binSessionId) {
            throw new Error('Missing binSessionId')
        }
    }

    /**
     * Get the name of the module
     * @returns {string} The module name
     */
    getModuleName() {
        return this.name
    }

    /**
     * Configure the module with session information
     * @param {string} binSessionId - The bin session ID
     * @param {number} platformIndex - The platform index
     * @param {Object} client - The gRPC client service
     * @param {Object} config - Configuration options
     */
    configure(binSessionId: string, platformIndex: number, client: unknown, config = {}) {
        this.binSessionId = binSessionId
        this.platformIndex = platformIndex
        this.client = client
        this.config = config

        BStackLogger.debug(`Configured module ${this.getModuleName()} with binSessionId=${binSessionId}, platformIndex=${platformIndex}`)
    }
}
