import { launch } from '../src/run'
import Launcher from '../src/launcher'

jest.mock('../src/launcher', () => jest.fn().mockImplementation(function(conf, result) {
    return {
        run: jest.fn().mockImplementation(() => Number.isInteger(result) ? Promise.resolve(result) : Promise.reject(result))
    }
}))

describe('launch', () => {
    process.exit = jest.fn()
    global.console.error = jest.fn()

    it('should exit with code 0', async () => {
        launch('configFile', 0)
        expect(Launcher).toBeCalledWith('configFile', 0)
        expect(Launcher.mock.instances).toHaveLength(1)

        await Launcher.mock.results[0].value.run.mock.results[0].value
        expect(process.exit).toBeCalledWith(0)
    })

    it('should exit with code 1', async () => {
        launch('configFile', 1)
        expect(Launcher).toBeCalledWith('configFile', 1)
        expect(Launcher.mock.instances).toHaveLength(1)

        await Launcher.mock.results[0].value.run.mock.results[0].value
        expect(process.exit).toBeCalledWith(1)
    })

    it('should catch errors', async () => {
        launch('configFile', 'foobar')
        expect(Launcher).toBeCalledWith('configFile', 'foobar')
        expect(Launcher.mock.instances).toHaveLength(1)

        let error
        try {
            await Launcher.mock.results[0].value.run.mock.results[0].value
        } catch (err) {
            error = err
        }
        expect(error).toBe('foobar')
        expect(global.console.error).toBeCalled
        expect(process.exit).toBeCalledWith(1)
    })

    afterEach(() => {
        Launcher.mockClear()
        global.console.error.mockClear()
        process.exit.mockClear()
    })
})
