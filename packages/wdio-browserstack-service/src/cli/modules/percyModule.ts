import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { HookState } from '../states/hookState.js'
import type { Frameworks } from '@wdio/types'
import PercyCaptureMap from '../../Percy/PercyCaptureMap.js'
import _PercyHandler from '../../Percy/Percy-Handler.js'
import type AutomationFrameworkInstance from '../instances/automationFrameworkInstance.js'

import { AutomationFrameworkState } from '../states/automationFrameworkState.js'

export default class PercyModule extends BaseModule {

    logger = BStackLogger
    private percyHandler!: _PercyHandler
    private browser?: WebdriverIO.Browser
    static readonly MODULE_NAME = 'PercyModule'
    /**
     * Create a new PercyModule
     */
    constructor() {
        super()
        this.logger.info('PercyModule: Initializing Percy Module')
        // AutomationFramework.registerObserver(AutomationFrameworkState.EXECUTE, HookState.PRE, this.onBeforeExecute.bind(this))
        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.PRE, this.onBefore.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.PRE, this.onBeforeTest.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))
    }

    getModuleName(): string {
        return PercyModule.MODULE_NAME
    }

    async onBefore(args: Record<string, unknown>) {
        this.logger.info('onPreExecute: inside onBefore percy module!!!')

    }

    async onBeforeTest(args: Record<string, unknown>) {
        this.logger.info('onPreExecute: inside percy module!!!')
        const autoInstance: AutomationFrameworkInstance = AutomationFramework.getTrackedInstance()
        if (!autoInstance) {
            this.logger.debug('No tracked instances found!')
            return
        }
        const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser
        this.logger.debug(`Browser instance: ${JSON.stringify(browser)}`)
    }

    async onAfterTest(args: Record<string, unknown>) {
        this.logger.info('onPostExecute: inside percy module!!!')
        try {
            const sessionName = "hello percy"
            if(sessionName == null){
                this.logger.debug(`Percy post execute failed - sessionName is null`);
                return;
            }
            this.logger.debug(`config data: ${JSON.stringify(this.config)}`);
            this.logger.debug(`percy capture mode: ${this.config.percyCaptureMode}, sessionName: ${sessionName}`);
            if(this.config.percyCaptureMode === 'testcase') {
                this.percyHandler.percyAutoCaptureForCli('testcase', sessionName);
            }
            // this.percyHandler.teardown()
        } catch (error) {
            this.logger.error(`Percy post execute failed: ${error}`);
        }
    }

}