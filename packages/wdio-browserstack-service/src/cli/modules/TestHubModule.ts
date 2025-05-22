import BaseModule from './BaseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { HookState } from '../states/hookState.js'

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

        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))
    }

    /**
     * Get the module name
     * @returns {string} The module name
     */
    getModuleName() {
        return TestHubModule.MODULE_NAME
    }

    onAfterTest() {
        this.logger.debug('onAfterTest: Called after test hook from cli configured module!!!')
    }
}
