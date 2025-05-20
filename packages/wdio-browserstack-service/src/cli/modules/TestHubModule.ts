import BaseModule from './BaseModule.js'
import { BStackLogger } from '../cliLogger.js'

/**
 * TestHub Module for BrowserStack
 */
export default class TestHubModule extends BaseModule {

    logger = BStackLogger
    testhubConfig: unknown
    name: string
    static MODULE_NAME = 'TestHubModule'
    static KEY_TEST_DEFERRED = 'test_deferred'

    /**
     * Create a new TestHubModule
     */
    constructor(testhubConfig: unknown) {
        super()
        this.name = 'TestHubModule'
        this.testhubConfig = testhubConfig
    }

    /**
     * Get the module name
     * @returns {string} The module name
     */
    getModuleName() {
        return TestHubModule.MODULE_NAME
    }
}
