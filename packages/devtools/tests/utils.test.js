import path from 'path'
// eslint-disable-next-line
import { log as pptrDebugLog } from 'pptrDebug'
import childProcess from 'child_process'
import {
    validate, getPrototype, findElement, findElements, getStaleElementError,
    sanitizeError, transformExecuteArgs, transformExecuteResult, getPages,
    uniq, findByWhich, patchDebug
} from '../src/utils'
import { canAccess } from '@wdio/utils'

const debug = jest.requireActual('debug')

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
    waitForSelector: jest.fn(),
    waitForXPath: jest.fn(),
    $$eval: jest.fn(),
    $$: jest.fn(),
    $x: jest.fn(),
    $: jest.fn()
}

jest.mock('fs', () => {
    return {
        existsSync: (pkgName) => pkgName === 'pptrDebug'
    }
})

jest.mock('child_process', () => {
    let returnValue = false
    return {
        execFileSync: jest.fn().mockImplementation(() => {
            if (!returnValue) {
                throw new Error('foo not found')
            }
            return returnValue
        }),
        shouldReturn: (value) => (returnValue = value)
    }
})

jest.mock('path', () => {
    let resolveResult = 'debug'
    const resolve = jest.fn(() => resolveResult)
    const setResolveResult = (result) => (resolveResult = result)
    return { resolve, setResolveResult, dirname: jest.fn() }
})

describe('validate', () => {
    it('should fail if wrong arguments are passed in', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.refs, []))
            .toThrow(/Wrong parameters applied for findElementFromElement/)
    })

    it('should fail if arguments are malformed', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.refs, ['123', 123, '123']))
            .toThrow(/Malformed type for "using" parameter of command/)
    })

    it('should fail if not required param has wrong type', () => {
        expect(() => validate(command.command, command.parameters, command.variables, command.refs, ['123', '123', '123', 'foobar']))
            .toThrow(/Malformed type for "customParam" parameter of command/)
    })

    it('should do a proper request', () => {
        const body = validate(command.command, command.parameters, command.variables, command.refs, ['123', 'css selector', '#body', undefined])
        expect(body).toMatchSnapshot()
    })

    it('should do a proper request with non required params', () => {
        const body = validate(command.command, command.parameters, command.variables, command.refs, ['123', 'css selector', '#body', 123])
        expect(body).toMatchSnapshot()
    })
})

test('getPrototype', () => {
    let i = 0
    expect(getPrototype(() => ++i)).toMatchSnapshot()
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
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn().mockReturnValue('foobar') }
            }
            pageMock.$.mockReturnValue(Promise.resolve(42))

            expect(await findElement.call(scope, pageMock, 'css selector', 'barfoo'))
                .toEqual({ 'element-6066-11e4-a52e-4f735466cecf': 'foobar' })

            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$).toBeCalledWith('barfoo')
            expect(pageMock.$x).toBeCalledTimes(0)
        })

        it('tries to find element using xpath', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn().mockReturnValue('foobar') }
            }
            pageMock.$x.mockReturnValue(Promise.resolve([42]))

            expect(await findElement.call(scope, pageMock, 'xpath', '//img'))
                .toEqual({ 'element-6066-11e4-a52e-4f735466cecf': 'foobar' })

            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$).toBeCalledTimes(0)
            expect(pageMock.$x).toBeCalledWith('//img')
        })

        it('should fail if not found', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve(null))

            const errorMessage = await findElement.call(scope, pageMock, 'css selector', 'barfoo')
            expect(errorMessage.message)
                .toContain('Element with selector "barfoo" not found')
        })

        it('should not fail with the same error if Puppeteer can not find the element', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn() }
            }
            pageMock.$.mockReturnValue(Promise.reject(new Error('failed to find element')))

            const errorMessage = await findElement.call(scope, pageMock, 'css selector', 'barfoo')
            expect(errorMessage.message)
                .toContain('Element with selector "barfoo" not found')
        })

        it('sets implicit waits', async () => {
            const scope = {
                timeouts: { get: jest.fn().mockReturnValue(1234) },
                elementStore: { set: jest.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve('foobar'))
            await findElement.call(scope, pageMock, 'css selector', 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(1)
            expect(pageMock.waitForXPath).toBeCalledTimes(0)
        })

        it('sets implicit waits with xpath', async () => {
            const scope = {
                timeouts: { get: jest.fn().mockReturnValue(1234) },
                elementStore: { set: jest.fn() }
            }
            pageMock.$.mockReturnValue(Promise.resolve('foobar'))
            await findElement.call(scope, pageMock, 'xpath', 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.waitForXPath).toBeCalledTimes(1)
        })
    })

    describe('findElements', () => {
        it('should find elements', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn().mockReturnValue('foobar') }
            }
            pageMock.$$.mockReturnValue(Promise.resolve([42, 11]))
            expect(await findElements.call(scope, pageMock, 'css selector', 'barfoo')).toMatchSnapshot()
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$$).toBeCalledWith('barfoo')
            expect(pageMock.$x).toBeCalledTimes(0)
        })

        it('should find elements with xpath', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn().mockReturnValue('foobar') }
            }
            pageMock.$x.mockReturnValue(Promise.resolve([42, 11]))
            expect(await findElements.call(scope, pageMock, 'xpath', 'barfoo')).toMatchSnapshot()
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(pageMock.$$).toBeCalledTimes(0)
            expect(pageMock.$x).toBeCalledWith('barfoo')
        })

        it('should return immiadiatelly if no elements were found', async () => {
            const scope = {
                timeouts: { get: jest.fn() },
                elementStore: { set: jest.fn() }
            }
            pageMock.$$.mockReturnValue(Promise.resolve([]))
            expect(await findElements.call(scope, pageMock, 'css selector', 'barfoo')).toEqual([])
            expect(pageMock.waitForSelector).toBeCalledTimes(0)
            expect(scope.elementStore.set).toBeCalledTimes(0)
        })

        it('sets implicit waits', async () => {
            const scope = {
                timeouts: { get: jest.fn().mockReturnValue(1234) },
                elementStore: { set: jest.fn() }
            }
            pageMock.$$.mockReturnValue(Promise.resolve(['foobar']))
            await findElements.call(scope, pageMock, 'css selector', 'barfoo')
            expect(pageMock.waitForSelector).toBeCalledTimes(1)
        })

        it('sets implicit waits with xpath', async () => {
            const scope = {
                timeouts: { get: jest.fn().mockReturnValue(1234) },
                elementStore: { set: jest.fn() }
            }
            pageMock.$x.mockReturnValue(Promise.resolve(['foobar']))
            await findElements.call(scope, pageMock, 'xpath', 'barfoo')
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
        err.stack = err.stack.split('\n')
        err.stack.push('at /foo/bar/devtools/node_modules/puppeteer-core/bla.js')
        err.stack = err.stack.join('\n')
        expect(sanitizeError(err)).not.toContain('devtools/node_modules/puppeteer-core')
    })
})

