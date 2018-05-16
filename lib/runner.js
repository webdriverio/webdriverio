import merge from 'deepmerge'
import Gaze from 'gaze'

import ConfigParser from './utils/ConfigParser'
import { remote, multiremote } from '../'

const WATCH_NOTIFICATION = '\nWDIO is now in watch mode and is waiting for a change...'
const MERGE_OPTIONS = { clone: false }

class Runner {
    constructor () {
        this.haltSIGINT = false
        this.sigintWasCalled = false
        this.hasSessionID = false
        this.failures = 0
        this.forceKillingProcess = false
        this.isRunning = false
        this.fileTriggeredWhileRunning = null
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
        this.addCommandHooks(config)
        this.initialiseServices(config)

        await this.runHook('beforeSession', config, this.caps, this.specs)

        this.framework = this.initialiseFramework(config)
        global.browser = this.initialiseInstance(m.isMultiremote, this.caps)
        this.initialisePlugins(config)

        /**
         * store end method before it gets fiberised by wdio-sync
         */
        this.endSession = global.browser.end.bind(global.browser)

        /**
         * initialisation successful, send start message
         */
        process.send({
            event: 'runner:start',
            cid: m.cid,
            specs: m.specs,
            capabilities: this.caps,
            config
        })

        /**
         * register runner events
         */
        global.browser.on('init', (payload) => {
            process.send({
                event: 'runner:init',
                cid: m.cid,
                specs: this.specs,
                sessionID: payload.sessionID,
                options: payload.options,
                desiredCapabilities: payload.desiredCapabilities
            })

            this.hasSessionID = true
        })

        global.browser.on('command', (payload) => {
            const command = {
                event: 'runner:command',
                cid: m.cid,
                specs: this.specs,
                method: payload.method,
                uri: payload.uri,
                data: payload.data
            }
            process.send(this.addTestDetails(command))
        })

        global.browser.on('result', (payload) => {
            const result = {
                event: 'runner:result',
                cid: m.cid,
                specs: this.specs,
                body: payload.body // ToDo figure out if this slows down the execution time
            }

            /**
             * multiremote doesn't send request data and options
             */
            if (!global.browser.isMultiremote) {
                const { uri, method, headers, timeout } = payload.requestOptions
                result.requestOptions = { uri, method, headers, timeout }
                result.requestData = payload.requestData
            }

            process.send(this.addTestDetails(result))

            /**
             * update sessionId property
             */
            if (payload.requestOptions && payload.requestOptions.method === 'POST' && payload.requestOptions.uri.path.match(/\/session$/)) {
                global.browser.sessionId = payload.body.sessionId
            }
        })

        global.browser.on('screenshot', (payload) => {
            const details = {
                event: 'runner:screenshot',
                cid: m.cid,
                specs: this.specs,
                filename: payload.filename,
                data: payload.data
            }
            process.send(this.addTestDetails(details))
        })

        global.browser.on('log', (...data) => {
            const details = {
                event: 'runner:log',
                cid: m.cid,
                specs: this.specs,
                data
            }
            process.send(this.addTestDetails(details))
        })

        process.on('test:start', (test) => {
            this.currentTest = test
        })

        global.browser.on('error', (payload) => {
            process.send({
                event: 'runner:error',
                cid: m.cid,
                specs: this.specs,
                error: payload,
                capabilities: this.caps
            })
        })

        this.haltSIGINT = true
        this.inWatchMode = Boolean(config.watch)

        /**
         * register global helper method to fetch elements
         */
        global.$ = (selector) => global.browser.element(selector)
        global.$$ = (selector) => global.browser.elements(selector).value

        try {
            let res = await global.browser.init()
            global.browser.sessionId = res.sessionId
            this.haltSIGINT = false

            /**
             * make sure init and end can't get called again
             */
            global.browser.options.isWDIO = true

            /**
             * kill session of SIGINT signal showed up while trying to
             * get a session ID
             */
            if (this.sigintWasCalled) {
                await this.end(1)
                process.removeAllListeners()
                global.browser.removeAllListeners()
                return
            }

            if (this.inWatchMode) {
                return this.runWatchMode(m.cid, config, m.specs)
            }

            this.failures = await this.framework.run(m.cid, config, m.specs, this.caps)
            await this.end(this.failures)

            await this.runHook('afterSession', config, this.caps, this.specs)
            process.exit(this.failures === 0 ? 0 : 1)
        } catch (e) {
            process.send({
                event: 'error',
                cid: this.cid,
                specs: this.specs,
                capabilities: this.caps,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            })

            await this.end(1)
            process.removeAllListeners()
            global.browser.removeAllListeners()
            process.exit(1)
        }
    }

    /**
     * end test runner instance and exit process
     */
    async end (failures = 0, inWatchMode = this.inWatchMode, sendProcessEvent = true) {
        if (this.hasSessionID && !inWatchMode) {
            global.browser.options.isWDIO = false
            try {
                global.browser.options.isWDIOSessionCleanUp = true
                await this.endSession()
                global.browser.options.isWDIOSessionCleanUp = false
            } finally {}
        }

        if (!sendProcessEvent) {
            return
        }

        process.send({
            event: 'runner:end',
            failures: failures,
            cid: this.cid,
            specs: this.specs
        })
    }

