import aiSDK from '@browserstack/ai-sdk-node'
import { BStackLogger } from './bstackLogger.js'
import { TCG_URL, TCG_INFO, SUPPORTED_BROWSERS_FOR_AI } from './constants.js'
import { handleHealingInstrumentation } from './instrumentation/funnelInstrumentation.js'
import { createRequire } from 'node:module'

import type { Capabilities } from '@wdio/types'
import type { BrowserstackConfig, SelfHeal } from './types.js'
import type BrowserStackConfig from './config.js'
import type { Options } from '@wdio/types'

class AiHandler {

    async AiHealingSetup(
        config:  Options.Testrunner & SelfHeal,
        browserStackConfig: BrowserStackConfig,
        options: BrowserstackConfig & Options.Testrunner,
        caps: any
    ) {
        try {
            if (SUPPORTED_BROWSERS_FOR_AI.includes(caps.browserName)) {
                const wdioBrowserStackServiceVersion = createRequire(import.meta.url)('../package.json').version
                if (config.user && config.key) {

                    const authResult = await aiSDK.BrowserstackHealing.init(config.key, config.user, TCG_URL, wdioBrowserStackServiceVersion)

                    handleHealingInstrumentation(authResult, browserStackConfig, config.selfHeal, options)
                    process.env.TCG_AUTH_RESULT = JSON.stringify(authResult)

                    if (caps.browserName !== 'firefox') {

                        const installExtCondition = authResult.isAuthenticated === true && (authResult.defaultLogDataEnabled === true || config.selfHeal === true)

                        if (installExtCondition) {
                            if (typeof caps === 'object') {
                                caps = aiSDK.BrowserstackHealing.initializeCapabilities(caps)
                            } else if (Array.isArray(caps)){
                                const newCaps = aiSDK.BrowserstackHealing.initializeCapabilities(caps[0])
                                caps[0] = newCaps
                            }
                        } else if (config.selfHeal === true) {
                            const healingWarnMessage = (authResult as aiSDK.BrowserstackHealing.InitErrorResponse).message
                            BStackLogger.warn(`Healing Auth failed. Disabling healing for this session. Reason: ${healingWarnMessage}`)
                        }
                    }

                }
            }
        } catch (err) {
            BStackLogger.debug(`Error while initiliazing Browserstack healing Extension ${err}`)
        }

        return caps
    }

    async AiHealingLogic(config: Options.Testrunner & SelfHeal, caps: Capabilities.RemoteCapability, browser: WebdriverIO.Browser) {
        try {

            if (SUPPORTED_BROWSERS_FOR_AI.includes((caps as any).browserName)) {
                const authInfo = JSON.parse(process.env.TCG_AUTH_RESULT || '{}')

                if (Object.keys(authInfo).length === 0 && config.selfHeal === true) {
                    BStackLogger.debug('TCG Auth result is empty')
                    return
                }

                const {
                    isAuthenticated,
                    isHealingEnabled,
                    sessionToken,
                    defaultLogDataEnabled
                } = authInfo

                if (isAuthenticated && (defaultLogDataEnabled === true || config.selfHeal === true)) {
                    await aiSDK.BrowserstackHealing.setToken(browser.sessionId, sessionToken, TCG_URL)

                    if ((caps as any).browserName === 'firefox') {
                        await browser.installAddOn(aiSDK.BrowserstackHealing.getFirefoxAddonPath(), true)
                    }

                    browser.overwriteCommand('findElement' as any, async (orginalFunc: (arg0: string, arg1: string) => any, using: string, value: string) => {

                        const sessionId = browser.sessionId

                        let tcgDetails = `{"region": "${TCG_INFO.tcgRegion}", "tcgUrls": {"${TCG_INFO.tcgRegion}": {"endpoint": "${TCG_INFO.tcgUrl.split('s://')[1]}"}}}`
                        tcgDetails = tcgDetails.replace(/'/g, '\\\'').replace(/"/g, '\\"')
                        const locatorType = using.replace(/'/g, '\\\'').replace(/"/g, '\\"')
                        const locatorValue = value.replace(/'/g, '\\\'').replace(/"/g, '\\"')
                        try {
                            const result = await orginalFunc(using, value)
                            if (!result.error) {
                                const script = await aiSDK.BrowserstackHealing.logData(locatorType, locatorValue, undefined, undefined, authInfo.groupId, sessionId, undefined, tcgDetails)
                                if (script) {
                                    await browser.execute(script)
                                }
                                return result
                            }
                            if (config.selfHeal === true && isHealingEnabled) {
                                BStackLogger.info('findElement failed, trying to heal')
                                const script = await aiSDK.BrowserstackHealing.healFailure(locatorType, locatorValue, undefined, undefined, authInfo.userId, authInfo.groupId, sessionId, undefined, undefined, authInfo.isGroupAIEnabled, tcgDetails)
                                if (script) {
                                    await browser.execute(script)
                                    const tcgData = await aiSDK.BrowserstackHealing.pollResult(TCG_URL, sessionId, authInfo.sessionToken)
                                    if (tcgData && tcgData.selector && tcgData.value){
                                        const healedResult = await orginalFunc(tcgData.selector, tcgData.value)
                                        BStackLogger.info('Healing worked, element found: ' + tcgData.selector + ': ' + tcgData.value)
                                        return healedResult.error ? result : healedResult
                                    }
                                }
                            }
                        } catch (err) {
                            BStackLogger.debug('Error in findElement: ' + err + 'using: ' + using + 'value: ' + value)
                            if (config.selfHeal === true) {
                                BStackLogger.debug('Healing disabled for this command')
                            }
                            return orginalFunc(using, value)
                        }
                    })
                }
            }
        } catch (err) {
            BStackLogger.error('Error in setting up self-healing: ' + err)
        }
    }
}

export default new AiHandler()
