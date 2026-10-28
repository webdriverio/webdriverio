import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { getResults } from './helpers/wdio-allure-helper.js'

// the real base: it hides the protocol events of a user command and keeps the screenshots
vi.mock('@wdio/reporter', () => vi.importActual('@wdio/reporter'))

const CID = '0-0'
const SPEC = path.join(process.cwd(), 'specs/user.spec.js')
const PNG = Buffer.from('png data').toString('base64')

type Result = Record<string, any>
type Play = (emit: (type: string, payload: Record<string, unknown>) => void) => void

async function run(play: Play, options: Record<string, unknown> = {}, isMultiRemote = false) {
    const outputDir = temporaryDirectory()
    const reporter = new AllureReporter({ outputDir, writeStream: { write: () => true }, ...options } as any)
    const emit = (type: string, payload: Record<string, unknown>) => reporter.emit(type, { cid: CID, specs: [SPEC], ...payload })
    emit('runner:start', { capabilities: { browserName: 'chrome' }, config: { framework: 'mocha' }, isMultiRemote, sessionId: 's', instanceOptions: {} })
    emit('suite:start', { uid: 'suite-A', title: 'A', fullTitle: 'A', parentUid: null, file: SPEC })
    const test = { uid: 'test-t1', title: 't1', fullTitle: 'A t1', parent: 'A', parentUid: 'suite-A', file: SPEC }
    emit('test:start', test)
    play(emit)
    emit('test:pass', { ...test, passed: true })
    emit('test:end', test)
    emit('suite:end', { uid: 'suite-A', title: 'A', fullTitle: 'A', parentUid: null, file: SPEC })
    emit('runner:end', { failures: 0, retries: 0 })
    await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
    const { results } = getResults(outputDir)
    const attachment = (a: Result) => fs.readFileSync(path.join(outputDir, a.source), 'utf8')
    return { result: results[0] as Result, attachment }
}

const user = (id: number, command: string, body: unknown[]) => ({ id, command, body, protocol: 'bidi', sessionId: 's' })
const userCommand = (emit: Parameters<Play>[0], id: number, command: string, body: unknown[], result: { value: unknown } | { error: unknown }, inner?: () => void) => {
    emit('client:beforeUserCommand', user(id, command, body))
    inner?.()
    emit('client:afterUserCommand', { ...user(id, command, body), result })
}
const protocol = (emit: Parameters<Play>[0], command: string, result: unknown, parent?: number) => {
    const payload = { command, method: 'POST', endpoint: '/x', body: {}, sessionId: 's', ...(parent === undefined ? {} : { parent }) }
    emit('client:beforeCommand', payload)
    emit('client:afterCommand', { ...payload, result })
}

let writeSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})
afterEach(() => {
    writeSpy.mockRestore()
})

