import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import reporter, {
    addFeature, addLabel, addSeverity, addIssue, addTestId, addStory,
    addEnvironment, addDescription, addAttachment, startStep, endStep,
    addStep, addArgument
} from '../src/index.js'
import { events, stepStatuses } from '../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('../src/utils')

describe('reporter reporter api', () => {
    const processEmit = process.emit.bind(process)
    beforeEach(() => {
        process.emit = vi.fn() as any
    })

    afterEach(() => {
        process.emit = processEmit
    })

    it('exports correct API', () => {
        expect(typeof addFeature).toBe('function')
        expect(typeof addLabel).toBe('function')
        expect(typeof addSeverity).toBe('function')
        expect(typeof addIssue).toBe('function')
        expect(typeof addTestId).toBe('function')
        expect(typeof addStory).toBe('function')
        expect(typeof addEnvironment).toBe('function')
        expect(typeof addDescription).toBe('function')
        expect(typeof addAttachment).toBe('function')
        expect(typeof startStep).toBe('function')
        expect(typeof endStep).toBe('function')
        expect(typeof addStep).toBe('function')
        expect(typeof addArgument).toBe('function')
    })

    it('should pass correct data from addLabel', () => {
        reporter.addLabel('customLabel', 'Label')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addLabel, { name: 'customLabel', value: 'Label' })
    })

    it('should pass correct data from addStory', () => {
        reporter.addStory('Story')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addStory, { storyName: 'Story' })
    })

    it('should pass correct data from addFeature', () => {
        reporter.addFeature('foo')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addFeature, { featureName: 'foo' })
    })

    it('should pass correct data from addSeverity', () => {
        reporter.addSeverity('foo')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addSeverity, { severity: 'foo' })
    })

    it('should pass correct data from addIssue', () => {
        reporter.addIssue('1')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addIssue, { issue: '1' })
    })

    it('should pass correct data from addTestId', () => {
        reporter.addTestId('2')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addTestId, { testId: '2' })
    })

    it('should pass correct data from addEnvironment', () => {
        reporter.addEnvironment('foo', 'bar')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addEnvironment, { name: 'foo', value: 'bar' })
    })

    it('should pass correct data from addDescription', () => {
        reporter.addDescription('foo', 'html')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addDescription, { description: 'foo', descriptionType: 'html' })
    })

    it('should pass correct data from addStep', () => {
        reporter.addStep('foo', { name: 'bar', content: 'baz', type: 'text/plain' }, stepStatuses.FAILED )
        expect(process.emit).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'bar', 'type': 'text/plain' }, 'status': 'failed', 'title': 'foo' } }
        expect(process.emit).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default attachment name for addStep', () => {
        reporter.addStep('foo', { content: 'baz' }, stepStatuses.FAILED )
        expect(process.emit).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'attachment', 'type': 'text/plain' }, 'status': 'failed', 'title': 'foo' } }
        expect(process.emit).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default attachment type for addStep', () => {
        reporter.addStep('foo', { content: 'baz' })
        expect(process.emit).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'attachment', 'type': 'text/plain' }, 'status': 'passed', 'title': 'foo' } }
        expect(process.emit).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support start step', () => {
        reporter.startStep('foo')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.startStep, 'foo')
    })

    it('should support end step', () => {
        reporter.endStep('passed')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.endStep, 'passed')
    })

    it('should support addStep without attachment', () => {
        reporter.addStep('foo')
        expect(process.emit).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'status': 'passed', 'title': 'foo' } }
        expect(process.emit).toHaveBeenCalledWith(events.addStep, step)
    })

    it('should support default step status for addStep', () => {
        reporter.addStep('foo', { content: 'baz' } )
        expect(process.emit).toHaveBeenCalledTimes(1)
        const step = { 'step': { 'attachment': { 'content': 'baz', 'name': 'attachment', 'type': 'text/plain' }, 'status': 'passed', 'title': 'foo' } }
        expect(process.emit).toHaveBeenCalledWith(events.addStep, step)
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
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addArgument, { name: 'os', value: 'osx' })
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
                expect(process.emit).toBeCalledWith(events.addAttachment, { name, content, type })
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
