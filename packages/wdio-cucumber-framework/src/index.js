import * as Cucumber from 'cucumber'
import mockery from 'mockery'
import isGlob from 'is-glob'
import glob from 'glob'
import path from 'path'

import CucumberReporter from './reporter'

import Hookrunner from './hookRunner'
import { EventEmitter } from 'events'

import {
    executeHooksWithArgs, executeSync, executeAsync,
    runFnInFiberContext, hasWdioSyncSupport
} from '@wdio/config'
import { DEFAULT_OPTS } from './constants'

class CucumberAdapter {
    constructor (cid, config, specs, capabilities, reporter) {
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

        Cucumber.supportCodeLibraryBuilder.reset(this.cwd)

        try {
            this.registerCompilers()
            this.loadSpecFiles()
            this.wrapSteps()
            Cucumber.setDefaultTimeout(this.cucumberOpts.timeout)
            const supportCodeLibrary = Cucumber.supportCodeLibraryBuilder.finalize()

            const eventBroadcaster = new EventEmitter()
            // eslint-disable-next-line no-new
            new Hookrunner(eventBroadcaster, this.config)
            const reporterOptions = {
                capabilities: this.capabilities,
                ignoreUndefinedDefinitions: Boolean(this.cucumberOpts.ignoreUndefinedDefinitions),
                failAmbiguousDefinitions: Boolean(this.cucumberOpts.failAmbiguousDefinitions),
                tagsInTitle: Boolean(this.cucumberOpts.tagsInTitle)
            }

            this.cucumberReporter = new CucumberReporter(eventBroadcaster, reporterOptions, this.cid, this.specs, this.reporter)

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
        //await reporter.waitUntilSettled()

        return result
    }

    registerCompilers () {
        this.cucumberOpts.compiler.forEach(compiler => {
            if (compiler instanceof Array) {
                let parts = compiler[0].split(':')
                return require(parts[1])(compiler[1])
            }

            let parts = compiler.split(':')
            require(parts[1])
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
     * wraps step definition code with sync/async runner with a retry option
     */
    wrapSteps () {
        const wrapStepSync = this.wrapStepSync
        const wrapStepAsync = this.wrapStepAsync

        Cucumber.setDefinitionFunctionWrapper((fn, options = {}) => {
            const retryTest = isFinite(options.retry) ? parseInt(options.retry, 10) : 0
            return fn.name === 'async' || !hasWdioSyncSupport
                ? wrapStepAsync(fn, retryTest)
                /* istanbul ignore next */
                : wrapStepSync(fn, retryTest)
        })
    }

    /**
     * wrap step definition to enable retry ability
     * @param  {Function} code       step definition
     * @param  {Number}   retryTest  amount of allowed repeats is case of a failure
     * @return {Function}            wrapped step definiton for sync WebdriverIO code
     */
    wrapStepSync (code, retryTest = 0) {
        return function (...args) {
            return runFnInFiberContext(
                executeSync.bind(this, code, retryTest, args),
            ).apply(this)
        }
    }

    /**
     * wrap step definition to enable retry ability
     * @param  {Function} code       step definitoon
     * @param  {Number}   retryTest  amount of allowed repeats is case of a failure
     * @return {Function}            wrapped step definiton for async WebdriverIO code
     */
    wrapStepAsync (code, retryTest = 0) {
        return function (...args) {
            return executeAsync.call(this, code, retryTest, args)
        }
    }
}

const _CucumberAdapter = CucumberAdapter
const adapterFactory = {}

/**
 * tested by smoke tests
 */
/* istanbul ignore next */
adapterFactory.run = async function (...args) {
    const adapter = new _CucumberAdapter(...args)
    const result = await adapter.run()
    return result
}

export default adapterFactory
export { CucumberAdapter, adapterFactory }
