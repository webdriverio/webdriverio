import fs from 'fs'
import path from 'path'
import util from 'util'
import { EventEmitter } from 'events'

import logger from '@wdio/logger'
import { initialiseWorkerService, initialisePlugin, executeHooksWithArgs } from '@wdio/utils'
import { ConfigParser, ConfigOptions, SingleConfigOption, Capability } from '@wdio/config'

import BaseReporter from './reporter'
import { runHook, initialiseInstance, filterLogTypes, getInstancesData } from './utils'

const log = logger('@wdio/runner')

interface Args extends Partial<ConfigOptions> {
    ignoredWorkerServices?: string[]
}

type RunParams = {
    cid: string
    args: Args
    specs: string[]
    caps: Capability
    configFile: string
    retries: number
}

interface TestFramework {
    init: (
        cid: string,
        config: ConfigOptions,
        specs: string[],
        capabilities: Capability,
        reporter: BaseReporter
    ) => TestFramework
    run (): number
    hasTests (): boolean
}

export default class Runner extends EventEmitter {
    private _configParser = new ConfigParser()
    private _sigintWasCalled = false
    private _isMultiremote = false

    private _reporter?: BaseReporter
    private _framework?: TestFramework
    private _config?: ConfigOptions
    private _cid?: string
    private _specs?: string[]
    private _caps?: Capability

    /**
     * run test suite
     * @param  {String}    cid            worker id (e.g. `0-0`)
     * @param  {Object}    args           config arguments passed into worker process
     * @param  {String[]}  specs          list of spec files to run
     * @param  {Object}    caps           capabilities to run session with
     * @param  {String}    configFile     path to config file to get config from
     * @param  {Number}    retries        number of retries remaining
     * @return {Promise}                  resolves in number of failures for testrun
     */
    async run({ cid, args, specs, caps, configFile, retries }: RunParams) {
        this._cid = cid
        this._specs = specs
        this._caps = caps

        /**
         * add config file
         */
        try {
            this._configParser.addConfigFile(configFile)
        } catch (e) {
            return this._shutdown(1, retries)
        }

        /**
         * merge cli arguments into config
         */
        this._configParser.merge(args)

        this._config = this._configParser.getConfig() as ConfigOptions
        this._config.specFileRetryAttempts = (this._config.specFileRetries || 0) - (retries || 0)
        logger.setLogLevelsConfig(this._config.logLevels, this._config.logLevel)
        const isMultiremote = this._isMultiremote = !Array.isArray(this._configParser.getCapabilities())

        /**
         * create `browser` stub only if `specFiltering` feature is enabled
         */
        let browser = await this._startSession({
            ...this._config,
            // @ts-ignore used in `/packages/webdriverio/src/protocol-stub.ts`
            _automationProtocol: this._config.automationProtocol,
            automationProtocol: './protocol-stub'
        }, caps)

        /**
         * run `beforeSession` command before framework and browser are initiated
         */
        initialiseWorkerService(
            this._config as WebdriverIO.Config,
            caps as unknown as WebDriver.DesiredCapabilities,
            args.ignoredWorkerServices
        ).map(this._configParser.addService.bind(this._configParser))
        await runHook('beforeSession', this._config, this._caps, this._specs)

        this._reporter = new BaseReporter(this._config, this._cid, { ...caps })
        /**
         * initialise framework
         */
        this._framework = initialisePlugin(this._config.framework as string, 'framework').default as unknown as TestFramework
        this._framework = await this._framework.init(cid, this._config, specs, caps, this._reporter)
        process.send!({ name: 'testTestFrameworkInit', content: { cid, caps, specs, hasTests: this._framework.hasTests() } })
        if (!this._framework.hasTests()) {
            return this._shutdown(0, retries)
        }

        browser = await this._initSession(this._config as SingleConfigOption, this._caps, browser)

        /**
         * return if session initialisation failed
         */
        if (!browser) {
            return this._shutdown(1, retries)
        }

        this._reporter.caps = browser.capabilities as Capability

        await executeHooksWithArgs(this._config.before, [this._caps, this._specs, browser])

        /**
         * kill session of SIGINT signal showed up while trying to
         * get a session ID
         */
        if (this._sigintWasCalled) {
            log.info('SIGINT signal detected while starting session, shutting down...')
            await this.endSession()
            return this._shutdown(0, retries)
        }

        /**
         * initialisation successful, send start message
         */
        const multiRemoteBrowser = browser as WebdriverIO.MultiRemoteBrowserObject
        this._reporter.emit('runner:start', {
            cid,
            specs,
            config: this._config,
            isMultiremote,
            sessionId: browser.sessionId,
            capabilities: isMultiremote
                ? multiRemoteBrowser.instances.reduce((caps: WebdriverIO.MultiRemoteCapabilities, browserName) => {
                    // @ts-ignore loosly typed multiremotecaps
                    caps[browserName] = multiRemoteBrowser[browserName].capabilities
                    caps[browserName].sessionId = multiRemoteBrowser[browserName].sessionId
                    return caps
                }, {})
                : { ...browser.capabilities, sessionId: browser.sessionId },
            retry: this._config.specFileRetryAttempts
        })

        /**
         * report sessionId and target connection information to worker
         */
        const { protocol, hostname, port, path, queryParams } = browser.options
        const { isW3C, sessionId } = browser
        const instances = getInstancesData(browser, isMultiremote)
        process.send!({
            origin: 'worker',
            name: 'sessionStarted',
            content: { sessionId, isW3C, protocol, hostname, port, path, queryParams, isMultiremote, instances }
        })

        /**
         * kick off tests in framework
         */
        let failures = 0
        try {
            failures = await this._framework.run()
            await this._fetchDriverLogs(this._config, (caps as Required<WebDriver.DesiredCapabilities>).excludeDriverLogs)
        } catch (e) {
            log.error(e)
            this.emit('error', e)
            failures = 1
        }

        /**
         * in watch mode we don't close the session and leave current page opened
         */
        if (!args.watch) {
            await this.endSession()
        }

        return this._shutdown(failures, retries)
    }

