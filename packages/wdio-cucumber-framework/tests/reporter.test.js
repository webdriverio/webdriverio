import CucumberReporter from '../src/reporter'
import { EventEmitter } from 'events'

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

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
        const cid = '0-1'
        const specs = ['/foobar.js']
        let eventBroadcaster

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            new CucumberReporter(eventBroadcaster, { failAmbiguousDefinitions: true }, cid, specs, wdioReporter)
        })

        it('should send proper data on `gherkin-document` event', () => {
            wdioReporter.emit.mockClear()
            loadGherkin(eventBroadcaster)

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                cid,
                description: gherkinDocEvent.document.feature.description,
                file: gherkinDocEvent.uri,
                keyword: gherkinDocEvent.document.feature.keyword,
                specs,
                tags: [...gherkinDocEvent.document.feature.tags],
                title: gherkinDocEvent.document.feature.name,
                // type: 'suite',
                uid: 'feature123',
            }))
        })

        it('should not send any data on `pickle-accepted` event', () => {
            loadGherkin(eventBroadcaster)
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
                // type: 'suite',
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
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('test-step-started', {
                index: 1,
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(wdioReporter.emit).toHaveBeenCalledWith('test:start', expect.objectContaining({
                // type: 'test',
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
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('test-step-finished', {
                index: 1,
                result: { duration: 10, status: 'passed' },
                testCase: {
                    sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
                }
            })

            expect(wdioReporter.emit).toHaveBeenCalledWith('test:pass', expect.objectContaining({
                // type: 'test',
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
            wdioReporter.emit.mockClear()

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

            expect(wdioReporter.emit).toHaveBeenCalledWith('test:fail', expect.objectContaining({
                // type: 'test',
                title: 'step-title-failing',
                cid: '0-1',
                parent: 'scenario126',
                uid: 'step-title-failing128',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ],
                error: expect.objectContaining({
                    message: 'exception-error'
                })
            }))
        })

        it('should send proper data on failing `test-step-finished` event with string error', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()

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

            expect(wdioReporter.emit).toHaveBeenCalledWith('test:fail', expect.objectContaining({
                // type: 'test',
                title: 'step-title-failing',
                cid: '0-1',
                parent: 'scenario126',
                uid: 'step-title-failing128',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ],
                error: expect.objectContaining({
                    message: 'string-error'
                })
            }))
        })

        it('should send proper data on ambiguous `test-step-finished` event', () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()

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

            expect(wdioReporter.emit).toHaveBeenCalledWith('test:fail', expect.objectContaining({
                // type: 'test',
                title: 'step-title-failing',
                cid: '0-1',
                parent: 'scenario126',
                uid: 'step-title-failing128',
                file: './any.feature',
                tags: [
                    { name: '@scenario-tag1' },
                    { name: '@scenario-tag2' }
                ],
                error: expect.objectContaining({
                    message: 'cucumber-ambiguous-error-message'
                })
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
                sourceLocation: { uri: gherkinDocEvent.uri, line: 126 }
            })

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:end', expect.objectContaining({
                // type: 'suite',
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
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('test-run-finished', {
                result: { duration: 0, success: true }
            })

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:end', expect.objectContaining({
                // type: 'suite',
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

    describe('provides a fail counter', () => {
        let eventBroadcaster
        let reporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            reporter = new CucumberReporter(eventBroadcaster, { failAmbiguousDefinitions: true, ignoreUndefinedDefinitions: false }, '0-1', ['/foobar.js'], wdioReporter)
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

        beforeAll(() => {
            eventBroadcaster = new EventEmitter()
            new CucumberReporter(eventBroadcaster, {
                tagsInTitle: true
            }, '0-1', ['/foobar.js'], wdioReporter)
        })

        it('should add tags on handleBeforeFeatureEvent', () => {
            eventBroadcaster.emit('gherkin-document', gherkinDocEvent)

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                // type: 'suite',
                title: '@feature-tag1, @feature-tag2: feature',
                uid: 'feature123',
                file: './any.feature',
                cid: '0-1'
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
            eventBroadcaster.emit('test-case-started', {})

            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                // type: 'suite',
                title: '@scenario-tag1, @scenario-tag2: scenario',
                uid: 'scenario126',
                file: './any.feature',
                cid: '0-1'
            }))
        })
    })

    it('getUriOf', () => {
        const eventBroadcaster = new EventEmitter()
        const reporter = new CucumberReporter(eventBroadcaster, {})
        expect(reporter.getUriOf()).toBe(undefined)
        expect(reporter.getUriOf({})).toBe(undefined)
        expect(reporter.getUriOf({ uri: __filename }))
            .toBe('/packages/wdio-cucumber-framework/tests/reporter.test.js')
    })

    it('getUniqueIdentifier', () => {
        const eventBroadcaster = new EventEmitter()
        const reporter = new CucumberReporter(eventBroadcaster, {})
        expect(reporter.getUniqueIdentifier({
            type: 'Hook',
            location: {
                uri: __filename,
                line: 54
            }
        })).toBe('reporter.test.js54')
        expect(reporter.getUniqueIdentifier({
            type: 'ScenarioOutline',
            name: 'foobar'
        }, {
            line: 123
        })).toBe('foobar123')
        expect(reporter.getUniqueIdentifier({
            type: 'ScenarioOutline',
            name: '<someval> here',
            examples: [{
                tableHeader: {
                    cells: [
                        { value: 'valsome' },
                        { value: 'someval' }
                    ]
                },
                tableBody: [{
                    location: { line: 54 }
                }, {
                    location: { line: 123 },
                    cells: [{}, { value: 'realval' }]
                }]
            }]
        }, {
            line: 123
        })).toBe('realval here123')
    })

    it('formatMessage', () => {
        const eventBroadcaster = new EventEmitter()
        const reporter = new CucumberReporter(eventBroadcaster, {})
        expect(reporter.formatMessage({
            type: 'foobar',
            payload: { ctx: { currentTest: { title: 'barfoo' } } }
        })).toMatchSnapshot()
        expect(reporter.formatMessage({
            type: 'afterTest',
            payload: { state: 'passed' }
        })).toMatchSnapshot()

        expect(reporter.formatMessage({
            type: 'foobar',
            payload: {
                title: '"before all" hook',
                error: new Error('boom'),
                state: 'passed'
            }
        }).type).toBe('hook:end')
    })

    afterEach(() => {
        wdioReporter.on.mockClear()
        wdioReporter.write.mockClear()
        wdioReporter.emit.mockClear()
    })
})
