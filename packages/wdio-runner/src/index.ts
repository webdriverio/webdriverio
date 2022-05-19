import fs from 'node:fs/promises'
import path from 'node:path'
import { EventEmitter } from 'node:events'

import logger from '@wdio/logger'
import { initialiseWorkerService, initialisePlugin, executeHooksWithArgs } from '@wdio/utils'
import { ConfigParser } from '@wdio/config'
import type { Options, Capabilities, Services } from '@wdio/types'
// @ts-expect-error
import type { Selector, Browser, MultiRemoteBrowser } from 'webdriverio'

import BaseReporter from './reporter.js'
import { initialiseInstance, filterLogTypes, getInstancesData } from './utils.js'

const log = logger('@wdio/runner')

type BeforeArgs = Parameters<Required<Services.HookFunctions>['before']>
type AfterArgs = Parameters<Required<Services.HookFunctions>['after']>
type BeforeSessionArgs = Parameters<Required<Services.HookFunctions>['beforeSession']>
type AfterSessionArgs = Parameters<Required<Services.HookFunctions>['afterSession']>

/**
 * user types for globals are set in webdriverio
 * putting this here to make compiler happy
 */
declare global {
    namespace NodeJS {
        interface Global {
            $: any
            $$: any
            browser: any
            driver: any
            multiremotebrowser: any
        }
    }
}

interface Args extends Partial<Options.Testrunner> {
    ignoredWorkerServices?: string[]
    watch?: boolean
}

type RunParams = {
    cid: string
    args: Args
    specs: string[]
    caps: Capabilities.RemoteCapability
    configFile: string
    retries: number
}

interface TestFramework {
    init: (
        cid: string,
        config: Options.Testrunner,
        specs: string[],
        capabilities: Capabilities.RemoteCapability,
        reporter: BaseReporter
    ) => TestFramework
    run (): number
    hasTests (): boolean
}

type SingleCapability = { capabilities: Capabilities.RemoteCapability }
interface SingleConfigOption extends Omit<Options.Testrunner, 'capabilities'>, SingleCapability {}
type MultiRemoteCaps = Record<string, (Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities) & { sessionId?: string }>

// Todo(Christian): move to a central place
declare global {
    var _HAS_FIBER_CONTEXT: boolean
}

export default class Runner extends EventEmitter {
    private _configParser = new ConfigParser()
    private _sigintWasCalled = false
    private _isMultiremote = false
    private _specFileRetryAttempts = 0

