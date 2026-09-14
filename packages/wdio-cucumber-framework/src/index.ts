import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
import { Writable } from 'node:stream'

import isGlob from 'is-glob'
import { sync as globSync } from 'glob'

import logger from '@wdio/logger'
import { executeHooksWithArgs, testFnWrapper } from '@wdio/utils'
import type { Capabilities, Frameworks } from '@wdio/types'

import {
    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    supportCodeLibraryBuilder,
    Status,
} from '@cucumber/cucumber'
import Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type { Feature, GherkinDocument } from '@cucumber/messages'
import type Cucumber from '@cucumber/cucumber'
import type { IConfiguration, IRunEnvironment } from '@cucumber/cucumber/api'
import { loadConfiguration, loadSources, runCucumber } from '@cucumber/cucumber/api'

import { DEFAULT_OPTS } from './constants.js'
import { generateSkipTagsFromCapabilities, setUserHookNames } from './utils.js'
import type {
    CucumberOptions,
    HookFunctionExtension as HookFunctionExtensionImport,
    StepDefinitionOptions
} from './types.js'

export const FILE_PROTOCOL = 'file://'

const uuidFn = IdGenerator.uuid()
const log = logger('@wdio/cucumber-framework')
const require = createRequire(import.meta.url)
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

function getResultObject(
    world: Cucumber.ITestCaseHookParameter
): Frameworks.PickleResult {
    return {
        passed:
            world.result?.status === Status.PASSED ||
            world.result?.status === Status.SKIPPED,
        error: world.result?.message as string,
        duration: (world.result?.duration?.nanos as number) / 1e6, // convert into ms
    }
}

export class CucumberAdapter {
    private _cwd = process.cwd()
    private _newId = IdGenerator.incrementing()
    private _cucumberOpts: Required<CucumberOptions>

    private _hasTests = true

    private gherkinParser: InstanceType<typeof Gherkin.Parser>

    constructor(
        private _cid: string,
        private _config: WebdriverIO.Config,
        private _specs: string[],
        private _capabilities: Capabilities.ResolvedTestrunnerCapabilities,
        private _reporter: EventEmitter,
        private _eventEmitter: EventEmitter,
        private _generateSkipTags: boolean = true,
        private _cucumberFormatter: string = url.pathToFileURL(path.resolve(__dirname, 'cucumberFormatter.js')).href
    ) {
        this._eventEmitter = new EventEmitter()
        this._cucumberOpts = Object.assign(
            {},
            DEFAULT_OPTS,
            this._config.cucumberOpts as Required<CucumberOptions>
        )

        /**
         * WebdriverIO doesn't support this Cucumber feature so we should let the user know
         */
        if (this._config.cucumberOpts?.parallel) {
            throw new Error('The option "parallel" is not supported by WebdriverIO')
        }

        /**
         * Including the `cucumberFormatter` here allows you to use cucumber formatting in addition to other formatting options.
         */
        this._cucumberOpts.format.push([this._cucumberFormatter])

        /**
         * formatting options used by custom cucumberFormatter
         * https://github.com/cucumber/cucumber-js/blob/3a945b1077d4539f8a363c955a0506e088ff4271/docs/formatters.md#options
         */
        this._cucumberOpts.formatOptions = {

            // We need to pass the user provided Formatter options
            // Example: JUnit formatter https://github.com/cucumber/cucumber-js/blob/3a945b1077d4539f8a363c955a0506e088ff4271/docs/formatters.md#junit
            // { junit: { suiteName: "MySuite" } }
            ...(this._cucumberOpts.formatOptions ?? {}),

            // Our Cucumber Formatter options
            // Put last so that user does not override them
            _reporter: this._reporter,
            _cid: this._cid,
            _specs: this._specs,
            _eventEmitter: this._eventEmitter,
            _scenarioLevelReporter: this._cucumberOpts.scenarioLevelReporter,
            _tagsInTitle: this._cucumberOpts.tagsInTitle,
            _ignoreUndefinedDefinitions: this._cucumberOpts.ignoreUndefinedDefinitions,
            _failAmbiguousDefinitions: this._cucumberOpts.failAmbiguousDefinitions
        }

        const builder = new Gherkin.AstBuilder(uuidFn)
        const matcher = new Gherkin.GherkinClassicTokenMatcher(
            this._cucumberOpts.language
        )
        this.gherkinParser = new Gherkin.Parser(builder, matcher)

        /**
         * as Cucumber doesn't support file:// formats yet we have to
         * remove it before adding it to Cucumber
         */
        this._specs = this._specs.map((spec) =>
            spec.startsWith(FILE_PROTOCOL) ? url.fileURLToPath(spec) : spec
        )

        // backwards compatibility for tagExpression usage
        this._cucumberOpts.tags = this._cucumberOpts.tags || this._cucumberOpts.tagExpression

        if (this._cucumberOpts.tagExpression) {
            log.warn("'tagExpression' is deprecated. Use 'tags' instead.")
        }
    }

