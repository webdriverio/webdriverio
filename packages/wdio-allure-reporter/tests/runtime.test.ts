import path from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import reporter from '../src/'
import * as utils from '../src/utils'
import { events, stepStatuses } from '../src/constants'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('../src/utils')

describe('reporter reporter api', () => {
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
        // @ts-expect-error invalid param
        const cb = () => { reporter.addStep('foo', { content: 'baz' }, 'invalid-status')}
        expect(cb).toThrowError('Step status must be passed or failed or broken or canceled or skipped. You tried to set "invalid-status"')
    })

    it('should throw exception for incorrect status for endStep', () => {
        // @ts-expect-error invalid param
        const cb = () => { reporter.endStep('invalid-status') }
        expect(cb).toThrowError('Step status must be passed or failed or broken or canceled or skipped. You tried to set "invalid-status"')
    })

    it('should pass correct data from addArgument', () => {
        reporter.addArgument('os', 'osx')
        expect(utils.tellReporter).toHaveBeenCalledTimes(1)
        expect(utils.tellReporter).toHaveBeenCalledWith(events.addArgument, { name: 'os', value: 'osx' })
    })

    describe('addAttachment', () => {
        const scenarios = [{
            title: 'no type, string',
            name: 'foo',
            content: 'bar',
            actualType: undefined,
            type: 'text/plain'
        }, {
            title: 'no type, image',
            name: 'foo',
            content: Buffer.from('QQ==', 'base64'),
            actualType: undefined,
            type: 'image/png'
        }, {
            title: 'no type, json',
            name: 'foo',
            content: { foo: 'bar' },
            actualType: undefined,
            type: 'application/json'
        }, {
            title: 'user defined type',
            name: 'foo',
            content: 'bar',
            actualType: 'text/yaml',
            type: 'text/yaml'
        }]

        scenarios.forEach(({ title, actualType, content, name, type }) => {
            it(title, () => {
                reporter.addAttachment(name, content, actualType!)
                expect(utils.tellReporter).toBeCalledWith(events.addAttachment, { name, content, type })
            })
        })
    })
})

describe('event listeners', () => {
    new reporter({})

    Object.values(events).forEach((eventName: any) => {
        it(`${eventName} should have listener defined`, () => {
            expect(process.listeners(eventName).length).toBeGreaterThanOrEqual(1)
        })
    })
})

describe('dumpJSON', () => {
    const reporterInstance = new reporter({})
    reporterInstance['_allure'].addAttachment = vi.fn()

    it('valid json', () => {
        reporterInstance.dumpJSON('foobar', { foo: 'bar' })
        expect(reporterInstance['_allure'].addAttachment).toBeCalledWith('foobar', '{\n  "foo": "bar"\n}', 'application/json')
    })

    it('undefined value', () => {
        // @ts-expect-error type test
        reporterInstance.dumpJSON('barfoo', undefined)
        expect(reporterInstance['_allure'].addAttachment).toBeCalledWith('barfoo', 'undefined', 'text/plain')
    })
})

beforeEach(() => {
    vi.resetAllMocks()
})
