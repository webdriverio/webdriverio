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
        this.sigintWasCalled = false
    }

    async run (m) {
        this.cid = m.cid
        this.specs = m.specs
        this.caps = m.caps

        this.configParser = new ConfigParser()
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
        this.reporter = new BaseReporter(config.reporters, config.reporterOptions)
        this.inWatchMode = Boolean(config.watch)

        try {
            await runHook('beforeSession', config, this.caps, this.specs)
            const browser = global.browser = await this.initialiseInstance(m.isMultiremote, this.caps)

            /**
             * register beforeCommand event
             */
            browser.on('command', (command) => {
                const runnerInfo = {
                    cid: m.cid,
                    sessionId: browser.sessionId,
                    capabilities: browser.options.capabilities
                }
                this.reporter.emit('client:beforeCommand', Object.assign(command, runnerInfo))
            })

            /**
             * register afterCommand event
             */
            browser.on('result', (result) => {
                const runnerInfo = {
                    cid: m.cid,
                    sessionId: browser.sessionId,
                    capabilities: browser.options.capabilities
                }
                this.reporter.emit('client:afterCommand', Object.assign(result, runnerInfo))
            })

            /**
             * initialisation successful, send start message
             */
            this.reporter.emit({
                event: 'runner:start',
                cid: m.cid,
                specs: m.specs,
                sessionId: browser.sessionId,
                capabilities: browser.options.capabilities,
                config
            })

            /**
             * register global helper method to fetch elements
             */
            global.$ = ::browser.$
            global.$$ = ::browser.$$

            /**
             * kill session of SIGINT signal showed up while trying to
             * get a session ID
             */
            if (this.sigintWasCalled) {
                log.info('SIGINT signal detected while starting session, shutting down...')
                return this.shutdown(0)
            }

            const failures = await this.framework.run(m.cid, config, m.specs, this.caps, this.reporter)
            await browser.deleteSession()
            delete browser.sessionId

            await runHook('afterSession', config, this.caps, this.specs)
            return this.shutdown(failures)
        } catch (e) {
            log.error(e)
            return this.shutdown(1)
        }
    }

    /**
     * kill runner session and end session if one was already started
     */
    async shutdown (failures) {
        if (global.browser && global.browser.sessionId) {
            await global.browser.deleteSession()
        }

        process.send({
            event: 'runner:end',
            failures,
            cid: this.cid
        })

        process.removeAllListeners()
        process.exit(failures === 0 ? 0 : 1)
    }

    /**
     * initialise browser instance depending whether remote or multiremote is requested
     */
    initialiseInstance (isMultiremote, capabilities) {
        let config = this.configParser.getConfig()

        if (!isMultiremote) {
            log.debug('init remote session')
            config.capabilities = capabilities
            return remote(config)
        }

        let options = {}
        log.debug('init multiremote session')
        for (let browserName of Object.keys(capabilities)) {
            options[browserName] = merge(config, capabilities[browserName], MERGE_OPTIONS)
        }

        let browser = multiremote(options)
        for (let browserName of Object.keys(capabilities)) {
            global[browserName] = browser.select(browserName)
        }
        browser.isMultiremote = true
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
                this.configParser.addService(serviceName)
                continue
            }

            this.configParser.addService(initialisePlugin(serviceName, 'service'))
        }
    }
}
