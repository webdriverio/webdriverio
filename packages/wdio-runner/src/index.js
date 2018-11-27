import fs from 'fs'
import path from 'path'
import util from 'util'
import EventEmitter from 'events'

import logger from '@wdio/logger'
import { ConfigParser, initialisePlugin } from '@wdio/config'

import BaseReporter from './reporter'
import { runHook, initialiseServices, initialiseInstance } from './utils'

const log = logger('wdio-runner')

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
     * @param  {Object}    caps           capabilties to run session with
     * @param  {String}    configFile     path to config file to get config from
     * @param  {Object}    server         modified WebDriver target
     * @return {Promise}                  resolves in number of failures for testrun
     */
    async run ({ cid, argv, specs, caps, configFile, server }) {
        this.cid = cid
        this.specs = specs
        this.caps = caps

        /**
         * add config file
         */
        this.configParser.addConfigFile(configFile)

        /**
         * merge cli arguments into config
         */
        this.configParser.merge(argv)

        /**
         * merge host/port changes by service launcher into config
         */
        this.configParser.merge(server)

        this.config = this.configParser.getConfig()
        initialiseServices(this.config, caps).map(::this.configParser.addService)

        this.reporter = new BaseReporter(this.config, this.cid)
        this.inWatchMode = Boolean(this.config.watch)

        await runHook('beforeSession', this.config, this.caps, this.specs)
        const browser = await this._initSession(this.config, this.caps)
        const isMultiremote = Boolean(browser.isMultiremote)

        /**
         * return if session initialisation failed
         */
        if (!browser) {
            return this._shutdown(1)
        }

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
                : browser.options.capabilities
        })

        /**
         * report sessionId and target connection information to worker
         */
        const { protocol, hostname, port, path, queryParams } = browser.options
        const { isW3C, sessionId } = browser
        process.send({
            origin: 'worker',
            name: 'sessionStarted',
            content: { sessionId, isW3C, protocol, hostname, port, path, queryParams }
        })

        /**
         * kick off tests in framework
         */
        let failures = 0
        try {
            failures = failures = await this.framework.run(cid, this.config, specs, caps, this.reporter)
            await this._fetchDriverLogs(this.config)

            /**
             * in watch mode we don't close the session and open a blank page instead
             */
            if (!argv.watch) {
                await this.endSession()
            } else {
                await global.browser.url('about:blank')
            }
        } catch (e) {
            log.error(e)
            this.emit('error', e)
            failures = 1
        }

        this.reporter.emit('runner:end', {
            failures,
            cid: this.cid
        })

        await this._shutdown(failures)
        return failures
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
    async _fetchDriverLogs (config) {
        /**
         * only fetch logs if
         */
        if (
            /**
             * a log directory is given in config
             */
            !config.logDir ||
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

        const logTypes = await global.browser.getLogTypes()
        log.debug(`Fetching logs for ${logTypes.join(', ')}`)
        return Promise.all(logTypes.map(async (logType) => {
            const logs = await global.browser.getLogs(logType)

            /**
             * don't write to file if no logs were captured
             */
            if (logs.length === 0) {
                return
            }

            const stringLogs = logs.map((log) => JSON.stringify(log)).join('\n')
            return util.promisify(fs.writeFile)(
                path.join(config.logDir, `wdio-${this.cid}-${logType}.log`),
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
    }

    /**
     * end WebDriver session, a config object can be applied if object has changed
     * within a hook by the user
     */
    async endSession (shutdown) {
        /**
         * don't do anything if test framework returns after SIGINT
         * if endSession is called without shutdown flag we expect a session id
         */
        if (!shutdown && (!global.browser || !global.browser.sessionId)) {
            return
        }

        /**
         * if shutdown was called but no session was created, wait until it was
         * and try to end it
         */
        if (shutdown && (!global.browser || !global.browser.sessionId)) {
            await new Promise((resolve) => setTimeout(resolve, 250))
            return this.endSession(shutdown)
        }

        await global.browser.deleteSession()
        delete global.browser.sessionId

        await runHook('afterSession', global.browser.config, this.caps, this.specs)

        if (shutdown) {
            await this._shutdown()
        }
    }
}
