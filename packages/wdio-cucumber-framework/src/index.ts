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
import * as Gherkin from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import type { Feature, GherkinDocument } from '@cucumber/messages'
import type Cucumber from '@cucumber/cucumber'
import type { IConfiguration, IRunEnvironment } from '@cucumber/cucumber/api'
import { loadConfiguration, loadSources, runCucumber } from '@cucumber/cucumber/api'

import { DEFAULT_OPTS } from './constants.js'
import { generateSkipTagsFromCapabilities, setUserHookNames, userRunHooks } from './utils.js'
import type {
    CucumberOptions,
    HookFunctionExtension as HookFunctionExtensionImport,
    StepDefinitionOptions,
    ParallelBrowser,
    ParallelMode,
} from './types.js'
import { runParallelCucumber, parallelRunHasStarted } from './parallel.js'

export const FILE_PROTOCOL = 'file://'

const uuidFn = IdGenerator.uuid()
const log = logger('@wdio/cucumber-framework')
const require = createRequire(import.meta.url)

/**
 * Cucumber's advice for its own CLI: WebdriverIO loads the support code itself, so it would be wrong in every worker
 */
const CUCUMBER_CLI_ADVICE = [
    'Use of `require-module` option',
    'Use of `loader` option',
]

// the values that Cucumber owns: from cucumberOpts, then the profile or config file, then Cucumber's defaults
const CUCUMBER_VALUES = [
    'backtrace', 'dryRun', 'failFast', 'forceExit', 'import', 'language', 'name', 'order',
    'publish', 'require', 'retry', 'retryTagFilter', 'strict', 'tags', 'worldParameters',
] as const
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
    // added by WebdriverIO to the values that the user wrote (see `_providedConfiguration`)
    private _generatedTags?: string
    private _seededOrder?: string
    /** a profile or config file error: run() throws it, after the `after` hook, as Cucumber's own errors */
    private _configurationError?: unknown
    /** the Cucumber output that the worker already wrote: the configuration loads up to 3 times */
    private _cucumberOutput = new Set<string>()
    private _warnedProfileValues = new Set<string>()
    private _browser?: WebdriverIO.Browser

    // set in the constructor and again in init(), with the language that Cucumber runs with
    private gherkinParser!: InstanceType<typeof Gherkin.Parser>

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
         * Cucumber replaced this flag with `tags`. Do not alias it: a silent
         * fallback would run a different set of scenarios than the user asked for.
         */
        const legacyTagExpression = (this._config.cucumberOpts as (CucumberOptions & { tagExpression?: string }) | undefined)?.tagExpression
        if (legacyTagExpression) {
            throw new Error('The option "tagExpression" was removed. Use "tags" instead. See https://github.com/cucumber/cucumber-js/blob/main/UPGRADING.md#1300')
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
            _failAmbiguousDefinitions: this._cucumberOpts.failAmbiguousDefinitions,
            _rootDir: this._config.rootDir
        }

        this._createGherkinParser()

        /**
         * as Cucumber doesn't support file:// formats yet we have to
         * remove it before adding it to Cucumber
         */
        this._specs = this._specs.map((spec) =>
            spec.startsWith(FILE_PROTOCOL) ? url.fileURLToPath(spec) : spec
        )
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

    private _createGherkinParser() {
        const builder = new Gherkin.AstBuilder(uuidFn)
        const matcher = new Gherkin.GherkinClassicTokenMatcher(
            this._cucumberOpts.language
        )
        this.gherkinParser = new Gherkin.Parser(builder, matcher)
    }

    /**
     * Cucumber merges its defaults, then the profile or config file, then `provided`. So `provided` holds
     * what the user wrote and the values that WebdriverIO adds, not the WebdriverIO defaults
     */
    _providedConfiguration(): Partial<IConfiguration> {
        // WebdriverIO loads requireModule itself (all its forms): Cucumber gives the modules of the profile only
        // the specs are the paths of the run (_loadRunConfiguration): Cucumber gives the paths of the profile only
        const { tags, requireModule: _requireModule, paths: _paths, ...user } = (this._config.cucumberOpts ?? {}) as CucumberOptions
        // Cucumber wraps the tags that it joins, but not `(@a) or (@b)`: its `or` would escape the `and` with the profile tags
        const userTags = this._generatedTags ?? (tags && /^\(.*\)$/s.test(tags) ? `(${tags})` : tags)
        return {
            ...user,
            // WebdriverIO runs the workers and shards the specs, and publishes no report unless cucumberOpts asks
            parallel: 0,
            shard: '',
            publish: (user as { publish?: boolean }).publish ?? false,
            // an empty value would replace the tags of the profile
            ...(userTags ? { tags: userTags } : {}),
            ...(this._seededOrder ? { order: this._seededOrder } : {}),
            format: this._cucumberOpts.format,
            formatOptions: this._cucumberOpts.formatOptions,
        } as Partial<IConfiguration>
    }

    /**
     * the values that Cucumber runs with, for the code that reads them before or outside of Cucumber
     */
    private _useCucumberValues(configuration: IConfiguration) {
        for (const key of CUCUMBER_VALUES) {
            (this._cucumberOpts as Record<string, unknown>)[key] = configuration[key as keyof IConfiguration]
        }
        // a loader for the Cucumber CLI (often ts-node/register): WebdriverIO has its own TypeScript loader
        this._warnProfileValue('requireModule', configuration.requireModule, 'Set "cucumberOpts.requireModule" to load a module.')
        this._cucumberOpts.requireModule = (this._config.cucumberOpts?.requireModule ?? []) as string[]
    }

    /**
     * the values that Cucumber runs with (cucumberOpts, profiles, config file), and the Gherkin parser of its language
     */
    private async _resolveCucumberValues() {
        const { useConfiguration } = await loadConfiguration(
            { profiles: this._cucumberOpts.profiles, provided: this._providedConfiguration(), file: this._configurationFile() },
            this._cucumberEnvironment()
        )
        this._warnProfileValue('paths', useConfiguration.paths, 'WebdriverIO runs the feature files of "specs".')
        this._useCucumberValues(useConfiguration)
        this._createGherkinParser()
    }

    async init() {
        // first: the skip tags parse the feature files in the language of the profile
        try {
            await this._resolveCucumberValues()
            if (this._generateSkipTags) {
                // wrap the user expression so an `or` in it can't escape the generated `and` conditions
                const skipTags = this.generateDynamicSkipTags()
                if (skipTags.length > 0) {
                    const userTags = this._config.cucumberOpts?.tags ? [`(${this._config.cucumberOpts.tags})`] : []
                    // the run: Cucumber joins the profile tags again; init: the tags that the first load resolved
                    this._generatedTags = [...skipTags, ...userTags].join(' and ')
                    this._cucumberOpts.tags = [...skipTags, ...(this._cucumberOpts.tags ? [`(${this._cucumberOpts.tags})`] : [])].join(' and ')
                }
            }
        } catch (err) {
            return this._deferConfigurationError(err)
        }

        // the reporters (cucumberjs-json) read the language of the config: the one of the profile too;
        // not Cucumber's default `en`, which would replace the `language` option of the reporter
        if (this._cucumberOpts.language && this._cucumberOpts.language !== (this._config.cucumberOpts?.language ?? 'en')) {
            this._config.cucumberOpts = { ...this._config.cucumberOpts, language: this._cucumberOpts.language }
        }

        // One seed for loadSources and the run; Cucumber logs the seed of the run to a discarded stream
        if (this._cucumberOpts.order === 'random') {
            const seed = Math.floor(Math.random() * 1000 * 1000)
            this._seededOrder = this._cucumberOpts.order = `random:${seed}`
            log.warn(`Random order using seed: ${seed}`)
        }

        // Filter the specs according to the tag expression
        // Some workers would only spawn to then skip the spec (Feature) file
        // Filtering at this stage can prevent the spawning of a massive number of workers
        let plan: Awaited<ReturnType<typeof loadSources>>['plan']
        try {
            ({ plan } = await loadSources({
                paths: this._specs,
                defaultDialect: this._cucumberOpts.language,
                order: this._cucumberOpts.order,
                names: this._cucumberOpts.name,
                tagExpression: this._cucumberOpts.tags,
            }))
        } catch (err) {
            // a bad tag expression or name of the profile: as a configuration error
            return this._deferConfigurationError(err)
        }
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

    /**
     * a configuration error: run() throws it, after the `after` hook, as Cucumber's own errors
     */
    private _deferConfigurationError(err: unknown) {
        this._configurationError = err
        this._hasTests = this._specs.length > 0
        return this
    }

    hasTests() {
        return this._hasTests
    }

    async run() {
        let runtimeError: unknown
        let result: number

        try {
            if (this._configurationError) {
                throw this._configurationError
            }
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

            const { parallelMode } = this._cucumberOpts
            result = parallelMode === 'contexts' || parallelMode === 'userContexts'
                ? await this._runParallelMode(supportCodeLibrary, parallelMode)
                : await this._runSequential(supportCodeLibrary)
        } catch (err) {
            runtimeError = err
            result = 1
        }

        /**
         * Run after hooks regardless of which path executed or whether
         * it threw — pass the runtime error so hooks can inspect it.
         */
        await executeHooksWithArgs('after', this._config.after, [
            runtimeError || result,
            this._capabilities,
            this._specs,
        ])

        /**
         * In case the spec has a runtime error throw after the wdio hook
         * so the runner can mark the worker as failed.
         */
        if (runtimeError) {
            throw runtimeError
        }

        return result
    }

    /**
     * Called by the runner once the session browser exists, before `run()`.
     */
    setBrowser(browser: WebdriverIO.Browser) {
        this._browser = browser
    }

    /**
     * Run scenarios in parallel within separate BiDi browsing contexts.
     * Falls back to sequential mode if BiDi is not available.
     *
     * @throws if a runtime error occurs (errors are caught by run())
     */
    private async _runParallelMode(
        supportCodeLibrary: Awaited<ReturnType<typeof supportCodeLibraryBuilder.finalize>>,
        mode: ParallelMode
    ): Promise<number> {
        const browser = (this._browser ?? (globalThis as Record<string, unknown>).browser) as ParallelBrowser

        if (!browser) {
            throw new Error(
                `Parallel mode (cucumberOpts.parallelMode: "${mode}") requires ` +
                'a browser instance (set via setBrowser or on globalThis).'
            )
        }

        const hasBidiCommands = !!(
            browser.__bidiCommandsEnabled ||
            (browser.requestedCapabilities as Record<string, unknown>)?.['wdio:experimentalBiDiCommands'] ||
            (browser.capabilities as Record<string, unknown>)?.['wdio:experimentalBiDiCommands']
        )

        if (!browser.isBidi) {
            log.warn(
                `Parallel mode (cucumberOpts.parallelMode: "${mode}") requires ` +
                'a WebDriver Bidi session. Falling back to sequential execution.'
            )
            return this._runSequential(supportCodeLibrary)
        }

        if (!hasBidiCommands) {
            log.warn(
                `Parallel mode (cucumberOpts.parallelMode: "${mode}") requires ` +
                '"wdio:experimentalBiDiCommands" to be set in capabilities. ' +
                'Falling back to sequential execution.'
            )
            return this._runSequential(supportCodeLibrary)
        }

        // Parse Gherkin documents from filtered specs; a spec `file.feature:12` keeps
        // its line numbers in `specs` for Cucumber's line filter
        const featurePaths = [...new Set(this._specs.map((spec) => spec.replace(/(:\d+)+$/, '')))]
        const gherkinDocuments = this.getGherkinDocuments([featurePaths])
        const { sources, runtime } = await this._loadRunConfiguration(this._cucumberEnvironment())

        try {
            return await runParallelCucumber({
                browser,
                reporter: this._reporter,
                eventEmitter: this._eventEmitter,
                cid: this._cid,
                specs: this._specs,
                gherkinDocuments,
                supportCodeLibrary,
                rootDir: this._config.rootDir,
                cucumberOpts: {
                    ...this._cucumberOpts,
                    tags: sources.tagExpression,
                    name: sources.names,
                    dryRun: runtime.dryRun,
                    failFast: runtime.failFast,
                    retry: runtime.retry,
                    retryTagFilter: runtime.retryTagFilter,
                    strict: runtime.strict,
                    worldParameters: runtime.worldParameters,
                },
            })
        } catch (err) {
            if (parallelRunHasStarted()) {
                // BeforeAll may already have run and scenarios may have
                // executed — re-running them sequentially would double-execute
                // side effects and duplicate reports.
                log.error(
                    `Parallel Cucumber execution failed after execution began: ${(err as Error).message}. ` +
                    'Not falling back to sequential execution to avoid re-running side effects.'
                )
                throw err
            }
            if (mode === 'userContexts') {
                // A sequential fallback would share storage between scenarios
                // while the config asked for isolation.
                throw err
            }
            log.warn(
                `Parallel Cucumber execution failed: ${(err as Error).message}. ` +
                'Falling back to sequential execution.'
            )
            return this._runSequential(supportCodeLibrary)
        }
    }

    /**
     * Cucumber joins `file` to the working folder: an absolute path must be relative to it
     */
    private _configurationFile() {
        const { file } = this._cucumberOpts
        return typeof file === 'string' && path.isAbsolute(file) ? path.relative(this._cwd, file) : file
    }

    /**
     * a value of a profile or config file for the Cucumber CLI that WebdriverIO does not use: the paths (Cucumber
     * would add them to the specs of each worker, #13562) and the requireModule; one warning per worker
     */
    private _warnProfileValue(key: string, values: string[], advice: string) {
        if (this._warnedProfileValues.has(key) || values.length === 0) {
            return
        }
        this._warnedProfileValues.add(key)
        const message = `The "${key}" of the Cucumber configuration are not used: ${values.join(', ')}. ${advice}`
        log.warn(message)
        console.warn(`[@wdio/cucumber-framework] ${message}`)
    }

    /**
     * Cucumber's errors and warnings go to the worker stderr, each one time; its stdout (formatters) is not used
     */
    private _cucumberEnvironment(): IRunEnvironment {
        const written = this._cucumberOutput
        const stderr = new Writable({
            write(chunk, _encoding, callback) {
                const text = String(chunk)
                if (!CUCUMBER_CLI_ADVICE.some((advice) => text.startsWith(advice)) && !written.has(text)) {
                    written.add(text)
                    process.stderr.write(text)
                }
                callback()
            },
        })
        const stdout = new Writable({ write(_chunk, _encoding, callback) { callback() } })
        return { cwd: this._cwd, stderr, stdout }
    }

    /**
     * Resolve `cucumberOpts` merged with `profiles` / `file` the way Cucumber does.
     */
    private async _loadRunConfiguration(environment: IRunEnvironment) {
        const { runConfiguration } = await loadConfiguration(
            { profiles: this._cucumberOpts.profiles, provided: this._providedConfiguration(), file: this._configurationFile() },
            environment
        )
        // the WebdriverIO specs choose the features, also in parallel mode: not the paths of the profile
        runConfiguration.sources.paths = this._cucumberOpts.paths
        return runConfiguration
    }

    /**
     * Run Cucumber in sequential mode.
     *
     * @throws if a runtime error occurs (errors are caught by run())
     */
    private async _runSequential(
        supportCodeLibrary: Awaited<ReturnType<typeof supportCodeLibraryBuilder.finalize>>
    ): Promise<number> {
        let failedCount: number | undefined
        const environment = this._cucumberEnvironment()

        try {
            this._eventEmitter.on('getFailedCount', (payload) => {
                failedCount = payload
            })

            const runConfiguration = await this._loadRunConfiguration(environment)
            const { runtime, formats } = runConfiguration

            const { success } = await runCucumber(
                {
                    ...runConfiguration,
                    support: supportCodeLibrary || runConfiguration.support,
                    formats: this._runFormats(formats, runtime, supportCodeLibrary),
                },
                environment
            )

            let result = success ? 0 : 1

            if (this._cucumberOpts.ignoreUndefinedDefinitions && result) {
                result = failedCount as number
            }

            return result
        } finally {
            environment.stdout?.end()
            environment.stderr?.end()
        }
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

    /**
     * the formatter options of a run: the values that Cucumber runs with (profiles, file) for a retried attempt and a
     * pending step under strict, and the user BeforeAll / AfterAll that the formatter sends as hooks (not the WDIO ones)
     */
    private _runFormats<T extends { options: object }>(
        formats: T,
        runtime: { retry: number, retryTagFilter: string, strict: boolean },
        supportCodeLibrary: Parameters<typeof userRunHooks>[0]
    ): T {
        return {
            ...formats,
            options: {
                ...formats.options,
                _retry: runtime.retry,
                _retryTagFilter: runtime.retryTagFilter,
                _strict: runtime.strict,
                _userRunHooks: supportCodeLibrary ? userRunHooks(supportCodeLibrary) : {},
            },
        }
    }

    async loadFilesWithType(fileList: string[]) {
        // a folder: its script files, sorted, as Cucumber loads them (a profile often lists `features/support`)
        const isFolder = (file: string) => Boolean(fs.statSync(path.resolve(file), { throwIfNoEntry: false })?.isDirectory())
        const folderFiles = (folder: string) => globSync('**/*.{js,cjs,mjs}', { cwd: path.resolve(folder), absolute: true }).sort()
        // paths, not file:// URLs (glob finds nothing for a URL); loadAndRefreshModule makes the URL to import
        const files = fileList.flatMap((file: string) => {
            if (!isGlob(file)) {
                return isFolder(file) ? folderFiles(file) : [file]
            }
            const matches = globSync(file, { windowsPathsNoEscape: os.platform() === 'win32' }).sort()
            return matches.flatMap((match) => isFolder(match) ? folderFiles(match) : [match])
        })
        return [...new Set(files)]
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

    private _getParallelContextId(): string | undefined {
        const browser = (this._browser ?? (globalThis as Record<string, unknown>).browser) as ParallelBrowser | undefined
        return browser?.__parallelContextStore?.getStore()
    }

    /**
     * wraps step definition code with sync/async runner with a retry option
     * @param {object} config
     */
    wrapSteps (config: WebdriverIO.Config) {
        const wrapStep = this.wrapStep
        const cid = this._cid

        let params: unknown
        const paramsByContext = new Map<string, unknown>()
        this._eventEmitter.on('getHookParams', (payload) => {
            const contextId = payload?.contextId ?? this._getParallelContextId()
            if (contextId) {
                paramsByContext.set(contextId, payload)
            } else {
                params = payload
            }
        })

        const getHookParams = () => {
            const contextId = this._getParallelContextId()
            return contextId && paramsByContext.has(contextId) ? paramsByContext.get(contextId) : params
        }

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
