import { launch } from '../src/commands/run'
import Launcher from '../src/launcher'

jest.mock('../src/launcher', () => jest.fn().mockImplementation(function(conf, result) {
    return {
        run: () => Number.isInteger(result) ? Promise.resolve(result) : Promise.reject(result)
    }
}))

describe('launch', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})

    it('should exit with code 0', async () => {
        await launch('configFile', 0)
        expect(Launcher).toBeCalledWith('configFile', 0)
        expect(Launcher.mock.instances).toHaveLength(1)

        expect(process.exit).toBeCalledWith(0)
    })

    it('should exit with code 1', async () => {
        await launch('configFile', 1)
        expect(Launcher).toBeCalledWith('configFile', 1)
        expect(Launcher.mock.instances).toHaveLength(1)
    })

    it('should catch errors', async () => {
        await launch('configFile', 'foobar')
        expect(Launcher).toBeCalledWith('configFile', 'foobar')
        expect(Launcher.mock.instances).toHaveLength(1)

        expect(global.console.error).toBeCalledWith('foobar')
        expect(process.exit).toBeCalledWith(1)
    })

    afterEach(() => {
        Launcher.mockClear()
        global.console.error.mockClear()
    })

    afterAll(() => {
        console.error.mockRestore()
    })
})
