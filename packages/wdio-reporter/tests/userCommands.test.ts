import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import tmp from 'tmp'

import WDIOReporter, { userCommandError } from '../src/index.js'
import type { AfterUserCommandArgs, BeforeUserCommandArgs } from '../src/index.js'

const runnerSpecs = ['/path/to/fileA.js']
const base = { cid: '0-0', specs: [], parent: 'p', pending: false, fullTitle: 'p t' }

class UserCommandReporter extends WDIOReporter {
    calls: string[] = []
    commands: string[] = []
    onBeforeUserCommand (payload: BeforeUserCommandArgs) {
        this.calls.push(`before ${payload.command} -> ${this.getContextUnit()?.test?.title}`)
    }
    onAfterUserCommand (payload: AfterUserCommandArgs) {
        this.calls.push(`after ${payload.command} -> ${this.getContextUnit()?.test?.title}`)
    }
    onBeforeCommand (payload: { command?: string }) {
        this.commands.push(`before ${payload.command}`)
    }
    onAfterCommand (payload: { command?: string }) {
        this.commands.push(`after ${payload.command}`)
    }
}

class CommandReporter extends WDIOReporter {
    commands: string[] = []
    onBeforeCommand (payload: { command?: string }) {
        this.commands.push(`before ${payload.command}`)
    }
}

function start (reporter: WDIOReporter) {
    reporter.emit('runner:start', { cid: '0-0', capabilities: {}, specs: runnerSpecs } as any)
    reporter.emit('suite:start', { uid: 'suite-id', title: 'suite' })
    reporter.emit('test:start', { ...base, uid: 'A', title: 'A', contextId: 'ctx-a' })
    reporter.emit('test:start', { ...base, uid: 'B', title: 'B', contextId: 'ctx-b' })
}

const userCommand = { id: 1, command: 'getTitle', body: [], protocol: 'bidi', sessionId: 's' }
const userResult = { ...userCommand, result: { value: 'title' } }
const protocolCommand = { command: 'getTitle', method: 'GET', endpoint: '/session/:sessionId/title', body: {}, sessionId: 's', parent: 1 }

