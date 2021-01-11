import logger from '@wdio/logger'
import { Eyes, Target } from '@applitools/eyes-webdriverio'
import type { Services, Capabilities } from '@wdio/types'

import { ApplitoolsConfig, ApplitoolsBrowserAsync } from './types'

const log = logger('@wdio/applitools-service')

const DEFAULT_VIEWPORT = {
    width: 1440,
    height: 900
}

export default class ApplitoolsService implements Services.ServiceInstance {
    private _isConfigured: boolean = false
    private _viewport: Required<ApplitoolsConfig['viewport']>
    private _eyes = new Eyes()
    private _browser?: ApplitoolsBrowserAsync

    constructor(private _options: ApplitoolsConfig) {}

    /**
     * set API key in onPrepare hook and start test
     */
    beforeSession() {
        const key = this._options.key || process.env.APPLITOOLS_KEY
        const serverUrl = this._options.serverUrl || process.env.APPLITOOLS_SERVER_URL

        if (!key) {
            throw new Error('Couldn\'t find an Applitools "applitools.key" in config nor "APPLITOOLS_KEY" in the environment')
        }

        /**
         * Optionally set a specific server url
         */
        if (serverUrl) {
            this._eyes.setServerUrl(serverUrl)
        }

        this._isConfigured = true
        this._eyes.setApiKey(key)

        if (this._options.proxy) {
            this._eyes.setProxy(this._options.proxy)
        }

        this._viewport = Object.assign({ ...DEFAULT_VIEWPORT }, this._options.viewport)
    }

    /**
     * set custom commands
     */
    before(
        caps: Capabilities.RemoteCapability,
        specs: string[],
        browser: ApplitoolsBrowserAsync
    ) {
        this._browser = browser

        if (!this._isConfigured) {
            return
        }

        this._browser.addCommand('takeSnapshot', (title: string) => {
            if (!title) {
                throw new Error('A title for the Applitools snapshot is missing')
            }

            return this._eyes.check(title, Target.window())
        })

        this._browser.addCommand('takeRegionSnapshot', (title: string, region: Region, frame: Frame) => {
            if (!title) {
                throw new Error('A title for the Applitools snapshot is missing')
            }
            if (!region || region === null) {
                throw new Error('A region for the Applitools snapshot is missing')
            }
            if (!frame) {
                return this._eyes.check(title, Target.region(region))
            }
            return this._eyes.check(title, Target.region(region, frame))
        })
    }

    beforeTest(test: { title: string, parent: string }) {
        if (!this._isConfigured || !this._browser) {
            return
        }

        log.info(`Open eyes for ${test.parent} ${test.title}`)
        this._browser.call(() => this._eyes.open(this._browser, test.title, test.parent, this._viewport))
    }

    afterTest() {
        if (!this._isConfigured || !this._browser) {
            return
        }

        this._browser.call(this._eyes.close.bind(this._eyes))
    }

    after() {
        if (!this._isConfigured || !this._browser) {
            return
        }

        this._browser.call(this._eyes.abortIfNotClosed.bind(this._eyes))
    }
}

export * from './types'
