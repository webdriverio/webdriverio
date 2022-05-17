import { describe, it, expect, afterEach, vi, test } from 'vitest'

import path from 'node:path'
import childProcess from 'node:child_process'
// @ts-ignore no types needed
import debug from 'debug'
// @ts-ignore not a real package but needed for testing
import { log as pptrDebugLog } from 'pptrDebug'
import { canAccess } from '@wdio/utils'

import {
    validate, getPrototype, findElement, findElements, getStaleElementError,
    sanitizeError, transformExecuteArgs, transformExecuteResult, getPages,
    uniq, findByWhich, patchDebug, sleep
} from '../src/utils'

vi.mock('@wdio/utils', async () => {
    const pathModule = await vi.importActual('node:path') as typeof path
    return import(pathModule.join(process.cwd(), '__mocks__', '@wdio/utils'))
})
vi.mock('pptrDebug', async () => {
    const pathModule = await vi.importActual('node:path') as typeof path
    return import(pathModule.join(process.cwd(), '__mocks__', 'pptrDebug'))
})

/**
 * some WebDriver commands are either not part of a recommended standard
 * or not used enough by end users that it would make sense to implement
 * parity to the devtools protocol
 */
const IGNORE_MISSING_COMMANDS = [
    'addCredential', 'addVirtualAuthenticator', 'createMockSensor', 'deleteMockSensor',
    'generateTestReport', 'getCredentials', 'getMockSensor', 'removeAllCredentials',
    'removeCredential', 'removeVirtualAuthenticator', 'setPermissions', 'setTimeZone',
    'setUserVerified', 'updateMockSensor'
]

const command = {
    endpoint: '/session/:sessionId/element/:elementId/element',
    method: 'POST',
    command: 'findElementFromElement',
    ref: 'https://w3c.github.io/webdriver/webdriver-spec.html#dfn-find-element-from-element',
    variables: [{
        'name': 'elementId',
        'description': 'the id of an element returned in a previous call to Find Element(s)'
    }],
    parameters: [{
        'name': 'using',
        'type': 'string',
        'description': 'a valid element location strategy',
        'required': true
    }, {
        'name': 'value',
        'type': 'string',
        'description': 'the actual selector that will be used to find an element',
        'required': true
    }, {
        'name': 'customParam',
        'type': 'number',
        'description': 'a random not required param',
        'required': false
    }]
}

let pageMock = {
    waitForSelector: vi.fn(),
    waitForXPath: vi.fn(),
    $$eval: vi.fn(),
    $$: vi.fn(),
    $x: vi.fn(),
    $: vi.fn()
}

vi.mock('fs', () => {
    return {
        default: {
            existsSync: (pkgName: string) => pkgName === 'pptrDebug'
        }
    }
})

vi.mock('node:child_process', () => {
    let returnValue = false
    const execFileSync = vi.fn().mockImplementation(() => {
        if (!returnValue) {
            throw new Error('foo not found')
        }
        return returnValue
    })

    return {
        execFileSync,
        default: {
            execFileSync,
            shouldReturn: (value: any) => (returnValue = value)
        }
    }
})

vi.mock('node:path', () => {
    let resolveResult = 'debug'
    const resolve = vi.fn(() => resolveResult)
    const setResolveResult = (result: any) => (resolveResult = result)
    return {
        default: { resolve, setResolveResult, dirname: vi.fn() }
    }
})

describe('validate', () => {
    it('should fail if wrong arguments are passed in', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.ref, []))
            .toThrow(/Wrong parameters applied for findElementFromElement/)
    })

    it('should fail if arguments are malformed', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.ref, ['123', 123, '123']))
            .toThrow(/Malformed type for "using" parameter of command/)
    })

    it('should fail if not required param has wrong type', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.ref, ['123', '123', '123', 'foobar']))
            .toThrow(/Malformed type for "customParam" parameter of command/)
    })

    it('should do a proper request', () => {
        const body = validate(command.command, command.parameters, command.variables, command.ref, ['123', 'css selector', '#body', undefined])
        expect(body).toMatchSnapshot()
    })

    it('should do a proper request with non required params', () => {
        const body = validate(command.command, command.parameters, command.variables, command.ref, ['123', 'css selector', '#body', 123])
        expect(body).toMatchSnapshot()
    })
})

test('getPrototype', () => {
    let i = 0
    const commands = getPrototype(() => ++i)
    const filteredCommands = Object.entries(commands)
        .reduce((cmds, [name, description]) => {
            if (IGNORE_MISSING_COMMANDS.includes(name)) {
                return cmds
            }
            cmds[name] = description
            return cmds
        }, {} as Record<string, { value: Function }>)
    expect(filteredCommands).toMatchSnapshot()
})

