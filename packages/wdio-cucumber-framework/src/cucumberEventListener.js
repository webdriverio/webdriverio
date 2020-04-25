import { EventEmitter } from 'events'

import { compareScenarioLineWithSourceLine, getTestCaseSteps } from './utils'

export default class CucumberEventListener extends EventEmitter {
    gherkinDocEvents = []
    acceptedPickles = []
    currentPickle = null
    currentStep = null
    currentSteps = null
    testCasePreparedEvents = []

    constructor (eventBroadcaster) {
        super()
        eventBroadcaster
            .on('gherkin-document', this.onGherkinDocument.bind(this))
            .on('test-run-started', this.onTestRunStarted.bind(this))
            .on('pickle-accepted', this.onPickleAccepted.bind(this))
            .on('test-case-prepared', this.onTestCasePrepared.bind(this))
            .on('test-case-started', this.onTestCaseStarted.bind(this))
            .on('test-step-started', this.onTestStepStarted.bind(this))
            .on('test-step-finished', this.onTestStepFinished.bind(this))
            .on('test-case-finished', this.onTestCaseFinished.bind(this))
            .on('test-run-finished', this.onTestRunFinished.bind(this))
    }

    // gherkinDocEvent = {
    //     uri: string,
    //     document: {
    //         type: 'GherkinDocument',
    //         feature: {
    //             type: 'Feature',
    //             tags: [{ name: string }],
    //             location: { line: 0, column: 0 },
    //             language: string,
    //             keyword: 'Feature',
    //             name: string,
    //             description: string,
    //             children: [{
    //                 type: 'Scenario',
    //                 tags: [],
    //                 location: { line: 0, column: 0 },
    //                 keyword: 'Scenario',
    //                 name: string,
    //                 steps: [{
    //                     type: 'Step',
    //                     location: { line: 0, column: 0 },
    //                     keyword: 'Given' | 'When' | 'Then',
    //                     text: string
    //                 }]
    //             }]
    //         }
    //     },
    //     comments: [{
    //         type: 'Comment',
    //         location: { line: 0, column: 0 },
    //         text: string
    //     }]
    // }
    onGherkinDocument (gherkinDocEvent) {
        this.gherkinDocEvents.push(gherkinDocEvent)
    }

    onTestRunStarted () {
        const doc = this.gherkinDocEvents[this.gherkinDocEvents.length - 1]

        this.emit('before-feature', doc.uri, doc.document.feature)
    }

    // pickleEvent = {
    //     uri: string,
    //     pickle: {
    //         tags: [{ name: string }],
    //         name: string,
    //         locations: [{ line: 0, column: 0 }],
    //         steps: [{
    //             locations: [{ line: 0, column: 0 }],
    //             keyword: 'Given' | 'When' | 'Then',
    //             text: string
    //         }]
    //     }
    // }
    onPickleAccepted (pickleEvent) {
        // because 'pickle-accepted' events are emitted together in forEach loop
        this.acceptedPickles.push(pickleEvent)
    }

    onTestCaseStarted (pickleEvent) {
        const { uri, pickle } = this.acceptedPickles.find(item =>
            item.uri === pickleEvent.sourceLocation.uri &&
            item.pickle.locations[0].line === pickleEvent.sourceLocation.line)
        const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
        const feature = doc.feature
        this.currentPickle = pickle

        const testCasePreparedEvent = this.testCasePreparedEvents[this.testCasePreparedEvents.length - 1]
        const scenario = feature.children.find((child) => compareScenarioLineWithSourceLine(child, testCasePreparedEvent.sourceLocation))
        this.currentSteps = getTestCaseSteps(feature, scenario, pickle, testCasePreparedEvent)
        this.currentPickle.description = scenario.description

        this.emit('before-scenario', uri, feature, this.currentPickle)
    }

    // testStepStartedEvent = {
    //     index: 0,
    //     testCase: {
    //         sourceLocation: { uri: string, line: 0 }
    //     }
    // }
    onTestStepStarted (testStepStartedEvent) {
        const sourceLocation = testStepStartedEvent.testCase.sourceLocation
        const uri = sourceLocation.uri

        const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
        const feature = doc.feature
        const scenario = feature.children.find((child) => compareScenarioLineWithSourceLine(child, sourceLocation))
        const step = this.currentSteps[testStepStartedEvent.index]

        if (step.type === 'Step') {
            this.currentStep = { uri, feature, scenario, step, sourceLocation }
        }

        this.emit('before-step', uri, feature, scenario, step, sourceLocation)
    }

    // testCasePreparedEvent = {
    //     sourceLocation: { uri: string, line: 0 }
    //     steps: [
    //         {
    //             actionLocation: {
    //                 uri: string
    //                 line: 0
    //             }
    //         }
    //     ]
    // }
    onTestCasePrepared (testCasePreparedEvent) {
        this.testCasePreparedEvents.push(testCasePreparedEvent)
        const sourceLocation = testCasePreparedEvent.sourceLocation
        const uri = sourceLocation.uri

        const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
        const scenario = doc.feature.children.find((child) => compareScenarioLineWithSourceLine(child, sourceLocation))

        const hasScenarioHasHooks = scenario.steps.filter((step) => step.type === 'Hook').length > 0
        if (hasScenarioHasHooks) {
            return
        }
        const allSteps = testCasePreparedEvent.steps
        allSteps.forEach((step, idx) => {
            if (step.sourceLocation) {
                return
            }

            step.sourceLocation = { line: step.actionLocation.line, column: 0, uri: step.actionLocation.uri }
            const hook = {
                type: 'Hook',
                location: step.sourceLocation,
                keyword: 'Hook',
                text: ''
            }
            scenario.steps.splice(idx, 0, hook)
        })
    }

    // testStepFinishedEvent = {
    //     index: 0,
    //     result: { duration: 0, status: string, exception?: Error },
    //     testCase: {
    //         sourceLocation: { uri: string, line: 0 }
    //     }
    // }
    onTestStepFinished (testStepFinishedEvent) {
        const sourceLocation = testStepFinishedEvent.testCase.sourceLocation
        const uri = sourceLocation.uri

        const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
        const feature = doc.feature
        const scenario = feature.children.find((child) => compareScenarioLineWithSourceLine(child, sourceLocation))
        const step = this.currentSteps[testStepFinishedEvent.index]
        const result = testStepFinishedEvent.result

        this.emit('after-step', uri, feature, scenario, step, result, sourceLocation)
    }

    // testCaseFinishedEvent = {
    //     result: { duration: 0, status: string },
    //     sourceLocation: { uri: string, line: 0 }
    // }
    onTestCaseFinished (testCaseFinishedEvent) {
        const { sourceLocation, result } = testCaseFinishedEvent
        const uri = sourceLocation.uri

        const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
        const feature = doc.feature
        const scenario = feature.children.find((child) => compareScenarioLineWithSourceLine(child, sourceLocation))

        this.emit('after-scenario', uri, feature, scenario, result, sourceLocation)

        this.currentPickle = null
        this.currentStep = null
        this.currentSteps = null
    }

    // testRunFinishedEvent = {
    //     result: { duration: 4004, success: true }
    // }
    onTestRunFinished () {
        const gherkinDocEvent = this.gherkinDocEvents.pop() // see .push() in `handleBeforeFeature()`
        const uri = gherkinDocEvent.uri
        const doc = gherkinDocEvent.document
        const feature = doc.feature

        this.emit('after-feature', uri, feature)
    }

    getCurrentStep () {
        return this.currentStep
    }
}
