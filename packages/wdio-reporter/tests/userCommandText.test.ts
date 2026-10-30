import { describe, expect, it } from 'vitest'

import {
    userCommandTitle, userCommandTitleIsCut, isNoDataResult, inlineResult, compactRequest, resolvedPath, userCommandTexts, userOutputReplacer
} from '../src/utils.js'

const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf'

describe('userCommandTitle', () => {
    it('writes the arguments as in the test code', () => {
        expect(userCommandTitle('url', ['https://webdriver.io'])).toBe('url("https://webdriver.io")')
        expect(userCommandTitle('getText', [])).toBe('getText()')
        expect(userCommandTitle('setValue', ['**MASKED**', { mask: true }])).toBe('setValue("**MASKED**", {"mask":true})')
        expect(userCommandTitle('execute', ['[Function readTitle]', 1])).toBe('execute(function readTitle, 1)')
    })

    it('writes an element argument as its query, with no id', () => {
        expect(userCommandTitle('dragAndDrop', ['WebdriverIO.Element<#drop> (id f.1.d.2.e.3)'])).toBe('dragAndDrop($("#drop"))')
        expect(userCommandTitle('isEqual', ['WebdriverIO.Element (id abc)'])).toBe('isEqual(Element)')
        expect(userCommandTitle('foo', ['WebdriverIO.ElementArray<li> (2)'])).toBe('foo($$("li"))')
    })

    it('cuts the arguments at 120 characters', () => {
        const title = userCommandTitle('url', ['a'.repeat(200)])
        expect(title).toBe(`url(${JSON.stringify('a'.repeat(200)).slice(0, 120)}…)`)
        expect(userCommandTitleIsCut(title)).toBe(true)
        expect(userCommandTitleIsCut('getText()')).toBe(false)
    })

    it('writes an assertion as in the test code', () => {
        expect(userCommandTitle('expect.toHaveText', ['WebdriverIO.Element<#btn>', 'Done'])).toBe('expect($("#btn")).toHaveText("Done")')
        expect(userCommandTitle('expect.not.toBeDisplayed', ['WebdriverIO.Element<#x> (not found)'])).toBe('expect($("#x")).not.toBeDisplayed()')
        expect(userCommandTitle('expect.toHaveUrl', ['WebdriverIO.Browser', 'https://webdriver.io'])).toBe('expect(browser).toHaveUrl("https://webdriver.io")')
        expect(userCommandTitle('expect.toBeRequested', ['WebdriverIO.Mock'])).toBe('expect(mock).toBeRequested()')
        expect(userCommandTitle('expect.toBeElementsArrayOfSize', ['WebdriverIO.ElementArray<li> (3)', 3])).toBe('expect($$("li")).toBeElementsArrayOfSize(3)')
    })

    it('keeps the name of a command with no list of arguments', () => {
        expect(userCommandTitle('action', undefined)).toBe('action')
    })
})

