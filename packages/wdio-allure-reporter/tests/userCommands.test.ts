import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { getResults } from './helpers/wdio-allure-helper.js'

// the real base: it keeps the protocol events of a user command, with their parent, and the screenshots
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
const protocol = (emit: Parameters<Play>[0], command: string, result: unknown, parent?: number, request: Record<string, unknown> = {}) => {
    const payload = { command, method: 'POST', endpoint: '/x', body: {}, sessionId: 's', ...request, ...(parent === undefined ? {} : { parent }) }
    emit('client:beforeCommand', payload)
    emit('client:afterCommand', { ...payload, result })
}
const getElementText = { method: 'GET', endpoint: '/session/:sessionId/element/f.1.d.2.e.3/text' }
const stepTree = (s: Result, attachment: (a: Result) => string): unknown => ({
    name: s.name,
    parameters: s.parameters.map((p: Result) => `${p.name}=${p.value}`),
    attachments: s.attachments.map((a: Result) => `${a.name}=${attachment(a).replace(/\s+/g, '')}`),
    steps: s.steps.map((c: Result) => stepTree(c, attachment))
})

let writeSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})
afterEach(() => {
    writeSpy.mockRestore()
})

describe('user commands of WebDriver BiDi sessions', () => {
    it('gives a user command step with its arguments and result, and its protocol commands as child steps', async () => {
        const { result, attachment } = await run((emit) => userCommand(emit, 1, 'getText', [], { value: 'hello' }, () => {
            protocol(emit, 'getElementText', { value: 'hello' }, 1, getElementText)
        }))

        expect(result.steps.map((s: Result) => stepTree(s, attachment))).toEqual([{
            name: 'getText() → "hello"',
            parameters: [],
            attachments: ['Response=hello'],
            steps: [{
                name: 'getElementText → "hello"',
                // the compact request, and the resolved request with the session id
                parameters: ['request=GET /element/:elementId/text'],
                attachments: ['Request={"method":"GET","path":"/session/s/element/f.1.d.2.e.3/text"}', 'Response=hello'],
                steps: []
            }]
        }])
    })

    it('puts the arguments of a user command in its name, with no Request attachment', async () => {
        const { result } = await run((emit) => userCommand(emit, 1, 'setValue', ['**MASKED**', { mask: true }], { value: null }))

        const [step] = result.steps
        expect(step.name).toBe('setValue("**MASKED**", {"mask":true})')
        expect(step.attachments).toEqual([])
    })

    it('attaches the arguments of a user command when its name cuts them', async () => {
        const long = 'a'.repeat(200)
        const { result, attachment } = await run((emit) => userCommand(emit, 1, 'url', [long], { value: 'WebdriverIO.BrowsingContext' }))

        const [step] = result.steps
        expect(step.name.endsWith('…)')).toBe(true)
        expect(step.attachments.map((a: Result) => [a.name, JSON.parse(attachment(a))])).toEqual([['Request', [long]]])
    })

    it('gives no Response for a result with no data and no result in the name of a handle command', async () => {
        const { result, attachment } = await run((emit) => {
            userCommand(emit, 1, 'url', ['https://webdriver.io'], { value: 'WebdriverIO.BrowsingContext' })
            userCommand(emit, 2, 'newWindow', ['https://webdriver.io'], { value: 'WebdriverIO.BrowsingContext' }, () => {
                protocol(emit, 'getWindowHandles', { value: ['4F2B'] }, 2, { method: 'GET', endpoint: '/session/:sessionId/window/handles' })
            })
            userCommand(emit, 3, 'browsingContexts', [], { value: ['WebdriverIO.BrowsingContext', 'WebdriverIO.BrowsingContext'] })
        })

        expect(result.steps.map((s: Result) => stepTree(s, attachment))).toEqual([
            { name: 'url("https://webdriver.io")', parameters: [], attachments: [], steps: [] },
            { name: 'newWindow("https://webdriver.io")', parameters: [], attachments: [], steps: [{
                name: 'getWindowHandles',
                parameters: ['request=GET /window/handles'],
                // the handle is not in the name, the Response keeps it
                attachments: ['Request={"method":"GET","path":"/session/s/window/handles"}', 'Response=["4F2B"]'],
                steps: []
            }] },
            { name: 'browsingContexts() → 2', parameters: [], attachments: [], steps: [] }
        ])
    })

    it('gives found, not found and the number of elements found, with the id only in the Response', async () => {
        const BTN = { wdio: 'element', query: [{ foundWith: '$', selector: '#btn' }], elementId: 'e.3' }
        const { result, attachment } = await run((emit) => {
            userCommand(emit, 1, '$', ['#btn'], { value: BTN })
            userCommand(emit, 2, '$', ['#missing'], { value: { wdio: 'element', query: [{ foundWith: '$', selector: '#missing' }], found: false } })
            userCommand(emit, 3, '$$', ['li'], { value: { wdio: 'element-array', query: [{ foundWith: '$$', selector: 'li' }], length: 3 } })
            userCommand(emit, 4, 'selectByVisibleText', ['France'], { value: null }, () => {
                protocol(emit, 'findElementFromElement', { value: { 'element-6066-11e4-a52e-4f735466cecf': 'e.9' } }, 4, { endpoint: '/session/:sessionId/element/e.8/element' })
            })
        })

        expect(result.steps.map((s: Result) => s.name)).toEqual(['$(`#btn`) → found', '$(`#missing`) → not found', '$$(`li`) → 3 found', 'selectByVisibleText("France")'])
        expect(JSON.parse(attachment(result.steps[0].attachments[0]))).toEqual(BTN)
        expect(result.steps[3].steps[0].name).toBe('findElementFromElement → found')
    })

    it('keeps a protocol command with no user command as on a WebDriver Classic session: no result in its name, no request parameter', async () => {
        const { result, attachment } = await run((emit) => protocol(emit, 'getElementText', { value: 'hello' }, undefined, { ...getElementText, body: { a: 1 } }))

        expect(result.steps.map((s: Result) => stepTree(s, attachment))).toEqual([{
            name: 'getElementText',
            parameters: [],
            attachments: ['Request={"a":1}', 'Response=hello'],
            steps: []
        }])
    })

    it('fails the step of a user command that throws, with the name and the message of the error', async () => {
        const { result, attachment } = await run((emit) => userCommand(emit, 1, 'getText', [], { error: new Error('element not found') }))

        const [step] = result.steps
        expect([step.name, step.status, step.statusDetails?.message]).toEqual(['getText()', 'failed', 'element not found'])
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
        expect(step.name).toBe('saveScreenshot("./a.png") → <Buffer 8 bytes>')
        expect(step.steps.flatMap((s: Result) => s.attachments.map((a: Result) => [s.name, a.name, a.type]))).toEqual([
            ['takeScreenshot', 'Request', 'application/json'],
            ['takeScreenshot', 'Screenshot', 'image/png']
        ])
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
            ['pause() → "paused"', 'passed', undefined, ['paused'], [
                ['execute()', 'failed', 'boom', ['Error: boom'], []]
            ]]
        ])
    })

    it('ends a protocol step that is still open with its user command, and ignores its late result', async () => {
        const { byName, attachment } = await runTests((emit) => {
            emit('test:start', test('t1'))
            // waitUntil times out while its condition still waits for a protocol command
            const waitUntil = user(4, 'waitUntil', ['[Function anonymous]', { timeout: 600 }])
            const execute = { command: 'executeScript', method: 'POST', endpoint: '/session/:sessionId/execute/sync', body: {}, sessionId: 's', parent: 4 }
            emit('client:beforeUserCommand', waitUntil)
            emit('client:beforeCommand', execute)
            emit('client:afterCommand', { ...execute, result: { value: false } })
            emit('client:beforeCommand', execute)
            emit('client:afterUserCommand', { ...waitUntil, result: { error: new Error('waitUntil condition timed out after 600ms') } })
            emit('client:afterCommand', { ...execute, result: { value: true } })
            emit('client:beforeUserCommand', user(5, 'getTitle', []))
            emit('client:afterUserCommand', { ...user(5, 'getTitle', []), result: { value: 'UCE demo' } })
            emit('test:fail', { ...test('t1'), error: new Error('waitUntil condition timed out after 600ms') })
            emit('test:end', test('t1'))
        })

        const message = 'waitUntil condition timed out after 600ms'
        expect(steps(byName('t1'), attachment)).toEqual([
            ['waitUntil(function anonymous, {"timeout":600})', 'failed', message, [`Error: ${message}`], [
                ['executeScript → false', 'passed', undefined, [expect.stringContaining('/execute/sync'), 'false'], []],
                ['executeScript', 'failed', message, [expect.stringContaining('/execute/sync')], []]
            ]],
            ['getTitle() → "UCE demo"', 'passed', undefined, ['UCE demo'], []]
        ])
    })

    it('ends each protocol step of overlapping user commands in its own user step', async () => {
        const { byName, attachment } = await runTests((emit) => {
            emit('test:start', test('t1'))
            // await Promise.all([a.getText(), b.getText()]): the request of a ends while b is on top
            const a = user(10, 'getText', []), b = user(11, 'getText', [])
            const textOf = (id: string, parent: number) => ({ command: 'getElementText', method: 'GET', endpoint: `/session/:sessionId/element/${id}/text`, sessionId: 's', parent })
            emit('client:beforeUserCommand', a)
            emit('client:beforeCommand', textOf('a', 10))
            emit('client:beforeUserCommand', b)
            emit('client:beforeCommand', textOf('b', 11))
            emit('client:afterCommand', { ...textOf('a', 10), result: { value: 'A' } })
            emit('client:afterCommand', { ...textOf('b', 11), result: { value: 'B' } })
            emit('client:afterUserCommand', { ...a, result: { value: 'A' } })
            emit('client:afterUserCommand', { ...b, result: { value: 'B' } })
            emit('client:beforeUserCommand', user(12, 'getTitle', []))
            emit('client:afterUserCommand', { ...user(12, 'getTitle', []), result: { value: 'T' } })
            emit('test:pass', { ...test('t1'), passed: true })
            emit('test:end', test('t1'))
        })

        // the steps nest by start time; each step gets its own result
        const request = (id: string) => expect.stringContaining(`/element/${id}/text`)
        expect(steps(byName('t1'), attachment)).toEqual([
            ['getText() → "A"', 'passed', undefined, ['A'], [
                ['getElementText → "A"', 'passed', undefined, [request('a'), 'A'], [
                    ['getText() → "B"', 'passed', undefined, ['B'], [
                        ['getElementText → "B"', 'passed', undefined, [request('b'), 'B'], []]
                    ]]
                ]]
            ]],
            ['getTitle() → "T"', 'passed', undefined, ['T'], []]
        ])
    })

    it('ignores only the late result of the protocol step that its user command ended', async () => {
        const { byName, attachment } = await runTests((emit) => {
            emit('test:start', test('t1'))
            // waitUntil times out while a screenshot (no parent) is in flight; a later getTitle ends first
            const waitUntil = user(4, 'waitUntil', ['[Function anonymous]', { timeout: 600 }])
            const shot = { command: 'takeScreenshot', method: 'GET', endpoint: '/session/:sessionId/screenshot', sessionId: 's' }
            const title = { command: 'getTitle', method: 'GET', endpoint: '/session/:sessionId/title', sessionId: 's' }
            emit('client:beforeUserCommand', waitUntil)
            emit('client:beforeCommand', shot)
            emit('client:afterUserCommand', { ...waitUntil, result: { error: new Error('timed out') } })
            emit('client:beforeCommand', title)
            emit('client:afterCommand', { ...title, result: { value: 'T' } })
            emit('client:afterCommand', { ...shot, result: { value: PNG } })
            emit('test:fail', { ...test('t1'), error: new Error('timed out') })
            emit('test:end', test('t1'))
        })

        expect(steps(byName('t1'), attachment)).toEqual([
            ['waitUntil(function anonymous, {"timeout":600})', 'failed', 'timed out', ['Error: timed out'], [
                ['takeScreenshot', 'failed', 'timed out', [expect.stringContaining('/screenshot')], []]
            ]],
            ['getTitle', 'passed', undefined, ['T'], []]
        ])
    })

    it('uses a late result that comes between two tests, so it does not take the result of the next test', async () => {
        const { byName, attachment } = await runTests((emit) => {
            const shot = { command: 'takeScreenshot', method: 'GET', endpoint: '/session/:sessionId/screenshot', sessionId: 's' }
            const title = { command: 'getTitle', method: 'GET', endpoint: '/session/:sessionId/title', sessionId: 's' }
            // t1 times out while a screenshot (no parent) is in flight; its result comes before t2 starts
            emit('test:start', test('t1'))
            emit('client:beforeUserCommand', user(4, 'checkScreen', ['home']))
            emit('client:beforeCommand', shot)
            emit('test:fail', { ...test('t1'), error: new Error('timed out') })
            emit('test:end', test('t1'))
            emit('client:afterCommand', { ...shot, result: { value: PNG } })
            emit('client:afterUserCommand', { ...user(4, 'checkScreen', ['home']), result: { error: new Error('timed out') } })
            emit('test:start', test('t2'))
            emit('client:beforeCommand', shot)
            emit('client:afterCommand', { ...shot, result: { value: PNG } })
            emit('client:beforeCommand', title)
            emit('client:afterCommand', { ...title, result: { value: 'T' } })
            emit('test:pass', { ...test('t2'), passed: true })
            emit('test:end', test('t2'))
        })

        expect(steps(byName('t2'), attachment).map(([name, status, , , children]) => [name, status, children])).toEqual([
            ['takeScreenshot', 'passed', []],
            ['getTitle', 'passed', []]
        ])
    })

    it('ends the protocol step of a failed user command when a user command that started after it ends', async () => {
        const { byName, attachment } = await runTests((emit) => {
            emit('test:start', test('t1'))
            // waitUntil times out while its request and a later pause still run; the test catches the timeout
            const waitUntil = user(4, 'waitUntil', ['[Function anonymous]', { timeout: 600 }])
            const execute = { command: 'executeScript', method: 'POST', endpoint: '/session/:sessionId/execute/sync', body: {}, sessionId: 's', parent: 4 }
            emit('client:beforeUserCommand', waitUntil)
            emit('client:beforeCommand', execute)
            emit('client:beforeUserCommand', user(5, 'pause', [1000]))
            emit('client:afterUserCommand', { ...waitUntil, result: { error: new Error('timed out') } })
            emit('client:afterUserCommand', { ...user(5, 'pause', [1000]), result: { value: null } })
            emit('test:pass', { ...test('t1'), passed: true })
            emit('test:end', test('t1'))
        })

        expect(steps(byName('t1'), attachment)).toEqual([
            ['waitUntil(function anonymous, {"timeout":600})', 'failed', 'timed out', ['Error: timed out'], [
                ['executeScript', 'failed', 'timed out', [expect.stringContaining('/execute/sync')], [
                    ['pause(1000)', 'passed', undefined, [], []]
                ]]
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

        expect(byName('t1').steps.map((s: Result) => s.name)).toEqual(['waitForDisplayed()'])
        expect(byName('t1').steps[0].status).not.toBe('passed')
        expect(steps(byName('t2'), attachment)).toEqual([
            ['pause(7000)', 'passed', undefined, [], []]
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