    /**
     * init protocol session
     * @param  {object}  config        configuration of sessions
     * @param  {Object}  caps          desired capabilities of session
     * @param  {Object}  browserStub   stubbed `browser` object with only capabilities, config and env flags
     * @return {Promise}               resolves with browser object or null if session couldn't get established
     */
    async _initSession (
        config: SingleConfigOption,
        caps: Capability,
        browserStub?: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject
    ) {
        const browser = await this._startSession(config, caps)

        // return null if session couldn't get established
        if (!browser) { return }

        // add flags declared by user to browser object
        if (browserStub) {
            Object.entries(browserStub).forEach(([key, value]: [keyof WebdriverIO.BrowserObject, any]) => {
                if (typeof browser[key] === 'undefined') {
                    // @ts-ignore allow to set value for undefined props
                    browser[key] = value
                }
            })
        }

        /**
         * register global helper method to fetch elements
         */
        global.$ = (selector) => browser.$(selector)
        global.$$ = (selector) => browser.$$(selector)

        /**
         * register command event
         */
        browser.on('command', (command) => this._reporter?.emit(
            'client:beforeCommand',
            Object.assign(command, { sessionId: browser.sessionId })
        ))

        /**
         * register result event
         */
        browser.on('result', (result) => this._reporter?.emit(
            'client:afterCommand',
            Object.assign(result, { sessionId: browser.sessionId })
        ))

        return browser
    }

    /**
     * start protocol session
     * @param  {object}  config        configuration of sessions
     * @param  {Object}  caps          desired capabilities of session
     * @return {Promise}               resolves with browser object or null if session couldn't get established
     */
    async _startSession (
        config: SingleConfigOption,
        caps: Capability
    ) {
        let browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject

        try {
            browser = global.browser = global.driver = await initialiseInstance(config, caps, this._isMultiremote)
        } catch (e) {
            log.error(e)
            return
        }

        browser.config = config as WebdriverIO.Config
        return browser
    }

