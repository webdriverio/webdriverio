import path from 'node:path'
import fs from 'node:fs'
import url from 'node:url'
import aiSDK from '@browserstack/ai-sdk-node'
import { BStackLogger } from './bstackLogger.js'
import { TCG_URL, TCG_INFO, SUPPORTED_BROWSERS_FOR_AI, BSTACK_SERVICE_VERSION, BSTACK_TCG_AUTH_RESULT } from './constants.js'
import { handleHealingInstrumentation } from './instrumentation/funnelInstrumentation.js'

import type { Capabilities } from '@wdio/types'
import type BrowserStackConfig from './config.js'
import type { Options } from '@wdio/types'
import type { BrowserstackHealing } from '@browserstack/ai-sdk-node'
import { getBrowserStackUserAndKey, isBrowserstackInfra } from './util.js'
import type { BrowserstackOptions } from './types.js'

class AiHandler {
    authResult: BrowserstackHealing.InitSuccessResponse | BrowserstackHealing.InitErrorResponse
    wdioBstackVersion: string
    constructor() {
        this.authResult = JSON.parse(process.env[BSTACK_TCG_AUTH_RESULT] || '{}')
        this.wdioBstackVersion = BSTACK_SERVICE_VERSION
    }

    async authenticateUser(user: string, key: string) {
        return await aiSDK.BrowserstackHealing.init(key, user, TCG_URL, this.wdioBstackVersion)
    }

    updateCaps(
        authResult: BrowserstackHealing.InitSuccessResponse | BrowserstackHealing.InitErrorResponse,
        options: BrowserstackOptions,
        caps: Array<Capabilities.RemoteCapability> | Capabilities.RemoteCapability
    ) {
        const installExtCondition = authResult.isAuthenticated === true && (authResult.defaultLogDataEnabled === true || options.selfHeal === true)
        if (installExtCondition){
            if (Array.isArray(caps)) {
                const newCaps= aiSDK.BrowserstackHealing.initializeCapabilities(caps[0])
                caps[0] = newCaps
            } else if (typeof caps === 'object') {
                caps = aiSDK.BrowserstackHealing.initializeCapabilities(caps)
            }
        } else if (options.selfHeal === true) {
            const healingWarnMessage = (authResult as aiSDK.BrowserstackHealing.InitErrorResponse).message
            BStackLogger.warn(`Healing Auth failed. Disabling healing for this session. Reason: ${healingWarnMessage}`)
        }

        return caps
    }

    async setToken(sessionId: string, sessionToken: string){
        await aiSDK.BrowserstackHealing.setToken(sessionId, sessionToken, TCG_URL)
    }

    async installFirefoxExtension(browser: WebdriverIO.Browser){
        const __dirname =  url.fileURLToPath(new URL('.', import.meta.url))
        const extensionPath = path.resolve(__dirname, aiSDK.BrowserstackHealing.getFirefoxAddonPath())
        const extFile = fs.readFileSync(extensionPath)
        await browser.installAddOn(extFile.toString('base64'), true)
    }

    async handleHealing(orginalFunc: (arg0: string, arg1: string) => any, using: string, value: string, browser: WebdriverIO.Browser, options: BrowserstackOptions){
        const sessionId = browser.sessionId

        // a utility function to escape single and double quotes
        const escapeString = (str: string) => str.replace(/'/g, "\\'").replace(/"/g, '\\"')

        const tcgDetails = escapeString(JSON.stringify({
            region: TCG_INFO.tcgRegion,
            tcgUrls: {
                [TCG_INFO.tcgRegion]: {
                    endpoint: TCG_INFO.tcgUrl.split('://')[1]
                }
            }
        }))

        const locatorType = escapeString(using)
        const locatorValue = escapeString(value)

        this.authResult = this.authResult as BrowserstackHealing.InitSuccessResponse

        try {
            const result = await orginalFunc(using, value)
            if (!result.error) {
                const script = await aiSDK.BrowserstackHealing.logData(locatorType, locatorValue, undefined, undefined, this.authResult.groupId, sessionId, undefined, tcgDetails)
                if (script) {
                    await browser.execute(script)
                }
                return result
            }
            if (options.selfHeal === true && this.authResult.isHealingEnabled) {
                BStackLogger.info('findElement failed, trying to heal')
                const script = await aiSDK.BrowserstackHealing.healFailure(locatorType, locatorValue, undefined, undefined, this.authResult.userId, this.authResult.groupId, sessionId, undefined, undefined, this.authResult.isGroupAIEnabled, tcgDetails)
                if (script) {
                    await browser.execute(script)
                    const tcgData = await aiSDK.BrowserstackHealing.pollResult(TCG_URL, sessionId, this.authResult.sessionToken)
                    if (tcgData && tcgData.selector && tcgData.value){
                        const healedResult = await orginalFunc(tcgData.selector, tcgData.value)
                        BStackLogger.info('Healing worked, element found: ' + tcgData.selector + ': ' + tcgData.value)
                        return healedResult.error ? result : healedResult
                    }
                }
            }
        } catch (err) {
            if (options.selfHeal === true) {
                BStackLogger.warn('Something went wrong while healing. Disabling healing for this command')
            } else {
                BStackLogger.warn('Error in findElement: ' + err + 'using: ' + using + 'value: ' + value)
            }
        }
        return await orginalFunc(using, value)
    }

