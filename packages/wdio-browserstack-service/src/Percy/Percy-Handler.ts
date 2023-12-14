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

class _PercyHandler {
    private _testMetadata: { [key: string]: any } = {}
    private sessionName?: string
    private _isAppAutomate?: boolean
    public _percyScreenshotCounter: any = 0

    constructor (
        private _percyAutoCaptureMode: string | undefined,
        private _browser: Browser<'async'> | MultiRemoteBrowser<'async'>,
        private _capabilities: Capabilities.RemoteCapability,
        isAppAutomate?: boolean,
        private _framework?: string
    ) {
        this._isAppAutomate = isAppAutomate
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

    async percyAutoCapture(eventName: string | null) {
        try {
            if (eventName) {
                /* Service doesn't wait for handling of browser commands so the below counter is used in teardown method to delay service exit */
                this._percyScreenshotCounter += 1;
                ((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).increment((this.sessionName as string), eventName)
                await (this._isAppAutomate ? PercySDK.screenshotApp(((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).getName((this.sessionName as string), eventName)) : PercySDK.screenshot(this._browser, ((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).getName((this.sessionName as string), eventName)));
                this._percyScreenshotCounter -= 1
            }
        } catch (err: any) {
            ((this._browser as BrowserAsync).percyCaptureMap as PercyCaptureMap).decrement((this.sessionName as string), eventName as string)
            PercyLogger.error(`Error while trying to auto capture Percy screenshot ${err}`)
        }
    }

    async before () {
        (this._browser as BrowserAsync).percyCaptureMap = new PercyCaptureMap()
    }

    async browserCommand (args: BeforeCommandArgs & AfterCommandArgs) {
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
                }
                await this.percyAutoCapture(eventName)
            }
        } catch (err: any) {
            PercyLogger.error(`Error while trying to calculate auto capture parameters ${err}`)
        }
    }

    async afterTest () {
        if (this._percyAutoCaptureMode && this._percyAutoCaptureMode === 'testcase') {
            await this.percyAutoCapture('testcase')
        }
    }

    async afterScenario () {
        if (this._percyAutoCaptureMode && this._percyAutoCaptureMode === 'testcase') {
            await this.percyAutoCapture('testcase')
        }
    }
}

// https://github.com/microsoft/TypeScript/issues/6543
const PercyHandler: typeof _PercyHandler = o11yClassErrorHandler(_PercyHandler)
type PercyHandler = _PercyHandler

export default PercyHandler
