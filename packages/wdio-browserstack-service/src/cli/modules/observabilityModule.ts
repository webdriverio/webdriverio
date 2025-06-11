import BaseModule from './BaseModule.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import { HookState } from '../states/hookState.js'
import PerformanceTester from '../../instrumentation/performance/performance-tester.js'
import { O11Y_EVENTS } from '../../instrumentation/performance/constants.js'
import { BStackLogger } from '../cliLogger.js'
import { performO11ySync } from 'src/util.js'

/**
 * Observability Module for BrowserStack
 */
export default class ObservabilityModule extends BaseModule {
    logger = BStackLogger
    observabilityConfig: unknown
    name: string
    static MODULE_NAME = 'ObservabilityModule'

    /**
     * Create a new ObservabilityModule
     */
    constructor(observabilityConfig: unknown) {
        super()
        this.name = 'ObservabilityModule'
        this.observabilityConfig = observabilityConfig

        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.POST, this.onBeforeTest.bind(this))
    }

    /**
     * Get the module name
     * @returns {string} The module name
     */
    getModuleName() {
        return ObservabilityModule.MODULE_NAME
    }

    async onBeforeTest(args: Record<string, WebdriverIO.Browser>) {
        if (args.browser) {
            const browser = args.browser
            PerformanceTester.start(O11Y_EVENTS.SYNC)
            performO11ySync(browser)
            PerformanceTester.end(O11Y_EVENTS.SYNC)
            this.logger.info('onBeforeTest: Observability sync done')
        } else {
            this.logger.error('onBeforeTest: page is not defined')
        }
    }

}
