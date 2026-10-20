/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as fs from 'node:fs'
// the default export, as in the source: the namespace cannot be spied on
import fsDefault from 'node:fs'
import * as os from 'node:os'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi, type MockInstance } from 'vitest'

import { containsSteps, getFailedMessage, keywordStartsWith } from '../src/utils.js'
import type * as UtilsModule from '../src/utils.js'
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
import type { CucumberJsAttachment, MetadataObject, Scenario, Step } from '../src/types.js'
import WdioCucumberJsJsonReporter from '../src/index.js'

const logFolderPath = path.join(os.tmpdir(), 'wdio-cucumberjs-json-reporter-tests')
const logFile = path.join(logFolderPath, 'logFile.json')
const jsonFolder = path.join(logFolderPath, 'ut-folder')

vi.mock('../src/utils', async (importOriginal) => ({
    escapeRegExp: (await importOriginal<typeof UtilsModule>()).escapeRegExp,
    getStepStatus: (await importOriginal<typeof UtilsModule>()).getStepStatus,
    isKnownLanguage: (await importOriginal<typeof UtilsModule>()).isKnownLanguage,
    containsSteps: vi.fn(),
    getFailedMessage: vi.fn(),
    keywordStartsWith: vi.fn()
}))

vi.mock('@wdio/logger', () => ({
    default: vi.fn().mockReturnValue({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
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
            const metadata = { foo: 'bar' } as unknown as MetadataObject
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
            const metadata = { foo: 'bar' } as unknown as MetadataObject
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
            const metadata = { foo: 'bar' } as unknown as MetadataObject
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
            // onSuiteStart sets both: the current feature and the list of the features
            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.report.features = [tmpReporter.report.feature]
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
            // onSuiteStart sets both: the current feature and the list of the features
            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.report.features = [tmpReporter.report.feature]
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

            // onSuiteStart sets both: the current feature and the list of the features
            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.report.features = [tmpReporter.report.feature]
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

        it('waits for another worker that writes the same file (reportFilePerRetry false)', async () => {
            const jsonFile = path.join(jsonFolder, 'this-feature.json')
            await fsp.rm(jsonFolder, { recursive: true, force: true })
            await fsp.mkdir(jsonFolder, { recursive: true })
            const { spawn } = await import('node:child_process')
            // another worker: it holds the lock of the file and writes its feature 150 ms later
            const other = spawn(process.execPath, ['-e', `
                const fs = require('node:fs')
                fs.mkdirSync(${JSON.stringify(`${jsonFile}.lock`)})
                console.log('locked')
                setTimeout(() => {
                    fs.writeFileSync(${JSON.stringify(jsonFile)}, JSON.stringify([{ id: 'other-worker' }]))
                    fs.rmSync(${JSON.stringify(`${jsonFile}.lock`)}, { recursive: true })
                }, 150)
            `])
            const exited = new Promise((resolve) => other.once('exit', resolve))
            await new Promise((resolve) => other.stdout.once('data', resolve))

            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.report.features = [tmpReporter.report.feature]
            tmpReporter.options.jsonFolder = jsonFolder
            tmpReporter.options.reportFilePerRetry = false
            tmpReporter.onRunnerEnd()
            await exited

            const content = JSON.parse(await fsp.readFile(jsonFile, 'utf-8'))
            expect(content.map((feature: { id: string }) => feature.id).sort()).toEqual(['other-worker', 'this-feature'])
            expect(fs.existsSync(`${jsonFile}.lock`)).toBe(false)
        })

        afterEach(async () => {
            await fsp.rm(jsonFolder, {
                recursive: true,
                force: true
            })
        })
    })

    describe('application/json attachments', () => {
        const attached = (data: unknown) => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.addStepData(STEP_TEST_ONSTART_STATS)
            tmpReporter.cucumberJsAttachment({ data, type: 'application/json' } as CucumberJsAttachment)
            return Buffer.from(String(tmpReporter.getCurrentStep()!.embeddings![0].data), 'base64').toString()
        }

        it('keeps a string that is already JSON, as Cucumber does', () => {
            expect(attached('{"a":1}')).toBe('{"a":1}')
        })

        it('writes an object as JSON', () => {
            expect(attached({ a: 1 })).toBe('{"a":1}')
        })

        it('writes a string that is not JSON as a JSON string', () => {
            expect(attached('hello')).toBe('"hello"')
        })
    })

    describe('keywords of the feature and the scenarios', () => {
        const keywords = (file: string, content: string, title: string) => {
            const featureFile = path.join(logFolderPath, file)
            fs.writeFileSync(featureFile, content)
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, logFile })
            reporter.onSuiteStart({ ...SUITE_FEATURE_STATS, file: featureFile, parent: undefined } as SuiteStatsExtended)
            reporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title, file: featureFile } as SuiteStatsExtended)
            return [reporter.report.feature.keyword, reporter.getCurrentScenario().keyword]
        }

        it('writes the keywords of the file, as Cucumber does', () => {
            expect(keywords('outline.keywords.feature', [
                'Feature: F',
                '  Scenario Outline: Buy <item>',
                '    Given I buy <item>',
                '    Examples:',
                '      | item |',
                '      | milk |',
                ''
            ].join('\n'), 'Buy milk')).toEqual(['Feature', 'Scenario Outline'])
        })

        it('writes the keywords of another language', () => {
            expect(keywords('fr.keywords.feature', '# language: fr\nFonctionnalité: F\n  Scénario: Premier\n    Soit je passe\n', 'Premier'))
                .toEqual(['Fonctionnalité', 'Scénario'])
        })
    })

    describe('ids with characters that a file name cannot have', () => {
        it('writes the ids as Cucumber does, and keeps the file name safe', async () => {
            const name = 'Login: admin/user'
            const feature = tmpReporter.getFeatureDataObject({ ...SUITE_FEATURE_STATS, title: name, file: undefined } as unknown as SuiteStatsExtended)
            // cucumber-js: name.replace(/ /g, '-').toLowerCase()
            expect(feature.id).toBe('login:-admin/user')
            const scenario = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'Open: home' } as SuiteStatsExtended, feature.id!)
            expect(scenario.id).toBe('login:-admin/user;open:-home')

            const folder = path.join(logFolderPath, 'safe-file-name')
            await fsp.rm(folder, { recursive: true, force: true })
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder: folder, language: 'en', logFile, reportFilePerRetry: false })
            reporter.report.feature = feature
            reporter.report.features = [feature]
            reporter.onRunnerEnd()
            expect(await fsp.readdir(folder)).toEqual(['login--admin-user.json'])
        })
    })

    describe('lock of the JSON file', () => {
        const lockCalls = (reportFilePerRetry: boolean) => {
            const folder = path.join(logFolderPath, `lock-${reportFilePerRetry}`)
            fs.rmSync(folder, { recursive: true, force: true })
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder: folder, language: 'en', logFile, reportFilePerRetry })
            reporter.report.feature = { id: 'this-feature' }
            reporter.report.features = [reporter.report.feature]
            const mkdir = vi.spyOn(fsDefault, 'mkdirSync')
            reporter.onRunnerEnd()
            const calls = mkdir.mock.calls.filter(([dir]) => String(dir).endsWith('.lock')).length
            mkdir.mockRestore()
            return { calls, files: fs.readdirSync(folder) }
        }

        it('takes no lock for a file name that only this worker writes (reportFilePerRetry)', () => {
            const { calls, files } = lockCalls(true)
            expect(calls).toBe(0)
            expect(files).toEqual([expect.stringMatching(/^this-feature_\d+\.json$/)])
        })

        it('does not replace the file of another worker with the same unique id', () => {
            const folder = path.join(logFolderPath, 'same-unique-id')
            fs.rmSync(folder, { recursive: true, force: true })
            // 2 workers end in the same millisecond with the same random fraction
            vi.spyOn(Date, 'now').mockReturnValue(1792465045771)
            vi.spyOn(Math, 'random').mockReturnValue(0.25)
            for (const worker of ['A', 'B']) {
                const reporter = new WdioCucumberJsJsonReporter({ jsonFolder: folder, language: 'en', logFile, reportFilePerRetry: true })
                reporter.report.feature = { id: 'this-feature', name: worker }
                reporter.report.features = [reporter.report.feature]
                reporter.onRunnerEnd()
            }
            vi.mocked(Date.now).mockRestore()
            vi.mocked(Math.random).mockRestore()
            const files = fs.readdirSync(folder).sort()
            expect(files).toEqual(['this-feature_179246504577125.json', 'this-feature_179246504577125-1.json'].sort())
            expect(files.map((file) => JSON.parse(fs.readFileSync(path.join(folder, file), 'utf-8'))[0].name).sort()).toEqual(['A', 'B'])
        })

        it('takes the lock for a file that other workers also write', () => {
            const { calls, files } = lockCalls(false)
            expect(calls).toBe(1)
            expect(files).toEqual(['this-feature.json'])
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
                elements: [{ foo: 'first-scenario' }, { bar: 'second-scenario' }, { foobar: 'current-scenario' }] as unknown as Scenario[],
            }

            expect(tmpReporter.getCurrentScenario()).toEqual({ foobar: 'current-scenario' })
        })
    })

    describe('getCurrentStep', () => {
        it('should return current running step', () => {
            const currentScenarioMock = {
                steps: [{ foo: 'first-step' }, { foo: 'second-step' }, { foo: 'current-step' }] as unknown as Step[],
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
                .mockReturnValue({ foo: 'current-step' } as unknown as Step)

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
        it('writes an object with the default type as JSON text, not [object Object]', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.addStepData(STEP_TEST_ONSTART_STATS)
            // `attach({ orderId: 42 })` sends the default type text/plain
            tmpReporter.cucumberJsAttachment({ data: { orderId: 42 }, type: TEXT_PLAIN })
            const [embedding] = tmpReporter.getCurrentStep().embeddings!
            expect(Buffer.from(embedding.data as string, 'base64').toString()).toBe('{"orderId":42}')
            expect(embedding.mime_type).toBe(TEXT_PLAIN)
        })

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

    describe('features of the same worker', () => {
        const featureIn = (folder: string) => {
            fs.mkdirSync(path.join(logFolderPath, folder), { recursive: true })
            const file = path.join(logFolderPath, folder, 'login.feature')
            fs.writeFileSync(file, `Feature: ${folder}\n  Scenario: ${folder} one\n    Given a step\n`)
            return file
        }

        it('keeps 2 feature files with the same name in other folders apart (same uid)', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            const admin = featureIn('admin')
            const user = featureIn('user')
            // the framework uid is `<file name>:<line>:<column>`
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, uid: 'login.feature:1:1', title: 'admin', file: admin, parent: undefined } as SuiteStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, uid: 'login.feature:1:1', title: 'user', file: user, parent: undefined } as SuiteStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'admin one', parent: 'login.feature:1:1', file: admin } as SuiteStatsExtended)
            const [adminFeature, userFeature] = tmpReporter.report.features!
            expect(adminFeature.elements!.map((scenario) => scenario.name)).toEqual(['admin one'])
            expect(userFeature.elements).toEqual([])
        })

        it('continues a feature that starts again (grouped specs in a random order)', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            const admin = featureIn('admin')
            const user = featureIn('user')
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, uid: 'a:1:1', title: 'admin', file: admin, parent: undefined } as SuiteStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'admin one', parent: 'a:1:1', file: admin } as SuiteStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, uid: 'u:1:1', title: 'user', file: user, parent: undefined } as SuiteStatsExtended)
            // the framework starts the feature again with the uid of this part
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, uid: 'a:1:1#2', title: 'admin', file: admin, parent: undefined } as SuiteStatsExtended)
            tmpReporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'admin two', parent: 'a:1:1#2', file: admin } as SuiteStatsExtended)
            expect(tmpReporter.report.features!.map((feature) => [feature.name, feature.elements!.map((scenario) => scenario.name)])).toEqual([
                ['admin', ['admin one', 'admin two']],
                ['user', []]
            ])
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

    describe('scenario lines when the run does not follow the file', () => {
        it('uses the Rule of the scenario, also when the second Rule runs first', () => {
            const featureFile = path.join(logFolderPath, 'rules-random.feature')
            fs.writeFileSync(featureFile, [
                'Feature: Rules',               // 1
                '  Rule: A',                    // 2
                '    Scenario: works',          // 3
                '      Given in A',             // 4
                '  Rule: B',                    // 5
                '    Scenario: works',          // 6
                '      Given in B',             // 7
                ''
            ].join('\n'))
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, title: 'Rules', file: featureFile, parent: undefined } as SuiteStatsExtended)
            const b = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'works', rule: 'B' } as SuiteStatsExtended, 'rules')
            const a = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'works', rule: 'A' } as SuiteStatsExtended, 'rules')
            expect([b.line, a.line]).toEqual([6, 3])
        })

        it('gives the steps before a retake the lines of the scenario that it takes again', () => {
            const featureFile = path.join(logFolderPath, 'retake.feature')
            fs.writeFileSync(featureFile, [
                'Feature: Shop',                // 1
                '  Scenario: Buy milk',         // 2
                '    Given I go to the shop',   // 3
                '    Then I buy milk',          // 4
                '  Scenario Outline: Buy <item>', // 5
                '    Given I go to the shop',   // 6
                '    Then I pay for <item>',    // 7
                '    Examples:',                // 8
                '      | item |',               // 9
                '      | milk |',               // 10
                ''
            ].join('\n'))
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, title: 'Shop', file: featureFile, parent: undefined } as SuiteStatsExtended)
            // only the example runs (a tag filter): it first takes the plain scenario with its name
            const example = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'Buy milk' } as SuiteStatsExtended, 'shop')
            tmpReporter.report.feature!.elements!.push(example)
            tmpReporter.addStepData({ ...STEP_TEST_ONSTART_STATS, title: 'Given I go to the shop', keyword: 'Given' } as TestStatsExtended)
            tmpReporter.addStepData({ ...STEP_TEST_ONSTART_STATS, title: 'Then I pay for milk', keyword: 'Then' } as TestStatsExtended)
            expect(example.line).toBe(10)
            expect(example.steps!.map((step) => step.line)).toEqual([6, 7])
        })

        it('gives an example the line of its own Examples row: tags of the table, values in the name', () => {
            const featureFile = path.join(logFolderPath, 'examples-tags.feature')
            fs.writeFileSync(featureFile, [
                'Feature: Examples',            // 1
                '  Scenario Outline: value <n>', // 2
                '    Given the value <n>',      // 3
                '    @smoke',                   // 4
                '    Examples:',                // 5
                '      | n |',                  // 6
                '      | 1 |',                  // 7
                '      | 2 |',                  // 8
                '    @regression',              // 9
                '    Examples:',                // 10
                '      | n |',                  // 11
                '      | 3 |',                  // 12
                '      | 4 |',                  // 13
                ''
            ].join('\n'))
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, title: 'Examples', file: featureFile, parent: undefined } as SuiteStatsExtended)
            // cucumberOpts.tags: '@regression', in a random order
            const four = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'value 4', tags: [{ name: '@regression' }] } as unknown as SuiteStatsExtended, 'examples')
            const three = tmpReporter.getScenarioDataObject({ ...SUITE_SCENARIO_STATS, title: 'value 3', tags: [{ name: '@regression' }] } as unknown as SuiteStatsExtended, 'examples')
            expect([four.line, three.line]).toEqual([13, 12])
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

    describe('unknown language', () => {
        it('uses "en" with a warning for an unknown language option', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, language: 'en-US', logFile })
            expect(reporter.options.language).toBe('en')
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('"en-US"'))
            warn.mockRestore()
        })

        it('uses "en" with a warning for an unknown cucumberOpts.language', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, logFile })
            // no browser in a unit test: metadata is not part of this check
            reporter.instanceMetadata = {}
            reporter.onRunnerStart({ config: { cucumberOpts: { language: 'xx' } }, capabilities: {} } as unknown as RunnerStatsExtended)
            expect(reporter.options.language).toBe('en')
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('"xx"'))
            warn.mockRestore()
        })
    })

    describe('feature file that cannot be read', () => {
        it('logs a warning: else all lines are null with no reason', async () => {
            const logger = (await import('@wdio/logger')).default
            const featureFile = path.join(logFolderPath, 'not-gherkin.feature')
            // not Gherkin: the parser fails
            fs.writeFileSync(featureFile, 'This is not a feature file\n')
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, language: 'en', logFile })
            reporter.onSuiteStart({ ...SUITE_FEATURE_STATS, file: featureFile, parent: undefined } as SuiteStatsExtended)
            expect(vi.mocked(logger('@wdio/cucumberjs-json-reporter').warn)).toHaveBeenCalledWith(expect.stringContaining(featureFile))
        })
    })

    describe('a file that cannot be written', () => {
        const folder = path.join(logFolderPath, 'not-written')
        beforeEach(() => fs.rmSync(folder, { recursive: true, force: true }))
        afterEach(() => vi.restoreAllMocks())
        const reporterOf = (...ids: string[]) => {
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder: folder, language: 'en', logFile, reportFilePerRetry: false })
            reporter.report.features = ids.map((id) => ({ id, name: id }))
            reporter.report.feature = reporter.report.features.at(-1)!
            return reporter
        }
        const read = (file: string) => JSON.parse(fs.readFileSync(path.join(folder, file), 'utf-8'))

        it('writes the files of the other features of the worker, and logs the error', () => {
            // a folder with the name of the file of the first feature: it cannot be read
            fs.mkdirSync(path.join(folder, 'first.json'), { recursive: true })
            const error = vi.spyOn(console, 'error').mockImplementation(() => {})
            reporterOf('first', 'second').onRunnerEnd()
            expect(read('second.json')).toEqual([{ id: 'second', name: 'second' }])
            expect(error).toHaveBeenCalledWith(expect.stringContaining('The CucumberJS JSON file of the feature "first" is not written'))
        })

        it('keeps an earlier file that is not valid JSON aside, and writes a new file', () => {
            fs.mkdirSync(folder, { recursive: true })
            // for example cut by a worker of an older version that ended while it wrote
            fs.writeFileSync(path.join(folder, 'first.json'), '[{"keyword":"Feat')
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            reporterOf('first').onRunnerEnd()
            const files = fs.readdirSync(folder).sort()
            // not a `.json` file: multiple-cucumber-html-reporter reads all `.json` files of the folder
            expect(files).toEqual(['first.json', expect.stringMatching(/^first\.json\.invalid-\d+$/)])
            expect(read('first.json')).toEqual([{ id: 'first', name: 'first' }])
            expect(fs.readFileSync(path.join(folder, files[1]), 'utf-8')).toBe('[{"keyword":"Feat')
            expect(warn).toHaveBeenCalledWith(expect.stringContaining(`is not valid JSON: it is kept as ${files[1]}`))
        })

        it('keeps an earlier file aside that is JSON but not a list of features', () => {
            fs.mkdirSync(folder, { recursive: true })
            fs.writeFileSync(path.join(folder, 'first.json'), '{}')
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            reporterOf('first').onRunnerEnd()
            expect(read('first.json')).toEqual([{ id: 'first', name: 'first' }])
            expect(fs.readdirSync(folder)).toHaveLength(2)
        })
    })

    describe('file name of a long feature name', () => {
        // 270 bytes in UTF-8: Linux file systems allow 255 bytes for a file name
        const longId = '漢字のテスト機能名称'.repeat(9)

        it('keeps the file name in the limit of 255 bytes', () => {
            const folder = path.join(logFolderPath, 'long-name')
            fs.rmSync(folder, { recursive: true, force: true })
            for (const reportFilePerRetry of [true, false]) {
                const reporter = new WdioCucumberJsJsonReporter({ jsonFolder: folder, language: 'en', logFile, reportFilePerRetry })
                reporter.report.feature = { id: longId }
                reporter.report.features = [reporter.report.feature]
                reporter.onRunnerEnd()
            }
            const files = fs.readdirSync(folder)
            expect(files).toHaveLength(2)
            for (const file of files) {
                expect(Buffer.byteLength(file), file).toBeLessThanOrEqual(255)
                expect(file.startsWith('漢字のテスト機能名称')).toBe(true)
            }
        })
    })

    describe('hook status', () => {
        // the events of the framework: the state of a hook with no error is not in the HookStats
        const hookStatus = (state: string) => {
            tmpReporter.emit('suite:start', { uid: 'feature', title: 'Feature', file: 'hook-status.feature' })
            tmpReporter.emit('suite:start', { uid: 'scenario', title: 'Scenario', parent: 'Feature', file: 'hook-status.feature' })
            tmpReporter.emit('hook:start', { uid: 'hook', title: 'Hook', parent: 'Scenario' })
            tmpReporter.emit('hook:end', { uid: 'hook', title: 'Hook', parent: 'Scenario', state })
            return tmpReporter.getCurrentStep()?.result?.status
        }

        it('writes "skipped" for a hook that Cucumber skips (after a failed hook, or it returns "skipped")', () => {
            expect(hookStatus('SKIPPED')).toBe('skipped')
        })

        it('writes "pending" for a hook that returns "pending"', () => {
            expect(hookStatus('PENDING')).toBe('pending')
        })

        it('writes "passed" for a hook that passed', () => {
            expect(hookStatus('PASSED')).toBe('passed')
        })
    })

    describe('process listener', () => {
        it('removes its attachment listener when the runner ends', () => {
            const event = 'wdioCucumberJsReporter:attachment'
            const before = process.listenerCount(event)
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, language: 'en', logFile })
            expect(process.listenerCount(event)).toBe(before + 1)
            reporter.onRunnerEnd()
            expect(process.listenerCount(event)).toBe(before)
        })
    })

    describe('attach() in a scenario with no step', () => {
        it('does not move the attachment to the next scenario (disableHooks)', () => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, language: 'en', logFile, disableHooks: true })
            reporter.onSuiteStart({ ...SUITE_FEATURE_STATS, parent: undefined } as SuiteStatsExtended)
            reporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'no steps' } as SuiteStatsExtended)
            // an After hook of the scenario with no step
            reporter.cucumberJsAttachment({ data: 'screenshot of no steps', type: TEXT_PLAIN })
            reporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'next' } as SuiteStatsExtended)
            reporter.addStepData({ ...STEP_TEST_ONSTART_STATS, title: 'Given a step', keyword: 'Given' } as TestStatsExtended)
            expect(reporter.getCurrentStep()!.embeddings).toBeUndefined()
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

    describe('cucumberOpts.parallelMode', () => {
        const scenario = (title: string) => ({ ...SUITE_SCENARIO_STATS, title } as SuiteStatsExtended)

        it('warns once when a scenario starts before the previous one ended', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, parent: undefined } as SuiteStatsExtended)
            tmpReporter.onSuiteStart(scenario('A'))
            tmpReporter.onSuiteStart(scenario('B'))
            tmpReporter.onSuiteStart(scenario('C'))
            expect(warn).toHaveBeenCalledTimes(1)
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('cucumberOpts.parallelMode'))
            warn.mockRestore()
        })

        it('does not warn for scenarios that run one after the other', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            tmpReporter.onSuiteStart({ ...SUITE_FEATURE_STATS, parent: undefined } as SuiteStatsExtended)
            for (const title of ['A', 'B', 'C']) {
                tmpReporter.onSuiteStart(scenario(title))
                tmpReporter.onSuiteEnd(scenario(title))
            }
            tmpReporter.onSuiteEnd({ ...SUITE_FEATURE_STATS, parent: undefined } as SuiteStatsExtended)
            expect(warn).not.toHaveBeenCalled()
            warn.mockRestore()
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

    describe('Cucumber step statuses', () => {
        const start = (reporter: WdioCucumberJsJsonReporter, title: string) => {
            vi.mocked(getFailedMessage).mockReturnValue({})
            reporter.report.feature = EMPTY_FEATURE
            reporter.report.feature.elements!.push(EMPTY_SCENARIO)
            reporter.onTestStart({ ...STEP_TEST_ONSTART_STATS, title, keyword: 'Given' } as TestStatsExtended)
        }

        it('writes "undefined" for an undefined step', () => {
            start(tmpReporter, 'Given an unknown step')
            const error = new Error('Step "an unknown step" is not defined. You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.')
            tmpReporter.onTestFail({ ...STEP_TEST_ONSTART_STATS, title: 'Given an unknown step', keyword: 'Given', state: FAILED, error } as TestStatsExtended)
            expect(tmpReporter.getCurrentStep()!.result.status).toBe('undefined')
        })

        it('writes "undefined" and the name without the suffix with ignoreUndefinedDefinitions', () => {
            start(tmpReporter, 'Given an unknown step')
            tmpReporter.onTestPending({ ...STEP_TEST_ONSTART_STATS, title: 'Given an unknown step (undefined step)', keyword: 'Given', state: PENDING, _duration: 2 } as TestStatsExtended)
            expect(tmpReporter.getCurrentStep()).toMatchObject({ name: 'an unknown step', result: { status: 'undefined', duration: 2000000 } })
        })

        it('writes "ambiguous" for an ambiguous step that the framework skips (the reason has the step definitions)', () => {
            tmpReporter.emit('suite:start', { uid: 'feature', title: 'Feature', file: 'ambiguous.feature' })
            tmpReporter.emit('suite:start', { uid: 'scenario', title: 'Scenario', parent: 'Feature', file: 'ambiguous.feature' })
            tmpReporter.emit('test:start', { uid: 'step', title: 'When I am ambiguous', parent: 'Scenario' })
            tmpReporter.emit('test:skip', { uid: 'step', title: 'When I am ambiguous', parent: 'Scenario', pendingReason: 'Multiple step definitions match:\n  I am ambiguous - steps.js:1\n  /^I am ambig/ - steps.js:2' })
            expect(tmpReporter.getCurrentStep()?.result?.status).toBe('ambiguous')
        })

        it('writes the duration of a pending step', () => {
            start(tmpReporter, 'Given a pending step')
            tmpReporter.onTestPending({ ...STEP_TEST_ONSTART_STATS, title: 'Given a pending step', keyword: 'Given', state: PENDING, _duration: 3 } as TestStatsExtended)
            expect(tmpReporter.getCurrentStep()!.result).toMatchObject({ status: PENDING, duration: 3000000 })
        })

    })

    describe('language of the feature file', () => {
        const run = async (reporter: WdioCucumberJsJsonReporter, file: string, content: string, config = {}) => {
            const utils = await vi.importActual<typeof UtilsModule>('../src/utils.js')
            vi.mocked(keywordStartsWith).mockImplementation(utils.keywordStartsWith)
            vi.mocked(containsSteps).mockImplementation(utils.containsSteps)
            vi.mocked(getFailedMessage).mockReturnValue({})
            const featureFile = path.join(logFolderPath, file)
            fs.writeFileSync(featureFile, content)
            // no browser in a unit test: metadata is not part of this check
            reporter.instanceMetadata = {}
            reporter.onRunnerStart({ config, capabilities: {} } as unknown as RunnerStatsExtended)
            reporter.onSuiteStart({ ...SUITE_FEATURE_STATS, file: featureFile, parent: undefined } as SuiteStatsExtended)
            reporter.onSuiteStart({ ...SUITE_SCENARIO_STATS, title: 'Premier', file: featureFile } as SuiteStatsExtended)
            reporter.onTestStart({ ...STEP_TEST_ONSTART_STATS, title: 'Soit je passe', keyword: undefined } as TestStatsExtended)
            reporter.onHookStart({ ...STEP_HOOK_ONSTART_STATS } as HookStatsExtended)
            const steps = reporter.getCurrentScenario().steps!
            return { keyword: steps[0].keyword, name: steps[0].name, line: steps[0].line, hook: steps[1].keyword }
        }

        it('uses the "# language:" header of the file, not the default language', async () => {
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, logFile })
            expect(await run(reporter, 'header.fr.feature', '# language: fr\nFonctionnalité: F\n  Scénario: Premier\n    Soit je passe\n'))
                .toEqual({ keyword: 'Soit', name: 'je passe', line: 4, hook: AFTER })
        })

        it('uses cucumberOpts.language for a file without a header', async () => {
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, logFile })
            expect(await run(reporter, 'no-header.fr.feature', 'Fonctionnalité: F\n  Scénario: Premier\n    Soit je passe\n', { cucumberOpts: { language: 'fr' } }))
                .toEqual({ keyword: 'Soit', name: 'je passe', line: 3, hook: AFTER })
        })

        it('uses cucumberOpts.language, as Cucumber does, with a warning for another language option', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const reporter = new WdioCucumberJsJsonReporter({ jsonFolder, logFile, language: 'en' })
            expect(await run(reporter, 'option.fr.feature', 'Fonctionnalité: F\n  Scénario: Premier\n    Soit je passe\n', { cucumberOpts: { language: 'fr' } }))
                .toEqual({ keyword: 'Soit', name: 'je passe', line: 3, hook: AFTER })
            expect(warn).toHaveBeenCalledWith(expect.stringContaining('The "language" option "en" is not the same as "cucumberOpts.language" "fr"'))
            warn.mockRestore()
        })
    })

    describe('updateStepStatus', () => {
        it('should update step data of the current scenario step', () => {
            const pendingStep = { foo: 'current-step', status: PENDING } as unknown as Step
            const updatedStep = { foo: 'current-step', status: PASSED, bar: false } as unknown as Step
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario')
            const getStepDataObjectSpy = vi.spyOn(tmpReporter, 'getStepDataObject').mockReturnValue(updatedStep)
            const getCurrentStepSpy = vi
                .spyOn(tmpReporter, 'getCurrentStep')
                .mockReturnValue({ foo: 'current-step' } as unknown as Step)

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
            const pendingStep = { foo: 'current-step', status: PENDING } as unknown as Step
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
            const pendingStep = {
                foo: 'current-step',
                result: { duration: 1, status: PENDING },
                embeddings: [{ data: 'data-1', mime_type: 'text/plain' }],
            } as unknown as Step
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