describe('user command events', () => {
    it('calls the user command methods in the unit of the context', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        start(reporter)

        reporter.emit('client:beforeUserCommand', { ...userCommand, contextId: 'ctx-b' })
        reporter.emit('client:afterUserCommand', { ...userResult, contextId: 'ctx-b' })

        expect(reporter.calls).toEqual(['before getTitle -> B', 'after getTitle -> B'])
    })

    it('adds the user commands to the output of the owner', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        start(reporter)

        reporter.emit('client:beforeUserCommand', { ...userCommand, contextId: 'ctx-a' })
        reporter.emit('client:afterUserCommand', { ...userResult, contextId: 'ctx-a' })

        expect(reporter.tests.A.output).toEqual([
            { ...userCommand, contextId: 'ctx-a', type: 'userCommand' },
            { ...userResult, contextId: 'ctx-a', type: 'userResult' }
        ])
        expect(reporter.tests.B.output).toEqual([])
    })

    it('hides the protocol events of a user command, except screenshots', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        start(reporter)
        const screenshot = { ...protocolCommand, command: 'takeScreenshot', endpoint: '/session/:sessionId/screenshot', result: { value: 'abc' }, contextId: 'ctx-a' }
        const elementScreenshot = { ...screenshot, command: 'takeElementScreenshot' }

        reporter.emit('client:beforeCommand', { ...protocolCommand, contextId: 'ctx-a' })
        reporter.emit('client:afterCommand', { ...protocolCommand, result: { value: 'title' }, contextId: 'ctx-a' })
        reporter.emit('client:afterCommand', screenshot)
        reporter.emit('client:afterCommand', elementScreenshot)
        // a command with no parent is no part of a user command
        reporter.emit('client:beforeCommand', { ...protocolCommand, parent: undefined, command: 'getUrl', contextId: 'ctx-a' })

        expect(reporter.commands).toEqual(['after takeScreenshot', 'after takeElementScreenshot', 'before getUrl'])
        expect(reporter.tests.A.output.map((entry: any) => [entry.command, entry.type])).toEqual([
            ['takeScreenshot', 'result'],
            ['takeElementScreenshot', 'result'],
            ['getUrl', 'command']
        ])
    })

    it('shows a custom command once: as a user command, not with its old events', () => {
        const optIn = new UserCommandReporter({ logFile: tmp.fileSync().name })
        const optOut = new CommandReporter({ logFile: tmp.fileSync().name })
        const myCmd = { id: 2, command: 'myCmd', body: ['**MASKED**', { mask: true }], protocol: 'bidi', sessionId: 's', contextId: 'ctx-a' }
        // the events in the order that a custom command sends them in a WebDriver BiDi session
        const events: [string, Record<string, unknown>][] = [
            ['client:beforeUserCommand', myCmd],
            ['client:beforeCommand', { command: 'myCmd', body: ['secret', { mask: true }], parent: 2, sessionId: 's', contextId: 'ctx-a' }],
            ['client:afterCommand', { command: 'myCmd', result: { value: 'done' }, parent: 2, sessionId: 's', contextId: 'ctx-a' }],
            ['client:afterUserCommand', { ...myCmd, result: { value: 'done' } }]
        ]
        for (const reporter of [optIn, optOut]) {
            start(reporter)
            for (const [event, payload] of events) {
                reporter.emit(event, { ...payload })
            }
        }

        expect(optIn.tests.A.output.map((entry: any) => [entry.command, entry.type, entry.body])).toEqual([
            ['myCmd', 'userCommand', ['**MASKED**', { mask: true }]],
            ['myCmd', 'userResult', ['**MASKED**', { mask: true }]]
        ])
        expect(optIn.commands).toEqual([])
        expect(optOut.tests.A.output.map((entry: any) => [entry.command, entry.type])).toEqual([['myCmd', 'command'], ['myCmd', 'result']])
        expect(optOut.commands).toEqual(['before myCmd'])
    })

    it('shortens the script of execute in the output', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        start(reporter)
        const execute = { ...userCommand, command: 'execute', body: ['return document.title', 1], contextId: 'ctx-a' }

        reporter.emit('client:beforeUserCommand', execute)
        reporter.emit('client:afterUserCommand', { ...execute, result: { value: 'title' } })

        expect(reporter.tests.A.output.map((entry: any) => entry.body)).toEqual([
            ['<script> [21 bytes]', 1],
            ['<script> [21 bytes]', 1]
        ])
        // the payload that other reporters get stays as it was sent
        expect(execute.body).toEqual(['return document.title', 1])
    })

    it('keeps the empty body of execute in the output', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        start(reporter)
        const execute = { ...userCommand, command: 'execute', body: [], contextId: 'ctx-a' }

        reporter.emit('client:beforeUserCommand', execute)
        reporter.emit('client:afterUserCommand', { ...execute, result: { error: new Error('no script') } })

        expect(reporter.tests.A.output.map((entry: any) => entry.body)).toEqual([[], []])
    })

    it('keeps the function label of execute in the output', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        start(reporter)
        const execute = { ...userCommand, command: 'executeAsync', body: ['[Function getTitle]', 1], contextId: 'ctx-a' }

        reporter.emit('client:beforeUserCommand', execute)
        reporter.emit('client:afterUserCommand', { ...execute, result: { value: 'title' } })

        expect(reporter.tests.A.output.map((entry: any) => entry.body)).toEqual([
            ['[Function getTitle]', 1],
            ['[Function getTitle]', 1]
        ])
    })

    it('puts a result that comes after the end of its test in that test, not in the next test', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        const seq = { ...base, contextId: undefined }
        reporter.emit('runner:start', { cid: '0-0', capabilities: {}, specs: runnerSpecs } as any)
        reporter.emit('suite:start', { uid: 'suite-id', title: 'suite' })
        reporter.emit('test:start', { ...seq, uid: 't1', title: 't1' })
        const wait = { ...userCommand, id: 3, command: 'waitForDisplayed' }
        reporter.emit('client:beforeUserCommand', wait)
        // the Mocha timeout ends t1 before its waitForDisplayed ends
        reporter.emit('test:fail', { ...seq, uid: 't1', title: 't1', error: { message: 'Timeout of 5000ms exceeded' } })
        reporter.emit('test:end', { ...seq, uid: 't1', title: 't1' })
        reporter.emit('test:start', { ...seq, uid: 't2', title: 't2' })
        const pause = { ...userCommand, id: 6, command: 'pause', body: [7000] }
        reporter.emit('client:beforeUserCommand', pause)
        const error = new Error('element ("#missing") still not displayed after 10000ms')
        reporter.emit('client:afterUserCommand', { ...wait, result: { error } })
        reporter.emit('client:afterUserCommand', { ...pause, result: { value: undefined } })

        expect(reporter.tests.t1.output.map((entry: any) => [entry.type, entry.command])).toEqual([
            ['userCommand', 'waitForDisplayed'],
            ['userResult', 'waitForDisplayed']
        ])
        expect(reporter.tests.t2.output.map((entry: any) => [entry.type, entry.command])).toEqual([
            ['userCommand', 'pause'],
            ['userResult', 'pause']
        ])
        // the reporter gets the late result in the unit of its own test
        expect(reporter.calls).toEqual([
            'before waitForDisplayed -> t1',
            'before pause -> t2',
            'after waitForDisplayed -> t1',
            'after pause -> t2'
        ])
    })

    it('puts the result of a parallel user command in its owner, also after the next test of its context started', () => {
        const reporter = new UserCommandReporter({ logFile: tmp.fileSync().name })
        start(reporter)
        reporter.emit('client:beforeUserCommand', { ...userCommand, id: 4, contextId: 'ctx-a' })
        reporter.emit('test:end', { ...base, uid: 'A', title: 'A', contextId: 'ctx-a' })
        reporter.emit('test:start', { ...base, uid: 'A2', title: 'A2', contextId: 'ctx-a' })
        reporter.emit('client:afterUserCommand', { ...userResult, id: 4, contextId: 'ctx-a' })

        expect(reporter.tests.A.output.map((entry: any) => entry.type)).toEqual(['userCommand', 'userResult'])
        expect(reporter.tests.A2.output).toEqual([])
    })

    it('changes nothing for a reporter that does not override the user command methods', () => {
        const reporter = new CommandReporter({ logFile: tmp.fileSync().name })
        const onBeforeUserCommand = vi.spyOn(WDIOReporter.prototype, 'onBeforeUserCommand')
        const onAfterUserCommand = vi.spyOn(WDIOReporter.prototype, 'onAfterUserCommand')
        start(reporter)

        reporter.emit('client:beforeUserCommand', { ...userCommand, contextId: 'ctx-a' })
        reporter.emit('client:afterUserCommand', { ...userResult, contextId: 'ctx-a' })
        reporter.emit('client:beforeCommand', { ...protocolCommand, contextId: 'ctx-a' })

        expect(onBeforeUserCommand).not.toBeCalled()
        expect(onAfterUserCommand).not.toBeCalled()
        expect(reporter.commands).toEqual(['before getTitle'])
        expect(reporter.tests.A.output.map((entry: any) => [entry.command, entry.type])).toEqual([['getTitle', 'command']])
        onBeforeUserCommand.mockRestore()
        onAfterUserCommand.mockRestore()
    })
})

describe('userCommandError', () => {
    it('keeps the name and the message of an error, also from another realm', () => {
        expect(userCommandError(new Error('boom'))).toEqual({ name: 'Error', message: 'boom' })
        expect(userCommandError(vm.runInNewContext('new TypeError("boom")'))).toEqual({ name: 'TypeError', message: 'boom' })
    })

    it('keeps a value with no message as it is', () => {
        expect(userCommandError('boom')).toBe('boom')
        expect(userCommandError(undefined)).toBe(undefined)
        expect(userCommandError({ code: 1 })).toEqual({ code: 1 })
    })
})
