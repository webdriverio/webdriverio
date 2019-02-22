import Launcher from '../src/launcher'
import logger from '@wdio/logger'

Launcher.prototype.runSpecs = jest.fn().mockReturnValue(true)

const caps = { maxInstances: 1, exclude: [], browserName: 'chrome' }

describe('launcher', () => {
    let launcher

    beforeEach(() => launcher = new Launcher('./'))

    it('should NOT fail when capabilities are passed', async () => {
        const exitCode = await launcher.runMode({ specs: './' }, [caps, caps])
        expect(launcher.runSpecs).toBeCalled()
        expect(exitCode).toEqual(0)
        expect(logger().error).not.toBeCalled()
    })

    it('should fail when no capabilities are passed', async () => {
        const exitCode = await launcher.runMode({ specs: './' })
        expect(exitCode).toEqual(1)
        expect(logger().error).toBeCalledWith('Missing capabilities, exiting with failure')
    })

    it('should fail when no capabilities are set', async () => {
        const exitCode = await launcher.runMode({ specs: './' }, [])
        expect(exitCode).toEqual(1)
        expect(logger().error).toBeCalledWith('Missing capabilities, exiting with failure')
    })
})