    /**
     * fetch logs provided by browser driver
     */
    async _fetchDriverLogs (
        config: ConfigOptions,
        excludeDriverLogs: string[]
    ) {
        /**
         * only fetch logs if
         */
        if (
            /**
             * a log directory is given in config
             */
            !config.outputDir ||
            /**
             * the session wasn't killed during start up phase
             */
            !global.browser.sessionId ||
            /**
             * driver supports it
             */
            typeof global.browser.getLogs === 'undefined'
        ) {
            return
        }

        /**
         * suppress @wdio/sync warnings of not running commands inside of
         * a Fibers context
         */
        global._HAS_FIBER_CONTEXT = true

        let logTypes
        try {
            logTypes = await global.browser.getLogTypes()
        } catch (errIgnored) {
            /**
             * getLogTypes is not supported by browser
             */
            return
        }

        logTypes = filterLogTypes(excludeDriverLogs, logTypes)

        log.debug(`Fetching logs for ${logTypes.join(', ')}`)
        return Promise.all(logTypes.map(async (logType) => {
            let logs

            try {
                logs = await global.browser.getLogs(logType)
            } catch (e) {
                return log.warn(`Couldn't fetch logs for ${logType}: ${e.message}`)
            }

            /**
             * don't write to file if no logs were captured
             */
            if (logs.length === 0) {
                return
            }

            const stringLogs = logs.map((log) => JSON.stringify(log)).join('\n')
            return util.promisify(fs.writeFile)(
                path.join(config.outputDir!, `wdio-${this._cid}-${logType}.log`),
                stringLogs,
                'utf-8'
            )
        }))
    }

    /**
     * kill worker session
     */
    async _shutdown (
        failures: number,
        retries: number
    ) {
        this._reporter!.emit('runner:end', {
            failures,
            cid: this._cid,
            retries
        })
        try {
            await this._reporter!.waitForSync()
        } catch (e) {
            log.error(e)
        }
        this.emit('exit', failures === 0 ? 0 : 1)
        return failures
    }

    /**
     * end WebDriver session, a config object can be applied if object has changed
     * within a hook by the user
     */
    async endSession() {
        /**
         * make sure instance(s) exist and have `sessionId`
         */
        const multiremoteBrowser = global.browser as WebdriverIO.MultiRemoteBrowserObject
        const hasSessionId = Boolean(global.browser) && (this._isMultiremote
            /**
             * every multiremote instance should exist and should have `sessionId`
             */
            ? !multiremoteBrowser.instances.some(i => multiremoteBrowser[i] && !multiremoteBrowser[i].sessionId)
            /**
             * browser object should have `sessionId` in regular mode
             */
            : global.browser.sessionId)

        /**
         * don't do anything if test framework returns after SIGINT
         * if endSession is called without payload we expect a session id
         */
        if (!hasSessionId) {
            return
        }

        /**
         * store capabilities for afterSession hook
         */
        const capabilities: WebDriver.DesiredCapabilities | Record<string, WebDriver.DesiredCapabilities> = global.browser.capabilities || {}
        if (this._isMultiremote) {
            multiremoteBrowser.instances.forEach((browserName) => {
                (capabilities as Record<string, WebDriver.DesiredCapabilities>)[browserName] = multiremoteBrowser[browserName].capabilities
            })
        }

        await global.browser.deleteSession()

        /**
         * delete session(s)
         */
        if (this._isMultiremote) {
            multiremoteBrowser.instances.forEach(i => {
                // @ts-ignore sessionId is usually required
                delete multiremoteBrowser[i].sessionId
            })
        } else {
            // @ts-ignore sessionId is usually required
            delete global.browser.sessionId
        }

        await runHook('afterSession', global.browser.config as ConfigOptions, capabilities, this._specs as string[])
    }
}
