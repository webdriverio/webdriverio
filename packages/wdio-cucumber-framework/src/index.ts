import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'

import * as Cucumber from '@cucumber/cucumber'
import EventDataCollector from '@cucumber/cucumber/lib/formatter/helpers/event_data_collector'
import { ITestCaseHookParameter } from '@cucumber/cucumber/lib/support_code_library_builder/types'
import { IRuntimeOptions } from '@cucumber/cucumber/lib/runtime'
import { GherkinStreams } from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import mockery from 'mockery'
import isGlob from 'is-glob'
import glob from 'glob'

import CucumberReporter from './reporter'

import { executeHooksWithArgs, testFnWrapper } from '@wdio/utils'
import type { ConfigOptions } from '@wdio/config'
import { DEFAULT_OPTS } from './constants'
import { CucumberOpts } from './types'
import { /* getDataFromResult, */ setUserHookNames } from './utils'

const { incrementing } = IdGenerator

class CucumberAdapter {
    private _cwd = process.cwd()
    private _newId = incrementing()
    private _cucumberOpts: CucumberOpts
    private _hasTests: boolean
    private _cucumberFeaturesWithLineNumbers: string[]
    private _eventBroadcaster: EventEmitter
    private _cucumberReporter?: CucumberReporter
    private _eventDataCollector: EventDataCollector
    private _pickleIds: string[] = []

    getHookParams?: Function

    constructor(
        private _cid: string,
        private _config: ConfigOptions,
        private _specs: string[],
        private _capabilities: WebDriver.Capabilities,
        private _reporter: EventEmitter
    ) {
        this._cucumberOpts = Object.assign(DEFAULT_OPTS, this._config.cucumberOpts)
        this._hasTests = true
        this._cucumberFeaturesWithLineNumbers = this._config.cucumberFeaturesWithLineNumbers || []
        this._eventBroadcaster = new EventEmitter()
        this._eventDataCollector = new EventDataCollector(this._eventBroadcaster)
    }

    async init() {
        try {
            const reporterOptions = {
                capabilities: this._capabilities,
                ignoreUndefinedDefinitions: Boolean(this._cucumberOpts.ignoreUndefinedDefinitions),
                failAmbiguousDefinitions: Boolean(this._cucumberOpts.failAmbiguousDefinitions),
                tagsInTitle: Boolean(this._cucumberOpts.tagsInTitle),
                scenarioLevelReporter: Boolean(this._cucumberOpts.scenarioLevelReporter)
            }
            this._cucumberReporter = new CucumberReporter(this._eventBroadcaster, reporterOptions, this._cid, this._specs, this._reporter)

            const featurePathsToRun = this._cucumberFeaturesWithLineNumbers.length > 0 ? this._cucumberFeaturesWithLineNumbers : this._specs
            const pickleFilter = new Cucumber.PickleFilter({
                cwd: this._cwd,
                featurePaths: featurePathsToRun,
                names: this._cucumberOpts.name,
                tagExpression: this._cucumberOpts.tagExpression
            })

            // const eventBroadcasterProxyFilter = new EventEmitter()
            // this._eventBroadcaster.eventNames()
            //     .forEach(n => eventBroadcasterProxyFilter.addListener(n, (...args) =>
            //         (n !== 'pickle-accepted' || this.filter(args[0])) && this._eventBroadcaster.emit(n, ...args)))

            const gherkinMessageStream = GherkinStreams.fromPaths(this._specs, {
                defaultDialect: this._cucumberOpts.featureDefaultLanguage,
                newId: this._newId,
                createReadStream: (path) => fs.createReadStream(path, { encoding: 'utf-8' })
            })

            this._pickleIds = (await Cucumber.parseGherkinMessageStream({
                cwd: this._cwd,
                eventBroadcaster: this._eventBroadcaster,
                gherkinMessageStream,
                eventDataCollector: this._eventDataCollector,
                order: this._cucumberOpts.order,
                pickleFilter
            })) //.filter(this.filter.bind(this))

            this._hasTests = this._pickleIds.length > 0
        } catch (runtimeError) {
            await executeHooksWithArgs('after', this._config.after, [runtimeError, this._capabilities, this._specs])
            throw runtimeError
        }

        /**
         * import and set options for `expect-webdriverio` assertion lib once
         * the framework was initiated so that it can detect the environment
         */
        const { setOptions } = require('expect-webdriverio')
        setOptions({
            wait: this._config.waitforTimeout, // ms to wait for expectation to succeed
            interval: this._config.waitforInterval, // interval between attempts
        })

        return this
    }

