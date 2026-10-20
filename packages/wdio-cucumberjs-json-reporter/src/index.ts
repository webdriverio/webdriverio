import fs from 'node:fs'
import path from 'node:path'

import WDIOReporter, { type HookStats, type RunnerStats, type SuiteStats, type TestStats } from '@wdio/reporter'
import logger from '@wdio/logger'

import {
    AFTER,
    BEFORE,
    DEFAULT_JSON_FOLDER,
    DEFAULT_LANGUAGE,
    DEFAULT_REPORT_FILE_PER_RETRY,
    FEATURE,
    PASSED,
    PENDING,
    SCENARIO,
    SKIPPED,
    UNDEFINED_STEP_SUFFIX,
} from './constants.js'
import { attach, events } from './common/api.js'
import { Metadata } from './metadata.js'
import { findDocStringLine, findStepLine, readFeatureLines, retakeScenarioLines, scenarioNameOf, tagLinesOf, takeScenarioLines, type FeatureLines, type TakenScenario } from './featureLines.js'
import { containsSteps, escapeRegExp, keywordStartsWith, getFailedMessage, getStepStatus, isKnownLanguage } from './utils.js'
import { fileIdOf, readEarlierFeatures, withFileLock, writeFileAtomic, writeNewFile } from './files.js'
import type { CucumberJsJsonReporterInterface, AttachmentType, CucumberAttachmentData, CucumberJsAttachment, DocString, Embedding, Feature, JsonTag, MetadataObject, Report, Scenario, Step } from './types.js'
import type { HookStatsExtended, SuiteStatsExtended, TestStatsExtended } from './types/wdio.js'

const log = logger('@wdio/cucumberjs-json-reporter')

/**
 * `true` for a string that is valid JSON text, for example `'{"a":1}'`
 */
function isJsonText (data: unknown): data is string {
    if (typeof data !== 'string') {
        return false
    }
    try {
        JSON.parse(data)
        return true
    } catch {
        return false
    }
}

/**
 * A tag of the framework (a Gherkin tag with its location, or a name) as in the Cucumber
 * JSON format, without the ids of Cucumber (they change at each run)
 */
function toJsonTag (tag: string | { name: string, line?: number, location?: { line: number } }): JsonTag {
    if (typeof tag === 'string') {
        return { name: tag }
    }
    const line = tag.location?.line ?? tag.line
    return line === undefined ? { name: tag.name } : { name: tag.name, line }
}

export class CucumberJsJsonReporter extends WDIOReporter {
    public instanceMetadata: MetadataObject | null
    public report: Report
    public metadataClassObject: Metadata
    #featureLines?: FeatureLines
    /** line data of each scenario of the report, and the step lines it used */
    #scenarioLines = new WeakMap<Scenario, { taken: TakenScenario, usedLines: Set<number>, rule?: string, tags: string[] }>()
    /**
     * each feature of the worker and the lines of its file, by the path of the file:
     * the uid of the framework has only the file name, and a feature that starts again
     * (grouped specs in a random order) gets another uid
     */
    #featuresByFile = new Map<string, { feature: Feature, lines?: FeatureLines }>()
    /** attachments sent while the scenario has no step yet (for example in a `Before` hook with `disableHooks`) */
    #pendingEmbeddings: Embedding[] = []
    /** the scenario that was running when the waiting attachments came (none: before the first scenario) */
    #pendingEmbeddingsScenario?: Scenario
    /**
     * `cucumberOpts.scenarioLevelReporter`: the framework reports no steps, and the
     * CucumberJS JSON format needs them, so make no report
     */
    #noSteps = false
    /** scenarios that started and did not end: more than one only in `cucumberOpts.parallelMode` */
    #runningScenarios = 0
    #parallelWarned = false
    /** `true` when the user set the `language` option: `cucumberOpts.language` replaces it */
    #languageOption: boolean
    /** the Cucumber status of the hook that ends (for example `SKIPPED`): the HookStats keep only failures */
    #hookEndState?: string

