import { run } from './../src/index'
import { handler } from './../src/commands/run'
import yargs from 'yargs'

jest.mock('./../src/commands/run', () => ({
    ...jest.requireActual('./../src/commands/run'),
    handler: jest.fn(({ wrongConfig }) => wrongConfig ? Promise.reject({ stack: 'error' }) : Promise.resolve())
}))

describe('index', () => {
    it('should call config if no known command is used', async () => {
        await run().catch()

        expect(handler).toHaveBeenCalledWith({
            _: ['wdio.conf.js'],
            configPath: `${process.cwd()}/wdio.conf.js`
        })
    })

    it('should work properly with absolute paths', async () => {
        const expectedPath = '/some/absolute/path/here/wdio.conf.js'
        jest.spyOn(yargs, 'epilogue').mockReturnValue({ argv: { _: [expectedPath] } })

        await run().catch()

        expect(handler).toHaveBeenCalledWith({
            _: [expectedPath],
            configPath: expectedPath
        })
    })

    it('should gracefully fail', async () => {
        jest.spyOn(yargs, 'parse').mockImplementation((str, cb) => cb(null, null, 'test'))
        jest.spyOn(console, 'error')

        try {
            await run()
        } catch (error) {
            expect(error).toBeTruthy()
            expect(console.error).toHaveBeenCalled()
        }
    })
})
