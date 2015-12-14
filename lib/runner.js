import merge from 'deepmerge'

import ConfigParser from './utils/ConfigParser'
import { remote, multiremote } from '../'

class Runner {
    constructor () {
        this.haltSIGINT = false
        this.sigintWasCalled = false
        this.hasSessionID = false
        this.failures = 0
    }

    async run (m) {
        this.cid = m.cid

        this.configParser = new ConfigParser()
        this.configParser.addConfigFile(m.configFile)
        this.configParser.merge(m.argv)

        let config = this.configParser.getConfig()
        let capabilities = this.configParser.getCapabilities(m.cid)

        this.addCommandHooks(config)

        this.framework = this.initialiseFramework(config)
        global.browser = this.initialiseInstance(m.isMultiremote, capabilities)
        this.initialisePlugins(config)
        this.initialiseServices(config)

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
            capabilities: capabilities,
            config: config
        })

        /**
         * register runner events
         */
        global.browser.on('init', (payload) => {
            process.send({
                event: 'runner:init',
                cid: m.cid,
                sessionID: payload.sessionID,
                options: payload.options,
                desiredCapabilities: payload.desiredCapabilities
            })

            this.hasSessionID = true
        })

        global.browser.on('command', (payload) => {
            process.send({
                event: 'runner:command',
                cid: m.cid,
                method: payload.method,
                uri: payload.uri,
                data: payload.data
            })
        })

        global.browser.on('result', (payload) => {
            process.send({
                event: 'runner:result',
                cid: m.cid,
                requestData: payload.requestData,
                requestOptions: payload.requestOptions,
                body: payload.body // ToDo figure out if this slows down the execution time
            })
        })

        global.browser.on('error', (payload) => {
            process.send({
                event: 'runner:error',
                cid: m.cid,
                err: payload.err,
                requestData: payload.requestData,
                requestOptions: payload.requestOptions,
                body: payload.body
            })
        })

        this.haltSIGINT = true

        try {
            let res = await global.browser.init()
            global.browser.sessionId = res.sessionId
            this.haltSIGINT = false

            /**
             * kill session of SIGINT signal showed up while trying to
             * get a session ID
             */
            if (this.sigintWasCalled) {
                await this.end(1)
            }

            this.failures = await this.framework.run(m.cid, config, m.specs, capabilities)
            await this.end(this.failures)
        } catch (e) {
            process.send({
                event: 'error',
                cid: this.cid,
                capabilities,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            })

            await this.end(1)
        }
    }

    /**
     * end test runner instance and exit process
     */
    async end (failures = 0) {
        if (this.hasSessionID) {
            await this.endSession()
        }

        process.send({
            event: 'runner:end',
            failures: failures,
            cid: this.cid
        })
        process.exit(failures === 0 ? 0 : 1)
    }

    addCommandHooks (config) {
        config.onCommandException.push((command, args, result, e) => {
            if (!e) return
            let error = e
            let commandCall
            while (error) {
                if (!commandCall && error.commandCall) {
                    commandCall = error.commandCall
                }
                if (error.seleniumStack && error.seleniumStack.type === 'StaleElementReference') {
                    if (commandCall) {
                        global.browser.logger.log(`Caught StaleElementReference in command [${commandCall.name}]. Will re-run with arguments: ${JSON.stringify(commandCall.args)}`)
                        e.wdioExceptionHandler = global.browser[commandCall.name].bind(global.browser, ...commandCall.args)
                    }
                    break
                }
                error = error.previousError
            }
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

        global.browser.removeAllListeners()
        this.end(1)
    }

    initialiseFramework (config) {
        if (typeof config.framework !== 'string') {
            throw new Error(
                `You haven't defined a valid framework. ` +
                `Please checkout http://webdriver.io/guide/testrunner/frameworks.html`
            )
        }

        let frameworkLibrary = config.framework.toLowerCase()
        try {
            return require(`wdio-${frameworkLibrary}-framework`).adapterFactory
        } catch (e) {
            throw new Error(
                `Couldn't load "${frameworkLibrary}" framework. You need to install ` +
                `it with \`$ npm install wdio-${frameworkLibrary}-framework\`!`
            )
        }
    }

    initialiseInstance (isMultiremote, capabilities) {
        let config = this.configParser.getConfig()

        if (!isMultiremote) {
            config.desiredCapabilities = capabilities
            return remote(config)
        }

        let options = capabilities
        for (let browserName of Object.keys(options)) {
            options[browserName] = merge(config, options[browserName])
        }

        let browser = multiremote(options)
        for (let browserName of Object.keys(options)) {
            global[browserName] = browser.select(browserName)
        }
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
                throw new Error(
                    `Couldn't find plugin "${pluginName}". You need to install it ` +
                    `with \`$ npm install ${pluginName}\`!`
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

            try {
                service = require(`wdio-${serviceName}-service`)
            } catch (e) {
                throw new Error(
                    `Couldn't find service "${serviceName}". You need to install it ` +
                    `with \`$ npm install wdio-${serviceName}-service\`!`
                )
            }

            this.configParser.addService(service)
        }
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
            cid: runner.cid
        })
        process.exit(1)
    })
})

/**
 * catches ctrl+c event
 */
process.on('SIGINT', () => {
    runner.sigintHandler()
})