    public constructor(public options: CucumberJsJsonReporterInterface) {
        super(options)
        this.options = options
        this.#languageOption = Boolean(options.language)

        if (!this.options.jsonFolder) {
            this.options.jsonFolder = DEFAULT_JSON_FOLDER
            log.info(`The 'jsonFolder' was not set, it has been set to the default '${DEFAULT_JSON_FOLDER}'`)
        }
        if (!this.options.language) {
            this.options.language = DEFAULT_LANGUAGE
            log.info(`The 'language' was not set, it has been set to the default '${DEFAULT_LANGUAGE}'`)
        } else {
            this.options.language = this.#knownLanguage(this.options.language, 'the "language" option')
        }
        if (this.options.reportFilePerRetry === undefined) {
            this.options.reportFilePerRetry = DEFAULT_REPORT_FILE_PER_RETRY
            log.info(
                `The 'reportFilePerRetry' was not set, it has been set to the default '${DEFAULT_REPORT_FILE_PER_RETRY.toString()}'`,
            )
        }

        this.instanceMetadata = null
        this.report = <Report>{}

        // before the listener of the base class, which calls onHookEnd
        this.prependListener('hook:end', (hook: { state?: string }) => {
            this.#hookEndState = hook.state
        })
        this.registerListeners()
        this.metadataClassObject = new Metadata()
    }

