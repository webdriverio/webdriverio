import Launcher from '../src/launcher'
import logger from '@wdio/logger'
import { sleep } from '@wdio/utils'
import fs from 'fs-extra'

const caps: WebDriver.DesiredCapabilities = { maxInstances: 1, browserName: 'chrome' }

jest.mock('fs-extra')
jest.mock('../src/interface', () => class {
    emit = jest.fn()
    on = jest.fn()
    sigintTrigger = jest.fn()
    onMessage = jest.fn()
})

describe('launcher', () => {
    const emitSpy = jest.spyOn(process, 'emit')
    let launcher: Launcher

    beforeEach(() => {
        global.console.log = jest.fn()
        emitSpy.mockClear()
        launcher = new Launcher('./')
    })

    describe('defaults', () => {
        it('should have default for the argv parameter', () => {
            expect(launcher['_args']).toEqual({})
        })

        it('should run autocompile by default', () => {
            expect(launcher['configParser'].autoCompile).toBeCalledTimes(1)
        })

        it('should not run auto compile if cli param was provided', () => {
            const otherLauncher = new Launcher('./', {
                autoCompileOpts: {
                    // @ts-expect-error cli params are always strings
                    autoCompile: 'false'
                }
            })

            expect(otherLauncher['configParser'].autoCompile).toBeCalledTimes(0)
        })
    })

    describe('capabilities', () => {
        it('should NOT fail when capabilities are passed', async () => {
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: ['./'] } as any, [caps])
            expect(launcher.runSpecs).toBeCalled()
            expect(exitCode).toEqual(0)
            expect(logger('').error).not.toBeCalled()
        })

        it('should fail if no specs were found', async () => {
            launcher.runSpecs = jest.fn()
            launcher.configParser.getSpecs = jest.fn().mockReturnValue([])
            const exitCode = await launcher.runMode({ specs: ['./'] } as any, [caps])
            expect(launcher.runSpecs).toBeCalledTimes(0)
            expect(exitCode).toBe(1)
        })

        it('should fail when no capabilities are passed', async () => {
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            // @ts-ignore test invalid parameter
            const exitCode = await launcher.runMode({ specs: ['./'] as any })
            expect(exitCode).toEqual(1)
            expect(logger('').error).toBeCalledWith('Missing capabilities, exiting with failure')
        })

        it('should fail when no capabilities are set', async () => {
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: ['./'] } as any, undefined)
            expect(exitCode).toEqual(1)
            expect(logger('').error).toBeCalledWith('Missing capabilities, exiting with failure')
        })

        it('should start instance in multiremote', () => {
            launcher.runSpecs = jest.fn()
            launcher.isMultiremote = true
            launcher.runMode(
                { specs: ['./'], specFileRetries: 2 } as any,
                { foo: { capabilities: { browserName: 'chrome' } } }
            )

            expect(launcher['_schedule']).toHaveLength(1)
            expect(launcher['_schedule'][0].specs[0].retries).toBe(2)

            expect(typeof launcher['_resolve']).toBe('function')
            expect(launcher.runSpecs).toBeCalledTimes(1)
        })

        it('should ignore specFileRetries in watch mode', () => {
            launcher.runSpecs = jest.fn()
            launcher['_isWatchMode'] = true
            launcher.runMode({ specs: ['./'], specFileRetries: 2 } as any, [caps, caps])

            expect(launcher['_schedule']).toHaveLength(2)
            expect(launcher['_schedule'][0].specs[0].retries).toBe(0)
            expect(launcher['_schedule'][1].specs[0].retries).toBe(0)

            expect(launcher.runSpecs).toBeCalledTimes(1)
        })

        it('should apply maxInstancesPerCapability if maxInstances is not passed', () => {
            launcher.runSpecs = jest.fn()
            launcher.runMode(
                { specs: ['./'], specFileRetries: 3, maxInstancesPerCapability: 4 } as any,
                [{ browserName: 'chrome' }]
            )

            expect(launcher['_schedule']).toHaveLength(1)
            expect(launcher['_schedule'][0].specs[0].retries).toBe(3)
            expect(launcher['_schedule'][0].availableInstances).toBe(4)

            expect(launcher.runSpecs).toBeCalledTimes(1)
        })
    })

    describe('hasTriggeredExitRoutine', () => {
        it('should return false if there are specs left of running when hasTriggeredExitRoutine is false', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher['_hasTriggeredExitRoutine'] = false
            const returnValue = launcher.runSpecs()
            expect(returnValue).toEqual(false)
        })

        it('should return true when hasTriggeredExitRoutine is true', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher['_hasTriggeredExitRoutine'] = true
            const returnValue = launcher.runSpecs()
            expect(returnValue).toEqual(true)
        })
    })

    describe('endHandler', () => {
        it('should emit and resolve failed status', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = jest.fn()
            launcher.endHandler({ cid: '0-1', exitCode: 1 } as any)
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: '0-1', passed: false })
            expect(launcher['_resolve']).toBeCalledWith(1)
        })

        it('should emit and resolve passed status', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = jest.fn()
            launcher.endHandler({ cid: '0-1', exitCode: 0 } as any)
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: '0-1', passed: true })
            expect(launcher['_resolve']).toBeCalledWith(0)
        })

        it('should do nothing if not all specs are run', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher.runSpecs = jest.fn().mockReturnValue(0)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = jest.fn()
            launcher.endHandler({ cid: '0-1', exitCode: 0 } as any)
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: '0-1', passed: true })
            expect(launcher['_resolve']).toBeCalledTimes(0)
        })

        it('should do nothing if watch mode is still running', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher['_isWatchMode'] = true
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = jest.fn()
            launcher.endHandler({ cid: '0-1', exitCode: 1 } as any)
            expect(launcher.interface.emit).toBeCalledWith('job:end', { cid: '0-1', passed: false })
            expect(launcher['_resolve']).toBeCalledTimes(0)
        })

        it('should resolve and not emit on watch mode stop', () => {
            launcher.getNumberOfRunningInstances = jest.fn().mockReturnValue(1)
            launcher['_isWatchMode'] = true
            launcher['_hasTriggeredExitRoutine'] = true
            launcher.runSpecs = jest.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = jest.fn()
            launcher.endHandler({ cid: '0-1', exitCode: 1 } as any)
            expect(launcher.interface.emit).not.toBeCalled()
            expect(launcher['_resolve']).toBeCalledWith(0)
        })

        it('should reschedule when runner failed and retries remain', () => {
            launcher['_schedule'] = [{ cid: 0, specs: [] }] as any
            launcher.endHandler({ cid: '0-5', exitCode: 1, retries: 1, specs: ['a.js'] })
            expect(launcher['_schedule']).toMatchObject([{ cid: 0, specs: [{ rid: '0-5', files: ['a.js'], retries: 0 }] }])
        })

        it('should requeue retried specfiles at beginning of queue', () => {
            launcher.configParser.getConfig = jest.fn().mockReturnValue({ specFileRetriesDeferred: false })
            launcher['_schedule'] = [{ cid: 0, specs: [{ files: ['b.js'] }] }] as any
            launcher.endHandler({ cid: '0-5', exitCode: 1, retries: 1, specs: ['a.js'] })
            expect(launcher['_schedule']).toMatchObject([{ cid: 0, specs: [{ rid: '0-5', files: ['a.js'], retries: 0 }, { files: ['b.js'] }] }])
        })

        it('should requeue retried specfiles at end of queue', () => {
            launcher['_schedule'] = [{ cid: 0, specs: [{ files: ['b.js'] }] }] as any
            launcher.endHandler({ cid: '0-5', exitCode: 1, retries: 1, specs: ['a.js'] })
            expect(launcher['_schedule']).toMatchObject([{ cid: 0, specs: [{ files: ['b.js'] }, { rid: '0-5', files: ['a.js'], retries: 0 }] }])
        })
    })

    describe('exitHandler', () => {
        it('should do nothing if no callback is given', () => {
            launcher['_hasTriggeredExitRoutine'] = false
            launcher.runner = { shutdown: jest.fn()
                .mockReturnValue(Promise.resolve()) } as any

            launcher.exitHandler()

            expect(launcher['_hasTriggeredExitRoutine']).toBe(false)
            expect(launcher.interface.sigintTrigger).toBeCalledTimes(0)
            expect(launcher.runner.shutdown).toBeCalledTimes(0)
        })

        it('should do nothing if shutdown was called before', () => {
            launcher['_hasTriggeredExitRoutine'] = true
            launcher.runner = { shutdown: jest.fn().mockReturnValue(Promise.resolve()) } as any

            expect(launcher.exitHandler(() => 'foo')).toBe('foo')

            expect(launcher['_hasTriggeredExitRoutine']).toBe(true)
            expect(launcher.interface.sigintTrigger).toBeCalledTimes(0)
            expect(launcher.runner.shutdown).toBeCalledTimes(0)
        })

        it('should shutdown', () => {
            launcher['_hasTriggeredExitRoutine'] = false
            launcher.runner = { shutdown: jest.fn().mockReturnValue(Promise.resolve()) } as any

            launcher.exitHandler(jest.fn())

            expect(launcher['_hasTriggeredExitRoutine']).toBe(true)
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
            launcher['_schedule'] = [{ specs: [1, 2, [3, 4, 5]] }, { specs: [1, 2] }] as any
            expect(launcher.getNumberOfSpecsLeft()).toBe(5)
        })
    })

    describe('getNumberOfRunningInstances', () => {
        it('should return number of spec', () => {
            launcher['_schedule'] = [{ runningInstances: 3 }, { runningInstances: 2 }] as any
            expect(launcher.getNumberOfRunningInstances()).toBe(5)
        })
    })

    describe('formatSpecs', () => {
        it('should return correctly formatted specs', () => {
            const capabilities = { specs: ['/a.js', ['/b.js', '/c.js']] }
            const specFileRetries = 17
            const expected = [{ 'files': ['/a.js'], 'retries': 17 }, { 'files': ['/b.js', '/c.js'], 'retries': 17 }]
            // Expect: [{"files": ["/a.js"], "retries": 17}, {"files": ["/b.js", "/c.js"], "retries": 17}]
            // Get: [{"files": ["./tests/test1.js"], "retries": 17}]
            expect(launcher.formatSpecs(capabilities, specFileRetries)).toStrictEqual(expected)
        })
    })

    describe('runSpecs', () => {
        beforeEach(() => {
            launcher.startInstance = jest.fn()
        })

        it('should not start running anything if exit routine is triggered', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) } as any
            launcher['_hasTriggeredExitRoutine'] = true
            expect(launcher.runSpecs()).toBe(true)
            expect(launcher.startInstance).toBeCalledTimes(0)
        })

        it('should run all specs', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) } as any
            launcher['_schedule'] = [{
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
            }] as any
            expect(launcher.runSpecs()).toBe(false)
            expect(launcher.getNumberOfRunningInstances()).toBe(9)
            expect(launcher.getNumberOfSpecsLeft()).toBe(0)
            expect(launcher['_schedule'][0].runningInstances).toBe(3)
            expect(launcher['_schedule'][0].availableInstances).toBe(47)
            expect(launcher['_schedule'][1].runningInstances).toBe(4)
            expect(launcher['_schedule'][1].availableInstances).toBe(56)
            expect(launcher['_schedule'][2].runningInstances).toBe(2)
            expect(launcher['_schedule'][2].availableInstances).toBe(68)
        })

        it('should run arrayed specs in a single instance', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) } as any
            launcher['_schedule'] = [{
                cid: 0,
                caps: { browserName: 'chrome' },
                specs: ['/a.js', ['b.js', 'c.js']],
                availableInstances: 50,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: [['/a.js', 'b.js', 'c.js', 'd.js']],
                availableInstances: 60,
                runningInstances: 0,
                seleniumServer: {}
            }, {
                cid: 1,
                caps: { browserName: 'chrome2' },
                specs: [['/a.js'], 'b.js'],
                availableInstances: 70,
                runningInstances: 0,
                seleniumServer: {}
            }] as any
            expect(launcher.runSpecs()).toBe(false)
            expect(launcher.getNumberOfRunningInstances()).toBe(5)
            expect(launcher.getNumberOfSpecsLeft()).toBe(0)
            expect(launcher['_schedule'][0].runningInstances).toBe(2)
            expect(launcher['_schedule'][0].availableInstances).toBe(48)
            expect(launcher['_schedule'][1].runningInstances).toBe(1)
            expect(launcher['_schedule'][1].availableInstances).toBe(59)
            expect(launcher['_schedule'][2].runningInstances).toBe(2)
            expect(launcher['_schedule'][2].availableInstances).toBe(68)
        })

        it('should not run anything if runner failed', () => {
            launcher['_runnerFailed'] = 2
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100,
                bail: 1
            }) } as any
            launcher['_schedule'] = [{
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
            }] as any
            expect(launcher.runSpecs()).toBe(true)
            expect(launcher.getNumberOfRunningInstances()).toBe(0)
            expect(launcher.getNumberOfSpecsLeft()).toBe(0)
        })

        it('should run as much as maxInstances allows', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 5
            }) } as any
            launcher['_schedule'] = [{
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
                cid: 2,
                caps: { browserName: 'chrome2' },
                specs: ['/a.js', 'b.js'],
                availableInstances: 70,
                runningInstances: 0,
                seleniumServer: {}
            }] as any
            expect(launcher.runSpecs()).toBe(false)
            expect(launcher.getNumberOfRunningInstances()).toBe(5)
            expect(launcher.getNumberOfSpecsLeft()).toBe(4)
        })

        it('should not allow to schedule more runner if no instances are available', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) } as any
            launcher['_schedule'] = [{
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
            }] as any
            expect(launcher.runSpecs()).toBe(false)
            expect(launcher.getNumberOfRunningInstances()).toBe(19)
            expect(launcher.getNumberOfSpecsLeft()).toBe(6)
            expect(launcher['_schedule'][0].runningInstances).toBe(11)
            expect(launcher['_schedule'][0].availableInstances).toBe(0)
            expect(launcher['_schedule'][1].runningInstances).toBe(6)
            expect(launcher['_schedule'][1].availableInstances).toBe(0)
            expect(launcher['_schedule'][2].runningInstances).toBe(2)
            expect(launcher['_schedule'][2].availableInstances).toBe(0)
        })

        it('should not run if all specs were executed', () => {
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                maxInstances: 100
            }) } as any
            launcher['_schedule'] = [{
                cid: 0,
                caps: { browserName: 'chrome' },
                specs: [],
                availableInstances: 10,
                runningInstances: 0,
                seleniumServer: {}
            }] as any
            expect(launcher.runSpecs()).toBe(true)
            expect(launcher.getNumberOfRunningInstances()).toBe(0)
            expect(launcher.getNumberOfSpecsLeft()).toBe(0)
        })
    })

    describe('startInstance', () => {
        beforeEach(() => {
            (launcher.runner.run as jest.Mock) = jest.fn().mockReturnValue({ on: () => {} })
            launcher['_launcher'] = []
        })

        it('should start an instance', async () => {
            const onWorkerStartMock = jest.fn()
            const caps = {
                browserName: 'chrome'
            }
            launcher.configParser.getConfig = () => ({ onWorkerStart: onWorkerStartMock }) as any
            launcher['_args'].hostname = '127.0.0.2'

            expect(launcher['_runnerStarted']).toBe(0)
            await launcher.startInstance(
                ['/foo.test.js'],
                caps,
                0,
                '0-5',
                0
            )

            expect(sleep).not.toHaveBeenCalled()
            expect(launcher['_runnerStarted']).toBe(1)
            expect((launcher.runner.run as jest.Mock).mock.calls[0][0]).toHaveProperty('cid', '0-5')
            expect(launcher.getRunnerId(0)).toBe('0-0')

            expect(onWorkerStartMock).toHaveBeenCalledWith(
                '0-5',
                caps,
                ['/foo.test.js'],
                { hostname: '127.0.0.2' },
                []
            )
        })

        it('should wait before starting an instance on retry', async () => {
            const onWorkerStartMock = jest.fn()
            const caps = {
                browserName: 'chrome'
            }
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                onWorkerStart: onWorkerStartMock,
                specFileRetries: 2,
                specFileRetriesDelay: 0.01
            }) } as any
            launcher['_args'].hostname = '127.0.0.3'

            await launcher.startInstance(
                ['/foo.test.js'],
                caps,
                0,
                '0-6',
                3
            )

            expect(sleep).toHaveBeenCalledTimes(1)
            expect(sleep).toHaveBeenCalledWith(10)

            expect(onWorkerStartMock).toHaveBeenCalledWith(
                '0-6',
                caps,
                ['/foo.test.js'],
                { hostname: '127.0.0.3' },
                []
            )
        })

        it('should not wait before starting an instance on the first run', async () => {
            const onWorkerStartMock = jest.fn()
            const caps = {
                browserName: 'chrome'
            }
            launcher.configParser = { getConfig: jest.fn().mockReturnValue({
                onWorkerStart: onWorkerStartMock,
                specFileRetries: 4,
                specFileRetriesDelay: 0.01
            }) } as any
            launcher['_args'].hostname = '127.0.0.4'

            await launcher.startInstance(
                ['/foo.test.js'],
                caps,
                0,
                '0-7',
                4
            )

            expect(sleep).not.toHaveBeenCalled()

            expect(onWorkerStartMock).toHaveBeenCalledWith(
                '0-7',
                caps,
                ['/foo.test.js'],
                { hostname: '127.0.0.4' },
                []
            )
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
        let config: WebdriverIO.Config = { capabilities: {} }

        beforeEach(() => {
            global.console.error = jest.fn()

            config = {
                // ConfigParser.addFileConfig() will return onPrepare and onComplete as arrays of functions
                onPrepare: [jest.fn()],
                onComplete: [jest.fn()],
                capabilities: {}
            }
            launcher.configParser = {
                getCapabilities: jest.fn().mockReturnValue(0),
                getConfig: jest.fn().mockReturnValue(config),
                autoCompile: jest.fn()
            } as any
            launcher.runner = { initialise: jest.fn(), shutdown: jest.fn() } as any
            launcher.runMode = jest.fn().mockImplementation((config, caps) => caps)
            launcher.interface = { finalise: jest.fn() } as any
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
            launcher['_hasTriggeredExitRoutine'] = true
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

        afterEach(() => {
            (global.console.error as jest.Mock).mockRestore()
        })
    })

    afterEach(() => {
        (global.console.log as jest.Mock).mockRestore()
        ;(sleep as jest.Mock).mockClear()
    })
})
