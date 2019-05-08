import logger from '@wdio/logger'

import CommandHandler from './commands'
import DevToolsDriver from './driver'
import Auditor from './auditor'
import TraceGatherer from './gatherer/trace'
import DevtoolsGatherer from './gatherer/devtools'
import { findCDPInterface, getCDPClient } from './utils'

const log = logger('@wdio/devtools-service')
const UNSUPPORTED_ERROR_MESSAGE = 'The @wdio/devtools-service currently only supports Chrome version 63 and up'
const TRACE_COMMANDS = ['click', 'navigateTo']

export default class DevToolsService {
    constructor (options = {}) {
        this.options = options
        this.isSupported = false
        this.shouldRunPerformanceAudits = false
    }

    beforeSession (_, caps) {
        if (caps.browserName !== 'chrome' || (caps.version && caps.version < 63)) {
            return log.error(UNSUPPORTED_ERROR_MESSAGE)
        }

        this.isSupported = true
    }

    async before () {
        if (!this.isSupported) {
            return global.browser.addCommand('cdp', /* istanbul ignore next */ () => {
                throw new Error(UNSUPPORTED_ERROR_MESSAGE)
            })
        }

        try {
            let debuggerAddress

            if (this.options.debuggerAddress) {
                const [host, port] = this.options.debuggerAddress.split(':')
                debuggerAddress = { host, port: parseInt(port, 10) }
            } else {
                debuggerAddress = await findCDPInterface()
            }

            this.client = await getCDPClient(debuggerAddress)
            this.commandHandler = new CommandHandler(this.client, global.browser)
            this.devtoolsDriver = await DevToolsDriver.attach(`http://${debuggerAddress.host}:${debuggerAddress.port}`)
            this.traceGatherer = new TraceGatherer(this.devtoolsDriver)

            const session = await this.devtoolsDriver.getCDPSession()
            session.on('Page.loadEventFired', ::this.traceGatherer.onLoadEventFired)
            session.on('Page.frameNavigated', ::this.traceGatherer.onFrameNavigated)

            /**
             * enable domains for client
             */
            await Promise.all(['Page', 'Network', 'Console'].map(
                (domain) => Promise.all([
                    session.send(`${domain}.enable`),
                    this.client[domain]['enable']()
                ])
            ))

            this.devtoolsGatherer = new DevtoolsGatherer()
            this.client.on('event', ::this.devtoolsGatherer.onMessage)

            log.info(`Connected to Chrome on ${debuggerAddress.host}:${debuggerAddress.port}`)
        } catch (err) {
            log.error(`Couldn't connect to chrome: ${err.stack}`)
            return
        }

        /**
         * set flag to run performance audits for page transitions
         */
        global.browser.addCommand('runPerformanceAudits', (doRun) => {
            this.shouldRunPerformanceAudits = Boolean(doRun)
        })
    }

    beforeCommand (commandName, params) {
        if (!this.shouldRunPerformanceAudits || !this.traceGatherer || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        const url = commandName === 'navigateTo' ? params[0] : 'click transition'
        return this.traceGatherer.startTracing(url)
    }

    async afterCommand (commandName) {
        if (!this.traceGatherer || !this.traceGatherer.isTracing || !TRACE_COMMANDS.includes(commandName)) {
            return
        }

        /**
         * update custom commands once tracing finishes
         */
        this.traceGatherer.once('tracingComplete', (traceEvents) => {
            const auditor = new Auditor(traceEvents, this.devtoolsGatherer.getLogs())
            auditor.updateCommands(global.browser)
        })

        return new Promise((resolve) => {
            log.info(`Wait until tracing for command ${commandName} finishes`)

            /**
             * wait until tracing stops
             */
            this.traceGatherer.once('tracingFinished', () => {
                log.info('continuing with next WebDriver command')
                resolve()
            })
        })
    }
}
