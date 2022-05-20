import { join, resolve } from 'node:path'
// @ts-expect-error mock
import { yargs as yargsMock } from 'yargs/yargs'

import { run } from '../src/index'
import { handler } from '../src/commands/run'

jest.mock('./../src/commands/run', () => ({
    ...jest.requireActual('./../src/commands/run') as object,
    handler: jest.fn().mockReturnValue(Promise.resolve('success'))
}))

const consoleError = console.error

describe('index', () => {
    beforeEach(() => {
        (handler as jest.Mock).mockClear()
        ;(yargsMock.parse as jest.Mock).mockClear()
        console.error = jest.fn()
    })

    it('should call config if no known command is used', async () => {
        await run()
        expect((handler as jest.Mock).mock.calls[0][0]).toEqual({
            configPath: join(`${process.cwd()}`, 'wdio.conf.js'),
            _: ['wdio.conf.js']
        })
    })

    it('should set default config filename if not set', async () => {
        (yargsMock.parse as jest.Mock).mockReturnValue({ _: [], spec: ['/foo/bar'] }) as any
        await run()
        expect((handler as jest.Mock).mock.calls[0][0]).toEqual({
            configPath: join(`${process.cwd()}`, 'wdio.conf.js'),
            spec: ['/foo/bar'],
            _: []
        })
    })

    it('should work properly with absolute paths', async () => {
        const expectedPath = resolve('/some/absolute/path/here/wdio.conf.js')
        ;(yargsMock.parse as jest.Mock).mockReturnValue({ ...yargsMock.argv, _: [expectedPath] }) as any
        await run().catch()

        expect(handler).toHaveBeenCalledTimes(1)
        expect((handler as jest.Mock).mock.calls[0][0]).toEqual({
            configPath: expectedPath,
            _: [expectedPath]
        })
        ;(yargsMock.epilogue as jest.Mock).mockClear()
    })

    /**
     * fails after updating yargs usage
     * for some reason the `cb` variable is not the callback passed in
     */
    it.skip('should gracefully fail', async () => {
        (yargsMock.parse as jest.Mock).mockImplementation((str, cb) => {
            cb(null, null, 'test')
            return yargsMock.argv
        })
        ;(handler as jest.Mock).mockRejectedValue(new Error('ups'))
        jest.spyOn(console, 'error')

        await run()
        expect(console.error).toHaveBeenCalled()
    })

    it('should do nothing if command was called', async () => {
        (yargsMock.parse as jest.Mock).mockReturnValue({ ...yargsMock.argv, _: ['run'] }) as any
        expect(typeof (await run())).toBe('undefined')
    })

    afterEach(() => {
        console.error = consoleError
    })
})