    /**
     * run watcher
     */
    runWatchMode (cid, config, specs) {
        this.gaze = new Gaze(specs, { interval: 1000 })

        console.log(WATCH_NOTIFICATION)
        this.gaze.on('changed', async (filepath) => {
            if (this.isRunning) {
                this.fileTriggeredWhileRunning = filepath
                return
            }

            /**
             * check if file is in require.cache
             * this is required to run specs multiple times
             */
            if (require.cache[require.resolve(filepath)]) {
                delete require.cache[require.resolve(filepath)]
            }

            console.log('change detected, running ...')
            this.isRunning = true
            const failures = await this.framework.run(cid, config, [filepath], this.caps)
            await this.end(failures, true)

            setTimeout(() => {
                this.isRunning = false
                console.log(WATCH_NOTIFICATION)

                /**
                 * retrigger onchange event if user has saved file while test
                 * was running
                 */
                if (this.fileTriggeredWhileRunning) {
                    this.gaze.emit('changed', this.fileTriggeredWhileRunning)
                    this.fileTriggeredWhileRunning = null
                }
            }, 500)
        })
    }

    addTestDetails (payload) {
        if (this.currentTest) {
            payload.title = this.currentTest.title
            payload.uid = this.currentTest.uid || this.currentTest.title
            payload.parent = this.currentTest.parent
            payload.parentUid = this.currentTest.parentUid || this.currentTest.parent
        }
        return payload
    }

    addCommandHooks (config) {
        config.beforeCommand.push((command, args) => {
            const payload = {
                event: 'runner:beforecommand',
                cid: this.cid,
                specs: this.specs,
                command,
                args
            }
            process.send(this.addTestDetails(payload))
        })
        config.afterCommand.push((command, args, result, err) => {
            const payload = {
                event: 'runner:aftercommand',
                cid: this.cid,
                specs: this.specs,
                command,
                args,
                result,
                err
            }
            process.send(this.addTestDetails(payload))
        })
    }

    sigintHandler () {
        if (this.sigintWasCalled) {
            return
        }

        this.sigintWasCalled = true

        if (this.haltSIGINT) {
            return
        }

        this.end(1, false, !this.inWatchMode)
        global.browser.removeAllListeners()
        process.removeAllListeners()

        if (this.gaze) {
            this.gaze.close()
        }
    }

    initialiseFramework (config) {
        if (typeof config.framework !== 'string') {
            throw new Error(
                'You haven\'t defined a valid framework. ' +
                'Please checkout http://webdriver.io/guide/testrunner/frameworks.html'
            )
        }

        let frameworkLibrary = `wdio-${config.framework.toLowerCase()}-framework`
        try {
            return require(frameworkLibrary).adapterFactory
        } catch (e) {
            if (!e.message.match(`Cannot find module '${frameworkLibrary}'`)) {
                throw new Error(`Couldn't initialise framework "${frameworkLibrary}".\n${e.stack}`)
            }

            throw new Error(
                `Couldn't load "${frameworkLibrary}" framework. You need to install ` +
                `it with \`$ npm install ${frameworkLibrary}\`!\n${e.stack}`
            )
        }
    }

    initialiseInstance (isMultiremote, capabilities) {
        let config = this.configParser.getConfig()

        if (!isMultiremote) {
            config.desiredCapabilities = capabilities
            return remote(config)
        }

        let options = {}
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
     * initialise WebdriverIO compliant plugins
     */
    initialisePlugins (config) {
        if (typeof config.plugins !== 'object') {
            return
        }

        for (let pluginName of Object.keys(config.plugins)) {
            let plugin

            try {
                plugin = require(pluginName)
            } catch (e) {
                if (!e.message.match(`Cannot find module '${pluginName}'`)) {
                    throw new Error(`Couldn't initialise service "${pluginName}".\n${e.stack}`)
                }

                throw new Error(
                    `Couldn't find plugin "${pluginName}". You need to install it ` +
                    `with \`$ npm install ${pluginName}\`!\n${e.stack}`
                )
            }

            if (typeof plugin.init !== 'function') {
                throw new Error(`The plugin "${pluginName}" is not WebdriverIO compliant!`)
            }

            plugin.init(global.browser, config.plugins[pluginName])
        }
    }

    /**
     * initialise WebdriverIO compliant services
     */
    initialiseServices (config) {
        if (!Array.isArray(config.services)) {
            return
        }

        for (let serviceName of config.services) {
            let service

            /**
             * allow custom services
             */
            if (typeof serviceName === 'object') {
                this.configParser.addService(serviceName)
                continue
            }

            try {
                service = require(`wdio-${serviceName}-service`)
            } catch (e) {
                if (!e.message.match(`Cannot find module '${serviceName}'`)) {
                    throw new Error(`Couldn't initialise service "${serviceName}".\n${e.stack}`)
                }

                throw new Error(
                    `Couldn't find service "${serviceName}". You need to install it ` +
                    `with \`$ npm install wdio-${serviceName}-service\`!`
                )
            }

            this.configParser.addService(service)
        }
    }

    /**
     * run before/after session hook
     */
    runHook (hookName, config, caps, specs) {
        const catchFn = (e) => console.error(`Error in ${hookName}: ${e.stack}`)

        return Promise.all(
            config[hookName].map((hook) => {
                try {
                    return hook(config, caps, specs)
                } catch (e) {
                    return catchFn(e)
                }
            })
        ).catch(catchFn)
    }
}

let runner = new Runner()

process.on('message', (m) => {
    runner[m.command](m).catch((e) => {
        /**
         * custom exit code to propagate initialisation error
         */
        process.send({
            event: 'runner:error',
            error: {
                message: e.message,
                stack: e.stack
            },
            capabilities: runner.configParser.getCapabilities(runner.cid),
            cid: runner.cid,
            specs: runner.specs
        })
        process.exit(1)
    })
})

/**
 * catches ctrl+c event
 */
process.on('SIGINT', () => {
    /**
     * force killing process when 2nd SIGINT comes in
     */
    if (runner.forceKillingProcess) {
        return process.exit(1)
    }

    runner.forceKillingProcess = true
    runner.sigintHandler()
})
