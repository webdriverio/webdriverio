import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { EventEmitter } from 'node:events'
import { Writable } from 'node:stream'

import isGlob from 'is-glob'
import { sync as globSync } from 'glob'
import { executeHooksWithArgs } from '@wdio/utils'

import * as Cucumber from '@cucumber/cucumber'
import Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import TagExpressionParser from '@cucumber/tag-expressions'

import { DEFAULT_OPTS, FILE_PROTOCOL } from './constants.js'
import { shouldRun } from './utils.js'

import type {
    CucumberOptions,
    HookFunctionExtension as HookFunctionExtensionImport,
} from './types.js'
import type { Feature, GherkinDocument } from '@cucumber/messages'
import type { ITestCaseHookParameter } from '@cucumber/cucumber'
import type { Capabilities, Options, Frameworks } from '@wdio/types'

import type {
    IRunEnvironment } from '@cucumber/cucumber/api'
import {
    loadConfiguration,
    runCucumber
} from '@cucumber/cucumber/api'

import type { SupportCodeLibraryBuilder } from '@cucumber/cucumber/lib/support_code_library_builder/index.js'

const {
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

    Status,

    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,
    defineParameterType,
    defineStep,
    supportCodeLibraryBuilder,
} = Cucumber

const uuidFn = IdGenerator.uuid()

const require = createRequire(import.meta.url)

const { incrementing } = IdGenerator

function getResultObject(
    world: ITestCaseHookParameter
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
    private _newId = incrementing()
    private _cucumberOpts: Required<CucumberOptions>

    private _hasTests = true

    private gherkinParser: InstanceType<typeof Gherkin.Parser>

    constructor(
        private _cid: string,
        private _config: Options.Testrunner,
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapability,
        private _reporter: EventEmitter,
        private _eventEmitter: EventEmitter
    ) {
        this._eventEmitter = new EventEmitter()
        this._cucumberOpts = Object.assign(
            {},
            DEFAULT_OPTS,
            this._config.cucumberOpts as Required<CucumberOptions>
        )

        this._cucumberOpts.formatOptions = {
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

    filterSpecsByTagExpression(
        specs: Options.Testrunner['specs'] = [],
        tagExpression = this._config.cucumberOpts?.tags ?? ''
    ): typeof specs {
        if (!tagExpression) {
            return specs
        }

        const tagParser = TagExpressionParser(tagExpression)

        const filteredSpecs: Options.Testrunner['specs'] =
            this.getGherkinDocuments([this._specs])
                .map((specDoc: GherkinDocument | GherkinDocument[]) => {
                    const [doc, ...etc] = [specDoc]
                        .flat(1)
                        .filter((doc) => shouldRun(doc, tagParser))

                    const ret = Array.isArray(specDoc)
                        ? // Return group only if its not empty
                        doc && [doc, ...etc]
                        : doc

                    return ret as GherkinDocument | GherkinDocument[]
                })
                .filter((doc: GherkinDocument) => !!doc)
                .map((doc) => {
                    // Get URIs from Gherkin documents to run
                    const [uri, ...etc] = [doc].flat(1).map((doc) => doc.uri!)
                    return Array.isArray(doc) ? [uri, ...etc] : uri
                })

        return filteredSpecs
    }

    async init() {
        // Filter the specs according to the tag expression
        // Some workers would only spawn to then skip the spec (Feature) file
        // Filtering at this stage can prevent the spawning of a massive number of workers
        if (this._config.cucumberOpts?.tags) {
            this._specs = this.filterSpecsByTagExpression([this._specs]).flat(
                1
            )
        }
        // Filter the specs according to line numbers
        if (this._config.cucumberFeaturesWithLineNumbers?.length! > 0) {
            this._specs = this._config.cucumberFeaturesWithLineNumbers!
        }
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

        try {
            await this.registerRequiredModules()
            supportCodeLibraryBuilder.reset(this._cwd, this._newId)

            this.addWdioHooks(this._config, supportCodeLibraryBuilder)

            setDefaultTimeout(this._cucumberOpts.timeout)

            await this.loadFiles()

            const supportCodeLibrary = supportCodeLibraryBuilder.finalize()

            const outStream = new Writable({
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
                { provided: this._cucumberOpts },
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
                        (await import(requiredModule[0]))(requiredModule[1])
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
    addWdioHooks(
        config: Options.Testrunner,
        supportCodeLibraryBuilder: SupportCodeLibraryBuilder
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
    defineStep
}

declare global {
    namespace WebdriverIO {
        interface CucumberOpts extends CucumberOptions {}
        interface HookFunctionExtension extends HookFunctionExtensionImport {}
    }
}
