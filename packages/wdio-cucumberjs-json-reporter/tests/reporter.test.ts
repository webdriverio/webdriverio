/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi, type MockInstance } from 'vitest'

import { containsSteps, getFailedMessage, keywordStartsWith } from '../src/utils.js'
import { AFTER, BEFORE, FAILED, PASSED, PENDING, TEXT_PLAIN } from '../src/constants.js'
import {
    EMPTY_FEATURE,
    EMPTY_SCENARIO,
    STEP_HOOK_ONSTART_STATS,
    STEP_TEST_ONSTART_ARGUMENT_STATS,
    STEP_TEST_ONSTART_STATS,
    SUITE_FEATURE_STATS,
    SUITE_FEATURE_UID,
    SUITE_SCENARIO_STATS,
    TEST_EMPTY_STATS,
    TEST_NO_KEYWORD_STATS,
    TEST_SCENARIO_STATS,
} from './__mocks__/mocks.js'
import type { HookStatsExtended, RunnerStatsExtended, SuiteStatsExtended, TestStatsExtended } from '../src/types/wdio.js'
import { Metadata } from '../src/metadata.js'
import type { Step } from '../src/types.js'
import WdioCucumberJsJsonReporter from '../src/index.js'

const logFolderPath = path.join(os.tmpdir(), 'wdio-cucumberjs-json-reporter-tests')
const logFile = path.join(logFolderPath, 'logFile.json')
const jsonFolder = path.join(logFolderPath, 'ut-folder')

vi.mock('../src/utils', () => ({
    containsSteps: vi.fn(),
    getFailedMessage: vi.fn(),
    keywordStartsWith: vi.fn()
}))

vi.mock('@wdio/logger', () => ({
    default: vi.fn().mockReturnValue({
        info: vi.fn(),
        warn: vi.fn()
    })
}))

