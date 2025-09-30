import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import AutomationFramework from '../frameworks/automationFramework.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { HookState } from '../states/hookState.js'
import { AutomationFrameworkState } from '../states/automationFrameworkState.js'
import PercyHandler from '../../Percy/Percy-Handler.js'
import type { Capabilities } from '@wdio/types'
import { TestFrameworkConstants } from '../frameworks/constants/testFrameworkConstants.js'
import type TestFrameworkInstance from '../instances/testFrameworkInstance.js'

export default class PercyModule extends BaseModule {

    logger = BStackLogger
    private browser?: WebdriverIO.Browser | undefined
    static readonly MODULE_NAME = 'PercyModule'
    private percyHandler: PercyHandler | undefined
    private percyConfig: unknown
    private isAppAutomate: boolean
    /**
     * Create a new PercyModule
     */
    constructor(percyConfig: unknown) {
        super()
        this.percyConfig = percyConfig
        this.isAppAutomate = false
        this.logger.info('PercyModule: Initializing Percy Module')
        AutomationFramework.registerObserver(AutomationFrameworkState.CREATE, HookState.POST, this.onAfterCreate.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.PRE, this.onBeforeTest.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))
    }

    getModuleName(): string {
        return PercyModule.MODULE_NAME
    }

    async onAfterCreate(args: Record<string, unknown>) {
        this.browser = args.browser as WebdriverIO.Browser

        if (!this.browser) {
            this.logger.error('PercyModule: Browser instance is not defined in onAfterCreate')
            return
        }
        if (!this.percyConfig || !(this.percyConfig as Record<string, unknown>).percyCaptureMode) {
            this.logger.warn('PercyModule: Percy capture mode is not defined in the configuration, skipping Percy initialization')
            return
        }
        this.isAppAutomate = this.isAppAutomate || 'app' in this.config
        this.percyHandler = new PercyHandler(
            (this.percyConfig as Record<string, unknown>).percyCaptureMode as string,
            this.browser,
            {} as Capabilities.ResolvedTestrunnerCapabilities,
            this.isAppAutomate,
            ''
        )

        await this.percyHandler.before()

        const sessionId = this.browser.sessionId
        this.browser.on('command', async (command) => {
            await this.percyHandler?.browserBeforeCommand(
                Object.assign(command, { sessionId })
            )
        })
        this.browser.on('result', (result) => {
            this.percyHandler?.browserAfterCommand(
                Object.assign(result, { sessionId })
            )
        })
    }

    async onBeforeTest(args: Record<string, unknown>) {
        const instace = args.instance as TestFrameworkInstance
        const sessionName = TestFramework.getState(instace, TestFrameworkConstants.KEY_AUTOMATE_SESSION_NAME)
        if (!this.percyHandler) {
            this.logger.warn('PercyModule: Percy handler is not initialized, skipping pre execute actions')
            return
        }
        this.percyHandler._setSessionName(sessionName as string)
    }

    async onAfterTest() {
        try {
            if (!this.percyHandler) {
                this.logger.warn('PercyModule: Percy handler is not initialized, skipping post execute actions')
                return
            }
            if ((this.percyConfig as Record<string, unknown>).percyCaptureMode === 'testcase') {
                await this.percyHandler.percyAutoCapture('testcase', null)
            }
            await this.percyHandler.teardown()
        } catch (error) {
            this.logger.error(`Percy post execute failed: ${error}`)
        }
    }
}
