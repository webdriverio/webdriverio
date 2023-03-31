import { EventEmitter } from 'node:events'

import { Status } from '@cucumber/cucumber'
import type { PickleFilter } from '@cucumber/cucumber'
import type {
    Pickle, TestCase, Envelope, TestStepResult, TestCaseStarted, GherkinDocument,
    TestStepStarted, TestStepFinished, PickleStep
} from '@cucumber/messages'

import logger from '@wdio/logger'
import type { Capabilities } from '@wdio/types'

import { addKeywordToStep, filterPickles, getRule } from './utils.js'
import type { ReporterScenario } from './constants.js'
import type { HookParams } from './types.js'

const log = logger('CucumberEventListener')

export default class CucumberEventListener extends EventEmitter {
    private _gherkinDocEvents: GherkinDocument[] = []
    private _scenarios: Pickle[] = []
    private _testCases: TestCase[] = []
    private _currentTestCase?: TestCaseStarted
    private _currentPickle?: HookParams = {}
    private _suiteMap: Map<string, string> = new Map()
    private _pickleMap: Map<string, string> = new Map()
    private _currentDoc: GherkinDocument = { comments: [] }
    private _startedFeatures: string[] = []

    constructor (eventBroadcaster: EventEmitter, private _pickleFilter: PickleFilter) {
        super()
        let results: TestStepResult[] = []
        eventBroadcaster.on('envelope', (envelope: Envelope) => {
            if (envelope.gherkinDocument) {
                this.onGherkinDocument(envelope.gherkinDocument)
            } else if (envelope.testRunStarted) {
                this.onTestRunStarted()
            } else if (envelope.pickle) {
                this.onPickleAccepted(envelope.pickle)
            } else if (envelope.testCase) {
                this.onTestCasePrepared(envelope.testCase)
            } else if (envelope.testCaseStarted) {
                results = []
                this.onTestCaseStarted(envelope.testCaseStarted)
            } else if (envelope.testStepStarted) {
                this.onTestStepStarted(envelope.testStepStarted)
            } else if (envelope.testStepFinished) {
                results.push(envelope.testStepFinished.testStepResult!)
                this.onTestStepFinished(envelope.testStepFinished)
            } else if (envelope.testCaseFinished) {
                /**
                 * only store result if step isn't retried
                 */
                if (envelope.testCaseFinished.willBeRetried) {
                    return log.debug(`test case with id ${envelope.testCaseFinished.testCaseStartedId} will be retried, ignoring result`)
                }
                this.onTestCaseFinished(results)
            } else if (envelope.testRunFinished) {
                this.onTestRunFinished()
            } else if (envelope.source) {
                // do nothing for step definition patterns
            } else {
                /* istanbul ignore next */
                log.debug(`Unknown envelope received: ${JSON.stringify(envelope, null, 4)}`)
            }
        })
    }

    usesSpecGrouping() {
        return this._gherkinDocEvents.length > 1
    }

    featureIsStarted(feature: string) {
        return this._startedFeatures.includes(feature)
    }

    // {
    //     "gherkinDocument": {
    //         "uri": "/Users/christianbromann/Sites/WebdriverIO/webdriverio/examples/wdio/cucumber/features/my-feature.feature",
    //         "feature": {
    //             "location": {
    //                 "line": 1,
    //                 "column": 1
    //             },
    //             "language": "en",
    //             "keyword": "Feature",
    //             "name": "Example feature",
    //             "description": "  As a user of WebdriverIO\n  I should be able to use different commands\n  to get informations about elements on the page",
    //             "children": [
    //                 {
    //                     "scenario": {
    //                         "location": {
    //                             "line": 6,
    //                             "column": 3
    //                         },
    //                         "keyword": "Scenario",
    //                         "name": "Get size of an element",
    //                         "steps": [
    //                             {
    //                                 "location": {
    //                                     "line": 7,
    //                                     "column": 5
    //                                 },
    //                                 "keyword": "Given ",
    //                                 "text": "I go on the website \"https://github.com/\"",
    //                                 "id": "0"
    //                             },
    //                             {
    //                                 "location": {
    //                                     "line": 8,
    //                                     "column": 5
    //                                 },
    //                                 "keyword": "Then ",
    //                                 "text": "should the element \".header-logged-out a\" be 32px wide and 35px high",
    //                                 "id": "1"
    //                             }
    //                         ],
    //                         "id": "2"
    //                     }
    //                 }
    //             ]
    //         }
    //     }
    // }
    onGherkinDocument (gherkinDocEvent: GherkinDocument) {
        this._currentPickle = { uri: gherkinDocEvent.uri, feature: gherkinDocEvent.feature }
        this._gherkinDocEvents.push(gherkinDocEvent)
    }

