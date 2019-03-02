import { EventEmitter } from 'events'

export class CucumberEventListener extends EventEmitter {
    gherkinDocEvents = []
    acceptedPickles = []
    currentPickle = null
    testCasePreparedEvents = []

    constructor (eventBroadcaster) {
        super()
        // attachEventLogger(eventBroadcaster)

        eventBroadcaster
            .on('gherkin-document', this.onGherkinDocument.bind(this))
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

        const uri = gherkinDocEvent.uri
        const doc = gherkinDocEvent.document
        const feature = doc.feature

        this.emit('before-feature', uri, feature)
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

    onTestCaseStarted () {
        const pickleEvent = this.acceptedPickles.shift()
        const uri = pickleEvent.uri
        const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
        const feature = doc.feature
        const scenario = pickleEvent.pickle

        this.currentPickle = scenario

        this.emit('before-scenario', uri, feature, scenario)
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
        const step = getStepFromFeature(feature, this.currentPickle, testStepStartedEvent.index, sourceLocation)

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

        const scenarioHasHooks = scenario.steps.filter((step) => step.type === 'Hook').length > 0
        if (scenarioHasHooks) {
            return
        }
        const allSteps = testCasePreparedEvent.steps
        allSteps.forEach((step, idx) => {
            if (!step.sourceLocation) {
                step.sourceLocation = { line: step.actionLocation.line, column: 0, uri: step.actionLocation.uri }
                const hook = {
                    type: 'Hook',
                    location: step.sourceLocation,
                    keyword: 'Hook',
                    text: ''
                }
                scenario.steps.splice(idx, 0, hook)
            }
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
        const step = getStepFromFeature(feature, this.currentPickle, testStepFinishedEvent.index, sourceLocation)
        const result = testStepFinishedEvent.result

        this.emit('after-step', uri, feature, scenario, step, result, sourceLocation)
    }

    // testCaseFinishedEvent = {
    //     result: { duration: 0, status: string },
    //     sourceLocation: { uri: string, line: 0 }
    // }
    onTestCaseFinished (testCaseFinishedEvent) {
        const sourceLocation = testCaseFinishedEvent.sourceLocation
        const uri = sourceLocation.uri

        const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
        const feature = doc.feature
        const scenario = feature.children.find((child) => compareScenarioLineWithSourceLine(child, sourceLocation))

        this.emit('after-scenario', uri, feature, scenario, sourceLocation)

        this.currentPickle = null
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
}

/* eslint-disable-next-line no-unused-vars
function attachEventLogger (eventBroadcaster) {
    // for debugging purposed
    // from https://github.com/cucumber/cucumber-js/blob/v4.1.0/src/formatter/event_protocol_formatter.js
    const EVENTS = [
        'source',
        'attachment',
        'gherkin-document',
        'pickle',
        'pickle-accepted',
        'pickle-rejected',
        'test-run-started',
        'test-case-prepared',
        'test-case-started',
        'test-step-started',
        'test-step-attachment',
        'test-step-finished',
        'test-case-finished',
        'test-run-finished'
    ]
    EVENTS.forEach(e => {
        eventBroadcaster.on(e, x => {
            console.log('\n-----' + e + ' -----\n' + JSON.stringify(x, null, 2))
        })
    })
}*/

export function compareScenarioLineWithSourceLine (scenario, sourceLocation) {
    if (scenario.type.indexOf('ScenarioOutline') > -1) {
        return scenario.examples[0].tableBody.some((tableEntry) => tableEntry.location.line === sourceLocation.line)
    } else {
        return scenario.location.line === sourceLocation.line
    }
}

export function getStepFromFeature (feature, pickle, stepIndex, sourceLocation) {
    let combinedSteps = []
    feature.children.forEach((child) => {
        if (child.type.indexOf('Scenario') > -1 && !compareScenarioLineWithSourceLine(child, sourceLocation)) {
            return
        }
        combinedSteps = combinedSteps.concat(child.steps)
    })
    const targetStep = combinedSteps[stepIndex]

    if (targetStep.type === 'Step') {
        const stepLine = targetStep.location.line
        const pickleStep = pickle.steps.find(s => s.locations.some(loc => loc.line === stepLine))

        if (pickleStep) {
            return { ...targetStep, text: pickleStep.text }
        }
    }

    return targetStep
}
