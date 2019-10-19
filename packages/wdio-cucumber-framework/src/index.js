import * as Cucumber from 'cucumber'
import mockery from 'mockery'
import isGlob from 'is-glob'
import glob from 'glob'
import path from 'path'

import CucumberReporter from './reporter'

import { EventEmitter } from 'events'

import { executeHooksWithArgs, testFnWrapper } from '@wdio/utils'
import { DEFAULT_OPTS } from './constants'
import { getDataFromResult, setUserHookNames } from './utils'

class CucumberAdapter {
    constructor(cid, config, specs, capabilities, reporter) {
        this.cwd = process.cwd()
        this.cid = cid
        this.specs = specs
        this.reporter = reporter
        this.capabilities = capabilities
        this.config = config
        this.cucumberOpts = Object.assign(DEFAULT_OPTS, config.cucumberOpts)
    }

    async run () {
        let runtimeError
        let result

        try {
            this.registerRequiredModules()
            Cucumber.supportCodeLibraryBuilder.reset(this.cwd)

            /**
             * wdio hooks should be added before spec files are loaded
             */
            this.addWdioHooks(this.config)
            this.loadSpecFiles()
            this.wrapSteps(this.config)

            /**
             * we need to somehow identify is function is step or hook
             * so we wrap every user hook function
             */
            setUserHookNames(Cucumber.supportCodeLibraryBuilder.options)
            Cucumber.setDefaultTimeout(this.cucumberOpts.timeout)
            const supportCodeLibrary = Cucumber.supportCodeLibraryBuilder.finalize()

            const eventBroadcaster = new EventEmitter()
            const reporterOptions = {
                capabilities: this.capabilities,
                ignoreUndefinedDefinitions: Boolean(this.cucumberOpts.ignoreUndefinedDefinitions),
                failAmbiguousDefinitions: Boolean(this.cucumberOpts.failAmbiguousDefinitions),
                tagsInTitle: Boolean(this.cucumberOpts.tagsInTitle)
            }

            this.cucumberReporter = new CucumberReporter(eventBroadcaster, reporterOptions, this.cid, this.specs, this.reporter)

            /**
             * gets current step data: `{ uri, feature, scenario, step, sourceLocation }`
             * or `null` for some hooks.
             *
             * @return  {object|null}
             */
            this.getCurrentStep = ::this.cucumberReporter.eventListener.getCurrentStep

            const pickleFilter = new Cucumber.PickleFilter({
                featurePaths: this.specs,
                names: this.cucumberOpts.name,
                tagExpression: this.cucumberOpts.tagExpression
            })
            const testCases = await Cucumber.getTestCasesFromFilesystem({
                cwd: this.cwd,
                eventBroadcaster,
                featurePaths: this.specs,
                order: this.cucumberOpts.order,
                pickleFilter
            })
            const runtime = new Cucumber.Runtime({
                eventBroadcaster,
                options: this.cucumberOpts,
                supportCodeLibrary,
                testCases
            })

            await executeHooksWithArgs(this.config.before, [this.capabilities, this.specs])
            result = await runtime.start() ? 0 : 1

            /**
             * if we ignore undefined definitions we trust the reporter
             * with the fail count
             */
            if (this.cucumberOpts.ignoreUndefinedDefinitions && result) {
                result = this.cucumberReporter.failedCount
            }
        } catch (e) {
            runtimeError = e
            result = 1
        }

        await executeHooksWithArgs(this.config.after, [runtimeError || result, this.capabilities, this.specs])

        /**
         * in case the spec has a runtime error throw after the wdio hook
         */
        if (runtimeError) {
            throw runtimeError
        }

        return result
    }

    /**
     * Transpilation https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#transpilation
     * Usage: `['module']`
     * we extend it a bit with ability to init and pass configuration to modules.
     * Pass an array with path to module and its configuration instead:
     * Usage: `[['module', {}]]`
     * Or pass your own function
     * Usage: `[() => { require('ts-node').register({ files: true }) }]`
     */
    registerRequiredModules () {
        this.cucumberOpts.requireModule.map(requiredModule => {
            if (Array.isArray(requiredModule)) {
                require(requiredModule[0])(requiredModule[1])
            } else if (typeof requiredModule === 'function') {
                requiredModule()
            } else {
                require(requiredModule)
            }
        })
    }

    requiredFiles () {
        return this.cucumberOpts.require.reduce(
            (files, requiredFile) => files.concat(isGlob(requiredFile)
                ? glob.sync(requiredFile)
                : [requiredFile]
            ),
            []
        )
    }