describe('inlineResult', () => {
    it('never throws on a raw value: a cycle, a BigInt, a big object', () => {
        const circular: Record<string, unknown> = { name: 'page' }
        circular.self = circular
        expect(inlineResult({ value: circular })).toBe('{"name":"page","self":"[Circular]"}')
        expect(inlineResult({ value: { id: 1n } })).toBe('[object Object]')
        const big = Object.fromEntries(Array.from({ length: 1000 }, (_, i) => [`k${i}`, i]))
        expect(inlineResult({ value: big })).toBe('{"k0":0,"k1":1,"k2":2,"k3":3,"k4":4,"k5":5,"k6":6,"k7":7,"k8…')
        expect(userCommandTitle('login', [circular])).toBe('login({"name":"page","self":"[Circular]"})')
    })

    it('writes a shared value each time it occurs: only a cycle is "[Circular]"', () => {
        const shared = { x: 1 }
        expect(inlineResult({ value: [shared, shared] })).toBe('[{"x":1},{"x":1}]')
        expect(userCommandTitle('custom', [shared, { a: shared }])).toBe('custom({"x":1}, {"a":{"x":1}})')
        const circular: Record<string, unknown> = { shared }
        circular.self = { back: circular, shared }
        expect(userCommandTitle('custom', [circular])).toBe('custom({"shared":{"x":1},"self":{"back":"[Circular]","shared":{"x":1}}})')
    })

    it('gives a short value as JSON', () => {
        expect(inlineResult({ value: 'Hello' })).toBe('"Hello"')
        expect(inlineResult({ value: false })).toBe('false')
        expect(inlineResult({ value: '' })).toBe('""')
        expect(inlineResult({ value: { width: 120, height: 32 } })).toBe('{"width":120,"height":32}')
    })

    it('cuts a long value at 60 characters', () => {
        expect(inlineResult({ value: 'a'.repeat(100) })).toBe(`"${'a'.repeat(59)}…`)
    })

    it('gives found, not found or the number of elements found, with no id', () => {
        expect(inlineResult({ value: 'WebdriverIO.Element<#btn> (id f.1.d.2.e.3)' })).toBe('found')
        expect(inlineResult({ value: 'WebdriverIO.Element<#missing> (not found)' })).toBe('not found')
        expect(inlineResult({ value: 'WebdriverIO.ElementArray<li> (3)' })).toBe('3 found')
        expect(inlineResult({ value: { [ELEMENT]: 'f.1.d.2.e.3' } })).toBe('found')
        expect(inlineResult({ value: [{ [ELEMENT]: 'a' }, { [ELEMENT]: 'b' }] })).toBe('2 found')
        expect(inlineResult({ value: [] }, 'findElementsFromElement')).toBe('0 found')
        expect(inlineResult({ value: [] }, 'getCookies')).toBe('[]')
    })

    it('gives the number of tabs of a list of tabs', () => {
        expect(inlineResult({ value: ['WebdriverIO.BrowsingContext', 'WebdriverIO.BrowsingContext'] })).toBe('2')
    })

    it('gives a Buffer label as it is', () => {
        expect(inlineResult({ value: '<Buffer 48213 bytes>' })).toBe('<Buffer 48213 bytes>')
    })

    it('gives nothing for an error, a result with no data or a handle command', () => {
        expect(inlineResult({ error: new Error('no') })).toBeUndefined()
        expect(inlineResult({ value: null })).toBeUndefined()
        expect(inlineResult({ value: {} })).toBeUndefined()
        expect(inlineResult({ value: 'WebdriverIO.BrowsingContext' })).toBeUndefined()
        expect(inlineResult({ value: 'WebdriverIO.Mock' })).toBeUndefined()
        expect(inlineResult({ value: '[Function restore]' }, 'emulate')).toBeUndefined()
    })

    it('gives no window handle: its id means nothing to a reader', () => {
        expect(inlineResult({ value: '4F2B8C1D' }, 'getWindowHandle')).toBeUndefined()
        expect(inlineResult({ value: ['4F2B8C1D', '9A0B'] }, 'getWindowHandles')).toBeUndefined()
        expect(inlineResult({ value: { handle: '4F2B', type: 'tab' } }, 'createWindow')).toBeUndefined()
        expect(inlineResult({ value: '4F2B8C1D' }, 'switchWindow')).toBeUndefined()
        expect(inlineResult({ value: '4F2B8C1D' }, 'getTitle')).toBe('"4F2B8C1D"')
    })
})

describe('isNoDataResult', () => {
    it('is true for no value, null, {}, a placeholder and the handle of a helper command', () => {
        expect(isNoDataResult({ value: undefined })).toBe(true)
        expect(isNoDataResult({ value: null })).toBe(true)
        expect(isNoDataResult({ value: {} })).toBe(true)
        expect(isNoDataResult({ value: 'WebdriverIO.Mock' })).toBe(true)
        expect(isNoDataResult({ value: ['WebdriverIO.BrowsingContext'] })).toBe(true)
        expect(isNoDataResult({ value: { remove: '[Function resetFn]' } }, 'addInitScript')).toBe(true)
    })

    it('is false for data, also for an element label and an empty list', () => {
        expect(isNoDataResult({ value: 'Hello' })).toBe(false)
        expect(isNoDataResult({ value: '' })).toBe(false)
        expect(isNoDataResult({ value: [] })).toBe(false)
        expect(isNoDataResult({ value: 'WebdriverIO.Element<#btn> (id abc)' })).toBe(false)
    })
})

describe('compactRequest and resolvedPath', () => {
    it('removes the session id and the element and shadow root ids', () => {
        expect(compactRequest('GET', '/session/:sessionId/element/f.1.d.2.e.3/text')).toBe('GET /element/:elementId/text')
        expect(compactRequest('post', '/session/:sessionId/shadow/abc/element')).toBe('POST /shadow/:shadowId/element')
        expect(compactRequest('GET', '/session/:sessionId/window/handles')).toBe('GET /window/handles')
        expect(compactRequest('DELETE', '/session/:sessionId')).toBe('DELETE /')
    })

    it('puts the session id in the path', () => {
        expect(resolvedPath('/session/:sessionId/element/e.3/text', 'abc')).toBe('/session/abc/element/e.3/text')
        expect(resolvedPath('/status')).toBe('/status')
    })
})

