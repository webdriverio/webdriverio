import path from 'node:path'
import type { SpyInstance } from 'vitest'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ContentType } from 'allure-js-commons'

import reporter, {
    addEpic, addOwner, addSuite, addSubSuite, addParentSuite, addLink, addTag,
    addFeature, addLabel, addSeverity, addIssue, addTestId, addStory,
    addEnvironment, addDescription, addAttachment, startStep, endStep,
    addStep, addArgument, addAllureId,
} from '../src/index.js'
import { events, stepStatuses } from '../src/constants.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

const fixtures = {
    testStats: {
        uid: '1',
        cid: '0-0',
        title: 'my test',
        duration: 0,
        _duration: 0,
        parent: undefined,
        type: 'scenario',
        start: new Date(),
        complete: vi.fn(),
    }
}

describe('reporter reporter api', () => {
    const processEmit = process.emit.bind(process)
    beforeEach(() => {
        process.emit = vi.fn() as any
    })

    afterEach(() => {
        process.emit = processEmit
    })

    it('exports correct API', () => {
        expect(typeof addEpic).toBe('function')
        expect(typeof addOwner).toBe('function')
        expect(typeof addSuite).toBe('function')
        expect(typeof addSubSuite).toBe('function')
        expect(typeof addParentSuite).toBe('function')
        expect(typeof addLink).toBe('function')
        expect(typeof addAllureId).toBe('function')
        expect(typeof addTag).toBe('function')
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

    it('should pass correct data from addEpic', () => {
        reporter.addEpic('EpicName')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addEpic, { epicName: 'EpicName' })
    })

    it('should pass correct data from addOwner', () => {
        reporter.addOwner('Owner')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addOwner, { owner: 'Owner' })
    })

    it('should pass correct data from addSuite', () => {
        reporter.addSuite('Suite')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addSuite, { suiteName: 'Suite' })
    })

    it('should pass correct data from addSubSuite', () => {
        reporter.addSubSuite('SubSuite')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addSubSuite, { suiteName: 'SubSuite' })
    })

    it('should pass correct data from addParentSuite', () => {
        reporter.addParentSuite('ParentSuite')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addParentSuite, { suiteName: 'ParentSuite' })
    })

    it('should pass correct data from addLink', () => {
        reporter.addLink('http://example.org', 'LinkName', 'LinkType')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addLink, { name: 'LinkName', type: 'LinkType', url: 'http://example.org' })
    })

    it('should pass correct data from addTag', () => {
        reporter.addTag('Tag')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addTag, { tag: 'Tag' })
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

    it('should pass correct data from addAllureId', () => {
        reporter.addAllureId('1')
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith(events.addAllureId, { id: '1' })
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

describe('attachJSON', () => {
    let reporterInstance: reporter
    let writeAttachmentSpy: SpyInstance

    beforeEach(() => {
        reporterInstance = new reporter({})
        writeAttachmentSpy = vi.spyOn(reporterInstance['_allure'], 'writeAttachment')
        reporterInstance.onTestStart({
            uid: '1',
            cid: '0-0',
            title: 'my test',
            duration: 0,
            _duration: 0,
            parent: undefined,
            type: 'scenario',
            start: new Date(),
            complete: vi.fn(),
        })
    })

    it('writes json file for string content', () => {
        const fixture = JSON.stringify({ foo: 'bar' })

        reporterInstance.attachJSON('foobar', fixture)

        expect(writeAttachmentSpy).toBeCalledWith(fixture, ContentType.JSON)
    })

    it('writes txt file for rest content types', () => {
        reporterInstance.attachJSON('foobar', { foo: 'bar' })

        expect(writeAttachmentSpy).toBeCalledWith(JSON.stringify({ foo: 'bar' }, null, 2), ContentType.TEXT)
    })

    it('writes txt file for undefined value', () => {
        reporterInstance.attachJSON('foobar', undefined)

        expect(writeAttachmentSpy).toBeCalledWith('undefined', ContentType.TEXT)
    })
})

describe('attachScreenshot', () => {
    let reporterInstance: reporter
    let writeAttachmentSpy: SpyInstance

    beforeEach(() => {
        reporterInstance = new reporter({})
        writeAttachmentSpy = vi.spyOn(reporterInstance['_allure'], 'writeAttachment')
        reporterInstance.onTestStart({
            uid: '1',
            cid: '0-0',
            title: 'my test',
            duration: 0,
            _duration: 0,
            parent: undefined,
            type: 'scenario',
            start: new Date(),
            complete: vi.fn(),
        })
    })

    it('writes content as png file', () => {
        const fixture = Buffer.from('0x1')

        reporterInstance.attachScreenshot('foobar', fixture)

        expect(writeAttachmentSpy).toBeCalledWith(fixture, ContentType.PNG)
    })
})

describe('attachLogs', () => {
    let reporterInstance: reporter
    let writeAttachmentSpy: SpyInstance

    it('doesn\'t write console logs when they\'re disabled', () => {
        reporterInstance = new reporter({
            addConsoleLogs: false
        })
        writeAttachmentSpy = vi.spyOn(reporterInstance['_allure'], 'writeAttachment')

        reporterInstance.onTestStart(fixtures.testStats)
        process.stdout.write('hello world')
        reporterInstance.attachLogs()

        expect(writeAttachmentSpy).not.toBeCalled()
    })

    it('writes console logs as text file when they\'re enabled', () => {
        reporterInstance = new reporter({
            addConsoleLogs: true
        })
        writeAttachmentSpy = vi.spyOn(reporterInstance['_allure'], 'writeAttachment')

        reporterInstance.onTestStart(fixtures.testStats)
        process.stdout.write('hello world')
        reporterInstance.attachLogs()

        expect(writeAttachmentSpy).toBeCalledWith('.........Console Logs.........\n\nhello world', ContentType.TEXT)
    })
})

beforeEach(() => {
    vi.resetAllMocks()
})
