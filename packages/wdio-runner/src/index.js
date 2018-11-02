import fs from 'fs'
import path from 'path'
import util from 'util'
import EventEmitter from 'events'

import logger from 'wdio/logger'
import { ConfigParser, initialisePlugin } from 'wdio/config'

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
     * @param  {Boolean}   isMultiremote  flag to run in multiremote or not
     * @param  {Object}    server         modified WebDriver target
     * @return {Promise}                  resolves in number of failures for testrun
     */
    async run ({ cid, argv, specs, caps, configFile, isMultiremote, server }) {
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

        let config = this.configParser.getConfig()
        initialiseServices(config).map(::this.configParser.addService)

        this.framework = initialisePlugin(config.framework, 'framework').adapterFactory
        this.reporter = new BaseReporter(config, this.cid)
        this.inWatchMode = Boolean(config.watch)

        await runHook('beforeSession', config, this.caps, this.specs)
        const browser = await this._initSession(config, this.caps, isMultiremote)

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
            return this._shutdown(0)
        }

        /**
         * initialisation successful, send start message
         */
        this.reporter.emit('runner:start', {
            cid: cid,
            specs: specs,
            sessionId: browser.sessionId,
            capabilities: browser.isMultiremote
                ? browser.instances.reduce((caps, browserName) => {
                    caps[browserName] = browser[browserName].capabilities
                    return caps
                }, {})
                : browser.options.capabilities,
            config,
            isMultiremote: browser.isMultiremote
        })

        /**
         * kick off tests in framework
         */
        let failures = 0
        try {
            failures = failures = await this.framework.run(cid, config, specs, caps, this.reporter)
            await this._fetchDriverLogs(config)
            await this._endSession(config)
        } catch (e) {
            log.error(e)
            this.emit('error', e)
            failures = 1
        }

        this.reporter.emit('runner:end', {
            failures,
            cid: this.cid
        })

        this._shutdown(failures)
        return failures
    }

    /**
     * init WebDriver session
     * @param  {object}  config        configuration of sessions
     * @param  {Object}  caps          desired cabilities of session
     * @param  {Boolean} isMultiremote flag to determine whether to run as multiremote
     * @return {Promise}               resolves with browser object or null if session couldn't get established
     */
    async _initSession (config, caps, isMultiremote) {
        let browser = null

        try {
            browser = global.browser = global.driver = await initialiseInstance(config, this.caps, isMultiremote)
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
         * only fetch logs if driver supports it
         */
        if (!config.logDir || typeof global.browser.getLogs !== 'function') {
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
     *
     * @param  {Object}  config  configuration object
     */
    async _endSession (config) {
        await global.browser.deleteSession()
        delete global.browser.sessionId
        await runHook('afterSession', config, this.caps, this.specs)
    }
}