    // {
    //     "pickle": {
    //         "id": "5",
    //         "uri": "/Users/christianbromann/Sites/WebdriverIO/webdriverio/examples/wdio/cucumber/features/my-feature.feature",
    //         "name": "Get size of an element",
    //         "language": "en",
    //         "steps": [
    //             {
    //                 "text": "I go on the website \"https://github.com/\"",
    //                 "id": "3",
    //                 "astNodeIds": [
    //                     "0"
    //                 ]
    //             },
    //             {
    //                 "text": "should the element \".header-logged-out a\" be 32px wide and 35px high",
    //                 "id": "4",
    //                 "astNodeIds": [
    //                     "1"
    //                 ]
    //             }
    //         ],
    //         "astNodeIds": [
    //             "2"
    //         ]
    //     }
    // }
    onPickleAccepted (pickleEvent: Pickle) {
        const id = this._suiteMap.size.toString()
        this._suiteMap.set(pickleEvent.id as string, id)
        this._pickleMap.set(id, pickleEvent.astNodeIds[0] as string)
        const scenario = { ...pickleEvent, id }
        this._scenarios.push(scenario)
    }

    // {
    //     "testRunStarted": {
    //         "timestamp": {
    //             "seconds": "1609002214",
    //             "nanos": 447000000
    //         }
    //     }
    // }
    onTestRunStarted () {
        if (this.usesSpecGrouping()) {
            return
        }
        const doc = this._gherkinDocEvents[this._gherkinDocEvents.length - 1]
        this.emit('before-feature', doc.uri, doc.feature)
    }

