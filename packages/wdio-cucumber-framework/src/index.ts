import url from 'node:url'
import path from 'node:path'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'

import mockery from 'mockery'
import isGlob from 'is-glob'
import glob from 'glob'

import * as Cucumber from '@cucumber/cucumber'
import {
    After,
    AfterAll,
    AfterStep,
    Before,
    BeforeAll,
    BeforeStep,
    DataTable,
    defineParameterType,
    defineStep,
    Given,
    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,
    World,
    Then,
    When
} from '@cucumber/cucumber'
import type { IRuntimeOptions, ITestCaseHookParameter } from '@cucumber/cucumber'
import { GherkinStreams } from '@cucumber/gherkin-streams'
import { IdGenerator } from '@cucumber/messages'

import { executeHooksWithArgs, testFnWrapper } from '@wdio/utils'
import type { Capabilities, Options, Frameworks } from '@wdio/types'

import CucumberReporter from './reporter.js'
import { DEFAULT_OPTS } from './constants.js'
import { setUserHookNames } from './utils.js'
import type { CucumberOptions, StepDefinitionOptions, HookFunctionExtension as HookFunctionExtensionImport } from './types.js'

const require = createRequire(import.meta.url)
const EventDataCollector = require('@cucumber/cucumber/lib/formatter/helpers/event_data_collector').default
const FILE_PROTOCOL = 'file://'

const { incrementing } = IdGenerator

function getResultObject (world: ITestCaseHookParameter): Frameworks.PickleResult {
    return {
        passed: (world.result?.status === Cucumber.Status.PASSED || world.result?.status === Cucumber.Status.SKIPPED),
        error: world.result?.message as string,
        duration: world.result?.duration?.nanos as number / 1e6 // convert into ms
    }
}

class CucumberAdapter {
    private _cwd = process.cwd()
    private _newId = incrementing()
    private _cucumberOpts: Required<CucumberOptions>
    private _hasTests: boolean
    private _cucumberFeaturesWithLineNumbers: string[]
    private _eventBroadcaster: EventEmitter
    private _cucumberReporter: CucumberReporter
    private _eventDataCollector: typeof EventDataCollector
    private _pickleFilter: Cucumber.PickleFilter
    private getHookParams?: Function

    constructor(
        private _cid: string,
        private _config: Options.Testrunner,
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: EventEmitter
    ) {
        const namesParam = this._config.cucumberOpts?.names || []
        this._cucumberOpts = Object.assign(
            {},
            DEFAULT_OPTS,
            this._config.cucumberOpts as Required<CucumberOptions>,
            /**
             * fix names param when passed in as CLI param, e.g.
             * wdio run wdio.conf.ts --cucumberOpts.names="FeatureA"
             */
            typeof namesParam === 'string' ? { names: (namesParam as string).split(',') } : {}
        )
        this._hasTests = true
        this._cucumberFeaturesWithLineNumbers = this._config.cucumberFeaturesWithLineNumbers || []
        this._eventBroadcaster = new EventEmitter()
        this._eventDataCollector = new EventDataCollector(this._eventBroadcaster)

        this._specs = this._specs.map((spec) => (
            /**
             * as Cucumber doesn't support file:// formats yet we have to
             * remove it before adding it to Cucumber
             */
            spec.startsWith(FILE_PROTOCOL)
                ? url.fileURLToPath(spec)
                : spec
        ))
        const featurePathsToRun = this._cucumberFeaturesWithLineNumbers.length > 0
            ? this._cucumberFeaturesWithLineNumbers
            : this._specs
        this._pickleFilter = new Cucumber.PickleFilter({
            cwd: this._cwd,
            featurePaths: featurePathsToRun,
            names: this._cucumberOpts.names as string[],
            tagExpression: this._cucumberOpts.tagExpression
        })

        const reporterOptions = {
            capabilities: this._capabilities,
            ignoreUndefinedDefinitions: Boolean(this._cucumberOpts.ignoreUndefinedDefinitions),
            failAmbiguousDefinitions: Boolean(this._cucumberOpts.failAmbiguousDefinitions),
            tagsInTitle: Boolean(this._cucumberOpts.tagsInTitle),
            scenarioLevelReporter: Boolean(this._cucumberOpts.scenarioLevelReporter)
        }
        this._cucumberReporter = new CucumberReporter(this._eventBroadcaster, this._pickleFilter, reporterOptions, this._cid, this._specs, this._reporter)
    }

    async init() {
        try {
            const gherkinMessageStream = GherkinStreams.fromPaths(this._specs, {
                defaultDialect: this._cucumberOpts.featureDefaultLanguage,
                newId: this._newId
            })

            await Cucumber.parseGherkinMessageStream({
                cwd: this._cwd,
                eventBroadcaster: this._eventBroadcaster,
                gherkinMessageStream,
                eventDataCollector: this._eventDataCollector,
                order: this._cucumberOpts.order,
                pickleFilter: this._pickleFilter
            })

            this._hasTests = this._cucumberReporter.eventListener.getPickleIds(this._capabilities).length > 0
        } catch (runtimeError) {
            await executeHooksWithArgs('after', this._config.after, [runtimeError, this._capabilities, this._specs])
            throw runtimeError
        }

        return this
    }

    hasTests() {
        return this._hasTests
    }

