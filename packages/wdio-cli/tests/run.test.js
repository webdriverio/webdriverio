import { launch, cmdArgs } from '../src/commands/run'
import Launcher from '../src/launcher'

jest.mock('../src/launcher', () => jest.fn().mockImplementation((conf, result) => ({
    run: () => Number.isInteger(result) ? Promise.resolve(result) : Promise.reject(result)
})))

describe('launch', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('should exit with code 0', async () => {
        await launch('configFile', 0)
        expect(Launcher).toBeCalledWith('configFile', 0)
        expect(Launcher.mock.instances).toHaveLength(1)
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
        expect(console.error).toBeCalledWith('foobar')
    })

    afterEach(() => {
        Launcher.mockClear()
        console.error.mockRestore()
    })
})

describe('cmdArgs', () => {
    it('should not have default', () => {
        Object.values(cmdArgs).forEach(cmdArg => {
            expect(cmdArg.default).toBeUndefined()
        })
    })
})
