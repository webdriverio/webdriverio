import path from 'path'
import * as cucumber from 'cucumber'
import CucumberAdapterFactory, { CucumberAdapter } from '../src'
import { NOOP } from '../src/constants'
//import { executeHooksWithArgs } from '@wdio/config'

process.send(NOOP)

const feature = [path.join(__dirname, '/fixtures/features/async.feature')]

global.browser = {
    config: {},
    options: {},
    capabilities: {
        device: '',
        os: 'OS X',
        os_version: 'Sierra',
        browserName: 'chrome'
    }
}

jest.mock('cucumber', () => ({
    supportCodeLibraryBuilder: {
        reset: jest.fn(),
        finalize: jest.fn()
    },
    setDefaultTimeout: jest.fn(),
    setDefinitionFunctionWrapper: jest.fn(),
    getTestCasesFromFilesystem: jest.fn(),
    PickleFilter: jest.fn(),
    Runtime: jest.fn().mockImplementation(() => ({
        start: jest.fn().mockImplementation(() => true)
    }))
}))

const wdioReporter = {
    write: jest.fn(),
    emit: jest.fn(),
    on: jest.fn()
}

test('comes with a factory', async () => {
    expect(typeof CucumberAdapterFactory.run).toBe('function')
})

describe('register compilers', () => {
    // what is '/fixtures/bar-definition.js' ?
    const conf = {
        cucumberOpts: {
            compiler: [],
            require: ['/fixtures/bar-definition.js'],
        }
    }

    it('should throw an error when no compiler is defined', () => {
        const adapter = new CucumberAdapter(0, conf, feature, {}, wdioReporter)

        expect(() => adapter.registerCompilers())
            .toThrow('A compiler must be defined')
    })
})

test('should properly set up cucumber', async () => {
    const adapter = new CucumberAdapter(
        '0-2',
        { cucumberOpts: { compiler: ['js:@babel/register'] } },
        ['/foo/bar.feature'],
        { browserName: 'chrome' },
        wdioReporter
    )
    adapter.registerCompilers = jest.fn()
    adapter.loadSpecFiles = jest.fn()
    adapter.wrapSteps = jest.fn()
    const result = await adapter.run()
    expect(result).toBe(0)

    expect(adapter.registerCompilers).toBeCalled()
    expect(adapter.loadSpecFiles).toBeCalled()
    expect(adapter.wrapSteps).toBeCalled()
    expect(cucumber.setDefaultTimeout).toBeCalledWith(60000)
    expect(cucumber.supportCodeLibraryBuilder.reset).toBeCalled()

    // what are these comment lines from Mocha?
    // expect(executeHooksWithArgs.mock.calls).toHaveLength(2)
    // expect(adapter.mocha.runner.on.mock.calls).toHaveLength(Object.keys(EVENTS).length)
    // expect(adapter.mocha.runner.suite.beforeAll).toBeCalled()
    // expect(adapter.mocha.runner.suite.beforeEach).toBeCalled()
    // expect(adapter.mocha.runner.suite.afterEach).toBeCalled()
    // expect(adapter.mocha.runner.suite.afterAll).toBeCalled()
    // expect(adapter.mocha.addFile).toBeCalledWith('/foo/bar.test.js')
})
