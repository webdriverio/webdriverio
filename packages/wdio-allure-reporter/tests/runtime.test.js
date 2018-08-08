import * as runtime from '../src/runtime'
import * as utils from '../src/utils'
import {events, stepStatuses} from '../src/constants'

jest.mock('../src/utils')

describe('reporter runtime api', () => {

    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('should pass correct data from addStory', () => {
        runtime.addStory('Story')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStory, {storyName: 'Story'})
    })

    it('should pass correct data from addStory', () => {
        runtime.addFeature('foo')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addFeature, {featureName: 'foo'})
    })

    it('should pass correct data from addSeverity', () => {
        runtime.addSeverity('foo')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addSeverity, {severity: 'foo'})
    })

    it('should pass correct data from addEnvironment', () => {
        runtime.addEnvironment('foo', 'bar')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addEnvironment, {name: 'foo', value: 'bar'})
    })

    it('should pass correct data from addDescription', () => {
        runtime.addDescription('foo', 'html')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addDescription, {description: 'foo', type: 'html'})
    })

    it('should pass correct data from addAttachment', () => {
        runtime.addAttachment('foo', 'bar', 'baz')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addAttachment, {name: 'foo', content: 'bar', type: 'baz'})
    })

    it('should support default type from addAttachment', () => {
        runtime.addAttachment('foo', 'bar')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addAttachment, {name: 'foo', content: 'bar', type: 'text/plain'})
    })

    it('should pass correct data from addStep', () => {
        runtime.addStep('foo', {name: 'bar', content: 'baz'}, stepStatuses.FAILED )
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = {'step': {'attachment': {'content': 'baz', 'name': 'bar'}, 'status': 'failed', 'title': 'foo'}}
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default attachment name for addStep', () => {
        runtime.addStep('foo', {content: 'baz'}, stepStatuses.FAILED )
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = {'step': {'attachment': {'content': 'baz', 'name': 'attachment'}, 'status': 'failed', 'title': 'foo'}}
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default step status for addStep', () => {
        runtime.addStep('foo', {content: 'baz'} )
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        const step = {'step': {'attachment': {'content': 'baz', 'name': 'attachment'}, 'status': 'passed', 'title': 'foo'}}
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should throw exception for incorrect status for addStep', () => {
        const cb = () => { runtime.addStep('foo', {content: 'baz'}, 'canceled')}
        expect(cb).toThrowError('Step status must be passed or failed or broken. You tried to set "canceled"')
    })

})