    loadSpecFiles () {
        // we use mockery to allow people to import 'our' cucumber even though their spec files are in their folders
        // because of that we don't have to attach anything to the global object, and the current cucumber spec files
        // should just work with no changes with this framework
        mockery.enable({
            useCleanCache: false,
            warnOnReplace: false,
            warnOnUnregistered: false
        })
        mockery.registerMock('cucumber', Cucumber)
        this.requiredFiles().forEach((codePath) => {
            const filepath = path.isAbsolute(codePath)
                ? codePath
                : path.join(process.cwd(), codePath)

            // This allows rerunning a stepDefinitions file
            delete require.cache[require.resolve(filepath)]
            require(filepath)
        })
        mockery.disable()
    }

    /**
     * Set `beforeScenario`, `afterScenario`, `beforeFeature`, and `afterFeature`.
     * @param {object} config - Config
     */
    addWdioHooks (config) {
        Cucumber.Before(function wdioHookBeforeScenario ({ sourceLocation, pickle }) {
            const { uri, feature } = getDataFromResult(global.result)
            return executeHooksWithArgs(config.beforeScenario, [uri, feature, pickle, sourceLocation])
        })
        Cucumber.After(function wdioHookAfterScenario ({ sourceLocation, pickle, result }) {
            const { uri, feature } = getDataFromResult(global.result)
            return executeHooksWithArgs(config.afterScenario, [uri, feature, pickle, result, sourceLocation])
        })
        Cucumber.BeforeAll(function wdioHookBeforeFeature () {
            const { uri, feature, scenarios } = getDataFromResult(global.result)
            return executeHooksWithArgs(config.beforeFeature, [uri, feature, scenarios])
        })
        Cucumber.AfterAll(function wdioHookAfterFeature () {
            const { uri, feature, scenarios } = getDataFromResult(global.result)
            return executeHooksWithArgs(config.afterFeature, [uri, feature, scenarios])
        })
    }

    /**
     * Wraps step definition code with sync/async runner, with a retry option.
     * @param {object} config - Config
     */
    wrapSteps (config) {
        const wrapStep = this.wrapStep
        const cid = this.cid
        const getCurrentStep = () => this.getCurrentStep()

        Cucumber.setDefinitionFunctionWrapper((fn, options = {}) => {
            /**
             * hooks defined in wdio.conf are already wrapped
             */
            if (fn.name.startsWith('wdioHook')) {
                return fn
            }

            /**
             * this flag is used to:
             * - avoid hook retry
             * - avoid wrap hooks with beforeStep and afterStep
             */
            const isStep = !fn.name.startsWith('userHook')

            const retryTest = isStep && isFinite(options.retry) ? parseInt(options.retry, 10) : 0
            return wrapStep(fn, retryTest, isStep, config, cid, getCurrentStep)
        })
    }

    /**
     * Wrap step definition to enable retry ability.
     * @param   {Function}  code            - Step definitoon
     * @param   {Number}    retryTest       - Allowed retries in case of a failure
     * @param   {boolean}   isStep          - 
     * @param   {object}    config          - Config
     * @param   {string}    cid             - CID
     * @param   {Function}  getCurrentStep  - Step definitoon
     * @return  {Function} - Wrapped step definiton for sync WebdriverIO code
     */
    wrapStep (code, retryTest = 0, isStep, config, cid, getCurrentStep) {
        return function (...args) {
            /**
             * wrap user step/hook with wdio before/after hooks
             */
            const { uri, feature } = getDataFromResult(global.result)
            const beforeFn = isStep ? config.beforeStep : config.beforeHook
            const afterFn = isStep ? config.afterStep : config.afterHook
            return testFnWrapper.call(this,
                isStep ? 'Step' : 'Hook',
                { specFn: code, specFnArgs: args },
                { beforeFn, beforeFnArgs: (context) => [uri, feature, getCurrentStep(), context] },
                { afterFn, afterFnArgs: (context) => [uri, feature, getCurrentStep(), context] },
                cid,
                retryTest)
        }
    }
}

const _CucumberAdapter = CucumberAdapter
const adapterFactory = {}

/**
 * Tested by smoke tests
 */
/* istanbul ignore next */
adapterFactory.run = async function (...args) {
    const adapter = new _CucumberAdapter(...args)
    const result = await adapter.run()
    return result
}

export default adapterFactory
export { CucumberAdapter, adapterFactory }
