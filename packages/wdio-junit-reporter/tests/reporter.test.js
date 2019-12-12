import fs from 'fs'
import path from 'path'
import WDIOJunitReporter from '../src'

import runnerLog from './__fixtures__/runner.json'
import suitesLog from './__fixtures__/suites.json'
import suitesHooksLog from './__fixtures__/suites-hooks.json'
import suitesMultipleLog from './__fixtures__/suites-multiple.json'

const testLog = fs.readFileSync(path.join(__dirname, '__fixtures__', 'wdio-0-0-junit-reporter.txt'))
const testHooksLog = fs.readFileSync(path.join(__dirname, '__fixtures__', 'wdio-0-0-junit-reporter-hooks.txt'))
const testMultipleLog = fs.readFileSync(path.join(__dirname, '__fixtures__', 'wdio-0-0-junit-reporter-multiple-suites.txt'))
const testErrorOptionsSetLog = fs.readFileSync(path.join(__dirname, '__fixtures__', 'wdio-0-0-junit-reporter-error-options-used.txt'))

describe('wdio-junit-reporter', () => {
    let reporter

    beforeEach(() => {
        reporter = new WDIOJunitReporter({ stdout: true })
    })

    it('should write to output stream on runnerEnd', () => {
        reporter.prepareXml = jest.fn().mockReturnValue('foobar')
        reporter.write = jest.fn()
        reporter.onRunnerEnd()
        expect(reporter.write.mock.calls[0][0]).toBe('foobar')
    })

    it('should prepare name', () => {
        expect(reporter.prepareName()).toBe('Skipped_test')
        expect(reporter.prepareName('Chrome something_odd.foobar')).toBe('Chrome_something_odd_foobar')
    })

    it('has a suiteNameFormat option for setting names manually', () => {
        reporter = new WDIOJunitReporter({ stdout: true, suiteNameFormat: /foobar/ })
        expect(reporter.prepareName('Skipped_foobar_test')).toBe('Skipped___test')
    })

    it('can format output', () => {
        expect(reporter.format()).toBe(undefined)
        expect(reporter.format(1)).toBe('1')
        expect(reporter.format({ a: 'foo', b: 'bar' })).toBe(
            '{"a":"foo","b":"bar"}')
        expect(reporter.format({ a: 'foobar'.repeat(100) })).toBe(
            '{"a":"[base64] 600 bytes"}')
        expect(reporter.format({ a: '@'.repeat(10000) })).toBe(
            `{"a":"${'@'.repeat(200)} ... (9800 more bytes)"}`)
        expect(reporter.format({ a: '@'.repeat(100).split('') })).toBe(
            '{"a":["@","@","@","@","@","@","@","@","@","@","(90 more items)"]}')
        expect(reporter.format([...Array(11)].map((item, i) => i).reduce((a, b) => {
            a['entry' + b] = 'foobar'
            return a
        }, {}))).toBe('{"entry0":"foobar","entry1":"foobar","entry2":"foobar","entry3":"foobar","entry4":"foobar","entry5":"foobar","entry6":"foobar","entry7":"foobar","entry8":"foobar","entry9":"foobar","_":"1 more keys: [\\"entry10\\"]"}')
    })

    it('can translate stdout', () => {
        const output = [{
            type: 'command',
            method: 'POST',
            sessionId: 'foobar',
            endpoint: '/wd/hub/sessionId/click',
            body: { elementId: 'foobar' }
        }, {
            type: 'result',
            body: { value: 'foobar' }
        }]
        expect(reporter.getStandardOutput({ output })).toContain('COMMAND: POST /wd/hub/sessionId/click - {"elementId":"foobar"}')
        expect(reporter.getStandardOutput({ output })).toContain('RESULT: {"value":"foobar"}')
    })

    it('generates xml output', () => {
        reporter.suites = suitesLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.prepareXml(runnerLog).replace(/\s/g, '')).toBe(testLog.toString().replace(/\s/g, ''))
    })

    it('generates xml output if before all hook failed', () => {
        reporter.suites = suitesHooksLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.prepareXml(runnerLog).replace(/\s/g, '')).toBe(testHooksLog.toString().replace(/\s/g, ''))
    })

    it('generates xml output for multiple describe blocks', () => {
        reporter.suites = suitesMultipleLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.prepareXml(runnerLog).replace(/\s/g, '')).toBe(testMultipleLog.toString().replace(/\s/g, ''))
    })

    it('generates xml output correctly when error options are set', () => {
        const errorOptions = {
            error: 'message',
            failure: 'message',
            stacktrace: 'stack'
        }

        reporter = new WDIOJunitReporter({ stdout: true, errorOptions })
        reporter.suites = suitesLog

        // verifies the content of the report but omits format by stripping all whitespace and new lines
        expect(reporter.prepareXml(runnerLog).replace(/\s/g, '')).toBe(testErrorOptionsSetLog.toString().replace(/\s/g, ''))
    })
})