    hasTests() {
        return this._hasTests
    }

    async run() {
        let runtimeError
        let result
        try {
            this.registerRequiredModules()
            Cucumber.supportCodeLibraryBuilder.reset(this._cwd, this._newId)

            /**
             * wdio hooks should be added before spec files are loaded
             */
            this.addWdioHooks(this._config)
            this.loadSpecFiles()
            this.wrapSteps(this._config)

            /**
             * we need to somehow identify is function is step or hook
             * so we wrap every user hook function
             */
            setUserHookNames(Cucumber.supportCodeLibraryBuilder)
            Cucumber.setDefaultTimeout(this._cucumberOpts.timeout)
            const supportCodeLibrary = Cucumber.supportCodeLibraryBuilder.finalize()

            /**
             * gets current step data: `{ uri, feature, scenario, step, sourceLocation }`
             * or `null` for some hooks.
             */
            if (this._cucumberReporter) {
                this.getHookParams = this._cucumberReporter
                    .eventListener
                    .getHookParams
                    .bind(this._cucumberReporter.eventListener)
            }

            const runtime = new Cucumber.Runtime({
                newId: this._newId,
                eventBroadcaster: this._eventBroadcaster,
                options: this._cucumberOpts as any as IRuntimeOptions,
                supportCodeLibrary,
                eventDataCollector: this._eventDataCollector,
                pickleIds: this._pickleIds
            })

            result = await runtime.start() ? 0 : 1

            /**
             * if we ignore undefined definitions we trust the reporter
             * with the fail count
             */
            if (this._cucumberOpts.ignoreUndefinedDefinitions && result && this._cucumberReporter) {
                result = this._cucumberReporter.failedCount
            }
        } catch (e) {
            runtimeError = e
            result = 1
        }

        await executeHooksWithArgs('after', this._config.after, [runtimeError || result, this._capabilities, this._specs])

        /**
         * in case the spec has a runtime error throw after the wdio hook
         */
        if (runtimeError) {
            throw runtimeError
        }

        return result
    }

    /**
     * Returns true/false if testCase should be kept for current capabilities
     * according to tag in the syntax  @skip([conditions])
     * For example "@skip(browserName=firefox)" or "@skip(browserName=chrome,platform=/.+n?x/)"
     * @param {*} testCase
     */
    // filter (testCase: string) {
    //     const skipTag = /^@skip\((.*)\)$/

    //     const match = (value: string, expr: RegExp) => {
    //         if (Array.isArray(expr)) {
    //             return expr.indexOf(value) >= 0
    //         } else if (expr instanceof RegExp) {
    //             return expr.test(value)
    //         }
    //         return (expr && ('' + expr).toLowerCase()) === (value && ('' + value).toLowerCase())
    //     }

    //     const parse = (skipExpr: string) =>
    //         skipExpr.split(';').reduce((acc, splitItem) => {
    //             const pos = splitItem.indexOf('=')
    //             if (pos > 0) {
    //                 acc[splitItem.substring(0, pos)] = eval(splitItem.substring(pos + 1))
    //             }
    //             return acc
    //         }, {})

    //     return !(testCase.pickle && testCase.pickle.tags && testCase.pickle.tags
    //         .map(p => p.name.match(skipTag))
    //         .filter(Boolean)
    //         .map(m => parse(m[1]))
    //         .find(filter => Object.keys(filter)
    //             .every(key => match(this._capabilities[key], filter[key]))))
    // }

    /**
     * Transpilation https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#transpilation
     * Usage: `['module']`
     * we extend it a bit with ability to init and pass configuration to modules.
     * Pass an array with path to module and its configuration instead:
     * Usage: `[['module', {}]]`
     * Or pass your own function
     * Usage: `[() => { require('@babel/register')({ ignore: [] }) }]`
     */
    registerRequiredModules() {
        this._cucumberOpts.requireModule.map(requiredModule => {
            if (Array.isArray(requiredModule)) {
                require(requiredModule[0])(requiredModule[1])
            } else if (typeof requiredModule === 'function') {
                (requiredModule as Function)()
            } else {
                require(requiredModule)
            }
        })
    }

