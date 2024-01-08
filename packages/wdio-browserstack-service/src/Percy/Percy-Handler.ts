import type { Capabilities } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'

import {
    o11yClassErrorHandler,
    sleep
} from '../util.js'
import PercyCaptureMap from './PercyCaptureMap.js'

import * as PercySDK from './PercySDK.js'
import { PercyLogger } from './PercyLogger.js'

import { PERCY_DOM_CHANGING_COMMANDS_ENDPOINTS, CAPTURE_MODES } from '../constants.js'

class _PercyHandler {
    private _testMetadata: { [key: string]: any } = {}
    private sessionName?: string
    private _isAppAutomate?: boolean
    private isPercyCleanupProcessingUnderway?: boolean = false
    private _percyScreenshotCounter: any = 0
    private percyDeferredScreenshots: any = []
    private percyScreenshotInterval: any = null

    constructor (
        private _percyAutoCaptureMode: string | undefined,
        private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
        private _capabilities: Capabilities.RemoteCapability,
        isAppAutomate?: boolean,
        private _framework?: string
    ) {
        this._isAppAutomate = isAppAutomate
        if (_percyAutoCaptureMode && !_percyAutoCaptureMode || !CAPTURE_MODES.includes(_percyAutoCaptureMode as string)) {
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

                (this._browser.percyCaptureMap as PercyCaptureMap).increment(sessionName ? sessionName : (this.sessionName as string), eventName)
                await (this._isAppAutomate ? PercySDK.screenshotApp((this._browser.percyCaptureMap as PercyCaptureMap).getName( sessionName ? sessionName : (this.sessionName as string), eventName)) : await PercySDK.screenshot(this._browser, (this._browser.percyCaptureMap as PercyCaptureMap).getName( sessionName ? sessionName : (this.sessionName as string), eventName)))
                this._percyScreenshotCounter -= 1
            }
        } catch (err: any) {
            this._percyScreenshotCounter -= 1;
            (this._browser.percyCaptureMap as PercyCaptureMap).decrement(sessionName ? sessionName : (this.sessionName as string), eventName as string)
            PercyLogger.error(`Error while trying to auto capture Percy screenshot ${err}`)
        }
    }

    async before () {
        this._browser.percyCaptureMap = new PercyCaptureMap()
    }

    deferCapture(sessionName: string, eventName: string | null) {
        /* Service doesn't wait for handling of browser commands so the below counter is used in teardown method to delay service exit */
        this._percyScreenshotCounter += 1
        this.percyDeferredScreenshots.push({ sessionName, eventName })
    }

    isDOMChangingCommand(args: BeforeCommandArgs): boolean {
        /*
          Percy screenshots which are to be taken on events such as send keys, element click & screenshot are deferred until
          another DOM changing command is seen such that any DOM processing post the previous command is completed
        */
        return (
            typeof args.method === 'string' && typeof args.endpoint === 'string' &&
            (
                (
                    args.method === 'POST' &&
                    (
                        PERCY_DOM_CHANGING_COMMANDS_ENDPOINTS.includes(args.endpoint) ||
                        (
                            /* click / clear element */
                            args.endpoint.includes('/session/:sessionId/element') &&
                            (
                                args.endpoint.includes('click') ||
                                args.endpoint.includes('clear')
                            )
                        ) ||
                        /* execute script sync / async */
                        (args.endpoint.includes('/session/:sessionId/execute') && args.body?.script) ||
                        /* Touch action for Appium */
                        (args.endpoint.includes('/session/:sessionId/touch'))
                    )
                ) ||
                ( args.method === 'DELETE' && args.endpoint === '/session/:sessionId' )
            )
        )
    }

    async cleanupDeferredScreenshots() {
        this.isPercyCleanupProcessingUnderway = true
        for (const entry of this.percyDeferredScreenshots) {
            await this.percyAutoCapture(entry.eventName, entry.sessionName)
        }
        this.percyDeferredScreenshots = []
        this.isPercyCleanupProcessingUnderway = false
    }

    async browserBeforeCommand (args: BeforeCommandArgs) {
        try {
            if (!this.isDOMChangingCommand(args)) {
                return
            }
            do {
                await sleep(1000)
            } while (this.percyScreenshotInterval)
            this.percyScreenshotInterval = setInterval(async () => {
                if (!this.isPercyCleanupProcessingUnderway) {
                    clearInterval(this.percyScreenshotInterval)
                    await this.cleanupDeferredScreenshots()
                    this.percyScreenshotInterval = null
                }
            }, 1000)
        } catch (err: any) {
            PercyLogger.error(`Error while trying to cleanup deferred screenshots ${err}`)
        }
    }

    async browserAfterCommand (args: BeforeCommandArgs & AfterCommandArgs) {
        try {
            if (!args.endpoint || !this._percyAutoCaptureMode) {
                return
            }
            let eventName = null
            const endpoint = args.endpoint as string
            if (endpoint.includes('click') && ['click', 'auto'].includes(this._percyAutoCaptureMode as string)) {
                eventName = 'click'
            } else if (endpoint.includes('screenshot') && ['screenshot', 'auto'].includes(this._percyAutoCaptureMode as string)) {
                eventName = 'screenshot'
            } else if (endpoint.includes('actions') && ['auto'].includes(this._percyAutoCaptureMode as string)) {
                if (args.body && args.body.actions && Array.isArray(args.body.actions) && args.body.actions.length && args.body.actions[0].type === 'key') {
                    eventName = 'keys'
                }
            } else if (endpoint.includes('/session/:sessionId/element') && endpoint.includes('value') && ['auto'].includes(this._percyAutoCaptureMode as string)) {
                eventName = 'keys'
            }
            if (eventName) {
                this.deferCapture(this.sessionName as string, eventName)
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

