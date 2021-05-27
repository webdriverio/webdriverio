import DevToolsDriver from '../src/devtoolsdriver'
import type { Dialog } from 'puppeteer-core/lib/cjs/puppeteer/common/Dialog'
import type { Frame } from 'puppeteer-core/lib/cjs/puppeteer/common/FrameManager'

const expect = global.expect as unknown as jest.Expect

jest.mock('fs', () => ({
    readdirSync: jest.fn().mockReturnValue([
        '/foo/bar/click.js',
        '/foo/bar/getAttribute.ts',
        '/foo/bar/getAttribute.d.ts'
    ])
}))

DevToolsDriver.requireCommand = jest.fn().mockImplementation((filePath) => {
    if (filePath.includes('click')) {
        return 'clickCommand'
    }

    if (filePath.includes('getAttribute')) {
        return 'getAttributeCommand'
    }

    return {}
})

let evaluateCommandCalls = 0
const executionContext = {
    evaluate: jest.fn()
}

const setNormalPageLoadBehavior = () => executionContext.evaluate.mockImplementation(() => Promise.resolve(++evaluateCommandCalls % 2 === 1
    ? '1'
    : 'complete'
))

const frame = {
    executionContext: jest.fn().mockImplementation(() => Promise.resolve(executionContext))
}

const page = {
    on: jest.fn(),
    once: jest.fn(),
    setDefaultTimeout: jest.fn(),
    mainFrame: jest.fn(),
    frames: jest.fn().mockReturnValue([frame])
}