describe('reporter', () => {
    let tmpReporter: WdioCucumberJsJsonReporter
    beforeAll(() => {
        if (!fs.existsSync(logFolderPath)) {
            fs.mkdirSync(logFolderPath)
            fs.closeSync(fs.openSync(logFile, 'w'))
        }
    })

    beforeEach(() => {
        tmpReporter = new WdioCucumberJsJsonReporter({
            jsonFolder,
            language: 'en',
            logFile,
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
        EMPTY_FEATURE.elements = []
        EMPTY_SCENARIO.steps = []
        delete STEP_HOOK_ONSTART_STATS.keyword
    })

    describe('on create', () => {
        it('should add the attachments that are sent with attach() to the report', () => {
            process.removeAllListeners('wdioCucumberJsReporter:attachment')
            const attachmentSpy = vi.spyOn(WdioCucumberJsJsonReporter.prototype, 'cucumberJsAttachment').mockImplementation(() => {})
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, language: 'en', logFile })

            WdioCucumberJsJsonReporter.attach('foo')

            expect(attachmentSpy).toHaveBeenCalledTimes(1)
            expect(attachmentSpy.mock.contexts[0]).toBe(reporter)
            expect(attachmentSpy).toHaveBeenCalledWith({ data: 'foo', type: TEXT_PLAIN })
            attachmentSpy.mockRestore()
            process.removeAllListeners('wdioCucumberJsReporter:attachment')
        })

        it('should set the defaults if only the logfile option is provided', () => {
            const noOptionsReporter = new WdioCucumberJsJsonReporter({
                logFile,
            })

            const { logFile: logFileOption, ...options } = noOptionsReporter.options
            expect(logFileOption).toBe(logFile)
            expect(options).toMatchSnapshot()
        })

        it('should verify initial properties', () => {
            const { jsonFolder: jsonFolderOption, logFile: logFileOption, ...options } = tmpReporter.options
            expect(options).toMatchSnapshot()
            expect(jsonFolderOption).toBe(jsonFolder)
            expect(logFileOption).toBe(logFile)
            expect(tmpReporter.instanceMetadata).toBeNull()
            expect(tmpReporter.report).toMatchSnapshot()
        })
    })

    describe('onRunnerStart', () => {
        it('should set instance data if it is not available yet', () => {
            const metadata = { foo: 'bar' }
            const metadataClassObject: Metadata = tmpReporter.metadataClassObject
            const determineMetadataSpy: MockInstance = vi
                .spyOn(metadataClassObject, 'determineMetadata')
                .mockReturnValue(metadata)

            expect(tmpReporter.instanceMetadata).toBeNull()

            tmpReporter.onRunnerStart({} as RunnerStatsExtended)

            expect(determineMetadataSpy).toHaveBeenCalled()
            expect(tmpReporter.instanceMetadata).toEqual(metadata)
        })

        it('should set not set instance data if it is already available', () => {
            const metadata = { foo: 'bar' }
            const determineMetadataSpy: MockInstance = vi
                .spyOn(new Metadata(), 'determineMetadata')
                .mockReturnValue(metadata)

            tmpReporter.instanceMetadata = metadata
            expect(tmpReporter.instanceMetadata).toEqual(metadata)

            tmpReporter.onRunnerStart({} as RunnerStatsExtended)

            expect(determineMetadataSpy).not.toHaveBeenCalled()
        })
    })

    describe('onSuiteStart', () => {
        it('should add the CucumberJS feature object if it is not available', () => {
            const featureData = { keyword: 'feature' }
            const getFeatureDataObjectSpy = vi
                .spyOn(tmpReporter, 'getFeatureDataObject')
                .mockReturnValue(featureData)

            expect(tmpReporter.report).toMatchSnapshot()

            tmpReporter.onSuiteStart({} as SuiteStatsExtended)

            expect(getFeatureDataObjectSpy).toHaveBeenCalled()
            expect(tmpReporter.report).toMatchSnapshot()
        })

        it('should add instance data to the feature if the feature is already there', () => {
            const metadata = { foo: 'bar' }
            const featureData = { keyword: 'feature' }
            const getFeatureDataObjectSpy = vi
                .spyOn(tmpReporter, 'getFeatureDataObject')
                .mockReturnValue(featureData)
            vi.spyOn(tmpReporter, 'getScenarioDataObject').mockReturnValue(EMPTY_SCENARIO)

            expect(tmpReporter.report).toMatchSnapshot()

            tmpReporter.instanceMetadata = metadata
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.onSuiteStart(SUITE_SCENARIO_STATS)

            expect(getFeatureDataObjectSpy).not.toHaveBeenCalled()
            expect(tmpReporter.report).toMatchSnapshot()
        })

        it('should add a scenario to the feature if the feature is already there', () => {
            const getFeatureDataObjectSpy = vi.spyOn(tmpReporter, 'getFeatureDataObject')
            const getScenarioDataObjectSpy = vi
                .spyOn(tmpReporter, 'getScenarioDataObject')
                .mockReturnValue(EMPTY_SCENARIO)

            tmpReporter.report.feature = EMPTY_FEATURE

            expect(tmpReporter.report.feature.elements!.length).toEqual(0)

            tmpReporter.onSuiteStart(SUITE_SCENARIO_STATS)

            expect(getFeatureDataObjectSpy).not.toHaveBeenCalled()
            expect(getScenarioDataObjectSpy).toHaveBeenCalledWith(SUITE_SCENARIO_STATS, EMPTY_FEATURE.id)
            expect(tmpReporter.report.feature.elements).toMatchSnapshot()
        })
    })

    describe('onHookStart', () => {
        it('should call `addStepData` to add a pending before step', () => {
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario').mockReturnValue(EMPTY_SCENARIO)
            const addStepDataSpy = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()

            tmpReporter.onHookStart({} as HookStatsExtended)

            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(containsSteps).toHaveBeenCalledTimes(1)
            expect(addStepDataSpy).toHaveBeenCalledWith({ state: PASSED, keyword: BEFORE })
        })

        it('should call `addStepData` to add a pending after step', () => {
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario').mockReturnValue(EMPTY_SCENARIO)
            const addStepDataSpy = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()

            vi.mocked(containsSteps).mockReturnValue(true)
            tmpReporter.onHookStart({} as HookStatsExtended)

            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(containsSteps).toHaveBeenCalledTimes(1)

            expect(addStepDataSpy).toHaveBeenCalledWith({ state: PASSED, keyword: AFTER })
        })
        it('should not call `addStepData` to add a pending after step', () => {
            tmpReporter.options.disableHooks = true
            const withDisabledHooks = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()
            tmpReporter.onHookStart({} as HookStatsExtended)

            expect(withDisabledHooks).toHaveBeenCalledTimes(0)
        })
    })

    describe('onHookEnd', () => {
        it('should call update a hook step to passed', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onHookEnd({} as HookStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ state: PASSED })
        })

        it('should call update a hook step to the current state when there is an error', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onHookEnd({ state: FAILED, error: {} as Error } as HookStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ state: FAILED, error: {} })
        })

        it('should not call `addUpdateStepStatus` to add a pending after step', () => {
            tmpReporter.options.disableHooks = true
            const withDisabledHooks = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onHookEnd({} as HookStatsExtended)

            expect(withDisabledHooks).toHaveBeenCalledTimes(0)
        })
    })

    describe('onTestStart', () => {
        it('should call `addStepDataSpy` to add a step when a test is started', () => {
            const addStepDataSpy = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()

            tmpReporter.onTestStart({ foo: 'bar' } as TestStatsExtended)

            expect(addStepDataSpy).toHaveBeenCalledWith({ foo: 'bar' })
        })
    })

    describe('onTestPass', () => {
        it('should call update a step', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onTestPass({ foo: true } as TestStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ foo: true })
        })
    })

    describe('onTestFail', () => {
        it('should call update a step', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onTestFail({ bar: true } as TestStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ bar: true })
        })
    })

    describe('onTestSkip', () => {
        it('should call update a step', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onTestSkip({ bar: false } as TestStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ bar: false })
        })
    })

    describe('onRunnerEnd', () => {
        it('should store the json file on the file system', async () => {
            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.options.jsonFolder = jsonFolder
            await fsp.rm(jsonFolder, {
                recursive: true,
                force: true
            })
            expect(fs.existsSync(jsonFolder)).toEqual(false)

            await tmpReporter.onRunnerEnd()
            const files = (await fsp.readdir(jsonFolder)).filter((dir) => dir !== '.' && dir !== '..')

            expect(files.length).toEqual(1)
            expect(files[0].includes(tmpReporter.report.feature.id!)).toEqual(true)
            expect(fs.existsSync(jsonFolder)).toEqual(true)
        })
        it('should by default create a unique Json file and should not add in existing Json file onRunnerEnd', async () => {
            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.options.jsonFolder = jsonFolder

            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()

            const files = (await fsp.readdir(jsonFolder)).filter((dir) => dir !== '.' && dir !== '..')

            expect(files.length).toEqual(5)

            for (const jsonFile of files) {
                const fileContent = JSON.parse((await fsp.readFile(path.resolve(jsonFolder, jsonFile))).toString())
                expect(fileContent.length).toEqual(1)
            }
        })
        it('should be able to add json to an existing json output when reportFilePerRetry option is set to false', async () => {
            const jsonFile = `${jsonFolder}/this-feature.json`

            await fsp.rm(jsonFolder, { recursive: true, force: true })
            await fsp.mkdir(jsonFolder, { recursive: true })
            await fsp.copyFile(__dirname + '/__mocks__/mock.json', jsonFile)

            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.options.jsonFolder = jsonFolder
            tmpReporter.options.reportFilePerRetry = false

            const fileContent = JSON.parse((await fsp.readFile(path.resolve(jsonFolder, jsonFile))).toString())
            expect(fileContent.length).toEqual(1)

            await tmpReporter.onRunnerEnd()

            const files = (await fsp.readdir(jsonFolder)).filter((dir) => dir !== '.' && dir !== '..')

            expect(files.length).toEqual(1)
            const newFileContent = JSON.parse((await fsp.readFile(jsonFile)).toString())
            expect(newFileContent.length).toEqual(2)
        })

        afterEach(async () => {
            await fsp.rm(jsonFolder, {
                recursive: true,
                force: true
            })
        })
    })

    describe('getFeatureDataObject', () => {
        it('should be able to to create a feature JSON data object', () => {
            expect(tmpReporter.getFeatureDataObject(SUITE_FEATURE_STATS)).toMatchSnapshot()
        })

        it('should be able to to create a feature JSON data object with no line data', () => {
            expect(tmpReporter.getFeatureDataObject(SUITE_FEATURE_UID)).toMatchSnapshot()
        })
    })

    describe('getScenarioDataObject', () => {
        it('should be able to to create a scenario JSON data object', () => {
            expect(tmpReporter.getScenarioDataObject(TEST_SCENARIO_STATS, 'create-passed-feature')).toMatchSnapshot()
        })
    })

    describe('getStepDataObject', () => {
        beforeEach(() => {
            vi.mocked(getFailedMessage).mockReturnValue({})
        })

        it('should be able to to create a step JSON data object', () => {
            expect(tmpReporter.getStepDataObject(STEP_TEST_ONSTART_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalledTimes(1)
        })

        it('should be able to add arguments to the step if they are present', () => {
            expect(tmpReporter.getStepDataObject(STEP_TEST_ONSTART_ARGUMENT_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalledTimes(1)
        })

        it('should be able to to create a step JSON data object based on a hook', () => {
            STEP_HOOK_ONSTART_STATS.keyword = BEFORE
            expect(tmpReporter.getStepDataObject(STEP_HOOK_ONSTART_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalledTimes(1)
        })

        it('should be able to to create a step JSON data object based on malformed data', () => {
            expect(tmpReporter.getStepDataObject(TEST_EMPTY_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalled()
        })

        it('should be able to to create a step JSON data object based on missing keyword data', () => {
            expect(tmpReporter.getStepDataObject(TEST_NO_KEYWORD_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalled()
        })

        it('keeps a step that starts with the * keyword', () => {
            vi.mocked(keywordStartsWith).mockReturnValue('*')
            const step = tmpReporter.getStepDataObject({ ...TEST_NO_KEYWORD_STATS, title: '* I have milk' } as TestStatsExtended)
            expect(step.keyword).toBe('*')
            expect(step.name).toBe('I have milk')
        })
    })

    describe('getCurrentScenario', () => {
        it('should return the last number of the scenario array as the current running scenario number', () => {
            tmpReporter.report.feature = {
                elements: [{ foo: 'first-scenario' }, { bar: 'second-scenario' }, { foobar: 'current-scenario' }],
            }

            expect(tmpReporter.getCurrentScenario()).toEqual({ foobar: 'current-scenario' })
        })
    })

    describe('getCurrentStep', () => {
        it('should return current running step', () => {
            const currentScenarioMock = {
                steps: [{ foo: 'first-step' }, { foo: 'second-step' }, { foo: 'current-step' }] as Step[],
            }
            const getCurrentScenarioSpy = vi
                .spyOn(tmpReporter, 'getCurrentScenario')
                .mockReturnValue(currentScenarioMock)

            expect(tmpReporter.getCurrentStep()).toEqual(currentScenarioMock.steps[2])
            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('addStepData', () => {
        it('should add step data to a current scenario', () => {
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario')
            const getStepDataObjectSpy = vi
                .spyOn(tmpReporter, 'getStepDataObject')
                .mockReturnValue({ foo: 'current-step' })

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)

            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(0)

            tmpReporter.addStepData({} as HookStatsExtended)

            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(1)
            expect(tmpReporter.report.feature.elements![0].steps).toMatchSnapshot()
            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(getStepDataObjectSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('cucumberJsAttachment', () => {
        it('keeps an attachment sent before the first step and adds it to that step', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)

            // with `disableHooks: true`, an attach() in a Before hook comes before any step
            expect(() => tmpReporter.cucumberJsAttachment({ data: 'from the hook', type: TEXT_PLAIN })).not.toThrow()
            tmpReporter.addStepData(STEP_TEST_ONSTART_STATS)

            expect(tmpReporter.getCurrentStep().embeddings).toEqual([
                { data: Buffer.from('from the hook').toString('base64'), mime_type: TEXT_PLAIN }
            ])
        })
    })

    describe('grouped specs in random order', () => {
        it('adds a scenario to the feature of its parent, also after another feature started', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            const featureFile = (name: string) => {
                const file = path.join(logFolderPath, `${name}.feature`)
                fs.writeFileSync(file, `Feature: ${name}\n  Scenario: ${name} one\n    Given a step\n`)
                return file
            }
            const fileA = featureFile('a')
            const fileB = featureFile('b')
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, uid: 'a.feature:1:1', title: 'a', file: fileA, parent: undefined } as SuiteStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, uid: 'b.feature:1:1', title: 'b', file: fileB, parent: undefined } as SuiteStatsExtended)
            // the framework sends the start of each feature one time, so a scenario of a comes after b started
            tmpReporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'a one', parent: 'a.feature:1:1', file: fileA } as SuiteStatsExtended)
            tmpReporter.addStepData({ ...STEP_TEST_ONSTART_STATS, title: 'Given a step', keyword: 'Given' } as TestStatsExtended)

            const [featureA, featureB] = tmpReporter.report.features!
            expect(featureA.elements!.map((scenario) => scenario.name)).toEqual(['a one'])
            expect(featureB.elements).toEqual([])
            expect(featureA.elements![0]).toMatchObject({ line: 2, steps: [{ name: 'a step', line: 3 }] })
        })
    })

    describe('scenario lines and ids as Cucumber writes them', () => {
        it('gives each scenario with the same name (in other Rules) its own lines, and the Rule in its id', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            const featureFile = path.join(logFolderPath, 'same-names.feature')
            fs.writeFileSync(featureFile, [
                'Feature: Same names',          // 1
                '  Rule: Admin',                // 2
                '    Scenario: login',          // 3
                '      Given an admin',         // 4
                '  Rule: Guest',                // 5
                '    Scenario: login',          // 6
                '      Given a guest',          // 7
                ''
            ].join('\n'))
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, title: 'Same names', file: featureFile, parent: undefined } as SuiteStatsExtended)
            const admin = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'login', rule: 'Admin' } as SuiteStatsExtended, 'same-names')
            const guest = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'login', rule: 'Guest' } as SuiteStatsExtended, 'same-names')
            expect([admin.line, guest.line]).toEqual([3, 6])
            expect([admin.id, guest.id]).toEqual(['same-names;admin;login', 'same-names;guest;login'])
            tmpReporter.report.feature!.elements!.push(guest)
            tmpReporter.addStepData({ ...STEP_TEST_ONSTART_STATS, title: 'Given a guest', keyword: 'Given' } as TestStatsExtended)
            expect(tmpReporter.getCurrentStep()!.line).toBe(7)
        })

        it('gives each example of a Scenario Outline the line of its Examples row', () => {
            const featureFile = path.join(logFolderPath, 'outline.feature')
            fs.writeFileSync(featureFile, [
                'Feature: Outline',             // 1
                '  Scenario Outline: value <n>', // 2
                '    Given the value <n>',      // 3
                '    Examples:',                // 4
                '      | n |',                  // 5
                '      | 1 |',                  // 6
                '      | 2 |',                  // 7
                ''
            ].join('\n'))
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, title: 'Outline', file: featureFile, parent: undefined } as SuiteStatsExtended)
            const first = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'value 1' } as SuiteStatsExtended, 'outline')
            const second = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'value 2' } as SuiteStatsExtended, 'outline')
            expect([first.line, second.line]).toEqual([6, 7])
        })
    })

    describe('cucumberOpts.tagsInTitle', () => {
        it('writes the feature and scenario names and ids without the tags of the title', () => {
            const feature = tmpReporter.getFeatureDataObject({ ...SUITE_FEATURE_STATS, title: '@featuretag: Tagged feature', tags: ['@featuretag'] } as unknown as SuiteStatsExtended)
            expect(feature).toMatchObject({ name: 'Tagged feature', id: 'tagged-feature' })
            const scenario = tmpReporter.getScenarioDataObject(
                { ...SUITE_SCENARIO_STATS, title: '@featuretag, @smoke: Login', tags: ['@featuretag', '@smoke'] } as SuiteStatsExtended,
                feature.id!
            )
            expect(scenario).toMatchObject({ name: 'Login', id: 'tagged-feature;login' })
        })

        it('keeps only the last try of a retried scenario that has tags in its title', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            const title = '@smoke: Login'
            const tags = ['@smoke']
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title, tags } as SuiteStatsExtended, 'f'))
            tmpReporter.addStepData({ ...STEP_TEST_ONSTART_STATS, state: FAILED } as TestStatsExtended)
            tmpReporter.onSuiteRetry({ ...SUITE_SCENARIO_STATS, title, tags } as SuiteStatsExtended)
            expect(tmpReporter.getCurrentScenario().steps).toEqual([])
        })
    })

    describe('doc string argument', () => {
        it('writes a doc string as { content, line }, as Cucumber does', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            const featureFile = path.join(logFolderPath, 'docstring.feature')
            fs.writeFileSync(featureFile, 'Feature: Doc\n  Scenario: Text\n    Given a doc string\n      """\n      some text\n      """\n')
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, file: featureFile, parent: undefined } as SuiteStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'Text', file: featureFile } as SuiteStatsExtended)
            const docStringStep = { ...STEP_TEST_ONSTART_STATS, title: 'Given a doc string', keyword: 'Given', argument: 'some text' } as unknown as TestStatsExtended
            tmpReporter.addStepData(docStringStep)
            tmpReporter.onTestPass({ ...docStringStep, state: PASSED } as TestStatsExtended)

            expect(tmpReporter.getCurrentStep()!.line).toBe(3)
            expect(tmpReporter.getCurrentStep()!.arguments).toEqual([{ content: 'some text', line: 4 }])
        })
    })

    describe('attach() before the first feature', () => {
        it('keeps the attachment for the first step (for example from the WebdriverIO before hook)', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            expect(() => tmpReporter.cucumberJsAttachment({ data: 'from the before hook', type: TEXT_PLAIN })).not.toThrow()
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.addStepData(STEP_TEST_ONSTART_STATS)
            expect(tmpReporter.getCurrentStep()!.embeddings).toEqual([
                { data: Buffer.from('from the before hook').toString('base64'), mime_type: TEXT_PLAIN }
            ])
        })
    })

    describe('Cucumber retry', () => {
        it('keeps only the steps of the last try, as Cucumber does', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            vi.mocked(containsSteps).mockReturnValue(false)
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.addStepData({ ...STEP_TEST_ONSTART_STATS, state: FAILED } as TestStatsExtended)

            tmpReporter.onSuiteRetry(SUITE_SCENARIO_STATS as SuiteStatsExtended)
            tmpReporter.addStepData({ ...STEP_TEST_ONSTART_STATS, state: PASSED } as TestStatsExtended)

            expect(tmpReporter.getCurrentScenario().steps!.map((step) => step.result.status)).toEqual([PASSED])
        })
    })

    describe('cucumberOpts.scenarioLevelReporter', () => {
        it('does not fail the run: the CucumberJS JSON format needs the steps', () => {
            tmpReporter.onRunnerStart({ config: { cucumberOpts: { scenarioLevelReporter: true } }, capabilities: {} } as unknown as RunnerStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, parent: undefined } as SuiteStatsExtended)
            expect(() => tmpReporter.onTestStart(TEST_SCENARIO_STATS as TestStatsExtended)).not.toThrow()
            expect(() => tmpReporter.onTestPass(TEST_SCENARIO_STATS as TestStatsExtended)).not.toThrow()
        })
    })

    describe('scenario lines', () => {
        it('finds the line of a scenario whose title has its tags (cucumberOpts.tagsInTitle)', () => {
            const featureFile = path.join(logFolderPath, 'tags.feature')
            fs.writeFileSync(featureFile, 'Feature: Tags\n  @smoke\n  Scenario: Login\n    Given a step\n')
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, file: featureFile, parent: undefined } as SuiteStatsExtended)
            const scenario = tmpReporter.getScenarioDataObject(
                { ...SUITE_SCENARIO_STATS, title: '@smoke: Login', tags: ['@smoke'] } as SuiteStatsExtended,
                'tags'
            )
            expect(scenario.line).toBe(3)
        })
    })

    describe('updateStepStatus', () => {
        it('should update step data of the current scenario step', () => {
            const pendingStep = { foo: 'current-step', status: PENDING }
            const updatedStep = { foo: 'current-step', status: PASSED, bar: false }
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario')
            const getStepDataObjectSpy = vi.spyOn(tmpReporter, 'getStepDataObject').mockReturnValue(updatedStep)
            const getCurrentStepSpy = vi
                .spyOn(tmpReporter, 'getCurrentStep')
                .mockReturnValue({ foo: 'current-step' })

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.report.feature.elements![0].steps!.push(pendingStep)

            expect(tmpReporter.report.feature.elements![0].steps).toMatchSnapshot()
            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(1)

            tmpReporter.updateStepStatus({} as TestStatsExtended)

            expect(tmpReporter.report.feature.elements![0].steps).toMatchSnapshot()
            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(1)
            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(getStepDataObjectSpy).toHaveBeenCalledTimes(1)
            expect(getCurrentStepSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('attach', () => {
        let mockStdout: MockInstance
        beforeAll(() => {
            mockStdout = vi.spyOn(process, 'emit').mockImplementation(() => true)
        })

        beforeEach(() => {
            // the reporter of the outer beforeEach adds a listener, which emits 'newListener'
            mockStdout.mockClear()
        })

        afterAll(() => {
            mockStdout.mockRestore()
        })

        it('should be able to attach default data', () => {
            WdioCucumberJsJsonReporter.attach('foo')

            expect(mockStdout).toHaveBeenCalledTimes(1)
            expect(mockStdout).toHaveBeenCalledWith('wdioCucumberJsReporter:attachment', {
                data: 'foo',
                type: TEXT_PLAIN,
            })
        })

        it('should be able to attach with all data', () => {
            WdioCucumberJsJsonReporter.attach('foo', 'text/plain')

            expect(mockStdout).toHaveBeenCalledTimes(1)
            expect(mockStdout).toHaveBeenCalledWith('wdioCucumberJsReporter:attachment', {
                data: 'foo',
                type: 'text/plain',
            })
        })
    })

    describe('cucumberJsAttachment', () => {
        it('should be able to add embeddings to a current step when they have not been added', () => {
            const pendingStep = { foo: 'current-step', status: PENDING }
            const getCurrentStepSpy = vi.spyOn(tmpReporter, 'getCurrentStep').mockReturnValue(pendingStep)

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.report.feature.elements![0].steps!.push(pendingStep)

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()

            tmpReporter.cucumberJsAttachment({ data: 'data', type: 'text/plain' })

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()
            expect(getCurrentStepSpy).toHaveBeenCalledTimes(1)
        })

        it('should be able to add embeddings to a current step which already has embeddings', () => {
            const pendingStep: Step = {
                foo: 'current-step',
                result: { duration: 1, status: PENDING },
                embeddings: [{ data: 'data-1', mime_type: 'text/plain' }],
            }
            const getCurrentStepSpy = vi.spyOn(tmpReporter, 'getCurrentStep').mockReturnValue(pendingStep)

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.report.feature.elements![0].steps!.push(pendingStep)

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()

            tmpReporter.cucumberJsAttachment({ data: 'data-2', type: 'text/plain' })

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()
            expect(getCurrentStepSpy).toHaveBeenCalledTimes(1)
        })
    })
})
