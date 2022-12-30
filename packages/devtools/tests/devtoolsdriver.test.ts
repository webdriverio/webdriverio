import path from 'node:path'
import { expect, test, vi, beforeEach } from 'vitest'
import DevToolsDriver from '../src/devtoolsdriver.js'
import type { Dialog } from 'puppeteer-core/lib/esm/puppeteer/common/Dialog.js'
import type { Frame } from 'puppeteer-core/lib/esm/puppeteer/common/Frame.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('puppeteer-core', () => import(path.join(process.cwd(), '__mocks__', 'puppeteer-core')))
vi.mock('chrome-launcher', () => import(path.join(process.cwd(), '__mocks__', 'chrome-launcher')))

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(false),
        readdirSync: vi.fn().mockReturnValue([
            '/foo/bar/click.js',
            '/foo/bar/getAttribute.ts',
            '/foo/bar/getAttribute.d.ts'
        ])
    }
}))

vi.mock('../src/commands/index.js', () => ({
    click: 'clickCommand',
    getAttribute: 'getAttributeCommand'
}))

let evaluateCommandCalls = 0
const executionContext = {
    evaluate: vi.fn()
}

const setNormalPageLoadBehavior = () => executionContext.evaluate.mockImplementation(() => Promise.resolve(++evaluateCommandCalls % 2 === 1
    ? '1'
    : 'complete'
))

const frame = {
    executionContext: vi.fn().mockImplementation(() => Promise.resolve(executionContext))
}

const page = {
    on: vi.fn(),
    once: vi.fn(),
    setDefaultTimeout: vi.fn(),
    mainFrame: vi.fn(),
    frames: vi.fn().mockReturnValue([frame])
}

const browser = {
    on: vi.fn(),
    pages: vi.fn().mockImplementation(async () => {
        page.mainFrame = vi.fn().mockImplementation(() => frame)
        ++evaluateCommandCalls
        setNormalPageLoadBehavior()
        return [page]
    })
}

const commandMock = {
    command: 'elementClick',
    description: 'foobar',
    ref: 'http://foobar.com',
    variables: [{
        name: 'elementId',
        description: 'barfoo'
    }],
    parameters: [{
        name: 'text',
        type: 'string',
        description: 'some description',
        required: true
    }, {
        name: 'value',
        type: 'string[]',
        description: 'some other description',
        required: false
    }]
}

let driver: DevToolsDriver

beforeEach(() => {
    page.on.mockClear()
    page.once.mockClear()
    page.setDefaultTimeout.mockClear()
    page.mainFrame.mockImplementation(() => frame)
    executionContext.evaluate.mockClear()
    setNormalPageLoadBehavior()
    driver = new DevToolsDriver(browser as any, [page as any])
    driver.timeouts.set('pageLoad', 100)
})

test('can be initiated', () => {
    expect(driver.commands).toEqual({ click: 'clickCommand', getAttribute: 'getAttributeCommand' })
    expect(driver.browser).toEqual(browser)
    expect(browser.on).toBeCalledWith('targetcreated', expect.any(Function))
    expect(browser.on).toBeCalledWith('targetdestroyed', expect.any(Function))
    expect(page.on).toBeCalledWith('dialog', expect.any(Function))
    expect(page.on).toBeCalledWith('framenavigated', expect.any(Function))
})

test('should throw if command is called that is not implemented', () => {
    const command = driver.register({
        command: 'click',
        description: 'some description',
        ref: 'https://foobar.com',
        parameters: []
    })
    expect(command).toThrow('Command "click" is not supported using the Devtools protocol.')
})

test('should return proper result', async () => {
    driver.commands.elementClick = (...args: any[]) => new Promise<any>(
        (resolve) => setTimeout(() => resolve.apply(null, args), 100))

    const emit = vi.fn()
    const command = driver.register(commandMock)

    const errorMsg = await command.call({ emit } as any).catch((e) => e.message)
    await expect(errorMsg).toContain('Wrong parameters applied')

    const errorMsg2 = await command.call(emit as any, '123').catch((e) => e.message)
    await expect(errorMsg2).toContain('Wrong parameters applied')

    emit.mockReset()
    const errorMsg3 = await command.call({ emit } as any, '123', 'some text', ['some value'])
    await expect(errorMsg3).toEqual({
        elementId: '123',
        text: 'some text',
        value: ['some value']
    })
    expect(emit.mock.calls).toMatchSnapshot()
})

