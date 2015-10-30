import merge from 'deepmerge'

import ConfigParser from './utils/ConfigParser'
import { remote, multiremote } from '../'

var haltSIGINT = false
var sigintWasCalled = false
var hasSessionID = false
var end

process.on('message', (m) => {
    let capabilities

    switch (m.command) {
    case 'run':

        let configParser = new ConfigParser()
        configParser.addConfigFile(m.configFile)
        configParser.merge(m.argv)

        let config = configParser.getConfig()
        capabilities = configParser.getCapabilities(m.cid)

        if (typeof config.framework !== 'string') {
            throw new Error('You haven\'t defined a valid framework\nPlease checkout http://webdriver.io/guide/testrunner/frameworks.html')
        }

        let frameworkLibrary = config.framework.toLowerCase()
        let framework

        try {
            framework = require(`wdio-${frameworkLibrary}-framework`)
        } catch (e) {
            throw new Error(`Couldn't load "${frameworkLibrary}" framework. You need to install it with \`$ npm install wdio-${frameworkLibrary}-framework\`!`)
        }

        process.send({
            event: 'runner:start',
            cid: m.cid,
            capabilities: capabilities,
            config: config
        })

        if (m.isMultiremote) {
            let options = capabilities

            for (let browserName of Object.keys(options)) {
                options[browserName] = merge(config, options[browserName])
            }

            global.browser = multiremote(options)

            /**
             * put browser name into global scope
             */
            for (let browserName of Object.keys(options)) {
                global[browserName] = global.browser.select(browserName)
            }
        } else {
            config.desiredCapabilities = capabilities
            global.browser = remote(config)
        }

        end = global.browser.end

        /**
         * initialise WebdriverIO compliant plugins
         */
        if (typeof config.plugins === 'object') {
            for (let pluginName of Object.keys(config.plugins)) {
                let plugin

                try {
                    plugin = require(pluginName)
                } catch (e) {
                    throw new Error(`Couldn't find plugin "${pluginName}". You need to install it with \`$ npm install ${pluginName}\`!`)
                }

                if (typeof plugin.init !== 'function') {
                    throw new Error(`The plugin "${pluginName}" is not WebdriverIO compliant!`)
                }

                plugin.init(global.browser, config.plugins[pluginName])
            }
        }

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

            hasSessionID = true
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

        /**
         * make sure we prevent process from getting killed
         */
        haltSIGINT = true
        let throwError = function (e) {
            process.send({
                event: 'error',
                cid: m.cid,
                capabilities: capabilities,
                error: {
                    message: e.message,
                    stack: e.stack
                }
            })
            return 1
        }

        let failures
        global.browser.init().then(() => {
            haltSIGINT = false

            /**
             * kill session of SIGINT signal showed up while trying to
             * get a session ID
             */
            if (sigintWasCalled) {
                return end.call(global.browser).finally(() => {
                    process.send({
                        event: 'runner:end',
                        cid: m.cid
                    })
                    process.exit(1)
                })
            }

            try {
                return framework.run(m.cid, config, m.specs, capabilities)
            } catch (e) {
                throwError(e)
            }
        }, throwError).then((f) => {
            failures = f
            return end.call(global.browser)
        }, throwError).then((res) => {
            if (!config.updateJob || config.host.indexOf('saucelabs') === -1 || !res || !res.sessionId) {
                return
            }

            // ToDo update sauce job
            return null
        }, throwError).finally(() => {
            process.send({
                event: 'runner:end',
                failures: failures,
                cid: m.cid
            })

            process.exit(failures === 0 ? 0 : 1)
        })

        break
    default:
        throw new Error(`Can't recognise "${m.command}" command`)
    }
})

/**
 * catches ctrl+c event
 */
process.on('SIGINT', () => {
    if (sigintWasCalled) {
        return
    }

    sigintWasCalled = true

    if (haltSIGINT) {
        return
    }

    if (!hasSessionID) {
        return process.kill(1)
    }

    global.browser.removeAllListeners()
    end().finally(() => process.exit(1))
})
