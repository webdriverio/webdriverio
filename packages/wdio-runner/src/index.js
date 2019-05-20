import fs from 'fs'
import path from 'path'
import util from 'util'
import EventEmitter from 'events'

import logger from '@wdio/logger'
import { initialiseServices, initialisePlugin } from '@wdio/utils'
import { ConfigParser } from '@wdio/config'

import BaseReporter from './reporter'
import { runHook, initialiseInstance, filterLogTypes, getInstancesData, attachToMultiremote } from './utils'

const log = logger('@wdio/runner')

export default class Runner extends EventEmitter {
    constructor () {
        super()
        this.configParser = new ConfigParser()
        this.sigintWasCalled = false
    }

    /**
     * run test suite
     * @param  {String}    cid            worker id (e.g. `0-0`)
     * @param  {Object}    argv           cli arguments passed into wdio command
     * @param  {String[]}  specs          list of spec files to run
     * @param  {Object}    caps           capabilities to run session with
     * @param  {String}    configFile     path to config file to get config from
     * @param  {Object}    server         modified WebDriver target
     * @param  {Number}    retries        number of retries remaining
     * @return {Promise}                  resolves in number of failures for testrun
     */
    async run ({ cid, argv, specs, caps, configFile, server, retries }) {
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
        this.configParser.merge(argv)

        /**
         * merge host/port changes by service launcher into config
         */
        this.configParser.merge(server)

        this.config = this.configParser.getConfig()
        logger.setLogLevelsConfig(this.config.logLevels, this.config.logLevel)
        this.isMultiremote = !Array.isArray(this.configParser.getCapabilities())
        initialiseServices(this.config, caps).map(::this.configParser.addService)

        await runHook('beforeSession', this.config, this.caps, this.specs)
        const browser = await this._initSession(this.config, this.caps)

        this.reporter = new BaseReporter(this.config, this.cid, browser.capabilities)
        this.inWatchMode = Boolean(this.config.watch)

        /**
         * return if session initialisation failed
         */
        if (!browser) {
            return this._shutdown(1)
        }

        const isMultiremote = Boolean(browser.isMultiremote)

        /**
         * kill session of SIGINT signal showed up while trying to
         * get a session ID
         */
        if (this.sigintWasCalled) {
            log.info('SIGINT signal detected while starting session, shutting down...')
            await this.endSession()
            return this._shutdown(0)
        }

        /**
         * initialise framework
         */
        this.framework = initialisePlugin(this.config.framework, 'framework')

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
                    return caps
                }, {})
                : browser.capabilities,
            retry: (this.config.specFileRetries || 0) - (retries || 0)
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
            failures = await this.framework.run(cid, this.config, specs, caps, this.reporter)
            await this._fetchDriverLogs(this.config, caps.excludeDriverLogs)
        } catch (e) {
            log.error(e)
            this.emit('error', e)
            failures = 1
        }

        /**
         * in watch mode we don't close the session and leave current page opened
         */
        if (!argv.watch) {
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
     * init WebDriver session
     * @param  {object}  config        configuration of sessions
     * @param  {Object}  caps          desired cabilities of session
     * @return {Promise}               resolves with browser object or null if session couldn't get established
     */
    async _initSession (config, caps) {
        let browser = null

        try {
            browser = global.browser = global.driver = await initialiseInstance(config, caps, this.isMultiremote)
        } catch (e) {
            log.error(e)
            this.emit('error', e)
            return browser
        }

        browser.config = config

        /**
         * register global helper method to fetch elements
         */
        global.$ = (selector) => browser.$(selector)
        global.$$ = (selector) => browser.$$(selector)

        /**
         * register command event
         */
        // console.log(this)
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
     * fetch logs provided by browser driver
     */
    async _fetchDriverLogs (config, excludeDriverLogs) {
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
    async _shutdown (failures) {
        await this.reporter.waitForSync()
        this.emit('exit', failures === 0 ? 0 : 1)
        return failures
    }

    /**
     * end WebDriver session, a config object can be applied if object has changed
     * within a hook by the user
     */
    async endSession (payload) {
        /**
         * Attach to browser session before killing it in Multiremote
         */
        if (!global.browser && payload && payload.argv && payload.argv.watch) {
            if (payload.argv.isMultiremote) {
                this.isMultiremote = true
                global.browser = await attachToMultiremote(payload.argv.instances, payload.argv.caps)
            } else {
                global.browser = await initialiseInstance(payload.argv.config, payload.argv.caps, false)
            }
        }

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
        if (!payload && !hasSessionId) {
            return
        }

        /**
         * if payload was called but no session was created, wait until it was
         * and try to end it
         */
        if (payload && !hasSessionId) {
            await new Promise((resolve) => setTimeout(resolve, 250))
            return this.endSession(payload)
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

        if (payload) {
            return this._shutdown()
        }
    }
}