describe('user commands of WebDriver BiDi sessions', () => {
    it('gives one step for a user command, with its result and no step for its protocol commands', async () => {
        const { result, attachment } = await run((emit) => userCommand(emit, 1, 'getText', [], { value: 'hello' }, () => {
            protocol(emit, 'browsingContextLocateNodes', { value: [] }, 1)
            protocol(emit, 'scriptCallFunction', { value: 'hello' }, 1)
        }))

        expect(result.steps.map((s: Result) => [s.name, s.status, s.steps.length])).toEqual([['getText', 'passed', 0]])
        const [step] = result.steps
        expect(step.attachments.map((a: Result) => [a.name, a.type, attachment(a)])).toEqual([['Response', 'application/json', 'hello']])
    })

    it('attaches the short body of a user command as the request', async () => {
        const { result, attachment } = await run((emit) => userCommand(emit, 1, 'setValue', ['**MASKED**'], { value: null }))

        const [step] = result.steps
        expect(step.name).toBe('setValue')
        expect(step.attachments.map((a: Result) => [a.name, a.type, attachment(a)])).toEqual([
            ['Request', 'application/json', JSON.stringify(['**MASKED**'], null, 2)],
        ])
    })

    it('fails the step of a user command that throws, with the name and the message of the error', async () => {
        const { result, attachment } = await run((emit) => userCommand(emit, 1, 'getText', [], { error: new Error('element not found') }))

        const [step] = result.steps
        expect([step.name, step.status, step.statusDetails?.message]).toEqual(['getText', 'failed', 'element not found'])
        expect(step.attachments.map((a: Result) => [a.name, a.type, attachment(a)])).toEqual([['Response', 'text/plain', 'Error: element not found']])
    })

    it.each([
        ['an error from another realm', () => vm.runInNewContext('new TypeError("boom")'), 'TypeError: boom'],
        ['an object with a name and a message', () => ({ name: 'Error', message: 'boom' }), 'Error: boom'],
        ['an object with a message', () => ({ message: 'boom' }), 'boom'],
        ['a string', () => 'boom', 'boom']
    ])('fails the step of a user command that throws %s, with its message', async (_, error, response) => {
        const { result, attachment } = await run((emit) => userCommand(emit, 1, 'getText', [], { error: error() }))

        const [step] = result.steps
        expect([step.status, step.statusDetails?.message]).toEqual(['failed', 'boom'])
        expect(step.attachments.map((a: Result) => [a.name, a.type, attachment(a)])).toEqual([['Response', 'text/plain', response]])
    })

    it('gives no step with disableWebdriverStepsReporting, and keeps the screenshot of the user command', async () => {
        const { result } = await run((emit) => {
            userCommand(emit, 1, 'getText', [], { value: 'hello' })
            userCommand(emit, 2, 'saveScreenshot', ['./a.png'], { value: '<Buffer 8 bytes>' }, () => protocol(emit, 'takeScreenshot', { value: PNG }))
        }, { disableWebdriverStepsReporting: true })

        expect(result.steps).toEqual([])
        expect(result.attachments.map((a: Result) => [a.name, a.type])).toEqual([['Screenshot', 'image/png']])
    })

    it('adds the screenshot of a protocol takeScreenshot inside the step of its user command', async () => {
        const { result } = await run((emit) => userCommand(emit, 1, 'saveScreenshot', ['./a.png'], { value: '<Buffer 8 bytes>' }, () => {
            // a screenshot event has no parent
            protocol(emit, 'takeScreenshot', { value: PNG })
        }))

        const [step] = result.steps
        expect(step.name).toBe('saveScreenshot')
        expect(step.steps.flatMap((s: Result) => s.attachments.map((a: Result) => [s.name, a.name, a.type]))).toEqual([['takeScreenshot', 'Screenshot', 'image/png']])
    })

    it('gives no step in a multi-remote session', async () => {
        const { result } = await run((emit) => userCommand(emit, 1, 'getText', [], { value: 'hello' }), {}, true)

        expect(result.steps).toEqual([])
    })

    it('keeps the historyId, testCaseId and fullName of the test', async () => {
        const ids = (r: Result) => [r.historyId, r.testCaseId, r.fullName]
        const { result: without } = await run(() => {})
        const { result: withCommands } = await run((emit) => userCommand(emit, 1, 'getText', [], { value: 'hello' }))

        expect(withCommands.steps).toHaveLength(1)
        expect(ids(withCommands)).toEqual(ids(without))
        expect(ids(without).every(Boolean)).toBe(true)
    })
})

