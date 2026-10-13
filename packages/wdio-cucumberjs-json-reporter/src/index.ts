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
    SCENARIO,
} from './constants.js'
import { attach, events } from './common/api.js'
import { Metadata } from './metadata.js'
import { findDocStringLine, findStepLine, readFeatureLines, scenarioNameOf, takeScenarioLines, type FeatureLines, type ScenarioLines } from './featureLines.js'
import { containsSteps, escapeRegExp, keywordStartsWith, getFailedMessage } from './utils.js'
import type { CucumberJsJsonReporterInterface, AttachmentType, CucumberAttachmentData, CucumberJsAttachment, DocString, Embedding, Feature, MetadataObject, Report, Scenario, Step } from './types.js'
import type { HookStatsExtended, SuiteStatsExtended, TestStatsExtended } from './types/wdio.js'

const log = logger('@wdio/cucumberjs-json-reporter')

export class CucumberJsJsonReporter extends WDIOReporter {
    public instanceMetadata: MetadataObject | null
    public report: Report
    public metadataClassObject: Metadata
    #featureLines?: FeatureLines
    /** line data of each scenario of the report, and the step lines it used */
    #scenarioLines = new WeakMap<Scenario, { lines: ScenarioLines, usedLines: Set<number> }>()
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

    public constructor(public options: CucumberJsJsonReporterInterface) {
        super(options)
        this.options = options

        if (!this.options.jsonFolder) {
            this.options.jsonFolder = DEFAULT_JSON_FOLDER
            log.info(`The 'jsonFolder' was not set, it has been set to the default '${DEFAULT_JSON_FOLDER}'`)
        }
        if (!this.options.language) {
            this.options.language = DEFAULT_LANGUAGE
            log.info(`The 'language' was not set, it has been set to the default '${DEFAULT_LANGUAGE}'`)
        }
        if (this.options.reportFilePerRetry === undefined) {
            this.options.reportFilePerRetry = DEFAULT_REPORT_FILE_PER_RETRY
            log.info(
                `The 'reportFilePerRetry' was not set, it has been set to the default '${DEFAULT_REPORT_FILE_PER_RETRY.toString()}'`,
            )
        }

        this.instanceMetadata = null
        this.report = <Report>{}

        this.registerListeners()
        this.metadataClassObject = new Metadata()
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
        const cucumberOpts = (runnerData.config as { cucumberOpts?: { scenarioLevelReporter?: boolean } } | undefined)?.cucumberOpts
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
            if (payload.file) {
                this.#featuresByFile.set(payload.file, { feature: this.report.feature, lines: this.#featureLines })
            }
        }

        /* istanbul ignore else */
        if (!this.report.feature.metadata) {
            this.report.feature.metadata = { ...this.instanceMetadata } as Feature['metadata']
        }

        if (typeof this.report.feature.elements !== 'undefined' && payload.parent) {
            this.report.feature.elements.push(this.getScenarioDataObject(payload, this.report.feature.id!))
        }
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
        payload.keyword = containsSteps(currentSteps!, this.options.language!) ? AFTER : BEFORE

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
        payload.state = payload.error ? payload.state : PASSED

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
            const uniqueId = String(Date.now() + Math.random()).replace('.', '')
            const filename = this.options.reportFilePerRetry
                ? `${feature.id}_${uniqueId}.json`
                : `${feature.id}.json`
            const jsonFile = path.resolve(jsonFolder, filename)
            const json = [feature]
            // Check if there is an existing file, if so concat the data, else add the new
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const output = fs.existsSync(jsonFile) ? json.concat(JSON.parse(fs.readFileSync(jsonFile, 'utf-8'))) : json
            fs.writeFileSync(jsonFile, JSON.stringify(output) + '\n')
        }
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
            tags: featureData.tags || [],
            elements: [],
            id: featureName.replace(/[\\/?%*:|"<> ]/g, '-').toLowerCase(),
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
            keyword: SCENARIO,
            type: scenarioData.type,
            description: scenarioData.description || '',
            name: scenarioName,
            tags: scenarioData.tags || [],
            id: [id, ...(rule ? [toId(rule)] : []), toId(scenarioName)].join(';'),
            line: taken?.line ?? null,
            steps: [],
        }
        if (taken) {
            this.#scenarioLines.set(scenario, { lines: taken.scenario, usedLines: new Set() })
        }
        return scenario
    }

    /**
     * Get the step data object
     */
    public getStepDataObject(stepData: TestStatsExtended | HookStatsExtended): Step {
        const keyword =
            stepData?.keyword || keywordStartsWith(stepData.title, this.options.language!) || ''
        const regex = new RegExp(`^(${escapeRegExp(keyword)})\\s`)
        const result = regex.exec(stepData.title)
        const title = (stepData.title.slice(result ? result.index + keyword.length : 0) || '').trim()
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
                status: stepData.state || '',
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
     * Add step data to the current running scenario
     */
    public addStepData(test: TestStats | HookStats): void {
        // Always add the finished step to the end of the steps
        // of the last current scenario that is running
        const scenario = this.getCurrentScenario()
        const step = this.getStepDataObject(test)
        const scenarioLines = this.#scenarioLines.get(scenario)
        if (!step.hidden && scenarioLines && this.#featureLines) {
            step.line = findStepLine(scenarioLines.lines, step.name ?? '', scenarioLines.usedLines) ?? null
            const docString = step.arguments?.[0] as Partial<DocString> | undefined
            const docStringLine = step.line !== null && typeof docString?.content === 'string'
                ? findDocStringLine(scenarioLines.lines, step.line)
                : undefined
            if (docString && docStringLine) {
                docString.line = docStringLine
            }
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
            data = Buffer.from(String(data)).toString('base64')
        }
        if (attachment.type === 'application/json') {
            data = Buffer.from(JSON.stringify(data)).toString('base64')
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
