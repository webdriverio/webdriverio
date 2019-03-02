import CucumberReporter from '../../../../wdio-cucumber-framework/src/CucumberReporter'
import { EventEmitter } from 'events'

const gherkinDocEvent = {
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
                        location: {line: 127, column: 1},
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
            }]
        }
    }
}

const loadGherkin = (eventBroadcaster) => eventBroadcaster.emit('gherkin-document', gherkinDocEvent)
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
    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 },
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
const startSuite = (eventBroadcaster) => eventBroadcaster.emit('test-case-started', {})

describe('cucumber reporter', () => {
    describe('emits messages for certain cucumber events', () => {
        let send
        let eventBroadcaster
        let reporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            reporter = new CucumberReporter(eventBroadcaster, { failAmbiguousDefinitions: true }, '0-1', ['/foobar.js'])
            send = reporter.send = jest.fn()
            send.mockImplementation(() => true)
        })

        it('should send proper data on `gherkin-document` event', () => {
            loadGherkin(eventBroadcaster)

            expect(send).toHaveBeenCalledWith({
                event: 'suite:start',
                type: 'suite',
                uid: 'feature123',
                file: './any.feature',
                cid: '0-1',
                tags: [
                    { name: '@feature-tag1' },
                    { name: '@feature-tag2' }
                ]
            })
        })

        it('should not send any data on `pickle-accepted` event', () => {
            loadGherkin(eventBroadcaster)
            send.mockClear()
            acceptPickle(eventBroadcaster)

            expect(send).not.toHaveBeenCalled()
        })

        it('should send accepted pickle\'s data on `test-case-started` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            send.mockClear()
            startSuite(eventBroadcaster)

            expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'suite:start',
                type: 'suite',
                cid: '0-1',
                parent: 'feature123',
                uid: 'scenario126',
                file: './any.feature',
                tags: [{ name: 'abc' }]
            }))
        })

        it('should send proper data on `test-step-started` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            send.mockClear()

            eventBroadcaster.emit('test-step-started', {
                index: 1,
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'test:start',
                type: 'test',
                title: 'step-title-passing',
                cid: '0-1',
                parent: 'scenario126',
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

        it('should send proper data on successful `test-step-finished` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            send.mockClear()

            eventBroadcaster.emit('test-step-finished', {
                index: 1,
                result: { duration: 10, status: 'passed' },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'test:pass',
                type: 'test',
                title: 'step-title-passing',
                cid: '0-1',
                parent: 'scenario126',
                uid: 'step-title-passing127',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ]
            }))
        })

        it('should send proper data on failing `test-step-finished` event with exception', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            send.mockClear()

            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'failed',
                    exception: new Error('exception-error')
                },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            /*expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'test:fail',
                type: 'test',
                title: 'step-title-failing',
                cid: '0-1',
                parent: 'scenario126',
                uid: 'step-title-failing128',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ]
            }))*/
            expect(send.mock.calls[send.mock.calls.length - 1][0].err.message).toEqual('exception-error')
        })

        it('should send proper data on failing `test-step-finished` event with string error', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            send.mockClear()

            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'failed',
                    exception: 'string-error'
                },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'test:fail',
                type: 'test',
                title: 'step-title-failing',
                cid: '0-1',
                parent: 'scenario126',
                uid: 'step-title-failing128',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ]
            }))
            expect(send.mock.calls[send.mock.calls.length - 1][0].err.message).toEqual('string-error')
        })

        it('should send proper data on ambiguous `test-step-finished` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            send.mockClear()

            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'ambiguous',
                    exception: 'cucumber-ambiguous-error-message'
                },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'test:fail',
                type: 'test',
                title: 'step-title-failing',
                cid: '0-1',
                parent: 'scenario126',
                uid: 'step-title-failing128',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ]
            }))
            expect(send.mock.calls[send.mock.calls.length - 1][0].err.message).toEqual('cucumber-ambiguous-error-message')
        })

        it('should send proper data on `test-case-finished` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            send.mockClear()

            eventBroadcaster.emit('test-case-finished', {
                result: { duration: 0, status: 'passed' },
                sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
            })

            expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'suite:end',
                type: 'suite',
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
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            send.mockClear()

            eventBroadcaster.emit('test-run-finished', {
                result: { duration: 0, success: true }
            })

            expect(send).toHaveBeenCalledWith(expect.objectContaining({
                event: 'suite:end',
                type: 'suite',
                title: 'feature',
                file: './any.feature',
                uid: 'feature123',
                cid: '0-1',
                parent: null,
                tags: [
                    { name: '@feature-tag1' },
                    { name: '@feature-tag2' }
                ]
            }))
        })
    })

    describe('make sure all commands are sent properly', () => {
        const reporter = new CucumberReporter(new EventEmitter(), { failAmbiguousDefinitions: true }, '0-1', ['/foobar.js'])

        reporter.send = (_0, _1, _2, callback) => setTimeout(callback, 500)

        it('should wait until all events were sent', () => {
            const start = (new Date()).getTime()

            reporter.emit({}, {})

            return reporter.waitUntilSettled().then(() => {
                const end = (new Date()).getTime()
                expect(end - start).toBeGreaterThan(500)
            })
        })
    })

    describe('provides a fail counter', () => {
        let eventBroadcaster
        let reporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            reporter = new CucumberReporter(eventBroadcaster, { failAmbiguousDefinitions: true, ignoreUndefinedDefinitions: false }, '0-1', ['/foobar.js'])
            reporter.send = () => {}
        })

        it('should increment failed counter on `failed` status', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)

            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'failed',
                    exception: new Error('exception-error')
                },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })
            expect(reporter.failedCount).toBe(1)
        })

        it('should increment failed counter on `ambiguous` status', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)

            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'ambiguous',
                    exception: 'cucumber-ambiguous-error-message'
                },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(reporter.failedCount).toBe(1)
        })

        it('should increment failed counter on `undefined` status', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)

            eventBroadcaster.emit('test-step-finished', {
                index: 2,
                result: {
                    duration: 10,
                    status: 'undefined'
                },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(reporter.failedCount).toBe(1)
        })
    })

    describe('tags in title', () => {
        let eventBroadcaster
        let reporter
        let send

        beforeAll(() => {
            eventBroadcaster = new EventEmitter()
            reporter = new CucumberReporter(eventBroadcaster, {
                tagsInTitle: true
            }, '0-1', ['/foobar.js'])
            send = reporter.send = jest.fn()
            send.mockImplementation(() => true)
        })

        it('should add tags on handleBeforeFeatureEvent', () => {
            eventBroadcaster.emit('gherkin-document', gherkinDocEvent)

            expect(send).toHaveBeenCalledWith({
                event: 'suite:start',
                type: 'suite',
                title: '@feature-tag1, @feature-tag2: feature',
                uid: 'feature123',
                file: './any.feature',
                cid: '0-1'
            })
        })

        it('should add tags on handleBeforeScenarioEvent', () => {
            eventBroadcaster.emit('gherkin-document', gherkinDocEvent)
            send.mockClear()

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
            eventBroadcaster.emit('test-case-started', {})

            expect(send).toHaveBeenCalledWith({
                event: 'suite:start',
                type: 'suite',
                title: '@scenario-tag1, @scenario-tag2: scenario',
                uid: 'scenario126',
                file: './any.feature',
                cid: '0-1'
            })
        })
    })
})