test('should throw if command throws', async () => {
    driver.commands.elementClick = () => new Promise(
        (resolve, reject) => setTimeout(() => reject(new Error('foobar')), 100))

    const command = driver.register(commandMock)

    const emit = vi.fn()
    const errorMsg3 = await command.call({ emit } as any, '123', 'some text', ['some value'])
        .catch((e) => e.message)
    await expect(errorMsg3).toEqual('foobar')
})

test('should rerun command if it was executed within navigation', async () => {
    expect.assertions(4)
    let wasCommandCalled = false
    driver.commands.elementClick = vi.fn().mockImplementation(
        () => new Promise((resolve, reject) => setTimeout(
            () => {
                if (!wasCommandCalled) {
                    wasCommandCalled = true
                    reject(new Error('foobar most likely because of a navigation'))
                }

                resolve(null)
            },
            100)
        )
    )
    const command = driver.register(commandMock)

    setTimeout(() => {
        expect(page.once).toBeCalledWith('load', expect.any(Function))
        page.once.mock.calls.pop()?.pop()()
    }, 150)

    const emit = vi.fn()
    const result = await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(driver.commands.elementClick).toBeCalledTimes(2)
    expect(result).toBe(null)
    expect(emit.mock.calls).toMatchSnapshot()
})

test('throws error if navigation takes too long', async () => {
    driver.timeouts.set('pageLoad', 150)
    let wasCommandCalled = false
    driver.commands.elementClick = vi.fn().mockImplementation(
        () => new Promise(
            (resolve, reject) => setTimeout(
                () => {
                    if (!wasCommandCalled) {
                        wasCommandCalled = true
                        reject(new Error('foobar most likely because of a navigation'))
                    }

                    resolve(null)
                },
                100
            )
        )
    )

    const emit = vi.fn()
    const command = driver.register(commandMock)
    const result = await command.call({ emit } as any, '123', 'some text', ['some value'])
        .catch((err) => err.message)
    expect(result).toBe('page load timeout')
})

test('should wait for page load to be complete before executing the command', async () => {
    executionContext.evaluate.mockReset()
    executionContext.evaluate = vi.fn()
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('loading')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('loading')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('interactive')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('complete')

    driver.commands.elementClick = (...args: any[]) => new Promise(
        (resolve) => setTimeout(() => resolve.apply(null, args), 100))

    const emit = vi.fn()
    const command = driver.register(commandMock)
    await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(executionContext.evaluate.mock.calls).toHaveLength(8)
})

test('should use page from target if we are currently in a frame', async () => {
    driver.getPageHandle = vi.fn().mockReturnValue(frame)
    executionContext.evaluate = vi.fn().mockReturnValueOnce('complete')

    driver.commands.elementClick = () => Promise.resolve(null)

    const emit = vi.fn()
    const command = driver.register(commandMock)
    await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(browser.pages).toBeCalledTimes(1)
})

test('should rerun command if no execution context could be found', async () => {
    executionContext.evaluate.mockReset()
    executionContext.evaluate = vi.fn()
        .mockRejectedValueOnce(new Error('ups'))
        .mockRejectedValueOnce(new Error('ups'))
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('complete')

    driver.commands.elementClick = (...args: any[]) => new Promise(
        (resolve) => setTimeout(() => resolve.apply(null, args), 100))

    const emit = vi.fn()
    const command = driver.register(commandMock)
    await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(executionContext.evaluate.mock.calls).toHaveLength(4)
})