    addMultiRemoteCaps (
        authResult: BrowserstackHealing.InitSuccessResponse | BrowserstackHealing.InitErrorResponse,
        config: Options.Testrunner,
        browserStackConfig: BrowserStackConfig,
        options: BrowserstackOptions,
        caps: any,
        browser: string
    ) {
        if ( caps[browser].capabilities &&
            !(isBrowserstackInfra(caps[browser])) &&
            SUPPORTED_BROWSERS_FOR_AI.includes(caps[browser]?.capabilities?.browserName?.toLowerCase())
        ) {
            const innerConfig = getBrowserStackUserAndKey(config, options)
            if (innerConfig?.user && innerConfig.key) {
                handleHealingInstrumentation(authResult, browserStackConfig, options.selfHeal)
                caps[browser].capabilities = this.updateCaps(authResult, options, caps[browser].capabilities)
            }
        }
    }

    handleMultiRemoteSetup(
        authResult: BrowserstackHealing.InitSuccessResponse | BrowserstackHealing.InitErrorResponse,
        config: Options.Testrunner,
        browserStackConfig: BrowserStackConfig,
        options: BrowserstackOptions,
        caps: any,
    ) {
        const browserNames = Object.keys(caps)
        for (let i = 0; i < browserNames.length; i++) {
            const browser = browserNames[i]
            this.addMultiRemoteCaps(authResult, config, browserStackConfig, options, caps, browser)
        }
    }

    async setup(
        config: Options.Testrunner,
        browserStackConfig: BrowserStackConfig,
        options: BrowserstackOptions,
        caps: any,
        isMultiremote: boolean
    ) {
        try {
            const innerConfig = getBrowserStackUserAndKey(config, options)
            if (innerConfig?.user && innerConfig.key) {
                const authResult = await this.authenticateUser(innerConfig.user, innerConfig.key)
                process.env[BSTACK_TCG_AUTH_RESULT] = JSON.stringify(authResult)
                if (!isMultiremote && SUPPORTED_BROWSERS_FOR_AI.includes(caps?.browserName?.toLowerCase())) {

                    handleHealingInstrumentation(authResult, browserStackConfig, options.selfHeal)
                    this.updateCaps(authResult, options, caps)

                } else if (isMultiremote) {
                    this.handleMultiRemoteSetup(authResult, config, browserStackConfig, options, caps)
                }
            }

        } catch (err) {
            if (options.selfHeal === true) {
                BStackLogger.warn(`Error while initiliazing Browserstack healing Extension ${err}`)
            }
        }

        return caps
    }

    async handleSelfHeal(options: BrowserstackOptions, browser: WebdriverIO.Browser) {

        if (SUPPORTED_BROWSERS_FOR_AI.includes((browser.capabilities as Capabilities.BrowserStackCapabilities)?.browserName?.toLowerCase() as string)) {
            const authInfo = this.authResult as BrowserstackHealing.InitSuccessResponse

            if (Object.keys(authInfo).length === 0 && options.selfHeal === true) {
                BStackLogger.debug('TCG Auth result is empty')
                return
            }

            const { isAuthenticated, sessionToken, defaultLogDataEnabled } = authInfo

            if (isAuthenticated && (defaultLogDataEnabled === true || options.selfHeal === true)) {
                await this.setToken(browser.sessionId, sessionToken)

                if ((browser.capabilities as Capabilities.BrowserStackCapabilities).browserName === 'firefox') {
                    await this.installFirefoxExtension(browser)
                }

                browser.overwriteCommand('findElement' as any, async (orginalFunc: (arg0: string, arg1: string) => any, using: string, value: string) => {
                    return await this.handleHealing(orginalFunc, using, value, browser, options)
                })
            }
        }
    }

    async selfHeal(options: BrowserstackOptions, caps: Capabilities.RemoteCapability, browser: WebdriverIO.Browser) {
        try {

            const multiRemoteBrowsers = Object.keys(caps).filter(e => Object.keys(browser).includes(e))
            if (multiRemoteBrowsers.length > 0) {
                for (let i = 0; i < multiRemoteBrowsers.length; i++) {
                    const remoteBrowser = (browser as any)[multiRemoteBrowsers[i]]
                    await this.handleSelfHeal(options, remoteBrowser)
                }
            } else {
                await this.handleSelfHeal(options, browser)
            }

        } catch (err) {
            if (options.selfHeal === true) {
                BStackLogger.warn(`Error while setting up self-healing: ${err}. Disabling healing for this session.`)
            }
        }
    }
}

export default new AiHandler()