    // {
    //     "testCase": {
    //         "id": "15",
    //         "pickleId": "5",
    //         "testSteps": [
    //             {
    //                 "id": "16",
    //                 "hookId": "13"
    //             },
    //             {
    //                 "id": "17",
    //                 "pickleStepId": "3",
    //                 "stepDefinitionIds": [
    //                     "6"
    //                 ],
    //                 "stepMatchArgumentsLists": [
    //                     {
    //                         "stepMatchArguments": [
    //                             {
    //                                 "group": {
    //                                     "start": 21,
    //                                     "value": "https://github.com/"
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 ]
    //             },
    //             {
    //                 "id": "18",
    //                 "pickleStepId": "4",
    //                 "stepDefinitionIds": [
    //                     "8"
    //                 ],
    //                 "stepMatchArgumentsLists": [
    //                     {
    //                         "stepMatchArguments": [
    //                             {
    //                                 "group": {
    //                                     "start": 20,
    //                                     "value": ".header-logged-out a"
    //                                 }
    //                             },
    //                             {
    //                                 "parameterTypeName": "int",
    //                                 "group": {
    //                                     "start": 45,
    //                                     "value": "32"
    //                                 }
    //                             },
    //                             {
    //                                 "parameterTypeName": "int",
    //                                 "group": {
    //                                     "start": 59,
    //                                     "value": "35"
    //                                 }
    //                             }
    //                         ]
    //                     }
    //                 ]
    //             },
    //             {
    //                 "id": "19",
    //                 "hookId": "11"
    //             }
    //         ]
    //     }
    // }
    onTestCasePrepared (testCase: TestCase) {
        this._testCases.push(testCase)
    }

    // {
    //     "testCaseStarted": {
    //         "timestamp": {
    //             "seconds": "1609002214",
    //             "nanos": 453000000
    //         },
    //         "attempt": 0,
    //         "testCaseId": "15",
    //         "id": "20"
    //     }
    // }
    onTestCaseStarted (testcase: TestCaseStarted) {
        this._currentTestCase = testcase

        const tc = this._testCases.find(tc => tc.id === testcase.testCaseId)
        const scenario = this._scenarios.find(sc => sc.id === this._suiteMap.get(tc?.pickleId as string))
        /* istanbul ignore if */
        if (!scenario) {
            return
        }

        const doc = this._gherkinDocEvents.find(gde => gde.uri === scenario?.uri)
        const uri = doc?.uri
        const feature = doc?.feature

        if (this._currentDoc.uri && this._currentDoc.feature && this.usesSpecGrouping() && doc !== this._currentDoc && this.featureIsStarted(this._currentDoc.uri)) {
            this.emit('after-feature', this._currentDoc.uri, this._currentDoc.feature)
        }

        if (this.usesSpecGrouping() && doc && doc.uri && !this.featureIsStarted(doc.uri)) {
            this.emit('before-feature', doc.uri, doc.feature)
            this._currentDoc = doc
            this._startedFeatures.push(doc.uri)
        }
        /**
         * The reporters need to have the keywords, like `Given|When|Then`. They are NOT available
         * on the scenario, they ARE on the feature.
         * This will aad them
         */
        if (scenario.steps && feature) {
            scenario.steps = addKeywordToStep(scenario.steps as PickleStep[], feature)
        }

        this._currentPickle = { uri, feature, scenario }

        const reporterScenario: ReporterScenario = scenario
        reporterScenario.rule = getRule(doc?.feature!, this._pickleMap.get(scenario.id)!)

        this.emit('before-scenario', scenario.uri, doc?.feature, reporterScenario)
    }

    // {
    //     "testStepStarted": {
    //         "timestamp": {
    //             "seconds": "1609002214",
    //             "nanos": 454000000
    //         },
    //         "testStepId": "16",
    //         "testCaseStartedId": "20"
    //     }
    // }
    onTestStepStarted (testStepStartedEvent: TestStepStarted) {
        const testcase = this._testCases.find((testcase) => this._currentTestCase && testcase.id === this._currentTestCase.testCaseId)
        const scenario = this._scenarios.find(sc => sc.id === this._suiteMap.get(testcase?.pickleId as string))
        const teststep = testcase?.testSteps?.find((step) => step.id === testStepStartedEvent.testStepId)
        const step = scenario?.steps?.find((s) => s.id === teststep?.pickleStepId) || teststep

        const doc = this._gherkinDocEvents.find(gde => gde.uri === scenario?.uri)
        const uri = doc?.uri
        const feature = doc?.feature

        /* istanbul ignore if */
        if (!step) {
            return
        }

        this._currentPickle = { uri, feature, scenario, step }
        this.emit('before-step', uri, feature, scenario, step)
    }

    // {
    //     "testStepFinished": {
    //         "testStepResult": {
    //             "status": "PASSED",
    //             "duration": {
    //                 "seconds": "0",
    //                 "nanos": 1000000
    //             }
    //         },
    //         "timestamp": {
    //             "seconds": "1609002214",
    //             "nanos": 455000000
    //         },
    //         "testStepId": "16",
    //         "testCaseStartedId": "20"
    //     }
    // }
    onTestStepFinished (testStepFinishedEvent: TestStepFinished) {
        const testcase = this._testCases.find((testcase) => testcase.id === this._currentTestCase?.testCaseId)
        const scenario = this._scenarios.find(sc => sc.id === this._suiteMap.get(testcase?.pickleId as string))
        const teststep = testcase?.testSteps?.find((step) => step.id === testStepFinishedEvent.testStepId)
        const step = scenario?.steps?.find((s) => s.id === teststep?.pickleStepId) || teststep
        const result = testStepFinishedEvent.testStepResult

        const doc = this._gherkinDocEvents.find(gde => gde.uri === scenario?.uri)
        const uri = doc?.uri
        const feature = doc?.feature

        /* istanbul ignore if */
        if (!step) {
            return
        }

        this.emit('after-step', uri, feature, scenario, step, result)
        delete this._currentPickle
    }

    // {
    //     "testCaseFinished": {
    //         "timestamp": {
    //             "seconds": "1609002223",
    //             "nanos": 913000000
    //         },
    //         "testCaseStartedId": "20"
    //     }
    // }
    onTestCaseFinished (
        results: TestStepResult[]
    ) {
        const tc = this._testCases.find(tc => tc.id === this._currentTestCase?.testCaseId)
        const scenario = this._scenarios.find(sc => sc.id === this._suiteMap.get(tc?.pickleId as string))

        /* istanbul ignore if */
        if (!scenario) {
            return
        }

        /**
         * propagate the first non passing result or the last one
         */
        const finalResult = results.find((r) => r.status !== Status.PASSED) || results.pop()

        const doc = this._gherkinDocEvents.find(gde => gde.uri === scenario?.uri)
        const uri = doc?.uri
        const feature = doc?.feature
        this._currentPickle = { uri, feature, scenario }
        this.emit('after-scenario', doc?.uri, doc?.feature, scenario, finalResult)
    }

    // testRunFinishedEvent = {
    //     "timestamp": {
    //         "seconds": "1609000747",
    //         "nanos": 793000000
    //     }
    // }
    onTestRunFinished () {
        delete this._currentTestCase

        if (this.usesSpecGrouping()) {
            this.emit('after-feature', this._currentDoc.uri, this._currentDoc.feature)
            return
        }

        const gherkinDocEvent = this._gherkinDocEvents.pop() // see .push() in `handleBeforeFeature()`

        /* istanbul ignore if */
        if (!gherkinDocEvent) {
            return
        }

        this.emit('after-feature', gherkinDocEvent.uri, gherkinDocEvent.feature)
    }

    getHookParams () {
        return this._currentPickle
    }

    /**
     * returns a list of pickles to run based on capability tags
     * @param caps session capabilities
     */
    getPickleIds (caps: Capabilities.RemoteCapability) {
        const gherkinDocument = this._gherkinDocEvents[this._gherkinDocEvents.length - 1]
        return [...this._suiteMap.entries()]
            /**
             * match based on capability tags
             */
            .filter(([, fakeId]) => filterPickles(caps, this._scenarios.find(s => s.id === fakeId)))
            /**
             * match based on Cucumber pickle filter
             */
            .filter(([, fakeId]) => this._pickleFilter.matches({
                gherkinDocument,
                pickle: this._scenarios.find(s => s.id === fakeId) as Pickle
            }))
            .map(([id]) => id)
    }
}