    requiredFiles() {
        return this._cucumberOpts.require.reduce(
            (files: string[], requiredFile: string) => files.concat(isGlob(requiredFile)
                ? glob.sync(requiredFile)
                : [requiredFile]
            ),
            []
        )
    }

    loadSpecFiles() {
        // we use mockery to allow people to import 'our' cucumber even though their spec files are in their folders
        // because of that we don't have to attach anything to the global object, and the current cucumber spec files
        // should just work with no changes with this framework
        mockery.enable({
            useCleanCache: false,
            warnOnReplace: false,
            warnOnUnregistered: false
        })
        mockery.registerMock('@cucumber/cucumber', Cucumber)
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
     * set `beforeScenario`, `afterScenario`, `beforeFeature`, `afterFeature`
     * @param {object} config config
     */
    addWdioHooks (config: ConfigOptions) {
        const eventListener = this._cucumberReporter?.eventListener
        Cucumber.BeforeAll(async function wdioHookBeforeFeature() {
            const params = eventListener?.getHookParams()
            await executeHooksWithArgs(
                'beforeFeature',
                config.beforeFeature,
                [params?.uri, params?.feature]
            )
        })
        Cucumber.AfterAll(async function wdioHookAfterFeature() {
            const params = eventListener?.getHookParams()
            await executeHooksWithArgs(
                'afterFeature',
                config.afterFeature,
                [params?.uri, params?.feature]
            )
        })
        Cucumber.Before(async function wdioHookBeforeScenario (world: ITestCaseHookParameter) {
            await executeHooksWithArgs(
                'beforeScenario',
                config.beforeScenario,
                [world]
            )
        })
        Cucumber.After(async function wdioHookAfterScenario (world: ITestCaseHookParameter) {
            await executeHooksWithArgs(
                'afterScenario',
                config.afterScenario,
                [world]
            )
        })
    }

    /**
     * wraps step definition code with sync/async runner with a retry option
     * @param {object} config
     */
    wrapSteps (config: ConfigOptions) {
        const wrapStep = this.wrapStep
        const cid = this._cid
        const getHookParams = () => this.getHookParams && this.getHookParams()

        Cucumber.setDefinitionFunctionWrapper((fn: Function) => {
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

            const retryTest = 0 // isStep && isFinite(options.retry) ? parseInt(options.retry, 10) : 0
            return wrapStep(fn, retryTest, isStep, config, cid, getHookParams)
        })
    }

    /**
     * wrap step definition to enable retry ability
     * @param   {Function}  code            step definition
     * @param   {Number}    retryTest       amount of allowed repeats is case of a failure
     * @param   {boolean}   isStep
     * @param   {object}    config
     * @param   {string}    cid             cid
     * @param   {Function}  getHookParams  step definition
     * @return  {Function}                  wrapped step definition for sync WebdriverIO code
     */
    wrapStep(
        code: Function,
        retryTest = 0,
        isStep: boolean,
        config: ConfigOptions,
        cid: string,
        getHookParams: Function
    ) {
        return function (this: Cucumber.World, ...args: any[]) {
            /**
             * wrap user step/hook with wdio before/after hooks
             */
            const beforeFn = isStep ? config.beforeStep : config.beforeHook
            const afterFn = isStep ? config.afterStep : config.afterHook
            const hookParams = getHookParams()
            return testFnWrapper.call(this,
                isStep ? 'Step' : 'Hook',
                { specFn: code, specFnArgs: args },
                { beforeFn: beforeFn as Function[], beforeFnArgs: (context) => [hookParams?.step, context] },
                { afterFn: afterFn as Function[], afterFnArgs: (context) => [hookParams?.step, context] },
                cid,
                retryTest)
        }
    }
}

const _CucumberAdapter = CucumberAdapter
const adapterFactory: { init?: Function } = {}

/**
 * tested by smoke tests
 */
/* istanbul ignore next */
adapterFactory.init = async function (...args: any[]) {
    // @ts-ignore just passing through args
    const adapter = new _CucumberAdapter(...args as any)
    const instance = await adapter.init()
    return instance
}

export default adapterFactory
export { CucumberAdapter, adapterFactory }
