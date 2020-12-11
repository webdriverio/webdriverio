import yargs from 'yargs'

import { run } from '../src/index'
import { handler } from '../src/commands/run'
import { join, resolve } from 'path'

jest.mock('./../src/commands/run', () => ({
    ...jest.requireActual('./../src/commands/run') as object,
    handler: jest.fn(
        (argv) => argv && argv.configPath === '/not/existing'
            ? Promise.reject({ stack: 'error' })
            : Promise.resolve('success'))
}))

const origArgv = { ...yargs.argv }
const consoleError = console.error

describe('index', () => {
    beforeEach(() => {
        (handler as jest.Mock).mockClear()
        yargs.argv = origArgv
        console.error = jest.fn()
    })

    it('should call config if no known command is used', async () => {
        await run().catch()
        expect((handler as jest.Mock).mock.calls[0][0]).toEqual({
            configPath: join(`${process.cwd()}`, 'wdio.conf.js')
        })
    })

    it('should set default config filename if not set', async () => {
        yargs.argv = { _: [] } as any
        await run().catch()

        expect((handler as jest.Mock).mock.calls[0][0]).toEqual({
            configPath: join(`${process.cwd()}`, 'wdio.conf.js')
        })
    })

    it('should work properly with absolute paths', async () => {
        const expectedPath = resolve('/some/absolute/path/here/wdio.conf.js')
        yargs.argv._[0] = expectedPath

        await run().catch()

        expect(handler).toHaveBeenCalledTimes(1)
        expect((handler as jest.Mock).mock.calls[0][0])
            .toEqual({ configPath: expectedPath })
        ;(yargs.epilogue as jest.Mock).mockClear()
    })

    it('should gracefully fail', async () => {
        (yargs.parse as jest.Mock).mockImplementation((str, cb) => cb(null, null, 'test'))
        yargs.argv._[0] = '/not/existing'
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

    afterEach(() => {
        console.error = consoleError
    })
})