    readFiles(
        filePaths: WebdriverIO.Config['specs'] = []
    ): (string | string[])[] {
        return filePaths.map((filePath) => {
            return Array.isArray(filePath)
                ? filePath.map((file) =>
                    fs.readFileSync(path.resolve(file), 'utf8')
                )
                : fs.readFileSync(path.resolve(filePath), 'utf8')
        })
    }

    getGherkinDocuments(
        files: WebdriverIO.Config['specs'] = []
    ): (GherkinDocument | GherkinDocument[])[] {
        return this.readFiles(files).map((specContent, idx) => {
            const docs: GherkinDocument[] = [specContent].flat(1).map(
                (content, ctIdx) =>
                    ({
                        ...this.gherkinParser.parse(content),
                        uri: Array.isArray(specContent)
                            ? files[idx][ctIdx]
                            : files[idx],
                    } as GherkinDocument)
            )

            const [doc, ...etc] = docs

            return etc.length ? docs : doc
        })
    }

    generateDynamicSkipTags() {
        return this.getGherkinDocuments([this._specs])
            .map((specDoc: GherkinDocument | GherkinDocument[]) => {
                const [doc] = [specDoc].flat(1)
                const pickles = Gherkin.compile(doc, '', uuidFn)
                const tags = pickles.map((pickle) => pickle.tags.map((tag) => tag.name))
                const generatedTag = generateSkipTagsFromCapabilities(this._capabilities, tags)
                return generatedTag.length > 0 ? generatedTag.join(' and '): []
            }).flat(1)
    }

    async init() {
        if (this._generateSkipTags) {
            this._cucumberOpts.tags = this.generateDynamicSkipTags().concat(this._cucumberOpts.tags || []).join(' and ')
        }

        // Filter the specs according to the tag expression
        // Some workers would only spawn to then skip the spec (Feature) file
        // Filtering at this stage can prevent the spawning of a massive number of workers
        const { plan } = await loadSources({
            paths: this._specs,
            defaultDialect: this._cucumberOpts.language,
            order: this._cucumberOpts.order,
            names: this._cucumberOpts.name,
            tagExpression: this._cucumberOpts.tags,
        })
        this._specs = plan?.map((pl) => path.resolve(pl.uri))

        // Filter features (of which at least some have line numbers) against the already filtered specs
        const lineNumbers = this._config.cucumberFeaturesWithLineNumbers?.length ?? 0
        if (lineNumbers > 0) {
            this._specs = this._config.cucumberFeaturesWithLineNumbers!.filter(feature =>
                this._specs.some(spec => path.resolve(feature).startsWith(spec))
            )
        }

        this._specs = [...new Set(this._specs)]

        this._cucumberOpts.paths = this._specs
        this._hasTests = this._specs.length > 0
        return this
    }

    hasTests() {
        return this._hasTests
    }

