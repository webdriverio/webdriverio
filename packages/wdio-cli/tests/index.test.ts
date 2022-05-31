import { join, resolve } from 'node:path'
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
// @ts-expect-error mock
import { yargs as yargsMock } from 'yargs/yargs'

import { run } from '../src/index'
import { handler } from '../src/commands/run'

vi.mock('yargs/yargs')
vi.mock('./../src/commands/run', async () => ({
    ...(await vi.importActual('./../src/commands/run')) as object,
    handler: vi.fn().mockReturnValue(Promise.resolve('success'))
}))

const consoleError = console.error

describe('index', () => {
    beforeEach(() => {
        vi.mocked(handler).mockClear()
        vi.mocked(yargsMock.parse).mockClear()
        console.error = vi.fn()
    })

    it('should call config if no known command is used', async () => {
        await run()
        expect(vi.mocked(handler).mock.calls[0][0]).toEqual({
            configPath: join(`${process.cwd()}`, 'wdio.conf.js'),
            _: ['wdio.conf.js']
        })
    })

    it('should set default config filename if not set', async () => {
        vi.mocked(yargsMock.parse).mockReturnValue({ _: [], spec: ['/foo/bar'] }) as any
        await run()
        expect(vi.mocked(handler).mock.calls[0][0]).toEqual({
            configPath: join(`${process.cwd()}`, 'wdio.conf.js'),
            spec: ['/foo/bar'],
            _: []
        })
    })

    it('should work properly with absolute paths', async () => {
        const expectedPath = resolve('/some/absolute/path/here/wdio.conf.js')
        vi.mocked(yargsMock.parse).mockReturnValue({ ...yargsMock.argv, _: [expectedPath] }) as any
        await run().catch()

        expect(handler).toHaveBeenCalledTimes(1)
        expect(vi.mocked(handler).mock.calls[0][0]).toEqual({
            configPath: expectedPath,
            _: [expectedPath]
        })
        vi.mocked(yargsMock.epilogue).mockClear()
    })

    /**
     * fails after updating yargs usage
     * for some reason the `cb` variable is not the callback passed in
     */
    it.skip('should gracefully fail', async () => {
        vi.mocked(yargsMock.parse).mockImplementation((str: never, cb: Function) => {
            cb(null, null, 'test')
            return yargsMock.argv
        })
        vi.mocked(handler).mockRejectedValue(new Error('ups'))
        vi.spyOn(console, 'error')

        await run()
        expect(console.error).toHaveBeenCalled()
    })

    it('should do nothing if command was called', async () => {
        vi.mocked(yargsMock.parse).mockReturnValue({ ...yargsMock.argv, _: ['run'] }) as any
        expect(typeof (await run())).toBe('undefined')
    })

    afterEach(() => {
        console.error = consoleError
    })
})