    async run() {
        let runtimeError
        let result
        try {
            await this.registerRequiredModules()
            Cucumber.supportCodeLibraryBuilder.reset(this._cwd, this._newId)

            /**
             * wdio hooks should be added before spec files are loaded
             */
            this.addWdioHooks(this._config)
            await this.loadSpecFiles()
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
            this.getHookParams = this._cucumberReporter
                .eventListener
                .getHookParams
                .bind(this._cucumberReporter.eventListener)

            const runtime = new Cucumber.Runtime({
                newId: this._newId,
                eventBroadcaster: this._eventBroadcaster,
                options: this._cucumberOpts as any as IRuntimeOptions,
                supportCodeLibrary,
                eventDataCollector: this._eventDataCollector,
                pickleIds: this._cucumberReporter!.eventListener.getPickleIds(this._capabilities)
            })

            result = await runtime.start() ? 0 : 1

            /**
             * if we ignore undefined definitions we trust the reporter
             * with the fail count
             */
            if (this._cucumberOpts.ignoreUndefinedDefinitions && result) {
                result = this._cucumberReporter.failedCount
            }
        } catch (err: any) {
            runtimeError = err
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
     * Transpilation https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#transpilation
     * Usage: `['module']`
     * we extend it a bit with ability to init and pass configuration to modules.
     * Pass an array with path to module and its configuration instead:
     * Usage: `[['module', {}]]`
     * Or pass your own function
     * Usage: `[() => { require('@babel/register')({ ignore: [] }) }]`
     */
    registerRequiredModules() {
        return Promise.all(this._cucumberOpts.requireModule.map(async (requiredModule) => {
            if (Array.isArray(requiredModule)) {
                (await import(requiredModule[0]))(requiredModule[1])
            } else if (typeof requiredModule === 'function') {
                requiredModule()
            } else {
                await import(requiredModule)
            }
        }))
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

    async loadSpecFiles() {
        // we use mockery to allow people to import 'our' cucumber even though their spec files are in their folders
        // because of that we don't have to attach anything to the global object, and the current cucumber spec files
        // should just work with no changes with this framework
        mockery.enable({
            useCleanCache: false,
            warnOnReplace: false,
            warnOnUnregistered: false
        })
        mockery.registerMock('@cucumber/cucumber', Cucumber)
        await Promise.all(this.requiredFiles().map((codePath) => {
            const filepath = path.isAbsolute(codePath)
                ? codePath.startsWith(FILE_PROTOCOL)
                    ? codePath
                    : url.pathToFileURL(codePath).href
                : url.pathToFileURL(path.join(process.cwd(), codePath)).href

            // This allows rerunning a stepDefinitions file
            const stepDefPath = url.pathToFileURL(
                require.resolve(url.fileURLToPath(filepath))
            ).href
            const cacheEntryToDelete = Object.keys(require.cache).find(
                (u) => url.pathToFileURL(u).href === stepDefPath)
            if (cacheEntryToDelete) {
                delete require.cache[cacheEntryToDelete]
            }

            return import(filepath)
        }))
        mockery.disable()
    }

    /**
     * set `beforeFeature`, `afterFeature`, `beforeScenario`, `afterScenario`, 'beforeStep', 'afterStep'
     * @param {object} config config
     */
    addWdioHooks(config: Options.Testrunner) {
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
        Cucumber.Before(async function wdioHookBeforeScenario(world: ITestCaseHookParameter) {
            await executeHooksWithArgs(
                'beforeScenario',
                config.beforeScenario,
                [world, this]
            )
        })
        Cucumber.After(async function wdioHookAfterScenario(world: ITestCaseHookParameter) {
            await executeHooksWithArgs(
                'afterScenario',
                config.afterScenario,
                [world, getResultObject(world), this]
            )
        })
        Cucumber.BeforeStep(async function wdioHookBeforeStep() {
            const params = eventListener?.getHookParams()
            await executeHooksWithArgs(
                'beforeStep',
                config.beforeStep,
                [params?.step, params?.scenario, this]
            )
        })
        Cucumber.AfterStep(async function wdioHookAfterStep(world: ITestCaseHookParameter) {
            const params = eventListener?.getHookParams()
            await executeHooksWithArgs(
                'afterStep',
                config.afterStep,
                [params?.step, params?.scenario, getResultObject(world), this]
            )
        })
    }

    /**
     * wraps step definition code with sync/async runner with a retry option
     * @param {object} config
     */
    wrapSteps (config: Options.Testrunner) {
        const wrapStep = this.wrapStep
        const cid = this._cid
        const getHookParams = () => this.getHookParams && this.getHookParams()

        Cucumber.setDefinitionFunctionWrapper((fn: Function, options: StepDefinitionOptions = { retry: 0 }) => {
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

            return wrapStep(fn, isStep, config, cid, options, getHookParams)
        })
    }

    /**
     * wrap step definition to enable retry ability
     * @param   {Function}  code            step definition
     * @param   {boolean}   isStep
     * @param   {object}    config
     * @param   {string}    cid             cid
     * @param   {StepDefinitionOptions} options
     * @param   {Function}  getHookParams  step definition
     * @return  {Function}                  wrapped step definition for sync WebdriverIO code
     */
    wrapStep(
        code: Function,
        isStep: boolean,
        config: Options.Testrunner,
        cid: string,
        options: StepDefinitionOptions,
        getHookParams: Function
    ) {
        return function (this: Cucumber.World, ...args: any[]) {
            const hookParams = getHookParams()
            const retryTest = isStep && isFinite(options.retry) ? options.retry : 0

            /**
             * wrap user step/hook with wdio before/after hooks
             */
            const beforeFn = config.beforeHook
            const afterFn = config.afterHook
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
export {
    CucumberAdapter,
    adapterFactory,
    After,
    AfterAll,
    AfterStep,
    Before,
    BeforeAll,
    BeforeStep,
    DataTable,
    defineParameterType,
    defineStep,
    Given,
    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,
    Then,
    When,
    World
}

declare global {
    namespace WebdriverIO {
        interface CucumberOpts extends CucumberOptions {}
        interface HookFunctionExtension extends HookFunctionExtensionImport {}
    }
}
