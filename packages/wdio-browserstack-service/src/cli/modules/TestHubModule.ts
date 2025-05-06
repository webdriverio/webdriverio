import { BaseModule } from './BaseModule.js';
import { BStackLogger } from '../cliLogger.js';

/**
 * TestHub Module for BrowserStack
 */
export class TestHubModule extends BaseModule {

    logger = BStackLogger;
    testhubConfig: any;
    static MODULE_NAME = "TestHubModule";
    static KEY_TEST_DEFERRED = "test_deferred";

    /**
     * Create a new TestHubModule
     */
    constructor(testhubConfig: any) {
        super();
        this.name = 'TestHubModule';
        this.testhubConfig = testhubConfig;

        // AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.PRE, this.onBeforePageCreate.bind(this));
    }

    /**
     * Get the module name
     * @returns {string} The module name
     */
    getModuleName() {
        return TestHubModule.MODULE_NAME;
    }

    onBeforePageCreate() {
    }
}