const browser = {
    on: jest.fn(),
    pages: jest.fn().mockImplementation(async () => {
        page.mainFrame = jest.fn().mockImplementation(() => frame)
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
    ;(DevToolsDriver.requireCommand as jest.Mock).mockClear()
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
    expect(command).toThrow('Command "click" is not yet implemented')
})

test('should return proper result', async () => {
    driver.commands.elementClick = (...args: any[]) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const emit = jest.fn()
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

    const emit = jest.fn()
    const errorMsg3 = await command.call({ emit } as any, '123', 'some text', ['some value'])
        .catch((e) => e.message)
    await expect(errorMsg3).toEqual('foobar')
})

test('should rerun command if it was executed within navigation', async () => {
    expect.assertions(4)
    let wasCommandCalled = false
    driver.commands.elementClick = jest.fn().mockImplementation(
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
    const command = driver.register(commandMock)

    setTimeout(() => {
        expect(page.once).toBeCalledWith('load', expect.any(Function))
        page.once.mock.calls.pop().pop()()
    }, 150)

    const emit = jest.fn()
    const result = await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(driver.commands.elementClick).toBeCalledTimes(2)
    expect(result).toBe(null)
    expect(emit.mock.calls).toMatchSnapshot()
})

test('throws error if navigation takes too long', async () => {
    driver.timeouts.set('pageLoad', 150)
    let wasCommandCalled = false
    driver.commands.elementClick = jest.fn().mockImplementation(
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

    const emit = jest.fn()
    const command = driver.register(commandMock)
    const result = await command.call({ emit } as any, '123', 'some text', ['some value'])
        .catch((err) => err.message)
    expect(result).toBe('page load timeout')
})

test('should wait for page load to be complete before executing the command', async () => {
    executionContext.evaluate.mockReset()
    executionContext.evaluate = jest.fn()
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('loading')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('loading')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('interactive')
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('complete')

    driver.commands.elementClick = (...args: any[]) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const emit = jest.fn()
    const command = driver.register(commandMock)
    await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(executionContext.evaluate.mock.calls).toHaveLength(8)
})

test('should use page from target if we are currently in a frame', async () => {
    driver.getPageHandle = jest.fn().mockReturnValue(frame)
    executionContext.evaluate = jest.fn().mockReturnValueOnce('complete')

    driver.commands.elementClick = () => Promise.resolve(null)

    const emit = jest.fn()
    const command = driver.register(commandMock)
    await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(browser.pages).toBeCalledTimes(1)
})

test('should rerun command if no execution context could be found', async () => {
    executionContext.evaluate.mockReset()
    executionContext.evaluate = jest.fn()
        .mockRejectedValueOnce(new Error('ups'))
        .mockRejectedValueOnce(new Error('ups'))
        .mockResolvedValueOnce('1')
        .mockResolvedValueOnce('complete')

    driver.commands.elementClick = (...args: any[]) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const emit = jest.fn()
    const command = driver.register(commandMock)
    await command.call({ emit } as any, '123', 'some text', ['some value'])
    expect(executionContext.evaluate.mock.calls).toHaveLength(4)
})

test('should throw if execution context can not be established', async () => {
    expect.assertions(1)

    executionContext.evaluate.mockReset()
    executionContext.evaluate = jest.fn()
        .mockImplementation(() => new Promise(
            (resolve, reject) => setTimeout(
                () => reject(new Error('ups')), 100)))

    driver.timeouts.set('pageLoad', 200)
    driver.commands.elementClick = (...args: any[]) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const command = driver.register(commandMock)

    try {
        const emit = jest.fn()
        await command.call({ emit } as any, '123', 'some text', ['some value'])
    } catch (err) {
        expect(err.message).toBe('ups')
    }
})

test('dialogHandler', () => {
    expect(driver.activeDialog).toBe(undefined)
    driver.dialogHandler('foobar' as unknown as Dialog)
    expect(driver.activeDialog).toBe('foobar')
})

test('framenavigatedHandler for main frame', () => {
    driver.elementStore.clear = jest.fn()

    const frameMock = { url: jest.fn().mockReturnValue('foobar'), parentFrame:jest.fn().mockReturnValue(null) }
    driver.framenavigatedHandler(frameMock as unknown as Frame)
    expect(driver.currentFrameUrl).toBe('foobar')
    expect(driver.elementStore.clear).toBeCalledTimes(1)
})

test('framenavigatedHandler for child frame', () => {
    driver.elementStore.clear = jest.fn()

    const frameMock = { url: jest.fn().mockReturnValue('foobar'), parentFrame:jest.fn().mockReturnValue({}) }
    driver.framenavigatedHandler(frameMock as unknown as Frame)
    expect(driver.currentFrameUrl).toBe('foobar')
    expect(driver.elementStore.clear).toBeCalledTimes(1)
    expect(driver.elementStore.clear).toBeCalledWith(frameMock)
})

test('setTimeouts with not value', () => {
    driver.timeouts = { set: jest.fn(), get: jest.fn().mockReturnValue(123) } as any
    driver.windows = { get: jest.fn().mockReturnValue(page) } as any
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
    driver.windows = { get: jest.fn().mockReturnValue('foobar') } as any
    expect(driver.getPageHandle()).toBe('foobar')

    driver.currentFrame = 'barfoo' as any
    expect(driver.getPageHandle()).toBe('foobar')

    expect(driver.getPageHandle(true)).toBe('barfoo')

    driver.windows = { get: jest.fn().mockReturnValue(undefined) } as any
    expect(() => driver.getPageHandle()).toThrow(/find page handle/)

    delete driver.currentWindowHandle
    expect(() => driver.getPageHandle()).toThrow(/no current window/)
})

test('_targetCreatedHandler', async () => {
    expect(driver.windows.size).toBe(1)
    await driver['_targetCreatedHandler']({ page: jest.fn().mockReturnValue(Promise.resolve(null)) } as any)
    expect(driver.windows.size).toBe(1)
    await driver['_targetCreatedHandler']({ page: jest.fn().mockReturnValue(Promise.resolve('foobar')) } as any)
    expect(driver.windows.size).toBe(2)
})

test('_targetDestroyedHandler', async () => {
    const target = { page: jest.fn().mockReturnValue(Promise.resolve('foobar')) } as any
    await driver['_targetCreatedHandler'](target)
    expect(driver.windows.size).toBe(2)
    await driver['_targetDestroyedHandler'](target)
    expect(driver.windows.size).toBe(1)
})