    async run() {
        let runtimeError
        let result
        let failedCount
        let outStream

        try {
            await this.registerRequiredModules()
            supportCodeLibraryBuilder.reset(this._cwd, this._newId, {
                requireModules: this._cucumberOpts.requireModule,
                requirePaths: this._cucumberOpts.require,
                importPaths: this._cucumberOpts.import,
                loaders: []
            })

            this.addWdioHooks(this._config, supportCodeLibraryBuilder)
            await this.loadFiles()
            this.wrapSteps(this._config)
            setUserHookNames(supportCodeLibraryBuilder)
            setDefaultTimeout(this._cucumberOpts.timeout)

            const supportCodeLibrary = supportCodeLibraryBuilder.finalize()

            outStream = new Writable({
                write(chunk, encoding, callback) {
                    callback()
                },
            })

            this._eventEmitter.on('getFailedCount', (payload) => {
                failedCount = payload
            })

            const environment: IRunEnvironment = {
                cwd: this._cwd,
                stderr: outStream,
                stdout: outStream,
            }

            const { runConfiguration } = await loadConfiguration(
                { profiles: this._cucumberOpts.profiles, provided: this._cucumberOpts as Partial<IConfiguration>, file: this._cucumberOpts.file },
                environment
            )

            const { success } = await runCucumber(
                {
                    ...runConfiguration,
                    support: supportCodeLibrary || runConfiguration.support,
                },
                environment
            )

            result = success ? 0 : 1

            /**
             * if we ignore undefined definitions we trust the reporter
             * with the fail count
             */
            if (this._cucumberOpts.ignoreUndefinedDefinitions && result) {
                result = failedCount
            }
        } catch (err) {
            runtimeError = err
            result = 1
        } finally {
            outStream?.end()
        }

        await executeHooksWithArgs('after', this._config.after, [
            runtimeError || result,
            this._capabilities,
            this._specs,
        ])

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
        return Promise.all(
            this._cucumberOpts.requireModule.map(
                async (requiredModule: string | Function | string[]) => {
                    if (Array.isArray(requiredModule)) {
                        (await import(requiredModule[0])).default(requiredModule[1])
                    } else if (typeof requiredModule === 'function') {
                        requiredModule()
                    } else {
                        await import(requiredModule)
                    }
                }
            )
        )
    }

    async loadFilesWithType(fileList: string[]) {
        return fileList.reduce(
            (files: string[], file: string) => {
                const filePath = os.platform() === 'win32'
                    ? url.pathToFileURL(file).href
                    : file
                return files.concat(isGlob(filePath) ? globSync(filePath) : [filePath])
            },
            []
        )
    }

    async loadAndRefreshModule(modules: string[]) {
        const importedModules = []

        for (const module of modules) {
            const filepath = module.startsWith(FILE_PROTOCOL)
                ? module
                : path.isAbsolute(module)
                    ? url.pathToFileURL(module).href
                    : url.pathToFileURL(path.join(process.cwd(), module)).href
            // This allows rerunning a stepDefinitions file
            const stepDefPath = url.pathToFileURL(
                require.resolve(url.fileURLToPath(filepath))
            ).href
            const cacheEntryToDelete = Object.keys(require.cache).find(
                (u) => url.pathToFileURL(u).href === stepDefPath
            )
            if (cacheEntryToDelete) {
                delete require.cache[cacheEntryToDelete]
            }
            const importedModule = await import(filepath)
            importedModules.push(importedModule)
        }

        return importedModules
    }

    async loadFiles() {
        await Promise.all([
            this.loadAndRefreshModule(
                await this.loadFilesWithType(this._cucumberOpts.require)
            ),
            this.loadAndRefreshModule(
                await this.loadFilesWithType(this._cucumberOpts.import)
            ),
        ])
    }

    /**
     * set `beforeFeature`, `afterFeature`, `beforeScenario`, `afterScenario`, 'beforeStep', 'afterStep'
     * @param {object} config config
     */
    addWdioHooks(
        config: WebdriverIO.Config,
        supportCodeLibraryBuilder: typeof Cucumber.supportCodeLibraryBuilder
    ) {
        const params: { uri?: string; feature?: Feature } = {}
        this._eventEmitter.on('getHookParams', (payload: typeof params) => {
            params.uri = payload.uri
            params.feature = payload.feature
        })

        supportCodeLibraryBuilder.methods.BeforeAll(async function wdioHookBeforeFeature() {
            await executeHooksWithArgs('beforeFeature', config.beforeFeature, [
                params.uri,
                params.feature,
            ])
        })

        supportCodeLibraryBuilder.methods.Before(async function wdioHookBeforeScenario(world) {
            await executeHooksWithArgs(
                'beforeScenario',
                config.beforeScenario,
                [world, this]
            )
        })

        supportCodeLibraryBuilder.methods.BeforeStep(async function wdioHookBeforeStep(world) {
            await executeHooksWithArgs('beforeStep', config.beforeStep, [
                world.pickleStep,
                world.pickle,
                this,
            ])
        })

        supportCodeLibraryBuilder.methods.AfterStep(async function wdioHookAfterStep(world) {
            await executeHooksWithArgs('afterStep', config.afterStep, [
                world.pickleStep,
                world.pickle,
                getResultObject(world),
                this,
            ])
        })

        supportCodeLibraryBuilder.methods.After(async function wdioHookAfterScenario(world) {
            await executeHooksWithArgs('afterScenario', config.afterScenario, [
                world,
                getResultObject(world),
                this,
            ])
        })

        supportCodeLibraryBuilder.methods.AfterAll(async function wdioHookAfterFeature() {
            await executeHooksWithArgs('afterFeature', config.afterFeature, [
                params.uri,
                params.feature,
            ])
        })
    }

