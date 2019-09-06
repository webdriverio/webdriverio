import fs from 'fs'
import Launcher from './../../src/launcher'
import Watcher from './../../src/watcher'
import {
    handler,
    // launch
} from './../../src/commands/run'
import * as utils from './../../src/utils'

jest.mock('./../../src/launcher', () => class {
    run() {
        return Promise.resolve('launcher-test')
    }
})
jest.mock('./../../src/watcher', () => class {
    watch() {
        return 'watching-test'
    }
})

describe('Command: run', () => {
    beforeAll(() => {
        jest.spyOn(fs, 'existsSync').mockImplementation(() => false)
        jest.spyOn(utils, 'missingConfigurationPrompt').mockImplementation(() => {})
    })

    beforeEach(() => {
        jest.spyOn(process, 'exit').mockImplementation(() => {})
        jest.spyOn(console, 'error')
    })

    it('should call missingConfigurationPrompt if no config found', async () => {
        await handler({ configPath: 'foo/bar' })

        expect(utils.missingConfigurationPrompt).toHaveBeenCalled()
        expect(utils.missingConfigurationPrompt)
            .toHaveBeenCalledWith('run', 'No WebdriverIO configuration found in "foo/bar"')
    })

    it('should use Watcher if "--watch" flag is passed', async () => {
        const watcher = await handler({ configPath: 'foo/bar', watch: true })

        expect(watcher).toBe('watching-test')
    })

    // it.only('should pass the correct config path and params to the launch function', async () => {
    //     process.stdin.isTTY = true
    //     const launch = jest.fn()

    //     const promise = await handler({ configPath: 'foo/bar', framework: 'test', spec: 'test-spec' })
    //     expect(launch).toHaveBeenCalled()
    // })

    afterEach(() => {
        process.exit.mockClear()
    })

    afterAll(() => {
        fs.existsSync.mockClear()
        utils.missingConfigurationPrompt.mockClear()
        Launcher.mockClear()
        Watcher.mockClear()
    })
})
