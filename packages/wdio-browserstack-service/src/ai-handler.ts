import aiSDK from '@browserstack/ai-sdk-node'
import { BStackLogger } from './bstackLogger.js'
import { TCG_URL, TCG_INFO, SUPPORTED_BROWSERS_FOR_AI } from './constants.js'
import { handleHealingInstrumentation } from './instrumentation/funnelInstrumentation.js'
import { createRequire } from 'node:module'

import type { Capabilities } from '@wdio/types'
import type BrowserStackConfig from './config.js'
import type { Options } from '@wdio/types'
import type { BrowserstackHealing } from '@browserstack/ai-sdk-node'
import path from 'node:path'
import fs from 'node:fs'
import url from 'node:url'
import { getBrowserStackUserAndKey } from './util.js'
import type { BrowserstackOptions } from './types.js'

class AiHandler {
    authResult: BrowserstackHealing.InitSuccessResponse | BrowserstackHealing.InitErrorResponse
    wdioBstackVersion: string
    constructor() {
        this.authResult = JSON.parse(process.env.TCG_AUTH_RESULT || '{}')
        this.wdioBstackVersion = createRequire(import.meta.url)('../package.json').version
    }

    async authenticateUser(user: string, key: string) {
        return await aiSDK.BrowserstackHealing.init(key, user, TCG_URL, this.wdioBstackVersion)
    }

    async updateCaps(
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

        let tcgDetails = `{"region": "${TCG_INFO.tcgRegion}", "tcgUrls": {"${TCG_INFO.tcgRegion}": {"endpoint": "${TCG_INFO.tcgUrl.split('s://')[1]}"}}}`
        tcgDetails = tcgDetails.replace(/'/g, '\\\'').replace(/"/g, '\\"')
        const locatorType = using.replace(/'/g, '\\\'').replace(/"/g, '\\"')
        const locatorValue = value.replace(/'/g, '\\\'').replace(/"/g, '\\"')

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
            BStackLogger.debug('Error in findElement: ' + err + 'using: ' + using + 'value: ' + value)
            if (options.selfHeal === true) {
                BStackLogger.debug('Something went wrong while healing. Disabling healing for this command')
            }
        }
        return await orginalFunc(using, value)
    }

    async setup(
        config: Options.Testrunner,
        browserStackConfig: BrowserStackConfig,
        options: BrowserstackOptions,
        caps: any
    ) {
        try {
            if (SUPPORTED_BROWSERS_FOR_AI.includes(caps.browserName)) {
                const { user, key } = getBrowserStackUserAndKey(config, options)
                if (user && key) {

                    const authResult = await this.authenticateUser(user, key)

                    handleHealingInstrumentation(authResult, browserStackConfig, options.selfHeal)
                    process.env.TCG_AUTH_RESULT = JSON.stringify(authResult)

                    caps = await this.updateCaps(authResult, options, caps)

                }
            }
        } catch (err) {
            BStackLogger.debug(`Error while initiliazing Browserstack healing Extension ${err}`)
        }

        return caps
    }

    async selfHeal(options: BrowserstackOptions, caps: Capabilities.RemoteCapability, browser: WebdriverIO.Browser) {
        try {

            if (SUPPORTED_BROWSERS_FOR_AI.includes((caps as any).browserName)) {
                const authInfo = this.authResult as BrowserstackHealing.InitSuccessResponse

                if (Object.keys(authInfo).length === 0 && options.selfHeal === true) {
                    BStackLogger.debug('TCG Auth result is empty')
                    return
                }

                const { isAuthenticated, sessionToken, defaultLogDataEnabled } = authInfo

                if (isAuthenticated && (defaultLogDataEnabled === true || options.selfHeal === true)) {
                    await this.setToken(browser.sessionId, sessionToken)

                    if ((caps as any).browserName === 'firefox') {
                        await this.installFirefoxExtension(browser)
                    }

                    browser.overwriteCommand('findElement' as any, async (orginalFunc: (arg0: string, arg1: string) => any, using: string, value: string) => {
                        return await this.handleHealing(orginalFunc, using, value, browser, options)
                    })
                }
            }
        } catch (err) {
            BStackLogger.error('Error in setting up self-healing: ' + err)
        }
    }
}

export default new AiHandler()
