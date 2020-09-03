import fs from 'fs'
import path from 'path'
import util from 'util'
import EventEmitter from 'events'

import logger from '@wdio/logger'
import { initialiseWorkerService, initialisePlugin, executeHooksWithArgs } from '@wdio/utils'
import { ConfigParser } from '@wdio/config'

import BaseReporter from './reporter'
import { runHook, initialiseInstance, filterLogTypes, getInstancesData } from './utils'

const log = logger('@wdio/runner')

export default class Runner extends EventEmitter {
    constructor() {
        super()
        this.configParser = new ConfigParser()
        this.sigintWasCalled = false
    }

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
    async run({ cid, args, specs, caps, configFile, retries }) {
        this.cid = cid
        this.specs = specs
        this.caps = caps

        /**
         * add config file
         */
        try {
            this.configParser.addConfigFile(configFile)
        } catch (e) {
            return this._shutdown(1)
        }

        /**
         * merge cli arguments into config
         */
        this.configParser.merge(args)

        this.config = this.configParser.getConfig()
        this.config.specFileRetryAttempts = (this.config.specFileRetries || 0) - (retries || 0)
        logger.setLogLevelsConfig(this.config.logLevels, this.config.logLevel)
        const isMultiremote = this.isMultiremote = !Array.isArray(this.configParser.getCapabilities())

        /**
         * create `browser` stub only if `specFiltering` feature is enabled
         */
        let browser = await this._startSession({
            ...this.config,
            _automationProtocol: this.config.automationProtocol,
            automationProtocol: './protocol-stub'
        }, caps)

        this.reporter = new BaseReporter(this.config, this.cid, { ...caps })
        /**
         * initialise framework
         */
        this.framework = initialisePlugin(this.config.framework, 'framework').default
        this.framework = await this.framework.init(cid, this.config, specs, caps, this.reporter)
        process.send({ name: 'testFrameworkInit', content: { cid, caps, specs, hasTests: this.framework.hasTests() } })
        if (!this.framework.hasTests()) {
            return this._shutdown(0)
        }

        initialiseWorkerService(this.config, caps, args.ignoredWorkerServices)
            .map(this.configParser.addService.bind(this.configParser))

        await runHook('beforeSession', this.config, this.caps, this.specs)
        browser = await this._initSession(this.config, this.caps, browser)

        this.inWatchMode = Boolean(this.config.watch)

        /**
         * return if session initialisation failed
         */
        if (!browser) {
            return this._shutdown(1)
        }

        this.reporter.caps = browser.capabilities

        await executeHooksWithArgs(this.config.before, [this.caps, this.specs])

        /**
         * kill session of SIGINT signal showed up while trying to
         * get a session ID
         */
        if (this.sigintWasCalled) {
            log.info('SIGINT signal detected while starting session, shutting down...')
            await this.endSession()
            return this._shutdown(0)
        }

        const instances = getInstancesData(browser, isMultiremote)

        /**
         * initialisation successful, send start message
         */
        this.reporter.emit('runner:start', {
            cid,
            specs,
            config: this.config,
            isMultiremote,
            sessionId: browser.sessionId,
            capabilities: isMultiremote
                ? browser.instances.reduce((caps, browserName) => {
                    caps[browserName] = browser[browserName].capabilities
                    caps[browserName].sessionId = browser[browserName].sessionId
                    return caps
                }, {})
                : { ...browser.capabilities, sessionId: browser.sessionId },
            retry: this.config.specFileRetryAttempts
        })

        /**
         * report sessionId and target connection information to worker
         */
        const { protocol, hostname, port, path, queryParams } = browser.options
        const { isW3C, sessionId } = browser
        process.send({
            origin: 'worker',
            name: 'sessionStarted',
            content: { sessionId, isW3C, protocol, hostname, port, path, queryParams, isMultiremote, instances }
        })

        /**
         * kick off tests in framework
         */
        let failures = 0
        try {
            failures = await this.framework.run()
            await this._fetchDriverLogs(this.config, caps.excludeDriverLogs)
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

        this.reporter.emit('runner:end', {
            failures,
            cid: this.cid,
            retries
        })

        return this._shutdown(failures)
    }

    /**
     * init protocol session
     * @param  {object}  config        configuration of sessions
     * @param  {Object}  caps          desired capabilities of session
     * @param  {Object}  browserStub   stubbed `browser` object with only capabilities, config and env flags
     * @return {Promise}               resolves with browser object or null if session couldn't get established
     */
    async _initSession(config, caps, browserStub) {
        const browser = await this._startSession(config, caps)

        // return null if session couldn't get established
        if (!browser) { return null }

        // add flags declared by user to browser object
        if (browserStub) {
            Object.entries(browserStub).forEach(([key, value]) => {
                if (typeof browser[key] === 'undefined') {
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
        browser.on('command', (command) => this.reporter.emit(
            'client:beforeCommand',
            Object.assign(command, { sessionId: browser.sessionId })
        ))

        /**
         * register result event
         */
        browser.on('result', (result) => this.reporter.emit(
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
    async _startSession(config, caps) {
        let browser = null

        try {
            browser = global.browser = global.driver = await initialiseInstance(config, caps, this.isMultiremote)
        } catch (e) {
            log.error(e)
            this.emit('error', e)
            return browser
        }

        browser.config = config

        return browser
    }

    /**
     * fetch logs provided by browser driver
     */
    async _fetchDriverLogs(config, excludeDriverLogs) {
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
                path.join(config.outputDir, `wdio-${this.cid}-${logType}.log`),
                stringLogs,
                'utf-8'
            )
        }))
    }

    /**
     * kill worker session
     */
    async _shutdown(failures) {
        try {
            await this.reporter.waitForSync()
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
        const hasSessionId = global.browser && (this.isMultiremote
            /**
             * every multiremote instance should exist and should have `sessionId`
             */
            ? !global.browser.instances.some(i => global.browser[i] && !global.browser[i].sessionId)
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
        let capabilities = global.browser.capabilities || {}
        if (this.isMultiremote) {
            global.browser.instances.forEach(i => { capabilities[i] = global.browser[i].capabilities })
        }

        await global.browser.deleteSession()

        /**
         * delete session(s)
         */
        if (this.isMultiremote) {
            global.browser.instances.forEach(i => { delete global.browser[i].sessionId })
        } else {
            delete global.browser.sessionId
        }

        await runHook('afterSession', global.browser.config, capabilities, this.specs)
    }
}
