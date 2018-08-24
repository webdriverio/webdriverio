import fs from 'fs'
import path from 'path'
import util from 'util'
import merge from 'deepmerge'
import EventEmitter from 'events'

import logger from 'wdio-logger'
import { ConfigParser, initialisePlugin } from 'wdio-config'
import { remote, multiremote } from 'webdriverio'

import BaseReporter from './reporter'
import { runHook } from './utils'

const log = logger('wdio-runner')
const MERGE_OPTIONS = { clone: false }

export default class Runner extends EventEmitter {
    constructor () {
        super()

        this.configParser = new ConfigParser()
        this.sigintWasCalled = false
    }

    async run (m) {
        this.cid = m.cid
        this.specs = m.specs
        this.caps = m.caps

        /**
         * add config file
         */
        this.configParser.addConfigFile(m.configFile)

        /**
         * merge cli arguments into config
         */
        this.configParser.merge(m.argv)

        /**
         * merge host/port changes by service launcher into config
         */
        this.configParser.merge(m.server)

        let config = this.configParser.getConfig()
        this.initialiseServices(config)

        this.framework = initialisePlugin(config.framework, 'framework').adapterFactory
        this.reporter = new BaseReporter(config, this.cid)
        this.inWatchMode = Boolean(config.watch)

        try {
            await runHook('beforeSession', config, this.caps, this.specs)
            const browser = global.browser = global.driver = await this.initialiseInstance(m.isMultiremote, this.caps)
            browser.config = config

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

            /**
             * initialisation successful, send start message
             */
            this.reporter.emit('runner:start', {
                cid: m.cid,
                specs: m.specs,
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
             * register global helper method to fetch elements
             */
            global.$ = (selector) => global.browser.$(selector)
            global.$$ = (selector) => global.browser.$$(selector)

            /**
             * kill session of SIGINT signal showed up while trying to
             * get a session ID
             */
            if (this.sigintWasCalled) {
                log.info('SIGINT signal detected while starting session, shutting down...')
                return this.shutdown(0)
            }

            const failures = await this.framework.run(m.cid, config, m.specs, this.caps, this.reporter)
            await this.fetchDriverLogs()
            await browser.deleteSession()
            delete browser.sessionId

            await runHook('afterSession', config, this.caps, this.specs)
            return this.shutdown(failures)
        } catch (e) {
            log.error(e)
            return this.shutdown(1, true)
        }
    }

    /**
     * fetch logs provided by browser driver
     */
    async fetchDriverLogs () {
        const config = this.configParser.getConfig()

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
     * kill runner session and end session if one was already started
     */
    async shutdown (failures, noSessionStarted) {
        if (global.browser && global.browser.sessionId) {
            await global.browser.deleteSession()
        }

        /**
         * only report if session was actually started
         */
        if (!noSessionStarted) {
            this.reporter.emit('runner:end', {
                failures,
                cid: this.cid
            })
        }

        this.emit('exit', failures === 0 ? 0 : 1)
    }

    /**
     * initialise browser instance depending whether remote or multiremote is requested
     */
    async initialiseInstance (isMultiremote, capabilities) {
        let config = this.configParser.getConfig()

        if (!isMultiremote) {
            log.debug('init remote session')
            config.capabilities = capabilities
            return remote(config)
        }

        const options = {}
        log.debug('init multiremote session')
        for (let browserName of Object.keys(capabilities)) {
            options[browserName] = merge(config, capabilities[browserName], MERGE_OPTIONS)
        }

        const browser = await multiremote(options)
        for (let browserName of Object.keys(capabilities)) {
            global[browserName] = browser[browserName]
        }

        return browser
    }

    /**
     * initialise WebdriverIO compliant services
     */
    initialiseServices (config) {
        if (!Array.isArray(config.services)) {
            return
        }

        for (let serviceName of config.services) {
            /**
             * allow custom services
             */
            if (typeof serviceName === 'object') {
                log.debug(`initialise custom service "${serviceName}"`)
                this.configParser.addService(serviceName)
                continue
            }

            log.debug(`initialise wdio service "${serviceName}"`)
            const Service = initialisePlugin(serviceName, 'service')
            this.configParser.addService(new Service(config, this.caps))
        }
    }
}
