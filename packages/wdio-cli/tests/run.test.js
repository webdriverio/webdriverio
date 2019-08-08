import { launch, launchCallback } from '../src/run'
import Launcher from '../src/launcher'

jest.mock('../src/launcher')

describe('launch', () => {
    it('should pass callback to launcher', () => {
        launch('configFile', 'argv')
        expect(Launcher).toBeCalledWith('configFile', 'argv')
        expect(Launcher.mock.instances[0].run).toBeCalledWith(launchCallback)
    })
})
