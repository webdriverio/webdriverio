import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
import { Writable } from 'node:stream'

import got from 'got'
import isGlob from 'is-glob'
import { sync as globSync } from 'glob'

import logger from '@wdio/logger'
import { executeHooksWithArgs } from '@wdio/utils'
import type { Capabilities, Options, Frameworks } from '@wdio/types'

import {
    After,
    AfterAll,
    AfterStep,

    Before,
    BeforeAll,
    BeforeStep,

    Given,
    When,
    Then,

    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    supportCodeLibraryBuilder,
    setWorldConstructor,
    defineParameterType,
    defineStep,

    DataTable,
    World,
    Status
} from '@cucumber/cucumber'
import Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type { Feature, GherkinDocument } from '@cucumber/messages'
import type Cucumber from '@cucumber/cucumber'
import type { IRunEnvironment } from '@cucumber/cucumber/api'
import { loadConfiguration, loadSources, runCucumber } from '@cucumber/cucumber/api'

import { DEFAULT_OPTS } from './constants.js'
import { generateSkipTagsFromCapabilities } from './utils.js'
import type {
    CucumberOptions,
    HookFunctionExtension as HookFunctionExtensionImport,
    StepDefinitionOptions
} from './types.js'

export const FILE_PROTOCOL = 'file://'

const uuidFn = IdGenerator.uuid()
const log = logger('@wdio/cucumber-framework')
const require = createRequire(import.meta.url)

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

class CucumberAdapter {
    private _cwd = process.cwd()
    private _newId = IdGenerator.incrementing()
    private _cucumberOpts: Required<CucumberOptions>

    private _hasTests = true

    private gherkinParser: InstanceType<typeof Gherkin.Parser>

    constructor(
        private _cid: string,
        private _config: Options.Testrunner,
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: EventEmitter,
        private _eventEmitter: EventEmitter,
        private _generateSkipTags: boolean = true,
        private _cucumberFormatter: string = url.pathToFileURL(path.resolve(url.fileURLToPath(import.meta.url), '..', 'cucumberFormatter.js')).href
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
        filePaths: Options.Testrunner['specs'] = []
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
        files: Options.Testrunner['specs'] = []
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

        // Filter the specs according to line numbers
        if (this._config.cucumberFeaturesWithLineNumbers?.length! > 0) {
            this._specs = this._config.cucumberFeaturesWithLineNumbers!
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
            })

            this.addWdioHooksAndWrapSteps(this._config, supportCodeLibraryBuilder)

            setDefaultTimeout(this._cucumberOpts.timeout)

            await this.loadFiles()

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
                { profiles: this._cucumberOpts.profiles, provided: this._cucumberOpts },
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
        } catch (err: any) {
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
            (files: string[], file: string) =>
                files.concat(isGlob(file) ? globSync(file) : [file]),
            []
        )
    }

    async loadAndRefreshModule(modules: string[]) {
        const importedModules = []

        for (const module of modules) {
            const filepath = path.isAbsolute(module)
                ? module.startsWith(FILE_PROTOCOL)
                    ? module
                    : url.pathToFileURL(module).href
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
    addWdioHooksAndWrapSteps(
        config: Options.Testrunner,
        supportCodeLibraryBuilder: typeof Cucumber.supportCodeLibraryBuilder
    ) {
        const params: { uri?: string; feature?: Feature } = {}
        this._eventEmitter.on('getHookParams', (payload: typeof params) => {
            params.uri = payload.uri
            params.feature = payload.feature
        })

        supportCodeLibraryBuilder.methods.BeforeAll(async function () {
            await executeHooksWithArgs('beforeFeature', config.beforeFeature, [
                params.uri,
                params.feature,
            ])
        })

        supportCodeLibraryBuilder.methods.Before(async function (world) {
            await executeHooksWithArgs(
                'beforeScenario',
                config.beforeScenario,
                [world, this]
            )
        })

        supportCodeLibraryBuilder.methods.BeforeStep(async function (world) {
            await executeHooksWithArgs('beforeStep', config.beforeStep, [
                world.pickleStep,
                world.pickle,
                this,
            ])
        })

        supportCodeLibraryBuilder.methods.AfterStep(async function (world) {
            await executeHooksWithArgs('afterStep', config.afterStep, [
                world.pickleStep,
                world.pickle,
                getResultObject(world),
                this,
            ])
        })

        supportCodeLibraryBuilder.methods.After(async function (world) {
            await executeHooksWithArgs('afterScenario', config.afterScenario, [
                world,
                getResultObject(world),
                this,
            ])
        })

        supportCodeLibraryBuilder.methods.AfterAll(async function () {
            await executeHooksWithArgs('afterFeature', config.afterFeature, [
                params.uri,
                params.feature,
            ])
        })

        supportCodeLibraryBuilder.methods.setDefinitionFunctionWrapper(function (fn: Function, options: StepDefinitionOptions = { retry: 0 }) {
            const retries = { attempts: 0, limit: isFinite(options?.retry) ? options.retry : 0 }

            if (retries.limit !== 0) {
                return async function (this: Record<string, any>, ...args: any[]) {
                    while (retries.limit >= retries.attempts) {
                        this.wdioRetries = retries.attempts
                        try {
                            await fn.apply(this, args)
                            break
                        } catch (error) {
                            if (retries.limit === retries.attempts) {
                                throw error
                            }
                            retries.attempts++
                        }
                    }
                }
            }

            return fn
        })
    }
}
/**
 * Publishes a Cucumber report to a specified URL using NDJSON files from a directory.
 * @async
 * @param {string} cucumberMessageDir - The directory path that holds Cucumber NDJSON files.
 * @returns {Promise<void>} - A Promise that resolves when the report is successfully published.
 * @throws {Error} - Throws an error if there are issues with file reading or the publishing process.
 */
const publishCucumberReport = async (cucumberMessageDir: string): Promise<void> => {
    const url = process.env.CUCUMBER_PUBLISH_REPORT_URL || 'https://messages.cucumber.io/api/reports'
    const token = process.env.CUCUMBER_PUBLISH_REPORT_TOKEN
    if (!token) {
        log.debug('Publishing reports are skipped because `CUCUMBER_PUBLISH_REPORT_TOKEN` environment variable value is not set.')
        return
    }

    const { headers } = await got(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    })

    const { location } = headers

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

    await got.put(location as string, {
        headers: {
            'Content-Type': 'application/json'
        },
        body: `${cucumberMessage}`
    })
}

const _CucumberAdapter = CucumberAdapter
const adapterFactory: { init?: Function } = {}

/**
 * tested by smoke tests
 */
/* istanbul ignore next */
adapterFactory.init = async function (...args: any[]) {
    // @ts-ignore just passing through args
    const adapter = new _CucumberAdapter(...(args as any))
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

    Given,
    When,
    Then,

    DataTable,

    World,

    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,
    defineParameterType,
    defineStep,

    publishCucumberReport
}

declare global {
    namespace WebdriverIO {
        interface CucumberOpts extends CucumberOptions {}
        interface HookFunctionExtension extends HookFunctionExtensionImport {}
    }
}