test('should throw if execution context can not be established', async () => {
    expect.assertions(1)

    executionContext.evaluate.mockReset()
    executionContext.evaluate = vi.fn()
        .mockImplementation(() => new Promise(
            (resolve, reject) => setTimeout(
                () => reject(new Error('ups')), 100)))

    driver.timeouts.set('pageLoad', 200)
    driver.commands.elementClick = (...args: any[]) => new Promise(
        (resolve) => setTimeout(() => resolve.apply(null, args), 100))

    const command = driver.register(commandMock)

    try {
        const emit = vi.fn()
        await command.call({ emit } as any, '123', 'some text', ['some value'])
    } catch (err: any) {
        expect(err.message).toBe('ups')
    }
})

test('dialogHandler', () => {
    expect(driver.activeDialog).toBe(undefined)
    driver.dialogHandler('foobar' as unknown as Dialog)
    expect(driver.activeDialog).toBe('foobar')
})

test('framenavigatedHandler for main frame', () => {
    driver.elementStore.clear = vi.fn()

    const frameMock = { url: vi.fn().mockReturnValue('foobar'), parentFrame:vi.fn().mockReturnValue(null) }
    driver.framenavigatedHandler(frameMock as unknown as Frame)
    expect(driver.currentFrameUrl).toBe('foobar')
    expect(driver.elementStore.clear).toBeCalledTimes(1)
})

test('framenavigatedHandler for child frame', () => {
    driver.elementStore.clear = vi.fn()

    const frameMock = { url: vi.fn().mockReturnValue('foobar'), parentFrame:vi.fn().mockReturnValue({}) }
    driver.framenavigatedHandler(frameMock as unknown as Frame)
    expect(driver.currentFrameUrl).toBe('foobar')
    expect(driver.elementStore.clear).toBeCalledTimes(1)
    expect(driver.elementStore.clear).toBeCalledWith(frameMock)
})

test('setTimeouts with not value', () => {
    driver.timeouts = { set: vi.fn(), get: vi.fn().mockReturnValue(123) } as any
    driver.windows = { get: vi.fn().mockReturnValue(page) } as any
    driver.setTimeouts()
    expect(page.setDefaultTimeout).toBeCalledTimes(2)
    expect(driver.timeouts.set).toBeCalledTimes(0)
})

test('setTimeouts with implicit timeout', () => {
    driver.setTimeouts()
    driver.setTimeouts(222)
    expect(driver.timeouts).toMatchSnapshot()
})

test('setTimeouts with implicit and pageLoad timeout', () => {
    driver.setTimeouts()
    driver.setTimeouts(222)
    driver.setTimeouts(222, 333)
    expect(driver.timeouts).toMatchSnapshot()
})

test('setTimeouts with all timeouts', () => {
    driver.setTimeouts()
    driver.setTimeouts(222)
    driver.setTimeouts(222, 333)
    driver.setTimeouts(222, 333, 444)
    expect(driver.timeouts).toMatchSnapshot()
})

test('getPageHandle', () => {
    driver.windows = { get: vi.fn().mockReturnValue('foobar') } as any
    expect(driver.getPageHandle()).toBe('foobar')

    driver.currentFrame = 'barfoo' as any
    expect(driver.getPageHandle()).toBe('foobar')

    expect(driver.getPageHandle(true)).toBe('barfoo')

    driver.windows = { get: vi.fn().mockReturnValue(undefined) } as any
    expect(() => driver.getPageHandle()).toThrow(/find page handle/)

    delete driver.currentWindowHandle
    expect(() => driver.getPageHandle()).toThrow(/no current window/)
})

test('_targetCreatedHandler', async () => {
    expect(driver.windows.size).toBe(1)
    await driver['_targetCreatedHandler']({ page: vi.fn().mockReturnValue(Promise.resolve(null)) } as any)
    expect(driver.windows.size).toBe(1)
    await driver['_targetCreatedHandler']({ page: vi.fn().mockReturnValue(Promise.resolve('foobar')) } as any)
    expect(driver.windows.size).toBe(2)
})

test('_targetDestroyedHandler', async () => {
    const target = { page: vi.fn().mockReturnValue(Promise.resolve('foobar')) } as any
    await driver['_targetCreatedHandler'](target)
    expect(driver.windows.size).toBe(2)
    await driver['_targetDestroyedHandler'](target)
    expect(driver.windows.size).toBe(1)
})
