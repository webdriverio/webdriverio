import type { Capabilities } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import {
    o11yClassErrorHandler
} from '../util'
import PercyCaptureMap from './PercyCaptureMap'

import * as PercySDK from './PercySDK'
import { PercyLogger } from './PercyLogger'
import { BrowserAsync } from 'src/@types/bstack-service-types'

import { PERCY_DOM_CHANGING_COMMANDS_ENDPOINTS, CAPTURE_MODES } from '../constants'

class _PercyHandler {
    private _testMetadata: { [key: string]: any } = {}
    private sessionName?: string
    private _isAppAutomate?: boolean
    private isPercyCleanupProcessingUnderway?: boolean = false
    public _percyScreenshotCounter: any = 0
    private percyDeferredScreenshots: any = []
    private percyScreenshotInterval: any = null

    constructor (
        private _percyAutoCaptureMode: string | undefined,
        private _browser: Browser<'async'> | MultiRemoteBrowser<'async'>,
        private _capabilities: Capabilities.RemoteCapability,
        isAppAutomate?: boolean,
        private _framework?: string
    ) {
        this._isAppAutomate = isAppAutomate
        if (!_percyAutoCaptureMode || !CAPTURE_MODES.includes(_percyAutoCaptureMode as string)) {
            this._percyAutoCaptureMode = 'auto'
        }
    }

    _setSessionName(name: string) {
        this.sessionName = name
    }

    async teardown () {
        await new Promise<void>((resolve) => {
            setInterval(() => {
                if (this._percyScreenshotCounter === 0) {
                    resolve()
                }
            }, 1000)
        })
    }

    async percyAutoCapture(eventName: string | null, sessionName: string | null) {
        try {
            if (eventName) {
                if (!sessionName) {
                    /* Service doesn't wait for handling of browser commands so the below counter is used in teardown method to delay service exit */
                    this._percyScreenshotCounter += 1
                }

                ((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).increment(sessionName ? sessionName : (this.sessionName as string), eventName)
                await (this._isAppAutomate ? PercySDK.screenshotApp(((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).getName(sessionName ? sessionName : (this.sessionName as string), eventName)) : PercySDK.screenshot(this._browser, ((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).getName( sessionName ? sessionName : (this.sessionName as string), eventName)))
                this._percyScreenshotCounter -= 1
            }
        } catch (err: any) {
            this._percyScreenshotCounter -= 1;
            ((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).decrement(sessionName ? sessionName : (this.sessionName as string), eventName as string)
            PercyLogger.error(`Error while trying to auto capture Percy screenshot ${err}`)
        }
    }

    async before () {
        (this._browser as BrowserAsync).percyCaptureMap = new PercyCaptureMap()
    }

    deferCapture(sessionName: string, eventName: string | null) {
        /* Service doesn't wait for handling of browser commands so the below counter is used in teardown method to delay service exit */
        this._percyScreenshotCounter += 1
        this.percyDeferredScreenshots.push({ sessionName, eventName })
    }

    isDOMChangingCommand(args: BeforeCommandArgs): boolean {
        if ((args.method as string) === 'POST') {
            if (PERCY_DOM_CHANGING_COMMANDS_ENDPOINTS.includes((args.endpoint as string))) {
                return true
            } else if ((args.endpoint as string).includes('/session/:sessionId/element') && (args.endpoint as string).includes('click')) {
                /* click element */
                return true
            } else if ((args.endpoint as string).includes('/session/:sessionId/element') && (args.endpoint as string).includes('clear')) {
                /* clear element */
                return true
            } else if ((args.endpoint as string).includes('/session/:sessionId/execute') && args.body?.script) {
                /* execute script sync / async */
                return true
            } else if ((args.endpoint as string).includes('/session/:sessionId/touch')) {
                /* Touch action for Appium */
                return true
            }
        } else if ((args.method as string) === 'DELETE' && (args.endpoint as string) === '/session/:sessionId') {
            return true
        }
        return false
    }

    async cleanupDeferredScreenshots() {
        this.isPercyCleanupProcessingUnderway = true
        for await (const entry of this.percyDeferredScreenshots) {
            await this.percyAutoCapture(entry.eventName, entry.sessionName)
        }
        this.percyDeferredScreenshots = []
        this.isPercyCleanupProcessingUnderway = false
    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async browserBeforeCommand (args: BeforeCommandArgs) {
        try {
            if (this.isDOMChangingCommand(args)) {
                do {
                    await this.sleep(1000)
                } while (this.percyScreenshotInterval)
                this.percyScreenshotInterval = setInterval(async () => {
                    if (!this.isPercyCleanupProcessingUnderway) {
                        clearInterval(this.percyScreenshotInterval)
                        await this.cleanupDeferredScreenshots()
                        this.percyScreenshotInterval = null
                    }
                }, 1000)
            }
        } catch (err: any) {
            PercyLogger.error(`Error while trying to cleanup deferred screenshots ${err}`)
        }
    }

    async browserAfterCommand (args: BeforeCommandArgs & AfterCommandArgs) {
        try {
            if (args.endpoint && this._percyAutoCaptureMode) {
                let eventName = null
                if ((args.endpoint as string).includes('click') && ['click', 'auto'].includes(this._percyAutoCaptureMode as string)) {
                    eventName = 'click'
                } else if ((args.endpoint as string).includes('screenshot') && ['screenshot', 'auto'].includes(this._percyAutoCaptureMode as string)) {
                    eventName = 'screenshot'
                } else if ((args.endpoint as string).includes('actions') && ['auto'].includes(this._percyAutoCaptureMode as string)) {
                    if (args.body && args.body.actions && Array.isArray(args.body.actions) && args.body.actions.length && args.body.actions[0].type === 'key') {
                        eventName = 'keys'
                    }
                } else if ((args.endpoint as string).includes('/session/:sessionId/element') && (args.endpoint as string).includes('value') && ['auto'].includes(this._percyAutoCaptureMode as string)) {
                    eventName = 'keys'
                }
                if (eventName) {
                    this.deferCapture(this.sessionName as string, eventName)
                }
            }
        } catch (err: any) {
            PercyLogger.error(`Error while trying to calculate auto capture parameters ${err}`)
        }
    }

    async afterTest () {
        if (this._percyAutoCaptureMode && this._percyAutoCaptureMode === 'testcase') {
            await this.percyAutoCapture('testcase', null)
        }
    }

    async afterScenario () {
        if (this._percyAutoCaptureMode && this._percyAutoCaptureMode === 'testcase') {
            await this.percyAutoCapture('testcase', null)
        }
    }
}

// https://github.com/microsoft/TypeScript/issues/6543
const PercyHandler: typeof _PercyHandler = o11yClassErrorHandler(_PercyHandler)
type PercyHandler = _PercyHandler

export default PercyHandler