    /**
     * wraps step definition code with sync/async runner with a retry option
     * @param {object} config
     */
    wrapSteps (config: WebdriverIO.Config) {
        const wrapStep = this.wrapStep
        const cid = this._cid

        let params: unknown
        this._eventEmitter.on('getHookParams', (payload) => {
            params = payload
        })

        const getHookParams = () => params

        setDefinitionFunctionWrapper(
            (fn: Function, options: StepDefinitionOptions = { retry: 0 }) => {
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

                /**
                 * Steps without wrapperOptions are returned promptly, avoiding failures when steps are defined with timeouts.
                 * However, steps with set wrapperOptions have limitations in utilizing timeouts.
                 */
                if (isStep && !options.retry) {
                    return fn
                }

                return wrapStep(fn, isStep, config, cid, options, getHookParams, this._cucumberOpts.timeout)
            }
        )
    }

    /**
     * wrap step definition to enable retry ability
     * @param   {Function}  code            step definition
     * @param   {boolean}   isStep
     * @param   {object}    config
     * @param   {string}    cid             cid
     * @param   {StepDefinitionOptions} options
     * @param   {Function}  getHookParams  step definition
     * @param   {number}    timeout        the maximum time (in milliseconds) to wait for
     * @return  {Function}                 wrapped step definition for sync WebdriverIO code
     */
    wrapStep(
        code: Function,
        isStep: boolean,
        config: WebdriverIO.Config,
        cid: string,
        options: StepDefinitionOptions,
        getHookParams: Function,
        timeout?: number,
        hookName: string | undefined = undefined,
    ): Function {
        return function (this: Cucumber.World, ...args: unknown[]) {
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
                { beforeFn: beforeFn as Function[], beforeFnArgs: (context: unknown) => [hookParams?.step, context] },
                { afterFn: afterFn as Function[], afterFnArgs: (context: unknown) => [hookParams?.step, context] },
                cid,
                retryTest, hookName, timeout)
        }
    }
}
/**
 * Publishes a Cucumber report to a specified URL using NDJSON files from a directory.
 * @async
 * @param {string} cucumberMessageDir - The directory path that holds Cucumber NDJSON files.
 * @returns {Promise<void>} - A Promise that resolves when the report is successfully published.
 * @throws {Error} - Throws an error if there are issues with file reading or the publishing process.
 */
export const publishCucumberReport = async (cucumberMessageDir: string): Promise<void> => {
    const url = process.env.CUCUMBER_PUBLISH_REPORT_URL || 'https://messages.cucumber.io/api/reports'
    const token = process.env.CUCUMBER_PUBLISH_REPORT_TOKEN
    if (!token) {
        log.debug('Publishing reports are skipped because `CUCUMBER_PUBLISH_REPORT_TOKEN` environment variable value is not set.')
        return
    }

    const response = await fetch(url, {
        method: 'get',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })

    const location = response.headers.get('location')

    const files = (await readdir(path.normalize(cucumberMessageDir))).filter((file) => path.extname(file) === '.ndjson')

    const cucumberMessage = (
        await Promise.all(
            files.map((file) =>
                readFile(
                    path.normalize(path.join(cucumberMessageDir, file)),
                    'utf8'
                )
            )
        )
    ).join('')

    await fetch(location as string, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
        body: `${cucumberMessage}`
    })
}

const _CucumberAdapter = CucumberAdapter
export const adapterFactory: { init?: Function } = {}

/**
 * tested by smoke tests
 */
/* istanbul ignore next */
adapterFactory.init = async function (...args: unknown[]) {
    // @ts-ignore just passing through args
    const adapter = new _CucumberAdapter(...(args as unknown))
    const instance = await adapter.init()
    return instance
}

export default adapterFactory
export * from '@cucumber/cucumber'

declare global {
    namespace WebdriverIO {
        interface CucumberOpts extends CucumberOptions {}
        interface HookFunctionExtension extends HookFunctionExtensionImport {}
    }
}