    /**
     * The language, or the default language for an unknown one: the step keywords of an
     * unknown language cannot be found
     */
    #knownLanguage (language: string, source: string) {
        if (isKnownLanguage(language)) {
            return language
        }
        const message = `Unknown language "${language}" in ${source}: the reporter uses "${DEFAULT_LANGUAGE}". ` +
            'See https://cucumber.io/docs/gherkin/reference/#spoken-languages for the language codes.'
        log.warn(message)
        console.warn(`[@wdio/cucumberjs-json-reporter] ${message}`)
        return DEFAULT_LANGUAGE
    }

    /**
     * The language of the keywords: the language of the feature file (its `# language:`
     * header), else the `language` option
     */
    get #language () {
        return this.#featureLines?.language ?? this.options.language!
    }

    /**
     * Attach data to the report
     */
    public static attach(data: CucumberAttachmentData, type?: AttachmentType): void {
        attach(data, type)
    }

    /**
     * Add a custom listener for the attachments
     */
    public registerListeners(): void {
        process.on(events.attachment as 'message', this.#onAttachment)
    }

    /** the listener of the attachments, removed when the runner ends */
    #onAttachment = (attachment: CucumberJsAttachment) => this.cucumberJsAttachment(attachment)

    /**
     * The order of running of the `on*` is the following:
     * - onRunnerStart
     * - onSuiteStart (feature)
     * - onSuiteStart (scenario)
     * - onHookStart
     * - onHookEnd
     * - onTestStart
     * - onBeforeCommand
     * - onAfterCommand
     * - onTestPass
     * - onHookStart
     * - onHookEnd
     * - onSuiteEnd (scenario is done)
     * - onSuiteEnd (feature is done)
     * - onRunnerEnd
     */

    /**
     * This hook is used to retrieve the browser data, but this is done only once
     */
    public onRunnerStart(runnerData: RunnerStats): void {
        const cucumberOpts = (runnerData.config as { cucumberOpts?: { scenarioLevelReporter?: boolean, language?: string } } | undefined)?.cucumberOpts
        // Cucumber reads the feature files without a `# language:` header in this language
        if (cucumberOpts?.language) {
            if (this.#languageOption && this.options.language !== cucumberOpts.language) {
                const message = `The "language" option "${this.options.language}" is not the same as "cucumberOpts.language" ` +
                    `"${cucumberOpts.language}": the reporter uses "cucumberOpts.language", as Cucumber does.`
                log.warn(message)
                console.warn(`[@wdio/cucumberjs-json-reporter] ${message}`)
            }
            this.options.language = this.#knownLanguage(cucumberOpts.language, '"cucumberOpts.language"')
        }
        if (cucumberOpts?.scenarioLevelReporter) {
            this.#noSteps = true
            const message = 'The CucumberJS JSON report needs the steps of the scenarios: set ' +
                '"cucumberOpts.scenarioLevelReporter" to false. No CucumberJS JSON report is made.'
            log.warn(message)
            console.warn(`[@wdio/cucumberjs-json-reporter] ${message}`)
            return
        }
        if (!this.instanceMetadata) {
            this.instanceMetadata = this.metadataClassObject.determineMetadata(runnerData)
        }
    }

    /**
     * This hook is called twice:
     * 1. create the feature
     * 2. add the scenario to the feature
     */
    public onSuiteStart(payload: SuiteStats): void {
        if (this.#noSteps) {
            return
        }
        /**
         * a suite without parent is a feature: a worker can run several feature
         * files (grouped specs), so start a new feature each time
         */
        const known = payload.file ? this.#featuresByFile.get(payload.file) : undefined
        if (known) {
            /**
             * in a random order the scenarios of the features mix: use the feature of
             * the file of the scenario, also for a feature that starts again
             */
            this.report.feature = known.feature
            this.#featureLines = known.lines
        } else if (!this.report.feature || !payload.parent) {
            this.report.feature = this.getFeatureDataObject(payload)
            this.report.features = [...(this.report.features ?? []), this.report.feature]
            this.#featureLines = payload.file ? readFeatureLines(payload.file, this.options.language!) : undefined
            // the keyword of the file, as in the Cucumber JSON format
            if (this.#featureLines?.keyword) {
                this.report.feature.keyword = this.#featureLines.keyword
            }
            if (payload.file) {
                this.#featuresByFile.set(payload.file, { feature: this.report.feature, lines: this.#featureLines })
            }
        }

        /* istanbul ignore else */
        if (!this.report.feature.metadata) {
            this.report.feature.metadata = { ...this.instanceMetadata } as Feature['metadata']
        }

        if (typeof this.report.feature.elements !== 'undefined' && payload.parent) {
            this.#warnParallelScenarios()
            this.#runningScenarios++
            this.report.feature.elements.push(this.getScenarioDataObject(payload, this.report.feature.id!))
        }
    }

    public onSuiteEnd(payload: SuiteStats): void {
        if (payload.parent && this.#runningScenarios > 0) {
            this.#runningScenarios--
        }
    }

    /**
     * The reporter adds each event to the last scenario: with scenarios that run at the
     * same time (`cucumberOpts.parallelMode`), steps and attachments can go into the
     * wrong scenario
     */
    #warnParallelScenarios() {
        if (this.#runningScenarios === 0 || this.#parallelWarned) {
            return
        }
        this.#parallelWarned = true
        const message = 'Scenarios run at the same time ("cucumberOpts.parallelMode"), which the CucumberJS JSON ' +
            'report does not support yet: steps and attachments can be in the wrong scenario.'
        log.warn(message)
        console.warn(`[@wdio/cucumberjs-json-reporter] ${message}`)
    }

    /**
     * Cucumber `retry`: the scenario runs again. The CucumberJS JSON format has only
     * the last try of a scenario, so start its steps again
     */
    public onSuiteRetry(payload: SuiteStats): void {
        const scenario = this.report.feature?.elements?.at(-1)
        if (!scenario || scenario.name !== scenarioNameOf(payload.title, payload.tags)) {
            return
        }
        scenario.steps = []
        this.#scenarioLines.get(scenario)?.usedLines.clear()
    }

    /**
     * This one is for the start of the hook and determines if this is a pending `before` or `after` hook.
     * The data will be equal to a step, so a hook is added as a step.
     */
    public onHookStart(payload: HookStatsExtended): void {
        if (this.#noSteps) {
            return
        }
        // There is always a scenario, take the last one
        if (this.options.disableHooks) {
            return
        }
        const currentSteps = this.getCurrentScenario().steps
        payload.state = PASSED
        payload.keyword = containsSteps(currentSteps!, this.#language) ? AFTER : BEFORE

        this.addStepData(payload)
    }

    /**
     * This one is for the end of the hook, it directly comes after the onHookStart
     * A hook is the same  as a 'normal' step, so use the update step
     */
    public onHookEnd(payload: HookStats): void {
        if (this.#noSteps) {
            return
        }
        if (this.options.disableHooks) {
            return
        }
        // Cucumber skips the hooks after a failed hook, and a hook can return 'skipped' or 'pending'
        const state = this.#hookEndState?.toLowerCase()
        if (!payload.error) {
            payload.state = (state === SKIPPED || state === PENDING ? state : PASSED) as HookStats['state']
        }

        return this.updateStepStatus(payload)
    }

    /**
     * This one starts the step, which will be set to pending
     */
    public onTestStart(payload: TestStats): void {
        if (this.#noSteps) {
            return
        }
        this.addStepData(payload)
    }

    /**
     * The passed step
     */
    public onTestPass(payload: TestStats): void {
        if (this.#noSteps) {
            return
        }
        this.updateStepStatus(payload)
    }

    /**
     * The failed step including the logs
     */
    public onTestFail(payload: TestStats): void {
        if (this.#noSteps) {
            return
        }
        this.updateStepStatus(payload)
    }

    /**
     * The skippe step
     */
    public onTestSkip(payload: TestStats): void {
        if (this.#noSteps) {
            return
        }
        this.updateStepStatus(payload)
    }

    /**
     * The pending step: it returned 'pending', or it is undefined with
     * `cucumberOpts.ignoreUndefinedDefinitions`
     */
    public onTestPending(payload: TestStats): void {
        if (this.#noSteps) {
            return
        }
        this.updateStepStatus(payload)
    }

    /**
     * Runner is done, write the file
     */
    public onRunnerEnd(): void {
        process.off(events.attachment as 'message', this.#onAttachment)
        // the last scenario of the worker ended with no step
        this.#dropPendingEmbeddingsOfOtherScenario()
        if (!this.report.feature) {
            return
        }
        const jsonFolder = path.resolve(process.cwd(), this.options.jsonFolder!)
        fs.mkdirSync(jsonFolder, { recursive: true })
        for (const feature of this.report.features ?? []) {
            try {
                this.#writeFeature(jsonFolder, feature)
            } catch (error: unknown) {
                // the other features of the worker still get their file
                const message = `The CucumberJS JSON file of the feature "${feature.name ?? feature.id}" is not written: ${(error as Error).message}`
                log.error(message)
                console.error(`[@wdio/cucumberjs-json-reporter] ${message}`)
            }
        }
    }

    #writeFeature (jsonFolder: string, feature: Feature) {
        const fileId = fileIdOf(feature.id!)
        const json = [feature]
        // a file for each try: no lock, and a new name when another worker made the same id
        if (this.options.reportFilePerRetry) {
            const uniqueId = String(Date.now() + Math.random()).replace('.', '')
            writeNewFile(jsonFolder, `${fileId}_${uniqueId}`, JSON.stringify(json) + '\n')
            return
        }
        const jsonFile = path.resolve(jsonFolder, `${fileId}.json`)
        // workers that run the same feature write one file: add to the tries already in it
        withFileLock(jsonFile, () => {
            const { features, invalidKeptAs } = readEarlierFeatures(jsonFile)
            if (invalidKeptAs) {
                const message = `The earlier file ${jsonFile} is not valid JSON: it is kept as ${path.basename(invalidKeptAs)}, and a new file is written`
                log.warn(message)
                console.warn(`[@wdio/cucumberjs-json-reporter] ${message}`)
            }
            writeFileAtomic(jsonFile, JSON.stringify(json.concat(features as Feature[])) + '\n')
        })
    }

    /**
     * All functions
     */

    /**
     * Get the feature data object
     */
    public getFeatureDataObject(featureData: SuiteStats): Feature {
        // without the tags that `cucumberOpts.tagsInTitle` adds to the title
        const featureName = scenarioNameOf(featureData.title, featureData.tags)

        return {
            keyword: FEATURE,
            type: featureData.type,
            description: featureData.description || '',
            // Sample  `uid: 'sample.feature:2:1'`, where:
            // - [0]: file name
            // - [1]: line in file
            // - [2]: column
            line: featureData.uid && featureData.uid.includes(':') ? parseInt(featureData.uid.split(':')[1], 10) : null,
            name: featureName,
            uri: featureData.file || 'Can not be determined',
            tags: Array.isArray(featureData.tags) ? featureData.tags.map(toJsonTag) : [],
            elements: [],
            // as in the Cucumber JSON format; the file name of `onRunnerEnd` is made safe
            id: featureName.replace(/ /g, '-').toLowerCase(),
        }
    }

    /**
     * Get the scenario data object
     */
    public getScenarioDataObject(
        scenarioData: TestStatsExtended | SuiteStatsExtended | HookStatsExtended,
        id: string,
    ): Scenario {
        // without the tags that `cucumberOpts.tagsInTitle` adds to the title
        const scenarioName = scenarioNameOf(scenarioData.title, (scenarioData as SuiteStatsExtended).tags)
        const rule = (scenarioData as SuiteStatsExtended).rule
        const tags = ((scenarioData as SuiteStatsExtended).tags ?? []).map((tag) => typeof tag === 'string' ? tag : tag.name)
        const taken = this.#featureLines && takeScenarioLines(this.#featureLines, scenarioName, { rule, tags })
        // `<feature id>;<rule id>;<scenario id>` as in the Cucumber JSON format
        const toId = (name: string) => name.replace(/ /g, '-').toLowerCase()

        const scenario: Scenario = {
            // the keyword of the file (`Scenario Outline`, another language), as Cucumber writes it
            keyword: taken?.scenario.keyword ?? SCENARIO,
            type: scenarioData.type,
            description: scenarioData.description || '',
            name: scenarioName,
            // the lines of the file: the framework sends no line for the tags of a scenario
            tags: tagLinesOf(this.#featureLines, taken, tags),
            id: [id, ...(rule ? [toId(rule)] : []), toId(scenarioName)].join(';'),
            line: taken?.line ?? null,
            steps: [],
        }
        if (taken) {
            this.#scenarioLines.set(scenario, { taken, usedLines: new Set(), rule, tags })
        }
        return scenario
    }

    /**
     * Get the step data object
     */
    public getStepDataObject(stepData: TestStatsExtended | HookStatsExtended): Step {
        // the name without the suffix that the framework adds to an undefined step
        const fullTitle = stepData.title.endsWith(UNDEFINED_STEP_SUFFIX)
            ? stepData.title.slice(0, -UNDEFINED_STEP_SUFFIX.length)
            : stepData.title
        const keyword =
            stepData?.keyword || keywordStartsWith(fullTitle, this.#language) || ''
        const regex = new RegExp(`^(${escapeRegExp(keyword)})\\s`)
        const result = regex.exec(fullTitle)
        const title = (fullTitle.slice(result ? result.index + keyword.length : 0) || '').trim()
        const step: Step = {
            /**
             * the framework sends a doc string as text: the Cucumber JSON format has
             * `{ content, line }` (the line is added with the step line)
             */
            arguments: typeof stepData.argument === 'string'
                ? [{ content: stepData.argument }]
                : stepData.argument ? [stepData.argument] : [],
            keyword,
            name: title,
            result: {
                status: getStepStatus(stepData),
                duration: (stepData._duration || 0) * 1000000,
                ...getFailedMessage(stepData),
            },
            line: null,
            match: {
                location: 'can not be determined with webdriver.io',
            },
        }
        // a hook has no name and no line in the Cucumber JSON format
        if (keyword === BEFORE || keyword === AFTER) {
            delete step.name
            delete step.line
            step.hidden = true
        }
        return step
    }

    /**
     * Get the current scenario
     */
    public getCurrentScenario(): Scenario {
        // no feature yet, for example for an attachment from the WebdriverIO `before` hook
        const elements = this.report.feature?.elements ?? []
        return elements[elements.length - 1]
    }

    /**
     * Get the current step
     */
    public getCurrentStep(): Step | undefined {
        const steps = this.getCurrentScenario()?.steps ?? []
        return steps[steps.length - 1]
    }

    /**
     * The line of the step and of its doc string in the lines of its scenario
     */
    #setStepLines(step: Step, scenario: TakenScenario['scenario'], usedLines: Set<number>) {
        step.line = findStepLine(scenario, step.name ?? '', usedLines) ?? null
        const docString = step.arguments?.[0] as Partial<DocString> | undefined
        const docStringLine = step.line !== null && typeof docString?.content === 'string'
            ? findDocStringLine(scenario, step.line)
            : undefined
        if (docString && docStringLine) {
            docString.line = docStringLine
        }
    }

    /**
     * Add step data to the current running scenario
     */
    public addStepData(test: TestStats | HookStats): void {
        // Always add the finished step to the end of the steps
        // of the last current scenario that is running
        const scenario = this.getCurrentScenario()
        const step = this.getStepDataObject(test)
        const scenarioLines = this.#scenarioLines.get(scenario)
        if (!step.hidden && scenarioLines && this.#featureLines) {
            const retaken = retakeScenarioLines(this.#featureLines, scenarioLines.taken, scenario.name ?? '', step.name ?? '', scenarioLines)
            if (retaken) {
                scenarioLines.taken = retaken
                scenario.line = retaken.line
                scenario.tags = tagLinesOf(this.#featureLines, retaken, scenarioLines.tags)
                scenario.keyword = retaken.scenario.keyword
                // the steps before this one have the lines of the other scenario
                scenarioLines.usedLines.clear()
                for (const previous of scenario.steps ?? []) {
                    if (!previous.hidden) {
                        this.#setStepLines(previous, scenarioLines.taken.scenario, scenarioLines.usedLines)
                    }
                }
            }
            this.#setStepLines(step, scenarioLines.taken.scenario, scenarioLines.usedLines)
        }
        this.#dropPendingEmbeddingsOfOtherScenario(scenario)
        if (this.#pendingEmbeddings.length) {
            step.embeddings = this.#pendingEmbeddings
            this.#pendingEmbeddings = []
        }
        scenario.steps!.push(step)
    }

    /**
     * Add step data to the current running scenario
     */
    public updateStepStatus(test: TestStats | HookStats): void {
        // There is always a scenario, take the last one
        const currentSteps = this.getCurrentScenario().steps!
        const currentStepsLength = currentSteps.length
        const stepData = this.getStepDataObject(test)

        const currentStep = this.getCurrentStep()
        // keep the line data that `addStepData` found (the step and its doc string)
        currentSteps[currentStepsLength - 1] = {
            ...currentStep,
            ...stepData,
            line: currentStep?.line ?? stepData.line,
            ...(currentStep?.arguments ? { arguments: currentStep.arguments } : {})
        }
    }

    /**
     * The waiting attachments of a scenario that ended with no step (for example an
     * `After` hook with `disableHooks`) have no step to go to: the Cucumber JSON
     * format has attachments only on steps. Do not move them to another scenario.
     */
    #dropPendingEmbeddingsOfOtherScenario(scenario?: Scenario) {
        const owner = this.#pendingEmbeddingsScenario
        if (owner && owner !== scenario && this.#pendingEmbeddings.length) {
            log.warn(`${this.#pendingEmbeddings.length} attachment(s) of the scenario "${owner.name}" not in the report: the scenario has no step`)
            this.#pendingEmbeddings = []
        }
    }

    /**
     * Add the attachment to the result
     */
    public cucumberJsAttachment(attachment: CucumberJsAttachment): void {
        // The attachment can be added to the current running scenario step
        const currentStep = this.getCurrentStep()
        let data = attachment?.data

        // If the mime_type is 'text/plain' or 'application/json', encode the data to a base64 string (like Cucumber v10+ does)
        if (attachment.type === 'text/plain') {
            // an object (`attach({ orderId: 42 })` has the default type text/plain) is written as JSON text
            const text = data && typeof data === 'object' && !Buffer.isBuffer(data) ? JSON.stringify(data) : String(data)
            data = Buffer.from(text).toString('base64')
        }
        if (attachment.type === 'application/json') {
            // a string that is already JSON stays as it is, as with `this.attach()` of Cucumber
            data = Buffer.from(isJsonText(data) ? data : JSON.stringify(data)).toString('base64')
        }

        const embeddings = {
            data: data,
            mime_type: attachment.type,
        }

        // no feature or no step yet: keep the attachment for the next step
        if (!currentStep) {
            this.#dropPendingEmbeddingsOfOtherScenario(this.getCurrentScenario())
            this.#pendingEmbeddingsScenario = this.getCurrentScenario()
            this.#pendingEmbeddings.push(embeddings)
            return
        }

        // Check if there is an embedding, if not, add it, else push it
        if (!currentStep.embeddings) {
            currentStep.embeddings = [embeddings]
        } else {
            currentStep.embeddings.push(embeddings)
        }
    }
}

export { attach }
export * from './types.js'
export default CucumberJsJsonReporter
