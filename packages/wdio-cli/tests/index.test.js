import yargs from 'yargs'

import { run } from './../src/index'
import { handler } from './../src/commands/run'
import { join, resolve } from 'path'

jest.mock('./../src/commands/run', () => ({
    ...jest.requireActual('./../src/commands/run'),
    handler: jest.fn(
        ({ wrongConfig }) => wrongConfig
            ? Promise.reject({ stack: 'error' })
            : Promise.resolve('success'))
}))

const origArgv = { ...yargs.argv }

describe('index', () => {
    beforeEach(() => {
        handler.mockClear()
        yargs.argv = origArgv
    })

    it('should call config if no known command is used', async () => {
        await run().catch()

        expect(handler).toHaveBeenCalledWith({
            _: ['wdio.conf.js'],
            configPath: join(`${process.cwd()}`, 'wdio.conf.js')
        })
    })

    it('should set default config filename if not set', async () => {
        yargs.argv = { _: [] }
        await run().catch()

        expect(handler).toHaveBeenCalledWith({
            _: [],
            configPath: join(`${process.cwd()}`, 'wdio.conf.js')
        })
    })

    it('should work properly with absolute paths', async () => {
        const expectedPath = resolve('/some/absolute/path/here/wdio.conf.js')
        yargs.argv._[0] = expectedPath

        await run({ spec: './foobar.js' }).catch()

        expect(handler).toHaveBeenCalledWith({
            _: [expectedPath],
            configPath: expectedPath
        })
        yargs.epilogue.mockClear()
    })

    it('should gracefully fail', async () => {
        yargs.parse.mockImplementation((str, cb) => cb(null, null, 'test'))
        yargs.argv.wrongConfig = true
        jest.spyOn(console, 'error')

        await run()
        expect(console.error).toHaveBeenCalled()
        delete yargs.argv.wrongConfig
    })

    it('should do nothing if command was called', async () => {
        yargs.argv._.push('run')
        expect(typeof (await run())).toBe('undefined')
        yargs.argv._.pop()
    })
})
