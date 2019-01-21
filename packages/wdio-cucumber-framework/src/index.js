import * as Cucumber from 'cucumber'
import mockery from 'mockery'
import isGlob from 'is-glob'
import glob from 'glob'
import path from 'path'
import { executeHooksWithArgs } from '@wdio/config'
import logger from '@wdio/logger'
import CucumberWdioEventTranslator from './wdioEventTranslator'
import HookRunner from './hookRunner'
// import HookRunner from './hookRunner'
import { EventEmitter } from 'events'
import { CucumberEventListener } from './eventListener'

const DEFAULT_TIMEOUT = 30000
const DEFAULT_OPTS = {
    backtrace: false, // <boolean> show full backtrace for errors
    compiler: [], // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    failAmbiguousDefinitions: false, // <boolean> treat ambiguous definitions as errors
    failFast: false, // <boolean> abort the run on first failure
    ignoreUndefinedDefinitions: false, // <boolean> treat undefined definitions as warnings
    name: [], // <REGEXP[]> only execute the scenarios with name matching the expression (repeatable)
    profile: [], // <string> (name) specify the profile to use
    require: [], // <string> (file/dir/glob) require files before executing features
    order: 'defined', // <string> switch between deterministic  and random feature execution. Either "defined", "random" or "random:42" whereas 42 is the seed for randomization
    snippetSyntax: undefined, // <string> specify a custom snippet syntax
    snippets: true, // <boolean> hide step definition snippets for pending steps
    source: true, // <boolean> hide source uris
    strict: false, // <boolean> fail if there are any undefined or pending steps
    tagExpression: '', // <string> (expression) only execute the features or scenarios with tags matching the expression
    tagsInTitle: false, // <boolean> add cucumber tags to feature or scenario name
    timeout: DEFAULT_TIMEOUT // <number> timeout for step definitions in milliseconds
}

const log = logger('wdio-cucumber-framework:CucumberAdapter')

class CucumberAdapter {
    constructor (cid, config, specs, capabilities, reporter) {
        this.cwd = process.cwd()
        this.cid = cid
        this.config = config
        this.specs = specs
        this.capabilities = capabilities
        this.reporter = reporter
        this.cucumberOpts = Object.assign(DEFAULT_OPTS, config.cucumberOpts)
    }

    async run () {
        log.debug(`Running Cucumber Adapter with this config ${JSON.stringify(this.config)}`)
        Cucumber.supportCodeLibraryBuilder.reset(this.cwd)

        this.wrapSteps()
        this.registerCompilers()
        this.loadSpecFiles()

        Cucumber.setDefaultTimeout(this.cucumberOpts.timeout)
        const supportCodeLibrary = Cucumber.supportCodeLibraryBuilder.finalize()
        const eventBroadcaster = new EventEmitter()
        const reporterOptions = {
            capabilities: this.capabilities,
            ignoreUndefinedDefinitions: Boolean(this.cucumberOpts.ignoreUndefinedDefinitions),
            failAmbiguousDefinitions: Boolean(this.cucumberOpts.failAmbiguousDefinitions),
            tagsInTitle: Boolean(this.cucumberOpts.tagsInTitle)
        }

        const eventTranslator = new CucumberWdioEventTranslator(eventBroadcaster, reporterOptions, this.cid, this.specs, this.reporter)
        // eslint-disable-next-line no-unused-vars
        const hookRunner = new HookRunner(eventBroadcaster, this.config)

        const pickleFilter = new Cucumber.PickleFilter({
            featurePaths: this.spec,
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
        const result = await runtime.start()
        await executeHooksWithArgs(this.config.after, [result, this.capabilities, this.specs])
        await eventTranslator.waitUntilSettled()
        log.debug(`full result from cucumber ${JSON.stringify(runtime.result)}`)
        return result ? 0 : 1
    }

    wrapSteps () {
        // Still not sure how to hook up correctly to wdio/sync
    }

    registerCompilers () {
        this.cucumberOpts.compiler.forEach(compiler => {
            const parts = compiler.split(':')
            require(parts[1])
        })
    }

    requiredFiles () {
        return this.cucumberOpts.require.reduce((files, requiredFile) => {
            if (isGlob(requiredFile)) {
                return files.concat(glob.sync(requiredFile))
            } else {
                return files.concat([requiredFile])
            }
        }, [])
    }

    loadSpecFiles () {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        })
        mockery.registerMock('cucumber', Cucumber)
        this.requiredFiles().forEach((codePath) => {
            let absolutePath
            if (path.isAbsolute(codePath)) {
                absolutePath = codePath
            } else {
                absolutePath = path.join(process.cwd(), codePath)
            }
            require(absolutePath)
        })
        mockery.disable()
    }
}

const adapterFactory = {}

adapterFactory.run = async function (...args) {
    const adapter = new CucumberAdapter(...args)
    return await adapter.run()
}

export default adapterFactory
export { CucumberAdapter, adapterFactory }
