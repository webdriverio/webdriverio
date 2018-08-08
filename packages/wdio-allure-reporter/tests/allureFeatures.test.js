import AllureReporter from '../src'

describe('reporter runtime implementation', () => {
    it('should correct add story label', () => {
        const reporter = new AllureReporter({stdout: true})
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return {addLabel}
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,

        }

        reporter.addStory({storyName: 'foo'})
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('story', 'foo')
    })

    it('should correct add feature label', () => {
        const reporter = new AllureReporter({stdout: true})
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return {addLabel}
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addFeature({featureName: 'foo'})
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('feature', 'foo')
    })

    it('should correct add severity label', () => {
        const reporter = new AllureReporter({stdout: true})
        const addLabel = jest.fn()
        const mock = jest.fn(() => {
            return {addLabel}
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addSeverity({severity: 'foo'})
        expect(addLabel).toHaveBeenCalledTimes(1)
        expect(addLabel).toHaveBeenCalledWith('severity', 'foo')
    })

    it('should correct add environment', () => {
        const reporter = new AllureReporter({stdout: true})
        const addParameter = jest.fn()
        const mock = jest.fn(() => {
            return {addParameter}
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addEnvironment({name: 'foo', value: 'bar'})
        expect(addParameter).toHaveBeenCalledTimes(1)
        expect(addParameter).toHaveBeenCalledWith('environment-variable', 'foo', 'bar')
    })

    it('should correct add description', () => {
        const reporter = new AllureReporter({stdout: true})
        const setDescription = jest.fn()
        const mock = jest.fn(() => {
            return {setDescription}
        })
        reporter.allure = {
            getCurrentSuite: mock,
            getCurrentTest: mock,
        }

        reporter.addDescription({description: 'foo', type: 'bar'})
        expect(setDescription).toHaveBeenCalledTimes(1)
        expect(setDescription).toHaveBeenCalledWith('foo', 'bar')
    })

    it('should correct add attachment', () => {
        const reporter = new AllureReporter({stdout: true})
        const addAttachment = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
            addAttachment
        }

        reporter.addAttachment({name: 'foo', content: 'bar', type: 'baz'})
        expect(addAttachment).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledWith('foo', Buffer.from('bar'), 'baz')
    })

    it('should correct add "application/json" attachment', () => {
        const reporter = new AllureReporter({stdout: true})
        const dumpJSON = jest.fn()
        reporter.dumpJSON = dumpJSON
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
        }

        reporter.addAttachment({name: 'foo', content: 'bar', type: 'application/json'})
        expect(dumpJSON).toHaveBeenCalledWith('foo', 'bar')
    })

    it('should correct add step with attachment', () => {
        const reporter = new AllureReporter({stdout: true})
        const startStep = jest.fn()
        const endStep = jest.fn()
        const addAttachment = jest.fn()
        reporter.addAttachment = addAttachment
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
            startStep,
            endStep
        }

        const step = {
            'step': {
                'attachment': {'content': 'baz', 'name': 'attachment'},
                'status': 'passed',
                'title': 'foo'
            }
        }
        reporter.addStep(step)

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledTimes(1)

        expect(startStep).toHaveBeenCalledWith(step.step.title)
        expect(addAttachment).toHaveBeenCalledWith(step.step.attachment)
        expect(endStep).toHaveBeenCalledWith(step.step.status)
    })

    it('should correct add step without attachment', () => {
        const reporter = new AllureReporter({stdout: true})
        const startStep = jest.fn()
        const endStep = jest.fn()
        const addAttachment = jest.fn()
        reporter.addAttachment = addAttachment
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => true),
            startStep,
            endStep
        }

        const step = {'step': {'status': 'passed', 'title': 'foo'}}
        reporter.addStep(step)

        expect(startStep).toHaveBeenCalledTimes(1)
        expect(endStep).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledTimes(0)

        expect(startStep).toHaveBeenCalledWith(step.step.title)
        expect(endStep).toHaveBeenCalledWith(step.step.status)
    })
})

describe('reporter runtime implementation', () => {
    it('should do nothing if no tests run', () => {
        const reporter = new AllureReporter({stdout: true})
        expect(reporter.addStory({})).toEqual(false)
        expect(reporter.addFeature({})).toEqual(false)
        expect(reporter.addSeverity({})).toEqual(false)
        expect(reporter.addEnvironment({})).toEqual(false)
        expect(reporter.addDescription({})).toEqual(false)
        expect(reporter.addAttachment({})).toEqual(false)
        expect(reporter.addStep({})).toEqual(false)
    })
})

describe('auxiliary methods', () => {
    it('isScreenshotCommand', () => {
        const reporter = new AllureReporter({stdout: true})
        expect(reporter.isScreenshotCommand({endpoint: '/session/id/screenshot'})).toEqual(true)
        expect(reporter.isScreenshotCommand({endpoint: '/wdu/hub/session/id/screenshot'})).toEqual(true)
        expect(reporter.isScreenshotCommand({endpoint: '/session/id/click'})).toEqual(false)
    })

    it('dumpJSON', () => {
        const reporter = new AllureReporter({stdout: true})
        const addAttachment = jest.fn()
        reporter.allure = {
            addAttachment
        }
        const json = {bar: 'baz'}
        reporter.dumpJSON('foo', json)
        expect(addAttachment).toHaveBeenCalledTimes(1)
        expect(addAttachment).toHaveBeenCalledWith('foo', JSON.stringify(json, null, 2), 'application/json')
    })
})

describe('hooks handling', () => {
    it('should add test on custom hook', () => {
        const reporter = new AllureReporter({stdout: true})
        const startCase = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            startCase
        }
        reporter.onHookStart({title: 'foo'});

        expect(startCase).toHaveBeenCalledTimes(1)
        expect(startCase).toHaveBeenCalledWith('foo')
    })

    it('should not add test if no suite', () => {
        const reporter = new AllureReporter({stdout: true})
        const startCase = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => false),
            startCase
        }
        reporter.onHookStart({title: 'foo'});

        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should not add test if it is ignored hook', () => {
        const reporter = new AllureReporter({stdout: true})
        const startCase = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            startCase
        }
        reporter.onHookStart({title: '"before all" hook'});

        expect(startCase).toHaveBeenCalledTimes(0)
    })

    it('should end test onHookEnd', () => {
        const reporter = new AllureReporter({stdout: true})
        const endCase = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            getCurrentTest: jest.fn(() => {return {steps: [1]}}),
            endCase
        }
        reporter.onHookEnd({title: 'foo'});

        expect(endCase).toHaveBeenCalledTimes(1)
    })

    it('should not end test onHookEnd if no suite', () => {
        const reporter = new AllureReporter({stdout: true})
        const endCase = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => false),
            endCase
        }
        reporter.onHookEnd({title: 'foo'});

        expect(endCase).toHaveBeenCalledTimes(0)
    })

    it('should not end test if no hook ignored', () => {
        const reporter = new AllureReporter({stdout: true})
        const endCase = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => true),
            endCase
        }
        reporter.onHookEnd({title: '"after all" hook'});

        expect(endCase).toHaveBeenCalledTimes(0)
    })
})

describe('nested suite naming', () => {
    it('should not end test if no hook ignored', () => {
        const reporter = new AllureReporter({stdout: true})
        const startSuite = jest.fn()
        reporter.allure = {
            getCurrentSuite: jest.fn(() => {return {name: 'foo'}}),
            startSuite
        }
        reporter.onSuiteStart({title: 'bar'});

        expect(startSuite).toHaveBeenCalledTimes(1)
        expect(startSuite).toHaveBeenCalledWith('foo bar')
    })
})
