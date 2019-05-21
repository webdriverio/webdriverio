import logger from '@wdio/logger'
import { Eyes, Target } from '@applitools/eyes-webdriverio'

const log = logger('@wdio/applitools-service')

const DEFAULT_VIEWPORT = {
    width: 1440,
    height: 900
}

export default class ApplitoolsService {
    constructor () {
        this.eyes = new Eyes()
    }

    /**
     * set API key in onPrepare hook and start test
     */
    beforeSession (config) {
        const key = config.applitoolsKey || process.env.APPLITOOLS_KEY
        const serverUrl = config.applitoolsServerUrl || process.env.APPLITOOLS_SERVER_URL
        const applitoolsConfig = config.applitools || {}

        if (!key) {
            throw new Error('Couldn\'t find an Applitools "applitoolsKey" in config nor "APPLITOOLS_KEY" in the environment')
        }

        // Optionally set a specific server url
        if (serverUrl) {
            this.eyes.setServerUrl(serverUrl)
        }

        this.isConfigured = true
        this.eyes.setApiKey(key)
        this.viewport = Object.assign(DEFAULT_VIEWPORT, applitoolsConfig.viewport)
    }

    /**
     * set custom commands
     */
    before () {
        if (!this.isConfigured) {
            return
        }

        global.browser.addCommand('takeSnapshot', (title) => {
            if (!title) {
                throw new Error('A title for the Applitools snapshot is missing')
            }

            return this.eyes.check(title, Target.window())
        })
    }

    beforeTest (test) {
        if (!this.isConfigured) {
            return
        }

        log.info(`Open eyes for ${test.parent} ${test.title}`)
        global.browser.call(() => this.eyes.open(global.browser, test.title, test.parent, this.viewport))
    }

    afterTest () {
        if (!this.isConfigured) {
            return
        }

        global.browser.call(::this.eyes.close)
    }

    after () {
        if (!this.isConfigured) {
            return
        }

        global.browser.call(::this.eyes.abortIfNotClosed)
    }
}