    private _reporter?: BaseReporter
    private _framework?: TestFramework
    private _config?: Options.Testrunner
    private _cid?: string
    private _specs?: string[]
    private _caps?: Capabilities.RemoteCapability

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
    async run({ cid, args, specs, caps, configFile, retries }: RunParams) {
        this._cid = cid
        this._specs = specs
        this._caps = caps

        /**
         * autocompile after parsing configs so we support ES6 features in tests with config driven by users
         */
        if (args.autoCompileOpts?.autoCompile) {
            this._configParser.merge({ autoCompileOpts: args.autoCompileOpts })
            this._configParser.autoCompile()
        }

        /**
         * add config file
         */
        try {
            this._configParser.addConfigFile(configFile)
        } catch (err: any) {
            return this._shutdown(1, retries)
        }

        /**
         * merge cli arguments again as some might have been overwritten by the config
         */
        this._configParser.merge(args)

        this._config = this._configParser.getConfig()
        this._specFileRetryAttempts = (this._config.specFileRetries || 0) - (retries || 0)
        logger.setLogLevelsConfig(this._config.logLevels, this._config.logLevel)
        const isMultiremote = this._isMultiremote = !Array.isArray(this._configParser.getCapabilities())

        /**
         * create `browser` stub only if `specFiltering` feature is enabled
         */
        let browser = await this._startSession({
            ...this._config,
            // @ts-ignore used in `/packages/webdriverio/src/protocol-stub.ts`
            _automationProtocol: this._config.automationProtocol,
            automationProtocol: './protocol-stub'
        }, caps)

        /**
         * run `beforeSession` command before framework and browser are initiated
         */
        ;(await initialiseWorkerService(
            this._config as Options.Testrunner,
            caps as Capabilities.Capabilities,
            args.ignoredWorkerServices
        )).map(this._configParser.addService.bind(this._configParser))

        const beforeSessionParams: BeforeSessionArgs = [this._config, this._caps, this._specs, this._cid]
        await executeHooksWithArgs('beforeSession', this._config.beforeSession, beforeSessionParams)

        this._reporter = new BaseReporter(this._config, this._cid, { ...caps })
        await this._reporter.initReporters()

        /**
         * initialise framework
         */
        this._framework = (await initialisePlugin(this._config.framework as string, 'framework')).default as unknown as TestFramework
        this._framework = await this._framework.init(cid, this._config, specs, caps, this._reporter)
        process.send!({ name: 'testFrameworkInit', content: { cid, caps, specs, hasTests: this._framework.hasTests() } })
        if (!this._framework.hasTests()) {
            return this._shutdown(0, retries)
        }

        browser = await this._initSession(this._config as SingleConfigOption, this._caps, browser)

        /**
         * return if session initialisation failed
         */
        if (!browser) {
            const afterArgs: AfterArgs = [1, this._caps, this._specs]
            await executeHooksWithArgs('after', this._config.after as Function, afterArgs)
            return this._shutdown(1, retries)
        }

        this._reporter.caps = browser.capabilities as Capabilities.RemoteCapability

        const beforeArgs: BeforeArgs = [this._caps, this._specs, browser]
        await executeHooksWithArgs('before', this._config.before, beforeArgs)

        /**
         * kill session of SIGINT signal showed up while trying to
         * get a session ID
         */
        if (this._sigintWasCalled) {
            log.info('SIGINT signal detected while starting session, shutting down...')
            await this.endSession()
            return this._shutdown(0, retries)
        }

        /**
         * initialisation successful, send start message
         */
        const multiRemoteBrowser = browser as unknown as MultiRemoteBrowser<'async'>
        this._reporter.emit('runner:start', {
            cid,
            specs,
            config: browser.options,
            isMultiremote,
            instanceOptions: isMultiremote
                ? multiRemoteBrowser.instances.reduce((prev: any, browserName: string) => {
                    prev[multiRemoteBrowser[browserName].sessionId] = multiRemoteBrowser[browserName].options as Options.WebdriverIO
                    return prev
                }, {} as Record<string, Options.WebdriverIO>)
                : {
                    [browser.sessionId]: browser.options
                },
            sessionId: browser.sessionId,
            capabilities: isMultiremote
                ? multiRemoteBrowser.instances.reduce((caps: any, browserName: string) => {
                    caps[browserName] = multiRemoteBrowser[browserName].capabilities
                    caps[browserName].sessionId = multiRemoteBrowser[browserName].sessionId
                    return caps
                }, {} as MultiRemoteCaps)
                : { ...browser.capabilities, sessionId: browser.sessionId },
            retry: this._specFileRetryAttempts
        } as Options.RunnerStart)

        /**
         * report sessionId and target connection information to worker
         */
        const { protocol, hostname, port, path, queryParams } = browser.options
        const { isW3C, sessionId } = browser
        const instances = getInstancesData(browser, isMultiremote)
        process.send!({
            origin: 'worker',
            name: 'sessionStarted',
            content: { sessionId, isW3C, protocol, hostname, port, path, queryParams, isMultiremote, instances }
        })

        /**
         * kick off tests in framework
         */
        let failures = 0
        try {
            failures = await this._framework.run()
            await this._fetchDriverLogs(this._config, (caps as Required<Capabilities.DesiredCapabilities>).excludeDriverLogs)
        } catch (err: any) {
            log.error(err)
            this.emit('error', err)
            failures = 1
        }

        /**
         * in watch mode we don't close the session and leave current page opened
         */
        if (!args.watch) {
            await this.endSession()
        }

        return this._shutdown(failures, retries)
    }

