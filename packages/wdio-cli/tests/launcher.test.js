import Launcher from '../src/launcher'
import logger from '@wdio/logger'
import fs from 'fs-extra'

const caps = { maxInstances: 1, browserName: 'chrome' }

jest.mock('fs-extra')
global.console.log = jest.fn()

describe('launcher', () => {
    const emitSpy = jest.spyOn(process, 'emit')
    let launcher

    beforeEach(() => {
        emitSpy.mockClear()
        launcher = new Launcher('./')
    })

    describe('defaults', () => {
        it('should have default for the argv parameter', () => {
            expect(launcher.argv).toEqual({})
        })
    })

    describe('capabilities', () => {
        it('should NOT fail when capabilities are passed', async () => {
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: './' }, [caps, caps])
            expect(launcher.runSpecs).toBeCalled()
            expect(exitCode).toEqual(0)
            expect(logger().error).not.toBeCalled()
        })

        it('should fail if no specs were found', async () => {
            launcher.runSpecs = jest.fn()
            launcher.configParser.getSpecs = jest.fn().mockReturnValue([])
            const exitCode = await launcher.runMode({ specs: './' }, [caps, caps])
            expect(launcher.runSpecs).toBeCalledTimes(0)
            expect(exitCode).toBe(1)
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

        it('should start instance in multiremote', () => {
            launcher.runSpecs = jest.fn()
            launcher.getSpecsWithDataProviderAndRetries = jest.fn().mockReturnValue([{ files: ['./'], testData: '', retries: 2 }])
            launcher.isMultiremote = true
            launcher.runMode({ specs: './', specFileRetries: 2 }, { foo: { capabilities: { browserName: 'chrome' } } })

            expect(launcher.schedule).toHaveLength(1)
            expect(launcher.schedule[0].specs[0].retries).toBe(2)

            expect(typeof launcher.resolve).toBe('function')
            expect(launcher.runSpecs).toBeCalledTimes(1)
        })

        it('should ignore specFileRetries in watch mode', () => {
            launcher.runSpecs = jest.fn()
            launcher.runMode({ specs: './', specFileRetries: 2, watch: true }, [caps, caps])

            expect(launcher.schedule).toHaveLength(2)
            expect(launcher.schedule[0].specs[0].retries).toBe(0)
            expect(launcher.schedule[1].specs[0].retries).toBe(0)

            expect(launcher.runSpecs).toBeCalledTimes(1)
        })

        it('should apply maxInstancesPerCapability if maxInstances is not passed', () => {
            launcher.runSpecs = jest.fn()
            launcher.getSpecsWithDataProviderAndRetries = jest.fn().mockReturnValue([{ files: ['./'], testData: '', retries:3 }])
            launcher.runMode({ specs: './', specFileRetries: 3, maxInstancesPerCapability: 4 }, [{ browserName: 'chrome' }])

            expect(launcher.schedule).toHaveLength(1)
            expect(launcher.schedule[0].specs[0].retries).toBe(3)
            expect(launcher.schedule[0].availableInstances).toBe(4)

            expect(launcher.runSpecs).toBeCalledTimes(1)
        })
    })

    describe('getSpecsWithDataProviderAndRetries', () => {
        it('should return empty string as test data when configParser.getDataProviders() returns null', () => {
            launcher.configParser.getDataProviders = jest.fn().mockReturnValue(null)
            const config = { specFileRetries: 2 }
            const specs = launcher.getSpecsWithDataProviderAndRetries(config)

            expect(specs).toHaveLength(1)
            expect(specs[0].files).toHaveLength(1)
            expect(specs[0].files[0]).toBe('./tests/test1.js')
            expect(specs[0].retries).toBe(2)
            expect(specs[0].testData).toBe('')
        })

        it('should return empty string as test data when configParser.getDataProviders() returns undefined', () => {
            launcher.configParser.getDataProviders = jest.fn().mockReturnValue(undefined)
            const config = { specFileRetries: 3 }
            const specs = launcher.getSpecsWithDataProviderAndRetries(config)

            expect(specs).toHaveLength(1)
            expect(specs[0].files).toHaveLength(1)
            expect(specs[0].files[0]).toBe('./tests/test1.js')
            expect(specs[0].retries).toBe(3)
            expect(specs[0].testData).toBe('')
        })

        it('should return valid test data with one spec file when configParser.getDataProviders() returns valid value', () => {
            launcher.configParser.getDataProviders = jest.fn().mockReturnValue({ './tests/test1.js': [{ url: 'url1', title: 'title1' }, { url: 'url2', title: 'title2' }] })
            const config = { specFileRetries: 4 }
            const specs = launcher.getSpecsWithDataProviderAndRetries(config)

            expect(specs).toHaveLength(2)

            //testData1
            expect(specs[0].files).toHaveLength(1)
            expect(specs[0].files[0]).toBe('./tests/test1.js')
            expect(specs[0].retries).toBe(4)
            expect(specs[0].testData.url).toBe('url1')
            expect(specs[0].testData.title).toBe('title1')

            //testData2
            expect(specs[1].files).toHaveLength(1)
            expect(specs[1].files[0]).toBe('./tests/test1.js')
            expect(specs[1].retries).toBe(4)
            expect(specs[1].testData.url).toBe('url2')
            expect(specs[1].testData.title).toBe('title2')
        })

        it('should return valid test data with multiple specs when configParser.getDataProviders() returns valid value', () => {
            launcher.configParser.getDataProviders = jest.fn().mockReturnValue({ './tests/test1.js': [{ url: 'url1', title: 'title1' }, { url: 'url2', title: 'title2' }] })
            launcher.getSpecs = jest.fn().mockReturnValue(['./tests/test1.js', './tests/test2.js'])
            const config = { specFileRetries: 5 }
            const specs = launcher.getSpecsWithDataProviderAndRetries(config)

            expect(specs).toHaveLength(3)

            //test1 - testData1
            expect(specs[0].files).toHaveLength(1)
            expect(specs[0].files[0]).toBe('./tests/test1.js')
            expect(specs[0].retries).toBe(5)
            expect(specs[0].testData.url).toBe('url1')
            expect(specs[0].testData.title).toBe('title1')

            //test1 - testData2
            expect(specs[1].files).toHaveLength(1)
            expect(specs[1].files[0]).toBe('./tests/test1.js')
            expect(specs[1].retries).toBe(5)
            expect(specs[1].testData.url).toBe('url2')
            expect(specs[1].testData.title).toBe('title2')

            //test2 - empty testData
            expect(specs[2].files).toHaveLength(1)
            expect(specs[2].files[0]).toBe('./tests/test2.js')
            expect(specs[2].retries).toBe(5)
            expect(specs[2].testData).toBe('')
        })

        it('should handle test data injected for spec file which are excluded from the current test run gracefully', () => {
            launcher.configParser.getDataProviders = jest.fn().mockReturnValue({ './tests/test1.js': ['data'] })
            launcher.getSpecs = jest.fn().mockReturnValue(['./tests/test2.js'])
            const config = { specFileRetries: 1 }
            const specs = launcher.getSpecsWithDataProviderAndRetries(config)

            expect(specs).toHaveLength(1)

            //test2 - empty testData
            expect(specs[0].files).toHaveLength(1)
            expect(specs[0].files[0]).toBe('./tests/test2.js')
            expect(specs[0].retries).toBe(1)
            expect(specs[0].testData).toBe('')
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
            launcher.schedule = [{ cid: 1 }, { cid: 2 }]
            launcher.interface.emit = jest.fn()
            launcher.resolve = jest.fn()
            launcher.endHandler({ cid: 1, exitCode: 1 })
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: 1, passed: false })
            expect(launcher.resolve).toBeCalledWith(1)
        })

        it('should emit and resolve passed status', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            launcher.schedule = [{ cid: 1 }, { cid: 2 }]
            launcher.interface.emit = jest.fn()
            launcher.resolve = jest.fn()
            launcher.endHandler({ cid: 1, exitCode: 0 })
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: 1, passed: true })
            expect(launcher.resolve).toBeCalledWith(0)
        })

        it('should do nothing if not all specs are run', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.runSpecs = jest.fn().mockReturnValue(0)
            launcher.schedule = [{ cid: 1 }, { cid: 2 }]
            launcher.interface.emit = jest.fn()
            launcher.resolve = jest.fn()
            launcher.endHandler({ cid: 1, exitCode: 0 })
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: 1, passed: true })
            expect(launcher.resolve).toBeCalledTimes(0)
        })

        it('should reschedule when runner failed and retries remain', () => {
            launcher.schedule = [{ cid: 0, specs: [] }]
            launcher.endHandler({ cid: '0-5', exitCode: 1, retries: 1, specs: ['a.js'] })
            expect(launcher.schedule).toMatchObject([{ cid: 0, specs: [{ rid: '0-5', files: ['a.js'], retries: 0 }] }])
        })
    })

    describe('exitHandler', () => {
        it('should do nothing if no callback is given', () => {
            launcher.hasTriggeredExitRoutine = false
            launcher.interface = { sigintTrigger: jest.fn() }
            launcher.runner = { shutdown: jest.fn().mockReturnValue(Promise.resolve()) }

            launcher.exitHandler()

            expect(launcher.hasTriggeredExitRoutine).toBe(false)
            expect(launcher.interface.sigintTrigger).toBeCalledTimes(0)
            expect(launcher.runner.shutdown).toBeCalledTimes(0)
        })

        it('should do nothing if shutdown was called before', () => {
            launcher.hasTriggeredExitRoutine = true
            launcher.interface = { sigintTrigger: jest.fn() }
            launcher.runner = { shutdown: jest.fn().mockReturnValue(Promise.resolve()) }

            expect(launcher.exitHandler(() => 'foo')).toBe('foo')

            expect(launcher.hasTriggeredExitRoutine).toBe(true)
            expect(launcher.interface.sigintTrigger).toBeCalledTimes(0)
            expect(launcher.runner.shutdown).toBeCalledTimes(0)
        })

        it('should shutdown', () => {
            launcher.hasTriggeredExitRoutine = false
            launcher.interface = { sigintTrigger: jest.fn() }
            launcher.runner = { shutdown: jest.fn().mockReturnValue(Promise.resolve()) }

            launcher.exitHandler(jest.fn())

            expect(launcher.hasTriggeredExitRoutine).toBe(true)
            expect(launcher.interface.sigintTrigger).toBeCalledTimes(1)
            expect(launcher.runner.shutdown).toBeCalledTimes(1)
        })
    })

    describe('getRunnerId', () => {
        it('should return increasing cid numbers', () => {
            expect(launcher.getRunnerId(0)).toBe('0-0')
            expect(launcher.getRunnerId(0)).toBe('0-1')
            expect(launcher.getRunnerId(0)).toBe('0-2')
            expect(launcher.getRunnerId(2)).toBe('2-0')
            expect(launcher.getRunnerId(0)).toBe('0-3')
            expect(launcher.getRunnerId(2)).toBe('2-1')
        })
    })

    describe('getNumberOfSpecsLeft', () => {
        it('should return number of spec', () => {
            launcher.schedule = [{ specs: [1, 2, 3] }, { specs: [1, 2] }]
            expect(launcher.getNumberOfSpecsLeft()).toBe(5)
        })
    })

    describe('getNumberOfRunningInstances', () => {
        it('should return number of spec', () => {
            launcher.schedule = [{ runningInstances: 3 }, { runningInstances: 2 }]
            expect(launcher.getNumberOfRunningInstances()).toBe(5)
        })
    })

    describe('runSpecs', () => {
        beforeEach(() => {
            launcher.startInstance = jest.fn()
        })

        it('should not start running anything if exit routine is triggered', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) }
            launcher.hasTriggeredExitRoutine = true
            expect(launcher.runSpecs()).toBe(true)
            expect(launcher.startInstance).toBeCalledTimes(0)
        })

        it('should run all specs', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) }
            launcher.schedule = [{
                cid: 0,
                caps: { browserName: 'chrome' },
                specs: ['/a.js', 'b.js', 'c.js'],
                availableInstances: 50,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js', 'c.js', 'd.js'],
                availableInstances: 60,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js'],
                availableInstances: 70,
                runningInstances: 0,
                seleniumServer: {}
            }]
            expect(launcher.runSpecs()).toBe(false)
            expect(launcher.getNumberOfRunningInstances()).toBe(9)
            expect(launcher.getNumberOfSpecsLeft()).toBe(0)
            expect(launcher.schedule[0].runningInstances).toBe(3)
            expect(launcher.schedule[0].availableInstances).toBe(47)
            expect(launcher.schedule[1].runningInstances).toBe(4)
            expect(launcher.schedule[1].availableInstances).toBe(56)
            expect(launcher.schedule[2].runningInstances).toBe(2)
            expect(launcher.schedule[2].availableInstances).toBe(68)
        })

        it('should not run anything if runner failed', () => {
            launcher.runnerFailed = 2
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100,
                bail: 1
            }) }
            launcher.schedule = [{
                cid: 0,
                caps: { browserName: 'chrome' },
                specs: ['/a.js', 'b.js', 'c.js'],
                availableInstances: 50,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js', 'c.js', 'd.js'],
                availableInstances: 60,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js'],
                availableInstances: 70,
                runningInstances: 0,
                seleniumServer: {}
            }]
            expect(launcher.runSpecs()).toBe(true)
            expect(launcher.getNumberOfRunningInstances()).toBe(0)
            expect(launcher.getNumberOfSpecsLeft()).toBe(0)
        })

        it('should run as much as maxInstances allows', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 5
            }) }
            launcher.schedule = [{
                cid: 0,
                caps: { browserName: 'chrome' },
                specs: ['/a.js', 'b.js', 'c.js'],
                availableInstances: 50,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js', 'c.js', 'd.js'],
                availableInstances: 60,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js'],
                availableInstances: 70,
                runningInstances: 0,
                seleniumServer: {}
            }]
            expect(launcher.runSpecs()).toBe(false)
            expect(launcher.getNumberOfRunningInstances()).toBe(5)
            expect(launcher.getNumberOfSpecsLeft()).toBe(4)
            expect(launcher.schedule[0].runningInstances).toBe(2)
            expect(launcher.schedule[0].availableInstances).toBe(48)
            expect(launcher.schedule[1].runningInstances).toBe(2)
            expect(launcher.schedule[1].availableInstances).toBe(58)
            expect(launcher.schedule[2].runningInstances).toBe(1)
            expect(launcher.schedule[2].availableInstances).toBe(69)
        })

        it('should not allow to schedule more runner if no instances are available', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) }
            launcher.schedule = [{
                cid: 0,
                caps: { browserName: 'chrome' },
                specs: ['/a.js', 'b.js', 'c.js'],
                availableInstances: 1,
                runningInstances: 10,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js', 'c.js', 'd.js'],
                availableInstances: 2,
                runningInstances: 4,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js'],
                availableInstances: 0,
                runningInstances: 2,
                seleniumServer: {}
            }]
            expect(launcher.runSpecs()).toBe(false)
            expect(launcher.getNumberOfRunningInstances()).toBe(19)
            expect(launcher.getNumberOfSpecsLeft()).toBe(6)
            expect(launcher.schedule[0].runningInstances).toBe(11)
            expect(launcher.schedule[0].availableInstances).toBe(0)
            expect(launcher.schedule[1].runningInstances).toBe(6)
            expect(launcher.schedule[1].availableInstances).toBe(0)
            expect(launcher.schedule[2].runningInstances).toBe(2)
            expect(launcher.schedule[2].availableInstances).toBe(0)
        })

        it('should not run if all specs were executed', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) }
            launcher.schedule = [{
                cid: 0,
                caps: { browserName: 'chrome' },
                specs: [],
                availableInstances: 10,
                runningInstances: 0,
                seleniumServer: {}
            }]
            expect(launcher.runSpecs()).toBe(true)
            expect(launcher.getNumberOfRunningInstances()).toBe(0)
            expect(launcher.getNumberOfSpecsLeft()).toBe(0)
        })
    })

    describe('startInstance', () => {
        beforeEach(() => {
            launcher.runner.run = jest.fn().mockReturnValue({ on: () => {} })
            launcher.interface.emit = jest.fn()
        })

        it('should allow override of runner id', () => {
            launcher.startInstance([], { browserName: 'chrome' }, 0, undefined, '0-5')
            expect(launcher.runner.run.mock.calls[0][0]).toHaveProperty('cid', '0-5')
            expect(launcher.getRunnerId(0)).toBe('0-0')
        })
    })

    describe('config options', () => {
        let ensureDirSyncSpy
        beforeEach(() => {
            ensureDirSyncSpy = jest.spyOn(fs, 'ensureDirSync')
        })
        it('should create directory when the config options have a outputDir option', () => {
            expect(ensureDirSyncSpy).toHaveBeenCalled()
            expect(ensureDirSyncSpy).toHaveBeenCalledWith('tempDir')
        })
        afterEach(() => {
            ensureDirSyncSpy.mockClear()
        })
    })

    describe('run', () => {
        let config = {}
        global.console.error = () => {}

        beforeEach(() => {
            config = {
                // ConfigParser.addFileConfig() will return onPrepare and onComplete as arrays of functions
                onPrepare: [jest.fn()],
                onComplete: [jest.fn()],
            }
            launcher.configParser = {
                getCapabilities: jest.fn().mockReturnValue(0),
                getConfig: jest.fn().mockReturnValue(config)
            }
            launcher.runner = { initialise: jest.fn(), shutdown: jest.fn() }
            launcher.runMode = jest.fn().mockImplementation((config, caps) => caps)
            launcher.interface = { finalise: jest.fn() }
        })

        it('exit code 0', async () => {
            expect(await launcher.run()).toEqual(0)
            expect(launcher.runner.shutdown).toBeCalled()

            expect(launcher.configParser.getCapabilities).toBeCalledTimes(1)
            expect(launcher.configParser.getConfig).toBeCalledTimes(1)
            expect(launcher.runner.initialise).toBeCalledTimes(1)
            expect(config.onPrepare[0]).toBeCalledTimes(1)
            expect(launcher.runMode).toBeCalledTimes(1)
            expect(config.onPrepare[0]).toBeCalledTimes(1)
            expect(launcher.interface.finalise).toBeCalledTimes(1)
        })

        it('should not shutdown runner if was called before', async () => {
            launcher.hasTriggeredExitRoutine = true
            expect(await launcher.run()).toEqual(0)
            expect(launcher.runner.shutdown).not.toBeCalled()
        })

        it('onComplete error', async () => {
            // ConfigParser.addFileConfig() will return onComplete as an array of functions
            config.onComplete = [() => { throw new Error() }]

            expect(await launcher.run()).toEqual(1)
            expect(launcher.runner.shutdown).toBeCalled()
        })

        it('should shutdown runner on error', async () => {
            delete logger.waitForBuffer

            let error
            try {
                await launcher.run()
            } catch (err) {
                error = err
            }
            expect(launcher.runner.shutdown).toBeCalled()
            expect(error).toBeInstanceOf(Error)
        })
    })
})
