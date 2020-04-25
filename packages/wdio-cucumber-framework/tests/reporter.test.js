import CucumberReporter from '../src/reporter'
import { EventEmitter } from 'events'

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

const buildGherkinDocEvent = () => ({
    uri: './any.feature',
    document: {
        type: 'GherkinDocument',
        feature: {
            type: 'Feature',
            tags: [
                { name: '@feature-tag1' },
                { name: '@feature-tag2' }
            ],
            location: { line: 123, column: 1 },
            keyword: 'Feature',
            name: 'feature',
            description: '    This is a feature description\n    Second description',
            children: [{
                type: 'Background',
                location: { line: 124, column: 0 },
                keyword: 'Background',
                name: 'background',
                steps: [
                    {
                        location: { line: 125, column: 1 },
                        keyword: 'Given ',
                        text: 'background-title'
                    }
                ]
            }, {
                type: 'Scenario',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ],
                location: { line: 126, column: 0 },
                keyword: 'Scenario',
                name: 'scenario',
                description: '    This should be a scenario description',
                steps: [
                    {
                        type: 'Step',
                        location: { line: 127, column: 1 },
                        keyword: 'Given ',
                        text: 'step-title-passing',
                        argument: {
                            type: 'DataTable',
                            location: { line: 15, column: 13 },
                            rows: [
                                {
                                    type: 'TableRow',
                                    location: { line: 15, column: 13 },
                                    cells: [
                                        {
                                            type: 'TableCell',
                                            location: { line: 15, column: 15 },
                                            value: 'Cucumber'
                                        },
                                        {
                                            type: 'TableCell',
                                            location: { line: 15, column: 30 },
                                            value: 'Cucumis sativus'
                                        }
                                    ]
                                },
                                {
                                    type: 'TableRow',
                                    location: { line: 16, column: 13 },
                                    cells: [
                                        {
                                            type: 'TableCell',
                                            location: { line: 16, column: 15 },
                                            value: 'Burr Gherkin'
                                        },
                                        {
                                            type: 'TableCell',
                                            location: { line: 16, column: 30 },
                                            value: 'Cucumis anguria'
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        type: 'Step',
                        location: { line: 128, column: 1 },
                        keyword: 'When ',
                        text: 'step-title-failing'
                    }
                ]
            }, {
                type: 'Scenario',
                location: { line: 131, column: 0 },
                keyword: 'Scenario',
                name: 'scenario',
                steps: [
                    {
                        type: 'Hook',
                        location: { line: 132, column: 1, uri: './any.feature' },
                        keyword: 'Hook',
                        text: '',
                    },
                    {
                        type: 'Step',
                        location: { line: 133, column: 2 },
                        keyword: '',
                        text: '',
                    },
                ]
            }]
        }
    }
})
const gherkinDocEvent = buildGherkinDocEvent()
const gherkinDocEventNoLine = buildGherkinDocEvent()
delete gherkinDocEventNoLine.document.feature.location.line

const loadGherkin = (eventBroadcaster) => eventBroadcaster.emit('gherkin-document', gherkinDocEvent)
const loadGherkinNoLine = (eventBroadcaster) => eventBroadcaster.emit('gherkin-document', gherkinDocEventNoLine)
const acceptPickle = (eventBroadcaster) => eventBroadcaster.emit('pickle-accepted', {
    uri: gherkinDocEvent.uri,
    pickle: {
        tags: [{ name: 'abc' }],
        name: 'scenario',
        locations: [{ line: 126, column: 1 }],
        steps: [{
            locations: [{ line: 127, column: 1 }],
            keyword: 'Given ',
            text: 'step-title-passing'
        }]
    }
})
const prepareSuite = (eventBroadcaster) => eventBroadcaster.emit('test-case-prepared', {
    sourceLocation: SOURCE_LOCATION,
    steps: [
        {
            sourceLocation: { uri: gherkinDocEvent.uri, line: 125 },
            actionLocation: { uri: gherkinDocEvent.uri, line: 126 }
        },
        {
            sourceLocation: { uri: gherkinDocEvent.uri, line: 127 },
            actionLocation: { uri: gherkinDocEvent.uri, line: 126 }
        },
        {
            sourceLocation: { uri: gherkinDocEvent.uri, line: 128 },
            actionLocation: { uri: gherkinDocEvent.uri, line: 126 }
        }
    ]
})

const SOURCE_LOCATION = { uri: gherkinDocEvent.uri, line: 126 }
const startSuite = (eventBroadcaster) => eventBroadcaster.emit('test-case-started', { sourceLocation: SOURCE_LOCATION })

describe('cucumber reporter', () => {
    describe('emits messages for certain cucumber events', () => {
        const cid = '0-1'
        const specs = ['/foobar.js']
        let eventBroadcaster
        let cucumberReporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            cucumberReporter = new CucumberReporter(eventBroadcaster, { failAmbiguousDefinitions: true }, cid, specs, wdioReporter)
        })

        it('should not send any data on `gherkin-document` event', () => {
            loadGherkin(eventBroadcaster)
            expect(cucumberReporter.eventListener.gherkinDocEvents).toEqual([gherkinDocEvent])
            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should send proper data on `test-run-started` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('test-run-started')

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                cid,
                description: gherkinDocEvent.document.feature.description,
                file: gherkinDocEvent.uri,
                keyword: gherkinDocEvent.document.feature.keyword,
                specs,
                tags: [...gherkinDocEvent.document.feature.tags],
                title: gherkinDocEvent.document.feature.name,
                type: 'feature',
                uid: 'feature123',
            }))
        })

        it('should not send any data on `pickle-accepted` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)

            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should not be ok if line is missing', () => {
            loadGherkinNoLine(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)

            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should send accepted pickle\'s data on `test-case-started` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()
            startSuite(eventBroadcaster)

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                type: 'scenario',
                cid: '0-1',
                parent: 'feature123',
                uid: 'scenario126',
                file: './any.feature',
                tags: [{ name: 'abc' }],
                description: '    This should be a scenario description'
            }))
        })

        describe('step finished events', () => {
            beforeEach(() => {
                loadGherkin(eventBroadcaster)
                acceptPickle(eventBroadcaster)
                prepareSuite(eventBroadcaster)
                startSuite(eventBroadcaster)
                wdioReporter.emit.mockClear()
            })

            it('should send proper data on `test-step-started` event', () => {
                eventBroadcaster.emit('test-step-started', {
                    index: 1,
                    testCase: {
                        sourceLocation: SOURCE_LOCATION
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('test:start', expect.objectContaining({
                    type: 'test',
                    title: 'Given step-title-passing',
                    cid: '0-1',
                    parent: 'feature: scenario',
                    uid: 'step-title-passing127',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ],
                    featureName: 'feature',
                    scenarioName: 'scenario'
                }))
            })

            it('passed hook', () => {
                eventBroadcaster.emit('test-step-finished', {
                    index: 0,
                    result: { duration: 10, status: 'passed' },
                    testCase: {
                        sourceLocation: { uri: gherkinDocEvent.uri, line: 131 }
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('hook:end', expect.objectContaining({
                    type: 'hook',
                    error: undefined,
                }))
            })

            it('failed hook', () => {
                eventBroadcaster.emit('test-step-finished', {
                    index: 0,
                    result: { duration: 10, status: 'failed', exception: 'err' },
                    testCase: {
                        sourceLocation: { uri: gherkinDocEvent.uri, line: 131 }
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('hook:end', expect.objectContaining({
                    type: 'hook',
                    error: 'err',
                }))
            })

            it('should send proper data on successful `test-step-finished` event', () => {
                eventBroadcaster.emit('test-step-finished', {
                    index: 1,
                    result: { duration: 10, status: 'passed' },
                    testCase: {
                        sourceLocation: SOURCE_LOCATION
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('test:pass', expect.objectContaining({
                    type: 'step',
                    title: 'Given step-title-passing',
                    cid: '0-1',
                    parent: 'feature: scenario',
                    uid: 'step-title-passing127',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ]
                }))
            })

            it('should send proper data on skipped `test-step-finished` event', () => {
                eventBroadcaster.emit('test-step-finished', {
                    index: 1,
                    result: { duration: 10, status: 'skipped' },
                    testCase: {
                        sourceLocation: SOURCE_LOCATION
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('test:pending', expect.objectContaining({
                    type: 'step',
                    title: 'Given step-title-passing',
                    cid: '0-1',
                    parent: 'feature: scenario',
                    uid: 'step-title-passing127',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ]
                }))
            })

            it('should send proper data on pending `test-step-finished` event', () => {
                eventBroadcaster.emit('test-step-finished', {
                    index: 1,
                    result: { duration: 10, status: 'pending' },
                    testCase: {
                        sourceLocation: SOURCE_LOCATION
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('test:pending', expect.objectContaining({
                    type: 'step',
                    title: 'Given step-title-passing',
                    cid: '0-1',
                    parent: 'feature: scenario',
                    uid: 'step-title-passing127',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ]
                }))
            })

            it('should send proper data on failing `test-step-finished` event with exception', () => {
                const err = new Error('exception-error')
                eventBroadcaster.emit('test-step-finished', {
                    index: 2,
                    result: {
                        duration: 10,
                        status: 'failed',
                        exception: err
                    },
                    testCase: {
                        sourceLocation: SOURCE_LOCATION
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('test:fail', expect.objectContaining({
                    type: 'step',
                    title: 'When step-title-failing',
                    cid: '0-1',
                    parent: 'feature: scenario',
                    uid: 'step-title-failing128',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ],
                    error: expect.objectContaining({
                        message: err.message,
                        stack: err.stack
                    })
                }))
            })

            it('should send proper data on failing `test-step-finished` event with string error', () => {
                eventBroadcaster.emit('test-step-finished', {
                    index: 2,
                    result: {
                        duration: 10,
                        status: 'failed',
                        exception: 'string-error'
                    },
                    testCase: {
                        sourceLocation: SOURCE_LOCATION
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('test:fail', expect.objectContaining({
                    type: 'step',
                    title: 'When step-title-failing',
                    cid: '0-1',
                    parent: 'feature: scenario',
                    uid: 'step-title-failing128',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ],
                    error: expect.objectContaining({
                        message: 'string-error',
                        stack: ''
                    })
                }))
            })

            it('should send proper data on ambiguous `test-step-finished` event', () => {
                eventBroadcaster.emit('test-step-finished', {
                    index: 2,
                    result: {
                        duration: 10,
                        status: 'ambiguous',
                        exception: 'cucumber-ambiguous-error-message'
                    },
                    testCase: {
                        sourceLocation: SOURCE_LOCATION
                    }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('test:fail', expect.objectContaining({
                    type: 'step',
                    title: 'When step-title-failing',
                    cid: '0-1',
                    parent: 'feature: scenario',
                    uid: 'step-title-failing128',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ],
                    error: expect.objectContaining({
                        message: 'cucumber-ambiguous-error-message',
                        stack: ''
                    })
                }))
            })

            it('should send proper data on `test-case-finished` event', () => {
                eventBroadcaster.emit('test-case-finished', {
                    result: { duration: 0, status: 'passed' },
                    sourceLocation: SOURCE_LOCATION
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('suite:end', expect.objectContaining({
                    type: 'scenario',
                    cid: '0-1',
                    parent: 'feature123',
                    uid: 'scenario126',
                    file: './any.feature',
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ]
                }))
            })

            it('should send proper data on `test-run-finished` event', () => {
                eventBroadcaster.emit('test-run-finished', {
                    result: { duration: 0, success: true }
                })

                expect(wdioReporter.emit).toHaveBeenCalledWith('suite:end', expect.objectContaining({
                    type: 'feature',
                    title: 'feature',
                    file: './any.feature',
                    uid: 'feature123',
                    cid: '0-1',
                    // parent: null,
                    tags: [
                        { name: '@feature-tag1' },
                        { name: '@feature-tag2' }
                    ]
                }))
            })
        })
    })

    describe('emits messages for certain cucumber events when executed in scenarioLeverReporter', () => {
        const cid = '0-1'
        const specs = ['/foobar.js']
        let eventBroadcaster
        let cucumberReporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            cucumberReporter = new CucumberReporter(eventBroadcaster, { failAmbiguousDefinitions: true, scenarioLevelReporter: true }, cid, specs, wdioReporter)
        })

        it('should not send any data on `gherkin-document` event', () => {
            loadGherkin(eventBroadcaster)
            expect(cucumberReporter.eventListener.gherkinDocEvents).toEqual([gherkinDocEvent])
            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should send proper data on `test-run-started` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('test-run-started')

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                cid,
                description: gherkinDocEvent.document.feature.description,
                file: gherkinDocEvent.uri,
                keyword: gherkinDocEvent.document.feature.keyword,
                specs,
                tags: [...gherkinDocEvent.document.feature.tags],
                title: gherkinDocEvent.document.feature.name,
                type: 'feature',
                uid: 'feature123',
            }))
        })

        it('should not send any data on `pickle-accepted` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)

            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should not be ok if line is missing', () => {
            loadGherkinNoLine(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)

            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should send accepted pickle\'s data on `test-case-started` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()
            startSuite(eventBroadcaster)

            expect(wdioReporter.emit).toHaveBeenCalledWith('test:start', expect.objectContaining({
                type: 'scenario',
                cid: '0-1',
                parent: 'feature123',
                uid: 'scenario126',
                file: './any.feature',
                tags: [{ name: 'abc' }],
                description: '    This should be a scenario description'
            }))
        })

        it('should send proper data on `test-case-finished` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('test-case-finished', {
                result: { duration: 0, status: 'passed' },
                sourceLocation: SOURCE_LOCATION
            })

            expect(wdioReporter.emit).toHaveBeenCalledWith('test:pass', expect.objectContaining({
                type: 'scenario',
                cid: '0-1',
                parent: 'feature123',
                uid: 'scenario126',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ],
            }))
        })

    })

    describe('provides a fail counter', () => {
        let eventBroadcaster
        let reporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            reporter = new CucumberReporter(eventBroadcaster, { failAmbiguousDefinitions: true }, '0-1', ['/foobar.js'], wdioReporter)

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
        })

        it('should increment failed counter on `failed` status', () => {
            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'failed',
                    exception: new Error('exception-error')
                },
                testCase: {
                    sourceLocation: SOURCE_LOCATION
                }
            })
            expect(reporter.failedCount).toBe(1)
        })

        it('should increment failed counter on `ambiguous` status', () => {
            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'ambiguous',
                    exception: 'cucumber-ambiguous-error-message',
                    stack: ''
                },
                testCase: {
                    sourceLocation: SOURCE_LOCATION
                }
            })

            expect(reporter.failedCount).toBe(1)
        })

        it('should increment failed counter on `undefined` status', () => {
            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'undefined'
                },
                testCase: {
                    sourceLocation: SOURCE_LOCATION
                }
            })

            expect(reporter.failedCount).toBe(1)
        })

        it('should not increment failed counter on `undefined` status if ignoreUndefinedDefinitions set to true', () => {
            reporter.options.ignoreUndefinedDefinitions = true

            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'undefined'
                },
                testCase: {
                    sourceLocation: SOURCE_LOCATION
                }
            })

            expect(reporter.failedCount).toBe(0)
        })
    })

    describe('tags in title', () => {
        let eventBroadcaster

        beforeAll(() => {
            eventBroadcaster = new EventEmitter()
            new CucumberReporter(eventBroadcaster, {
                tagsInTitle: true
            }, '0-1', ['/foobar.js'], wdioReporter)
        })

        it('should add tags on handleBeforeFeatureEvent', () => {
            eventBroadcaster.emit('gherkin-document', gherkinDocEvent)
            expect(wdioReporter.emit).not.toBeCalled()

            eventBroadcaster.emit('test-run-started')

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                type: 'feature',
                title: '@feature-tag1, @feature-tag2: feature',
                uid: 'feature123',
                file: './any.feature',
                cid: '0-1',
                description: gherkinDocEvent.document.feature.description
            }))
        })

        it('should add tags on handleBeforeScenarioEvent', () => {
            eventBroadcaster.emit('gherkin-document', gherkinDocEvent)
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('pickle-accepted', {
                uri: gherkinDocEvent.uri,
                pickle: {
                    tags: [
                        { name: '@scenario-tag1' },
                        { name: '@scenario-tag2' }
                    ],
                    name: 'scenario',
                    locations: [{ line: 126, column: 1 }],
                    steps: [{
                        locations: [{ line: 127, column: 1 }],
                        keyword: 'Given ',
                        text: 'I go on the website "http://webdriver.io" the async way'
                    }]
                }
            })
            prepareSuite(eventBroadcaster)
            eventBroadcaster.emit('test-case-started', { sourceLocation: SOURCE_LOCATION })

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                type: 'scenario',
                title: '@scenario-tag1, @scenario-tag2: scenario',
                uid: 'scenario126',
                file: './any.feature',
                cid: '0-1'
            }))
        })
    })

    afterEach(() => {
        wdioReporter.on.mockClear()
        wdioReporter.write.mockClear()
        wdioReporter.emit.mockClear()
    })
})
