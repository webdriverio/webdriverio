import DevToolsDriver from '../src/devtoolsdriver'

jest.mock('fs', () => ({
    readdirSync: jest.fn().mockReturnValue([
        '/foo/bar/click.js',
        '/foo/bar/getAttribute.js'
    ])
}))

DevToolsDriver.requireCommand = jest.fn()

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

let driver

beforeEach(() => {
    page.on.mockClear()
    page.once.mockClear()
    page.setDefaultTimeout.mockClear()
    page.mainFrame.mockImplementation(() => frame)
    executionContext.evaluate.mockClear()
    setNormalPageLoadBehavior()
    DevToolsDriver.requireCommand.mockClear()
    driver = new DevToolsDriver(browser, [page])
    driver.timeouts.set('pageLoad', 100)
})

test('can be initiated', () => {
    expect(driver.commands).toEqual({ click: undefined, getAttribute: undefined })
    expect(driver.browser).toEqual(browser)
    expect(page.on).toBeCalledWith('dialog', expect.any(Function))
    expect(page.on).toBeCalledWith('framenavigated', expect.any(Function))
})

test('should throw if command is called that is not implemented', () => {
    const command = driver.register({ command: 'click' })
    expect(command).toThrow('Command "click" is not yet implemented')
})

test('should return proper result', async () => {
    driver.commands.elementClick = (...args) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const emit = jest.fn()
    const command = driver.register(commandMock)

    const errorMsg = await command.call({ emit }).catch((e) => e.message)
    await expect(errorMsg).toContain('Wrong parameters applied')

    const errorMsg2 = await command.call(emit, '123').catch((e) => e.message)
    await expect(errorMsg2).toContain('Wrong parameters applied')

    emit.mockReset()
    const errorMsg3 = await command.call({ emit }, '123', 'some text', ['some value'])
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
    const errorMsg3 = await command.call({ emit }, '123', 'some text', ['some value'])
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
    const result = await command.call({ emit }, '123', 'some text', ['some value'])
    expect(driver.commands.elementClick).toBeCalledTimes(2)
    expect(result).toBe(null)
    expect(emit.mock.calls).toMatchSnapshot()
})

test('should not throw if there are no pages', async () => {
    driver.windows.clear()
    driver.commands.deleteSession = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const emit = jest.fn()
    const command = driver.register({ command: 'deleteSession', variables: [], parameters: [] })

    await command.call({ emit })
    expect(driver.commands.deleteSession).toBeCalledTimes(1)
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
    const result = await command.call({ emit }, '123', 'some text', ['some value'])
        .catch((err) => err.message)
    expect(result).toBe('page load timeout')
})

test('should wait for page load to be complete before executing the command', async () => {
    executionContext.evaluate.mockReset()
    executionContext.evaluate = jest.fn()
        .mockReturnValueOnce('1')
        .mockReturnValueOnce('loading')
        .mockReturnValueOnce('1')
        .mockReturnValueOnce('loading')
        .mockReturnValueOnce('1')
        .mockReturnValueOnce('interactive')
        .mockReturnValueOnce('1')
        .mockReturnValueOnce('complete')

    driver.commands.elementClick = (...args) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const emit = jest.fn()
    const command = driver.register(commandMock)
    await command.call({ emit }, '123', 'some text', ['some value'])
    expect(executionContext.evaluate.mock.calls).toHaveLength(8)
})

test('should use page from target if we are currently in a frame', async () => {
    driver.getPageHandle = jest.fn().mockReturnValue(frame)
    executionContext.evaluate = jest.fn().mockReturnValueOnce('complete')

    driver.commands.elementClick = () => Promise.resolve(null)

    const emit = jest.fn()
    const command = driver.register(commandMock)
    await command.call({ emit }, '123', 'some text', ['some value'])
    expect(browser.pages).toBeCalledTimes(1)
})

test('should rerun command if no execution context could be found', async () => {
    executionContext.evaluate.mockReset()
    executionContext.evaluate = jest.fn()
        .mockReturnValueOnce(Promise.reject(new Error('ups')))
        .mockReturnValueOnce(Promise.reject(new Error('ups')))
        .mockReturnValueOnce(Promise.resolve('1'))
        .mockReturnValueOnce(Promise.resolve('complete'))

    driver.commands.elementClick = (...args) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const emit = jest.fn()
    const command = driver.register(commandMock)
    await command.call({ emit }, '123', 'some text', ['some value'])
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
    driver.commands.elementClick = (...args) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const command = driver.register(commandMock)

    try {
        const emit = jest.fn()
        await command.call({ emit }, '123', 'some text', ['some value'])
    } catch (err) {
        expect(err.message).toBe('ups')
    }
})

test('dialogHandler', () => {
    expect(driver.activeDialog).toBe(null)
    driver.dialogHandler('foobar')
    expect(driver.activeDialog).toBe('foobar')
})

test('framenavigatedHandler', () => {
    driver.elementStore.clear = jest.fn()

    const frameMock = { url: jest.fn().mockReturnValue('foobar') }
    driver.framenavigatedHandler(frameMock)
    expect(driver.currentFrameUrl).toBe('foobar')
    expect(driver.elementStore.clear).toBeCalledTimes(1)
})

test('setTimeouts with not value', () => {
    driver.timeouts = { set: jest.fn(), get: jest.fn().mockReturnValue(123) }
    driver.windows = { get: jest.fn().mockReturnValue(page) }
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
    driver.windows = { get: jest.fn().mockReturnValue('foobar') }
    expect(driver.getPageHandle()).toBe('foobar')

    driver.currentFrame = 'barfoo'
    expect(driver.getPageHandle()).toBe('foobar')

    expect(driver.getPageHandle(true)).toBe('barfoo')
})