    /**
     * init protocol session
     * @param  {object}  config        configuration of sessions
     * @param  {Object}  caps          desired capabilities of session
     * @param  {Object}  browserStub   stubbed `browser` object with only capabilities, config and env flags
     * @return {Promise}               resolves with browser object or null if session couldn't get established
     */
    private async _initSession (
        config: SingleConfigOption,
        caps: Capabilities.RemoteCapability,
        browserStub?: Browser<'async'> | MultiRemoteBrowser<'async'>
    ) {
        const browser = await this._startSession(config, caps) as Browser<'async'>

        // return null if session couldn't get established
        if (!browser) { return }

        // add flags declared by user to browser object
        if (browserStub) {
            Object.entries(browserStub).forEach(([key, value]: [keyof Browser<'async'>, any]) => {
                if (typeof browser[key] === 'undefined') {
                    // @ts-ignore allow to set value for undefined props
                    browser[key] = value
                }
            })
        }

        /**
         * register global helper method to fetch elements
         */
        // @ts-ignore
        global.$ = (selector: Selector) => browser.$(selector)
        // @ts-ignore
        global.$$ = (selector: Selector) => browser.$$(selector)

        /**
         * register command event
         */
        browser.on('command', (command: any) => this._reporter?.emit(
            'client:beforeCommand',
            Object.assign(command, { sessionId: browser.sessionId })
        ))

        /**
         * register result event
         */
        browser.on('result', (result: any) => this._reporter?.emit(
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
    private async _startSession (
        config: SingleConfigOption,
        caps: Capabilities.RemoteCapability
    ) {
        let browser: Browser<'async'> | MultiRemoteBrowser<'async'>

        try {
            // @ts-ignore
            browser = global.browser = global.driver = await initialiseInstance(config, caps, this._isMultiremote)

            /**
             * attach browser to `multiremotebrowser` so user have better typing support
             */
            if (this._isMultiremote) {
                // @ts-ignore
                global.multiremotebrowser = browser
            }
        } catch (err: any) {
            log.error(err)
            return
        }

        browser.config = config as Options.Testrunner
        return browser
    }

    /**
     * fetch logs provided by browser driver
     */
    private async _fetchDriverLogs (
        config: Options.Testrunner,
        excludeDriverLogs: string[]
    ) {
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
            } catch (e: any) {
                return log.warn(`Couldn't fetch logs for ${logType}: ${e.message}`)
            }

            /**
             * don't write to file if no logs were captured
             */
            if (logs.length === 0) {
                return
            }

            const stringLogs = logs.map((log: any) => JSON.stringify(log)).join('\n')
            return fs.writeFile(
                path.join(config.outputDir!, `wdio-${this._cid}-${logType}.log`),
                stringLogs,
                'utf-8'
            )
        }))
    }

    /**
     * kill worker session
     */
    private async _shutdown (
        failures: number,
        retries: number
    ) {
        this._reporter!.emit('runner:end', {
            failures,
            cid: this._cid,
            retries
        } as Options.RunnerEnd)
        try {
            await this._reporter!.waitForSync()
        } catch (err: any) {
            log.error(err)
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
        const multiremoteBrowser = global.browser as unknown as MultiRemoteBrowser<'async'>
        const hasSessionId = Boolean(global.browser) && (this._isMultiremote
            /**
             * every multiremote instance should exist and should have `sessionId`
             */
            ? !multiremoteBrowser.instances.some((i: number) => (
                multiremoteBrowser[i] &&
                !multiremoteBrowser[i].sessionId)
            )

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
        const capabilities: Capabilities.Capabilities | Capabilities.W3CCapabilities | MultiRemoteCaps = global.browser.capabilities || {}
        if (this._isMultiremote) {
            multiremoteBrowser.instances.forEach((browserName: string) => {
                (capabilities as MultiRemoteCaps)[browserName] = multiremoteBrowser[browserName].capabilities
            })
        }

        await global.browser.deleteSession()

        /**
         * delete session(s)
         */
        if (this._isMultiremote) {
            multiremoteBrowser.instances.forEach((i: number) => {
                // @ts-ignore sessionId is usually required
                delete multiremoteBrowser[i].sessionId
            })
        } else {
            // @ts-ignore sessionId is usually required
            delete global.browser.sessionId
        }

        const afterSessionArgs: AfterSessionArgs = [this._config!, capabilities, this._specs as string[]]
        await executeHooksWithArgs('afterSession', global.browser.config.afterSession!, afterSessionArgs)
    }
}
