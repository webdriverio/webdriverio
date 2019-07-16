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
