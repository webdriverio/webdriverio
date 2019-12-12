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

test('onTestCaseFinished', () => {
    const uri = '/myFeature.feature'
    const scenario = {
        type: 'Scenario',
        location: { line: 321 }
    }
    const feature = {
        children: [scenario]
    }
    const eventBroadcaster = new EventEmitter()
    const listener = new CucumberEventListener(eventBroadcaster)
    listener.gherkinDocEvents = [{
        uri,
        document: {
            feature
        }
    }]

    const result = { duration: 2, status: 'passed' }
    const sourceLocation = {
        line: 321,
        uri
    }
    const testCaseFinishedEvent = {
        sourceLocation,
        result
    }
    const spy = jest.fn()
    listener.on('after-scenario', spy)
    listener.onTestCaseFinished(testCaseFinishedEvent)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(uri, feature, scenario, result, sourceLocation)
})

test('getCurrentStep', () => {
    const eventBroadcaster = new EventEmitter()
    const listener = new CucumberEventListener(eventBroadcaster)

    expect(listener.getCurrentStep()).toBeNull()

    listener.currentStep = 'foobar'
    expect(listener.getCurrentStep()).toBe('foobar')
})