describe('findElement utils', () => {
    afterEach(() => {
        pageMock.waitForSelector.mockClear()
        pageMock.waitForXPath.mockClear()
        pageMock.$$eval.mockClear()
        pageMock.$.mockClear()
        pageMock.$x.mockClear()
        pageMock.$$.mockClear()
    })

    describe('findElement', () => {
        it('tries to find element using css selector', async () => {
            const scope = {
                timeouts: { get: vi.fn() },
                elementStore: { set: vi.fn().mockReturnValue('foobar') }
            }
            pageMock.$.mockReturnValue(Promise.resolve(42))

            expect(await findElement.call(scope as any, pageMock as any as any, 'css selector', 'barfoo'))
                .toEqual({ 'element-6066-11e4-a52e-4f735466cecf': 'foobar' })

            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$).toBeCalledWith('barfoo')
            expect(pageMock.$x).toBeCalledTimes(0)
        })

        it('tries to find element using xpath', async () => {
            const scope = {
                timeouts: { get: vi.fn() },
                elementStore: { set: vi.fn().mockReturnValue('foobar') }
            }
            pageMock.$x.mockReturnValue(Promise.resolve([42]))

            expect(await findElement.call(scope as any, pageMock as any, 'xpath', '//img'))
                .toEqual({ 'element-6066-11e4-a52e-4f735466cecf': 'foobar' })

            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$).toBeCalledTimes(0)
            expect(pageMock.$x).toBeCalledWith('//img')
        })

        it('should fail if not found', async () => {
            const scope = {
                timeouts: { get: vi.fn() },
                elementStore: { set: vi.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve(null))

            const errorMessage = await findElement.call(scope as any, pageMock as any, 'css selector', 'barfoo')
            expect((errorMessage as Error).message)
                .toContain('Element with selector "barfoo" not found')
        })

        it('should not fail with the same error if Puppeteer can not find the element', async () => {
            const scope = {
                timeouts: { get: vi.fn() },
                elementStore: { set: vi.fn() }
            }
            pageMock.$.mockReturnValue(Promise.reject(new Error('failed to find element')))

            const errorMessage = await findElement.call(scope as any, pageMock as any, 'css selector', 'barfoo')
            expect((errorMessage as Error).message)
                .toContain('Element with selector "barfoo" not found')
        })

        it('sets implicit waits', async () => {
            const scope = {
                timeouts: { get: vi.fn().mockReturnValue(1234) },
                elementStore: { set: vi.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve('foobar'))
            await findElement.call(scope as any, pageMock as any, 'css selector', 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(1)
            expect(pageMock.waitForXPath).toBeCalledTimes(0)
        })

        it('sets implicit waits with xpath', async () => {
            const scope = {
                timeouts: { get: vi.fn().mockReturnValue(1234) },
                elementStore: { set: vi.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve('foobar'))
            await findElement.call(scope as any, pageMock as any, 'xpath', 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.waitForXPath).toBeCalledTimes(1)
        })
    })

    describe('findElements', () => {
        it('should find elements', async () => {
            const scope = {
                timeouts: { get: vi.fn() },
                elementStore: { set: vi.fn().mockReturnValue('foobar') }
            }
            pageMock.$$.mockReturnValue(Promise.resolve([42, 11]))
            expect(await findElements.call(scope as any, pageMock as any, 'css selector', 'barfoo')).toMatchSnapshot()
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$$).toBeCalledWith('barfoo')
            expect(pageMock.$x).toBeCalledTimes(0)
        })

        it('should find elements with xpath', async () => {
            const scope = {
                timeouts: { get: vi.fn() },
                elementStore: { set: vi.fn().mockReturnValue('foobar') }
            }
            pageMock.$x.mockReturnValue(Promise.resolve([42, 11]))
            expect(await findElements.call(scope as any, pageMock as any, 'xpath', 'barfoo')).toMatchSnapshot()
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$$).toBeCalledTimes(0)
            expect(pageMock.$x).toBeCalledWith('barfoo')
        })

        it('should return immediately if no elements were found', async () => {
            const scope = {
                timeouts: { get: vi.fn() },
                elementStore: { set: vi.fn() }
            }
            pageMock.$$.mockReturnValue(Promise.resolve([]))
            expect(await findElements.call(scope as any, pageMock as any, 'css selector', 'barfoo')).toEqual([])
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(scope.elementStore.set).toBeCalledTimes(0)
        })

        it('sets implicit waits', async () => {
            const scope = {
                timeouts: { get: vi.fn().mockReturnValue(1234) },
                elementStore: { set: vi.fn() }
            }
            pageMock.$$.mockReturnValue(Promise.resolve(['foobar']))
            await findElements.call(scope as any, pageMock as any, 'css selector', 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(1)
        })

        it('sets implicit waits with xpath', async () => {
            const scope = {
                timeouts: { get: vi.fn().mockReturnValue(1234) },
                elementStore: { set: vi.fn() }
            }
            pageMock.$x.mockReturnValue(Promise.resolve(['foobar']))
            await findElements.call(scope as any, pageMock as any, 'xpath', 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.waitForXPath).toBeCalledTimes(1)
        })
    })
})

describe('sanitizeError', () => {
    it('should set stale element error', () => {
        const err = new Error('Node is detached from document bla bla')
        expect(sanitizeError(err).stack)
            .toContain('stale element reference: The element reference is stale')
    })

    it('should not contain puppeteer traces', () => {
        const err = new Error('some error')
        const newStack = err?.stack?.split('\n') || []
        newStack.push('at /foo/bar/devtools/node_modules/puppeteer-core/bla.js')
        err.stack = newStack.join('\n')
        expect(sanitizeError(err).stack).not.toContain('devtools/node_modules/puppeteer-core')
    })
})

test('transformExecuteArgs', async () => {
    const scope = { elementStore: new Map() }
    scope.elementStore.set('foobar', 'barfoo')

    expect(await transformExecuteArgs.call(scope as any, [
        'foo',
        { 'element-6066-11e4-a52e-4f735466cecf': 'foobar' },
        true,
        42
    ])).toEqual(['foo', 'barfoo', true, 42])
})

test('transformExecuteArgs throws stale element if element is not in store', async () => {
    const scope = { elementStore: new Map() }
    scope.elementStore.set('foobar', 'barfoo')

    expect(transformExecuteArgs.call(scope as any, [
        'foo',
        { 'element-6066-11e4-a52e-4f735466cecf': 'not-existing' },
        true,
        42
    ])).rejects.toThrow()
})

test('transformExecuteArgs should allow undefined params', async () => {
    const scope = { elementStore: new Map() }
    expect(await transformExecuteArgs.call(scope as any, undefined)).toEqual([])
})

describe('transformExecuteResult', () => {
    test('multiple results', async () => {
        const scope = {
            timeouts: { get: vi.fn() },
            elementStore: { set: vi.fn().mockReturnValue('foobar') }
        }
        pageMock.$.mockReturnValue(Promise.resolve(42))
        expect(await transformExecuteResult.call(scope as any, pageMock as any, [
            'foobar',
            '__executeElement',
            42
        ])).toMatchSnapshot()
    })

    test('single result', async () => {
        const scope = {
            timeouts: { get: vi.fn() },
            elementStore: { set: vi.fn().mockReturnValue('foobar') }
        }
        pageMock.$.mockReturnValue(Promise.resolve(42))
        expect(await transformExecuteResult.call(scope as any, pageMock as any, 'foobar'))
            .toEqual('foobar')
    })

    afterEach(() => {
        pageMock.waitForSelector.mockClear()
        pageMock.$.mockClear()
        pageMock.$$.mockClear()
        pageMock.$$eval.mockClear()
    })
})

test('getPages', async () => {
    const browser = {
        pages: vi.fn()
            .mockReturnValueOnce([])
            .mockReturnValueOnce([])
            .mockReturnValueOnce([{}])
    }
    await getPages(browser as any, 10)
    expect(browser.pages).toBeCalledTimes(3)
})

test('getStaleElementError', () => {
    const err = getStaleElementError('foobar')
    expect(err instanceof Error).toBe(true)
    expect(err.name).toContain('stale element reference')
})

test('uniq', () => {
    const listA = [1, 2, 3]
    expect(listA).toBe(listA)
    expect(listA).not.toBe(uniq(listA as any))
})

test('findByWhich', () => {
    vi.mocked(canAccess).mockImplementation(() => true)
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual([])

    // @ts-expect-error mock feature
    vi.mocked(childProcess).shouldReturn('/path/to/other/firefox\n')
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual(['/path/to/other/firefox'])

    vi.mocked(canAccess).mockImplementation(() => {
        throw new Error('uups')
    })
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual([])
})

test('patchDebug', () => {
    const logMock = { debug: vi.fn() }
    patchDebug(logMock as any)
    debug.log('something something - puppeteer:protocol foobar')
    expect(logMock.debug).toBeCalledWith('foobar')
})

/**
 * can't be tested due to mock issues in vitest
 */
test.skip('patchDebug with debug not install in puppeteer', () => {
    const logMock = { debug: vi.fn() }
    // @ts-expect-error mock feature
    vi.mocked(path).setResolveResult('pptrDebug')
    patchDebug(logMock as any)
    pptrDebugLog('something something - puppeteer:protocol barfoo')
    expect(logMock.debug).toBeCalledWith('barfoo')
})

test('sleep', async () => {
    const start = Date.now()
    await sleep(100)
    expect(Date.now() - start).toBeGreaterThanOrEqual(90)
})
