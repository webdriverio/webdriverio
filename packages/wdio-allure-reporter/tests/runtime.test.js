import reporter from '../src/'
import * as utils from '../src/utils'
import { events, stepStatuses } from '../src/constants'

jest.mock('../src/utils')

describe('reporter reporter api', () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('should pass correct data from addLabel', () => {
        reporter.addLabel('customLabel', 'Label')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addLabel, { name: 'customLabel', value: 'Label' })
    })

    it('should pass correct data from addStory', () => {
        reporter.addStory('Story')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStory, { storyName: 'Story' })
    })

    it('should pass correct data from addFeature', () => {
        reporter.addFeature('foo')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addFeature, { featureName: 'foo' })
    })

    it('should pass correct data from addSeverity', () => {
        reporter.addSeverity('foo')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addSeverity, { severity: 'foo' })
    })

    it('should pass correct data from addIssue', () => {
        reporter.addIssue('1')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addIssue, { issue: '1' })
    })

    it('should pass correct data from addTestId', () => {
        reporter.addTestId('2')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addTestId, { testId: '2' })
    })

    it('should pass correct data from addEnvironment', () => {
        reporter.addEnvironment('foo', 'bar')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addEnvironment, { name: 'foo', value: 'bar' })
    })

    it('should pass correct data from addDescription', () => {
        reporter.addDescription('foo', 'html')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addDescription, { description: 'foo', descriptionType: 'html' })
    })

    it('should pass correct data from addAttachment', () => {
        reporter.addAttachment('foo', 'bar', 'baz')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addAttachment, { name: 'foo', content: 'bar', type: 'baz' })
    })

    it('should support default type from addAttachment', () => {
        reporter.addAttachment('foo', 'bar')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addAttachment, { name: 'foo', content: 'bar', type: 'text/plain' })
    })

    it('should pass correct data from addStep', () => {
        reporter.addStep('foo', { name: 'bar', content: 'baz', type: 'text/plain' }, stepStatuses.FAILED )
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'bar', 'type': 'text/plain' }, 'status': 'failed', 'title': 'foo' } }
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default attachment name for addStep', () => {
        reporter.addStep('foo', { content: 'baz' }, stepStatuses.FAILED )
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'attachment', 'type': 'text/plain' }, 'status': 'failed', 'title': 'foo' } }
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default attachment type for addStep', () => {
        reporter.addStep('foo', { content: 'baz' })
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'attachment', 'type': 'text/plain' }, 'status': 'passed', 'title': 'foo' } }
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support start step', () => {
        reporter.startStep('foo')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.startStep, 'foo')
    })

    it('should support end step', () => {
        reporter.endStep('passed')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.endStep, 'passed')
    })

    it('should support addStep without attachment', () => {
        reporter.addStep('foo')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'status': 'passed', 'title': 'foo' } }
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default step status for addStep', () => {
        reporter.addStep('foo', { content: 'baz' } )
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'attachment', 'type': 'text/plain' }, 'status': 'passed', 'title': 'foo' } }
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should throw exception for incorrect status for addStep', () => {
        const cb = () => { reporter.addStep('foo', { content: 'baz' }, 'invalid-status')}
        expect(cb).toThrowError('Step status must be passed or failed or broken or canceled or skipped. You tried to set "invalid-status"')
    })

    it('should throw exception for incorrect status for endStep', () => {
        const cb = () => { reporter.endStep('invalid-status') }
        expect(cb).toThrowError('Step status must be passed or failed or broken or canceled or skipped. You tried to set "invalid-status"')
    })

    it('should pass correct data from addArgument', () => {
        reporter.addArgument('os', 'osx')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addArgument, { name: 'os', value: 'osx' })
    })
})

describe('event listeners', () => {
    new reporter({ stdout: true })

    Object.values(events).forEach(eventName => {
        it(`${eventName} should have listener defined`, () => {
            expect(process.listeners(eventName).length).toBeGreaterThanOrEqual(1)
        })
    })
})
