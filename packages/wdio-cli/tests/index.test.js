import { run } from './../src/index'
import { handler, builder } from './../src/commands/run'

jest.mock('./../src/commands/run')
jest.mock('yargs', () => {
    return {
        commandDir: jest.fn(() => ({
            help: jest.fn(function () {
                this.argv = {
                    _: ['wdio.conf.js']
                }
                return {
                    argv: this.argv,
                    option: (a, b) => this.argv[a] = b,
                }
            })
        }))
    }
})

describe('index', () => {
    it('should call config if no known command is used', async () => {
        await run()

        expect(handler).toHaveBeenCalledWith({
            _: ['wdio.conf.js'],
            ...builder,
            configPath: `${process.cwd()}/wdio.conf.js`
        })
    })
})