describe('userCommandTexts', () => {
    it('gives each protocol command its own result when the results come out of order', () => {
        const child = (endpoint: string) => ({ type: 'command', command: 'getElementText', method: 'GET', endpoint, parent: 1 })
        const result = (endpoint: string, value: string) => ({ ...child(endpoint), type: 'result', result: { value } })
        const a = child('/session/:sessionId/element/e.1/text')
        const b = child('/session/:sessionId/element/e.2/text')
        const texts = userCommandTexts([
            { type: 'userCommand', id: 1, command: 'readAll', body: [] },
            a, b,
            result('/session/:sessionId/element/e.2/text', 'B'),
            result('/session/:sessionId/element/e.1/text', 'A'),
            { type: 'userResult', id: 1, command: 'readAll', body: [], result: { value: ['A', 'B'] } }
        ])
        expect(texts.get(a)).toBe('getElementText → "A"  GET /element/:elementId/text')
        expect(texts.get(b)).toBe('getElementText → "B"  GET /element/:elementId/text')
    })

    it('pairs the same request first in, first out', () => {
        const child = { type: 'command', command: 'getTitle', method: 'GET', endpoint: '/session/:sessionId/title', parent: 1 }
        const first = { ...child }
        const second = { ...child }
        const texts = userCommandTexts([
            { type: 'userCommand', id: 1, command: 'twice', body: [] },
            first, { ...child, type: 'result', result: { value: 'one' } },
            second, { ...child, type: 'result', result: { value: 'two' } },
            { type: 'userResult', id: 1, command: 'twice', body: [], result: { value: true } }
        ])
        expect([texts.get(first), texts.get(second)]).toEqual(['getTitle → "one"  GET /title', 'getTitle → "two"  GET /title'])
    })

    const userCommand = { type: 'userCommand', id: 1, command: 'getText', body: [] }
    const command = { type: 'command', command: 'getElementText', method: 'GET', endpoint: '/session/:sessionId/element/e.3/text', parent: 1 }
    const result = { type: 'result', command: 'getElementText', result: { value: 'clicked' }, parent: 1 }
    const userResult = { type: 'userResult', id: 1, command: 'getText', body: [], result: { value: 'clicked' } }

    it('gives a user command its title and result, and its protocol command its result and compact request', () => {
        const texts = userCommandTexts([userCommand, command, result, userResult])
        expect(texts.get(userCommand)).toBe('getText() → "clicked"')
        expect(texts.get(command)).toBe('getElementText → "clicked"  GET /element/:elementId/text')
        expect(texts.has(result)).toBe(false)
        expect(texts.has(userResult)).toBe(false)
    })

    it('gives no text to a protocol command with no parent (a WebDriver Classic session)', () => {
        const classic = { ...command, parent: undefined }
        expect(userCommandTexts([classic, { ...result, parent: undefined }]).size).toBe(0)
    })

    it('gives the title only to a user command with no result yet or with an error', () => {
        expect(userCommandTexts([userCommand]).get(userCommand)).toBe('getText()')
        const failed = { ...userResult, result: { error: new Error('no') } }
        expect(userCommandTexts([userCommand, failed]).get(userCommand)).toBe('getText()')
    })

    it('pairs each protocol command with its own result', () => {
        const first = { ...command, command: 'getElementProperty' }
        const second = { ...command, command: 'getElementProperty' }
        const texts = userCommandTexts([
            userCommand, first, { ...result, command: 'getElementProperty', result: { value: 'text' } },
            second, { ...result, command: 'getElementProperty', result: { value: '' } }, userResult
        ])
        expect(texts.get(first)).toBe('getElementProperty → "text"  GET /element/:elementId/text')
        expect(texts.get(second)).toBe('getElementProperty → ""  GET /element/:elementId/text')
    })

    it('gives a protocol command with no HTTP request no request text', () => {
        const getUrl = { type: 'command', command: 'getUrl', parent: 1 }
        const texts = userCommandTexts([userCommand, getUrl, { type: 'result', command: 'getUrl', parent: 1, result: 'https://webdriver.io' }])
        expect(texts.get(getUrl)).toBe('getUrl → "https://webdriver.io"')
    })
})

describe('userOutputReplacer text', () => {
    it('adds the text to the user command and protocol command entries of an output', () => {
        const output = [
            { type: 'userCommand', id: 1, command: 'getText', body: [] },
            { type: 'command', command: 'getElementText', method: 'GET', endpoint: '/session/:sessionId/element/e.3/text', parent: 1 },
            { type: 'result', command: 'getElementText', result: { value: 'clicked' }, parent: 1 },
            { type: 'userResult', id: 1, command: 'getText', body: [], result: { value: 'clicked' } }
        ]
        const json = JSON.parse(JSON.stringify({ output }, userOutputReplacer))
        expect(json.output.map((entry: { text?: string }) => entry.text)).toEqual([
            'getText() → "clicked"', 'getElementText → "clicked"  GET /element/:elementId/text', undefined, undefined
        ])
    })

    it('keeps an output with no user command as it is (a WebDriver Classic session)', () => {
        const output = [{ type: 'command', command: 'getElementText', method: 'GET', endpoint: '/x', body: {} }]
        expect(JSON.stringify({ output }, userOutputReplacer)).toBe(JSON.stringify({ output }))
    })
})
