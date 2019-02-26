import Launcher from '../src/launcher'
import logger from '@wdio/logger'

const caps = { maxInstances: 1, browserName: 'chrome' }

describe('launcher', () => {
    let launcher

    beforeEach(() => launcher = new Launcher('./'))

    describe('capabilities', () => {
        it('should NOT fail when capabilities are passed', async () => {
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: './' }, [caps, caps])
            expect(launcher.runSpecs).toBeCalled()
            expect(exitCode).toEqual(0)
            expect(logger().error).not.toBeCalled()
        })

        it('should fail when no capabilities are passed', async () => {
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: './' })
            expect(exitCode).toEqual(1)
            expect(logger().error).toBeCalledWith('Missing capabilities, exiting with failure')
        })

        it('should fail when no capabilities are set', async () => {
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: './' }, [])
            expect(exitCode).toEqual(1)
            expect(logger().error).toBeCalledWith('Missing capabilities, exiting with failure')
        })
    })

    describe('hasTriggeredExitRoutine', () => {
        it('should return false if there are specs left of running when hasTriggeredExitRoutine is false', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.hasTriggeredExitRoutine = false
            const returnValue = launcher.runSpecs()
            expect(returnValue).toEqual(false)
        })

        it('should return true when hasTriggeredExitRoutine is true', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.hasTriggeredExitRoutine = true
            const returnValue = launcher.runSpecs()
            expect(returnValue).toEqual(true)
        })
    })

    describe('endHandler', () => {
        it('should emit and resolve failed status', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            launcher.schedule = [{ cid: 1 }, { cid: 2}]
            launcher.interface.emit = jest.fn()
            launcher.resolve = jest.fn()
            launcher.endHandler({ cid: 1, exitCode: 1 })
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: 1, passed: false })
            expect(launcher.resolve).toBeCalledWith(1)
        })

        it('should emit and resolve passed status', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            launcher.schedule = [{ cid: 1 }, { cid: 2}]
            launcher.interface.emit = jest.fn()
            launcher.resolve = jest.fn()
            launcher.endHandler({ cid: 1, exitCode: 0 })
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: 1, passed: true })
            expect(launcher.resolve).toBeCalledWith(0)
        })
    })
})