test('transformExecuteArgs', async () => {
    const scope = { elementStore: new Map() }
    scope.elementStore.set('foobar', 'barfoo')

    expect(await transformExecuteArgs.call(scope, [
        'foo',
        { 'element-6066-11e4-a52e-4f735466cecf': 'foobar' },
        true,
        42
    ])).toEqual(['foo', 'barfoo', true, 42])
})

test('transformExecuteArgs throws stale element if element is not in store', async () => {
    const scope = { elementStore: new Map() }
    scope.elementStore.set('foobar', 'barfoo')

    expect(transformExecuteArgs.call(scope, [
        'foo',
        { 'element-6066-11e4-a52e-4f735466cecf': 'not-existing' },
        true,
        42
    ])).rejects.toThrow()
})

describe('transformExecuteResult', () => {
    test('multiple results', async () => {
        const scope = {
            timeouts: { get: jest.fn() },
            elementStore: { set: jest.fn().mockReturnValue('foobar') }
        }
        pageMock.$.mockReturnValue(Promise.resolve(42))
        expect(await transformExecuteResult.call(scope, pageMock, [
            'foobar',
            '__executeElement',
            42
        ])).toMatchSnapshot()
    })

    test('single result', async () => {
        const scope = {
            timeouts: { get: jest.fn() },
            elementStore: { set: jest.fn().mockReturnValue('foobar') }
        }
        pageMock.$.mockReturnValue(Promise.resolve(42))
        expect(await transformExecuteResult.call(scope, pageMock, 'foobar'))
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
        pages: jest.fn()
            .mockReturnValueOnce([])
            .mockReturnValueOnce([])
            .mockReturnValueOnce([{}])
    }
    await getPages(browser, 10)
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
    expect(listA).not.toBe(uniq(listA))
})

test('findByWhich', () => {
    canAccess.mockImplementation(() => true)
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual([])

    childProcess.shouldReturn('/path/to/other/firefox\n')
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual(['/path/to/other/firefox'])

    canAccess.mockImplementation(() => {
        throw new Error('uups')
    })
    expect(findByWhich(['firefox'], [{ regex: /firefox/, weight: 51 }]))
        .toEqual([])
})

test('patchDebug', () => {
    const logMock = { debug: jest.fn() }
    patchDebug(logMock)
    debug.log('something something - puppeteer:protocol foobar')
    expect(logMock.debug).toBeCalledWith('foobar')
})

test('patchDebug with debug not install in puppeteer', () => {
    const logMock = { debug: jest.fn() }
    path.setResolveResult('pptrDebug')
    patchDebug(logMock)
    pptrDebugLog('something something - puppeteer:protocol barfoo')
    expect(logMock.debug).toBeCalledWith('barfoo')
})