describe('user commands that overlap or end after their test', () => {
    async function runTests(play: Play) {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir, writeStream: { write: () => true } } as any)
        const emit = (type: string, payload: Record<string, unknown>) => reporter.emit(type, { cid: CID, specs: [SPEC], ...payload })
        emit('runner:start', { capabilities: { browserName: 'chrome' }, config: { framework: 'mocha' }, isMultiRemote: false, sessionId: 's', instanceOptions: {} })
        emit('suite:start', { uid: 'suite-A', title: 'A', fullTitle: 'A', parentUid: null, file: SPEC })
        play(emit)
        emit('suite:end', { uid: 'suite-A', title: 'A', fullTitle: 'A', parentUid: null, file: SPEC })
        emit('runner:end', { failures: 0, retries: 0 })
        await vi.waitFor(() => expect(reporter.isSynchronised).toBe(true))
        const { results } = getResults(outputDir)
        const attachment = (a: Result) => fs.readFileSync(path.join(outputDir, a.source), 'utf8')
        const byName = (name: string) => (results as Result[]).find((r) => r.name === name)!
        return { byName, attachment, reporter }
    }
    const test = (title: string) => ({ uid: `test-${title}`, title, fullTitle: `A ${title}`, parent: 'A', parentUid: 'suite-A', file: SPEC })
    const steps = (r: Result, attachment: (a: Result) => string): unknown[] => r.steps.map((s: Result) => [
        s.name, s.status, s.statusDetails?.message, s.attachments.map((a: Result) => attachment(a)), steps(s, attachment)
    ])

    it('closes each step of overlapping user commands with its own status and response', async () => {
        const { byName, attachment } = await runTests((emit) => {
            emit('test:start', test('t1'))
            // Promise.all([pause(), execute()]): the pause ends first
            emit('client:beforeUserCommand', user(1, 'pause', []))
            emit('client:beforeUserCommand', user(2, 'execute', []))
            emit('client:afterUserCommand', { ...user(1, 'pause', []), result: { value: 'paused' } })
            emit('client:afterUserCommand', { ...user(2, 'execute', []), result: { error: new Error('boom') } })
            emit('test:pass', { ...test('t1'), passed: true })
            emit('test:end', test('t1'))
        })

        expect(steps(byName('t1'), attachment)).toEqual([
            ['pause', 'passed', undefined, ['paused'], [
                ['execute', 'failed', 'boom', ['Error: boom'], []]
            ]]
        ])
    })

    it('does not close a step of the next test with a result that comes after the end of its test', async () => {
        const { byName, attachment } = await runTests((emit) => {
            emit('test:start', test('t1'))
            emit('client:beforeUserCommand', user(3, 'waitForDisplayed', []))
            // the Mocha timeout ends t1 before its waitForDisplayed ends
            emit('test:fail', { ...test('t1'), error: new Error('Timeout of 5000ms exceeded') })
            emit('test:end', test('t1'))
            emit('test:start', test('t2'))
            emit('client:beforeUserCommand', user(6, 'pause', [7000]))
            emit('client:afterUserCommand', { ...user(3, 'waitForDisplayed', []), result: { error: new Error('still not displayed') } })
            emit('client:afterUserCommand', { ...user(6, 'pause', [7000]), result: { value: null } })
            emit('test:pass', { ...test('t2'), passed: true })
            emit('test:end', test('t2'))
        })

        expect(byName('t1').steps.map((s: Result) => s.name)).toEqual(['waitForDisplayed'])
        expect(byName('t1').steps[0].status).not.toBe('passed')
        expect(steps(byName('t2'), attachment)).toEqual([
            ['pause', 'passed', undefined, ['[\n  7000\n]'], []]
        ])
    })

    it('forgets at the end of the runner the steps of user commands that got no result', async () => {
        const { reporter } = await runTests((emit) => {
            emit('test:start', test('t1'))
            emit('client:beforeUserCommand', user(3, 'waitForDisplayed', []))
            emit('test:fail', { ...test('t1'), error: new Error('Timeout of 5000ms exceeded') })
            emit('test:end', test('t1'))
        })

        const state = reporter as unknown as { _userStepOf: Map<number, unknown>, _userSteps: Map<string, unknown> }
        expect([state._userStepOf.size, state._userSteps.size]).toEqual([0, 0])
    })
})
