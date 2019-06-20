import { EventEmitter } from 'events'

import CucumberEventListener from '../src/cucumberEventListener'

test('onTestCasePrepared does nothing if step is a hook', () => {
    const uri = '/myFeature.feature'
    const testCasePreparedEvent = {
        sourceLocation: {
            uri,
            line: 321
        }
    }
    const eventBroadcaster = new EventEmitter()
    const listener = new CucumberEventListener(eventBroadcaster)
    listener.gherkinDocEvents = [{
        uri,
        document: {
            feature: {
                children: [{
                    type: 'ScenarioOutline',
                    examples: [{
                        tableBody: [
                            { location: { line: 123 } },
                            { location: { line: 321 } }
                        ]
                    }],
                    steps: [{ type: 'Hook' }]
                }]
            }
        }
    }]
    listener.onTestCasePrepared(testCasePreparedEvent)
})

test('onTestCasePrepared', () => {
    const uri = '/myFeature.feature'
    const testCasePreparedEventStep = {
        actionLocation: {
            line: 321,
            uri: 'some uri'
        }
    }
    const testCasePreparedEvent = {
        sourceLocation: {
            uri,
            line: 321
        },
        steps: []
    }
    const eventBroadcaster = new EventEmitter()
    const listener = new CucumberEventListener(eventBroadcaster)
    listener.gherkinDocEvents = [{
        uri,
        document: {
            feature: {
                children: [{
                    type: 'ScenarioOutline',
                    examples: [{
                        tableBody: [
                            { location: { line: 123 } },
                            { location: { line: 321 } }
                        ]
                    }],
                    steps: []
                }]
            }
        }
    }]
    listener.onTestCasePrepared(testCasePreparedEvent)
    expect(listener.gherkinDocEvents[0].document.feature.children[0].steps).toHaveLength(0)

    testCasePreparedEvent.steps.push(testCasePreparedEventStep)
    listener.onTestCasePrepared(testCasePreparedEvent)
    expect(listener.gherkinDocEvents[0].document.feature.children[0].steps).toHaveLength(1)
})

//     onTestCasePrepared (testCasePreparedEvent) {
//         this.testCasePreparedEvents.push(testCasePreparedEvent)
//         const sourceLocation = testCasePreparedEvent.sourceLocation
//         const uri = sourceLocation.uri
//
//         const doc = this.gherkinDocEvents.find(gde => gde.uri === uri).document
//         const scenario = doc.feature.children.find((child) => compareScenarioLineWithSourceLine(child, sourceLocation))
//
//         const scenarioHasHooks = scenario.steps.filter((step) => step.type === 'Hook').length > 0
//         if (scenarioHasHooks) {
//             return
//         }
//         const allSteps = testCasePreparedEvent.steps
//         allSteps.forEach((step, idx) => {
//             if (!step.sourceLocation) {
//                 step.sourceLocation = { line: step.actionLocation.line, column: 0, uri: step.actionLocation.uri }
//                 const hook = {
//                     type: 'Hook',
//                     location: step.sourceLocation,
//                     keyword: 'Hook',
//                     text: ''
//                 }
//                 scenario.steps.splice(idx, 0, hook)
//             }
//         })
//     }
