import { describe, it, expect, afterEach, vi, test } from 'vitest'

import type path from 'node:path'
// @ts-ignore no types needed
import debug from 'debug'
import which from 'which'
import { launch } from 'chrome-launcher'
import { canAccess } from '@wdio/utils'

import {
    validate, getPrototype, findElement, findElements, getStaleElementError,
    sanitizeError, transformExecuteArgs, transformExecuteResult, getPages,
    uniq, findByWhich, patchDebug, sleep, launchChromeUsingWhich
} from '../src/utils.js'

vi.mock('which')
vi.mock('chrome-launcher')
vi.mock('@wdio/logger', async () => {
    const pathModule = await vi.importActual('node:path') as typeof path
    return import(pathModule.join(process.cwd(), '__mocks__', '@wdio/logger'))
})
vi.mock('@wdio/utils', async () => {
    const pathModule = await vi.importActual('node:path') as typeof path
    return import(pathModule.join(process.cwd(), '__mocks__', '@wdio/utils'))
})
vi.mock('pptrDebug', async () => {
    const pathModule = await vi.importActual('node:path') as typeof path
    return import(pathModule.join(process.cwd(), '__mocks__', 'pptrDebug'))
})

const PUPPETEER_LOG = `  puppeteer:protocol:RECV ◀ [
    puppeteer:protocol:RECV ◀   '{"id":20,"result":{"result":{"type":"string","value":"complete"}},"sessionId":"B5BB76CBB624830A41E4159E01ABED39"}'
    puppeteer:protocol:RECV ◀ ]`

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

const pageMock = {
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

vi.mock('debug', () => ({
    default: { log: vi.fn() }
}))

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

    vi.mocked(which.sync).mockReturnValue('/path/to/other/firefox')
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual(['/path/to/other/firefox'])

    vi.mocked(canAccess).mockImplementation(() => {
        throw new Error('uups')
    })
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual([])
})

test('patchDebug', async () => {
    /**
     * fails in Windows
     */
    if (process.platform === 'win32') {
        return
    }
    const logMock = { debug: vi.fn() }
    await patchDebug(logMock as any)
    debug.log(PUPPETEER_LOG)
    expect(logMock.debug.mock.calls[0]).toMatchSnapshot('foobar')
})

test('sleep', async () => {
    const start = Date.now()
    await sleep(100)
    expect(Date.now() - start).toBeGreaterThanOrEqual(90)
})

describe('launchChromeUsingWhich', () => {
    it('should throw if error is not related to chrome binary not found', async () => {
        await expect(() => launchChromeUsingWhich(new Error('ups'), {}))
            .rejects.toThrow('ups')
    })

    it('should throw if user has specified path explicitly', async () => {
        await expect(() => launchChromeUsingWhich(
            new Error('No Chrome installations found.'),
            { chromePath: '/foo/bar' }
        )).rejects.toThrow('No Chrome installations found.')
    })

    it('should use which properly to find path', async () => {
        vi.mocked(which).mockImplementation(async (binary: string) => {
            if (binary === 'google-chrome') {
                return '/foo/bar/google-chrome'
            }
            throw new Error('not found')
        })
        await launchChromeUsingWhich(new Error('No Chrome installations found.'), {})
        expect(launch).toBeCalledWith({ chromePath: '/foo/bar/google-chrome' })
    })
})
