import DevToolsDriver from '../src/devtoolsdriver'

jest.mock('fs', () => ({
    readdirSync: jest.fn().mockReturnValue([
        '/foo/bar/click.js',
        '/foo/bar/getAttribute.js'
    ])
}))

DevToolsDriver.requireCommand = jest.fn()

const page = {
    on: jest.fn(),
    setDefaultTimeout: jest.fn()
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
    page.setDefaultTimeout.mockClear()
    DevToolsDriver.requireCommand.mockClear()
    driver = new DevToolsDriver('browser', [page])
})

test('can be initiated', () => {
    expect(driver.commands).toEqual({ click: undefined, getAttribute: undefined })
    expect(driver.browser).toBe('browser')
    expect(page.on).toBeCalledWith('dialog', expect.any(Function))
    expect(page.on).toBeCalledWith('framenavigated', expect.any(Function))
})

test('should throw if command is called that is not implemented', () => {
    const command = driver.register({ command: 'click' })
    expect(command).toThrow('Not yet implemented')
})

test('should return proper result', async () => {
    driver.commands.elementClick = (...args) => new Promise(
        (resolve) => setTimeout(() => resolve(...args), 100))

    const command = driver.register(commandMock)

    const errorMsg = await command().catch((e) => e.message)
    await expect(errorMsg).toContain('Wrong parameters applied')

    const errorMsg2 = await command('123').catch((e) => e.message)
    await expect(errorMsg2).toContain('Wrong parameters applied')

    const errorMsg3 = await command('123', 'some text',  'some value')
    await expect(errorMsg3).toEqual({
        elementId: '123',
        text: 'some text',
        value: 'some value'
    })
})

test('should throw if command throws', async () => {
    driver.commands.elementClick = () => new Promise(
        (resolve, reject) => setTimeout(() => reject(new Error('foobar')), 100))

    const command = driver.register(commandMock)

    const errorMsg3 = await command('123', 'some text',  'some value')
        .catch((e) => e.message)
    await expect(errorMsg3).toEqual('foobar')
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
    expect(driver.timeouts.set).toBeCalledTimes(1)
    expect(driver.timeouts.set).toBeCalledWith('implicit', 222)
})

test('setTimeouts with implicit and pageLoad timeout', () => {
    driver.setTimeouts()
    driver.setTimeouts(222)
    driver.setTimeouts(222, 333)
    expect(driver.timeouts.set).toBeCalledTimes(2)
    expect(driver.timeouts.set).toBeCalledWith('implicit', 222)
    expect(driver.timeouts.set).toBeCalledWith('pageLoad', 333)
})

test('setTimeouts with all timeouts', () => {
    driver.setTimeouts()
    driver.setTimeouts(222)
    driver.setTimeouts(222, 333)
    driver.setTimeouts(222, 333, 444)
    expect(driver.timeouts.set).toBeCalledTimes(3)
    expect(driver.timeouts.set).toBeCalledWith('implicit', 222)
    expect(driver.timeouts.set).toBeCalledWith('pageLoad', 333)
    expect(driver.timeouts.set).toBeCalledWith('script', 444)
})
