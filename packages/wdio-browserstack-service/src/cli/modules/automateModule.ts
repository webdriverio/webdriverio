import BaseModule from './baseModule.js'
import { BStackLogger } from '../cliLogger.js'
import TestFramework from '../frameworks/testFramework.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import { HookState } from '../states/hookState.js'
import got from 'got'
import type { Frameworks, Options } from '@wdio/types'
import AutomationFramework from '../frameworks/automationFramework.js'
import { AutomationFrameworkConstants } from '../frameworks/constants/automationFrameworkConstants.js'
import { isBrowserstackSession } from '../../util.js'
import type TestFrameworkInstance from '../instances/testFrameworkInstance.js'
import { TestFrameworkConstants } from '../frameworks/constants/testFrameworkConstants.js'
import PerformanceTester from '../../instrumentation/performance/performance-tester.js'
import * as PERFORMANCE_SDK_EVENTS from '../../instrumentation/performance/constants.js'
import APIUtils from '../apiUtils.js'

export default class AutomateModule extends BaseModule {

    logger = BStackLogger
    browserStackConfig: Options.Testrunner

    static readonly MODULE_NAME = 'AutomateModule'
    /**
     * Create a new AutomateModule
     */
    constructor(browserStackConfig: Options.Testrunner) {
        super()
        this.browserStackConfig = browserStackConfig
        this.logger.info('AutomateModule: Initializing Automate Module')
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.PRE, this.onBeforeTest.bind(this))
        TestFramework.registerObserver(TestFrameworkState.TEST, HookState.POST, this.onAfterTest.bind(this))
    }

    getModuleName(): string {
        return AutomateModule.MODULE_NAME
    }

    async onBeforeTest(args: Record<string, unknown>) {
        this.logger.info('onbeforeTest: inside automate module before test hook!')
        const instace = args.instance as TestFrameworkInstance
        const autoInstance = AutomationFramework.getTrackedInstance()
        const sessionId = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)
        const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser
        const test = args.test as Frameworks.Test
        const testTitle = test.title as string
        const suiteTitle = args.suiteTitle as string
        const userName = this.config.userName as string
        const accessKey = this.config.accessKey as string
        const testContextOptions = this.config.testContextOptions as TestContextOptions

        if (testContextOptions.skipSessionName || !isBrowserstackSession(browser)) {
            this.logger.info('Skipping session name update as per configuration')
            return
        }

        let name = suiteTitle
        if (testContextOptions.sessionNameFormat) {
            const caps = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_CAPABILITIES)
            name = testContextOptions.sessionNameFormat(
                this.browserStackConfig,
                caps,
                suiteTitle,
                testTitle
            )
        } else if (test && !test.fullName) {
            // Mocha
            const pre = testContextOptions.sessionNamePrependTopLevelSuiteTitle ? `${suiteTitle} - ` : ''
            const post = !testContextOptions.sessionNameOmitTestTitle ? ` - ${testTitle}` : ''
            name = `${pre}${test.parent}${post}`
        }

        TestFramework.setState(instace, TestFrameworkConstants.KEY_AUTOMATE_SESSION_NAME, name)
        await this.markSessionName( sessionId, name,
            { user: userName, key: accessKey }
        )
    }

    async onAfterTest(args: Record<string, unknown>) {
        this.logger.debug('onAfterTest: inside automate module after test hook!')
        const instace = args.instance as TestFrameworkInstance
        const { error, passed } = args.result as { error: Error | null, passed: boolean }
        const _failReasons: string[] = []

        if (!passed) {
            _failReasons.push((error && error.message) || 'Unknown Error')
        }

        const status = passed ? 'passed' : 'failed'
        const reason = _failReasons.length > 0 ? _failReasons.join('\n') : undefined

        const autoInstance = AutomationFramework.getTrackedInstance()
        const sessionId = AutomationFramework.getState(autoInstance, AutomationFrameworkConstants.KEY_FRAMEWORK_SESSION_ID)
        const browser = AutomationFramework.getDriver(autoInstance) as WebdriverIO.Browser
        const userName = this.config.userName as string
        const accessKey = this.config.accessKey as string
        const testContextOptions = this.config.testContextOptions as TestContextOptions

        if (testContextOptions.skipSessionStatus || !isBrowserstackSession(browser)) {
            this.logger.info('Skipping session status update as per configuration')
            return
        }

        TestFramework.setState(instace, TestFrameworkConstants.KEY_AUTOMATE_SESSION_STATUS, status)
        TestFramework.setState(instace, TestFrameworkConstants.KEY_AUTOMATE_SESSION_REASON, reason)
        await this.markSessionStatus( sessionId, status, reason,
            { user: userName, key: accessKey }
        )
    }

    async markSessionName(sessionId: string, sessionName: string, config: { user: string; key: string;}): Promise<void> {
        return await PerformanceTester.measureWrapper(
            PERFORMANCE_SDK_EVENTS.AUTOMATE_EVENTS.SESSION_NAME,
            async (sessionId: string, sessionName: string, config: { user: string; key: string;}) => {
                try {
                    const auth = Buffer.from(`${config.user}:${config.key}`).toString('base64')
                    const isAppAutomate = this.config.app
                    if (isAppAutomate) {
                        this.logger.info('Marking session name for App Automate')
                    } else {
                        this.logger.info('Marking session name for Automate')
                    }

                    const sessionStatusApiUrl = isAppAutomate
                        ? `${APIUtils.BROWSERSTACK_AA_API_URL}/app-automate/sessions/${sessionId}.json`
                        : `${APIUtils.BROWSERSTACK_AUTOMATE_API_URL}/automate/sessions/${sessionId}.json`

                    const requestBody = {
                        name: sessionName
                    }

                    const options: any = {
                        method: 'PUT',
                        url: sessionStatusApiUrl,
                        headers: {
                            Authorization: `Basic ${auth}`,
                            'Content-Type': 'application/json'
                        },
                        json: requestBody,
                        responseType: 'json'
                    }

                    if (this.config.proxy) {
                        options.agent = {
                            https: new (require('https-proxy-agent'))(this.config.proxy)
                        }
                    }

                    const response = await got(options)
                    this.logger.debug('Session name updated:', response.body)
                    this.logger.debug(`Done for sessionId ${sessionId}`)
                } catch (err) {
                    this.logger.error(`Failed to update session name on BrowserStack: ${err}`)
                }
            }
        )(sessionId, sessionName, config)
    }

    async markSessionStatus(sessionId: string, sessionStatus: 'passed' | 'failed', sessionErrorMessage: string | undefined, config: { user: string; key: string; }): Promise<void> {
        return await PerformanceTester.measureWrapper(
            PERFORMANCE_SDK_EVENTS.AUTOMATE_EVENTS.SESSION_STATUS,
            async (sessionId: string, sessionStatus: 'passed' | 'failed', sessionErrorMessage: string | undefined, config: { user: string; key: string; }) => {
                try {
                    const auth = Buffer.from(`${config.user}:${config.key}`).toString('base64')
                    const isAppAutomate = this.config.app
                    if (isAppAutomate) {
                        this.logger.info('Marking session status for App Automate')
                    } else {
                        this.logger.info('Marking session status for Automate')
                    }

                    const sessionStatusApiUrl = isAppAutomate
                        ? `${APIUtils.BROWSERSTACK_AA_API_URL}/app-automate/sessions/${sessionId}.json`
                        : `${APIUtils.BROWSERSTACK_AUTOMATE_API_URL}/automate/sessions/${sessionId}.json`

                    const body = {
                        status: sessionStatus,
                        ...(sessionErrorMessage ? { reason: sessionErrorMessage } : {})
                    }

                    const options: any = {
                        method: 'PUT',
                        url: sessionStatusApiUrl,
                        headers: {
                            Authorization: `Basic ${auth}`,
                            'Content-Type': 'application/json'
                        },
                        json: body,
                        responseType: 'json'
                    }

                    if (this.config.proxy) {
                        options.agent = {
                            https: new (require('https-proxy-agent'))(this.config.proxy)
                        }
                    }

                    const response = await got(options)
                    this.logger.debug('Session update response:', response.body)
                } catch (err) {
                    this.logger.error(`Failed to update session status on BrowserStack: ${err}`)
                }
            }
        )(sessionId, sessionStatus, sessionErrorMessage, config)
    }

}
