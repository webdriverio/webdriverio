import fs from 'node:fs/promises'
import path from 'node:path'
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { sleep } from '@wdio/utils'

vi.mocked(fs.access).mockResolvedValue()

import Launcher from '../src/launcher.js'

const caps: WebDriver.DesiredCapabilities = { maxInstances: 1, browserName: 'chrome' }

vi.mock('node:fs/promises')
vi.mock('@wdio/utils', () => import(path.join(process.cwd(), '__mocks__', '@wdio/utils')))
vi.mock('@wdio/config', () => import(path.join(process.cwd(), '__mocks__', '@wdio/config')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/interface', () => ({
    default: class {
        emit = vi.fn()
        on = vi.fn()
        sigintTrigger = vi.fn()
        onMessage = vi.fn()
        logHookError = vi.fn()
        finalise = vi.fn()
    }
}))

describe('launcher', () => {
    const emitSpy = vi.spyOn(process, 'emit')
    let launcher: Launcher

    beforeEach(() => {
        global.console.log = vi.fn()
        emitSpy.mockClear()
        launcher = new Launcher('./')
        launcher.interface = {
            onMessage: vi.fn(),
            emit: vi.fn(),
            sigintTrigger: vi.fn()
        } as any
    })

    it('should have default for the argv parameter', () => {
        expect(launcher['_args']).toEqual({})
    })

    describe('capabilities', () => {
        it('should NOT fail when capabilities are passed', async () => {
            launcher.runSpecs = vi.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: ['./'] } as any, [caps])
            expect(launcher.runSpecs).toBeCalled()
            expect(exitCode).toEqual(0)
            expect(logger('').error).not.toBeCalled()
        })

        it('should fail if no specs were found', async () => {
            launcher.runSpecs = vi.fn()
            launcher.configParser.getSpecs = vi.fn().mockReturnValue([])
            const exitCode = await launcher.runMode({ specs: ['./'] } as any, [caps])
            expect(launcher.runSpecs).toBeCalledTimes(0)
            expect(exitCode).toBe(1)
        })

        it('should fail when no capabilities are passed', async () => {
            launcher.runSpecs = vi.fn().mockReturnValue(1)
            // @ts-ignore test invalid parameter
            const exitCode = await launcher.runMode({ specs: ['./'] as any })
            expect(exitCode).toEqual(1)
            expect(logger('').error).toBeCalledWith('Missing capabilities, exiting with failure')
        })

        it('should fail when no capabilities are set', async () => {
            launcher.runSpecs = vi.fn().mockReturnValue(1)
            const exitCode = await launcher.runMode({ specs: ['./'] } as any, undefined as any)
            expect(exitCode).toEqual(1)
            expect(logger('').error).toBeCalledWith('Missing capabilities, exiting with failure')
        })

        it('should start instance in multiremote', () => {
            launcher.runSpecs = vi.fn()
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

        it('should start instance with grouped specs', () => {
            launcher.runSpecs = vi.fn()
            launcher.isMultiremote = false
            launcher.runMode(
                { specs: [['/a.js', '/b.js']], specFileRetries: 2 } as any,
                [caps]
            )

            expect(launcher['_schedule']).toHaveLength(1)
            expect(launcher['_schedule'][0].specs[0].retries).toBe(2)

            expect(typeof launcher['_resolve']).toBe('function')
            expect(launcher.runSpecs).toBeCalledTimes(1)
        })

        it('should start instance in multiremote with grouped specs', () => {
            launcher.runSpecs = vi.fn()
            launcher.isMultiremote = true
            launcher.runMode(
                { specs: [['/a.js', '/b.js']], specFileRetries: 2 } as any,
                { foo: { capabilities: { browserName: 'chrome' } } }
            )

            expect(launcher['_schedule']).toHaveLength(1)
            expect(launcher['_schedule'][0].specs[0].retries).toBe(2)

            expect(typeof launcher['_resolve']).toBe('function')
            expect(launcher.runSpecs).toBeCalledTimes(1)
        })

        it('should ignore specFileRetries in watch mode', () => {
            launcher.runSpecs = vi.fn()
            launcher['_isWatchMode'] = true
            launcher.runMode({ specs: ['./'], specFileRetries: 2 } as any, [caps, caps])

            expect(launcher['_schedule']).toHaveLength(2)
            expect(launcher['_schedule'][0].specs[0].retries).toBe(0)
            expect(launcher['_schedule'][1].specs[0].retries).toBe(0)

            expect(launcher.runSpecs).toBeCalledTimes(1)
        })

        it('should apply maxInstancesPerCapability if maxInstances is not passed', () => {
            launcher.runSpecs = vi.fn()
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
            launcher.getNumberOfRunningInstances = vi.fn().mockReturnValue(1)
            launcher['_hasTriggeredExitRoutine'] = false
            const returnValue = launcher.runSpecs()
            expect(returnValue).toEqual(false)
        })

        it('should return true when hasTriggeredExitRoutine is true', () => {
            launcher.getNumberOfRunningInstances = vi.fn().mockReturnValue(1)
            launcher['_hasTriggeredExitRoutine'] = true
            const returnValue = launcher.runSpecs()
            expect(returnValue).toEqual(true)
        })
    })

    describe('endHandler', () => {
        const config = { onWorkerEnd: vi.fn() }

        beforeEach(() => {
            launcher['_launcher'] = []
            launcher.configParser.getConfig = vi.fn().mockReturnValue(config)
        })

        it('should emit and resolve failed status', async () => {
            launcher.getNumberOfRunningInstances = vi.fn().mockReturnValue(1)
            launcher.runSpecs = vi.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = vi.fn()
            await launcher.endHandler({ cid: '0-1', exitCode: 1, specs: [], retries: 0 } as any)
            expect(launcher.interface!.emit).toBeCalledWith('job:end', { cid: '0-1', passed: false, retries: 0 })
            expect(launcher['_resolve']).toBeCalledWith(1)
            expect(config.onWorkerEnd).toBeCalledWith('0-1', 1, [], 0)
        })

        it('should emit and resolve passed status', async () => {
            launcher.getNumberOfRunningInstances = vi.fn().mockReturnValue(1)
            launcher.runSpecs = vi.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = vi.fn()
            await launcher.endHandler({ cid: '0-1', exitCode: 0 } as any)
            expect(launcher.interface!.emit).toBeCalledWith('job:end', { cid: '0-1', passed: true })
            expect(launcher['_resolve']).toBeCalledWith(0)
        })

        it('should do nothing if not all specs are run', async () => {
            launcher.getNumberOfRunningInstances = vi.fn().mockReturnValue(1)
            launcher.runSpecs = vi.fn().mockReturnValue(0)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = vi.fn()
            await launcher.endHandler({ cid: '0-1', exitCode: 0 } as any)
            expect(launcher.interface!.emit).toBeCalledWith('job:end', { cid: '0-1', passed: true })
            expect(launcher['_resolve']).toBeCalledTimes(0)
        })

        it('should do nothing if watch mode is still running', async () => {
            launcher.getNumberOfRunningInstances = vi.fn().mockReturnValue(1)
            launcher['_isWatchMode'] = true
            launcher.runSpecs = vi.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = vi.fn()
            await launcher.endHandler({ cid: '0-1', exitCode: 1 } as any)
            expect(launcher.interface!.emit).toBeCalledWith('job:end', { cid: '0-1', passed: false })
            expect(launcher['_resolve']).toBeCalledTimes(0)
        })

        it('should resolve and not emit on watch mode stop', async () => {
            launcher.getNumberOfRunningInstances = vi.fn().mockReturnValue(1)
            launcher['_isWatchMode'] = true
            launcher['_hasTriggeredExitRoutine'] = true
            launcher.runSpecs = vi.fn().mockReturnValue(1)
            launcher['_schedule'] = [{ cid: 1 } as any, { cid: 2 }]
            launcher['_resolve'] = vi.fn()
            await launcher.endHandler({ cid: '0-1', exitCode: 1 } as any)
            expect(launcher.interface!.emit).not.toBeCalled()
            expect(launcher['_resolve']).toBeCalledWith(0)
        })

        it('should reschedule when runner failed and retries remain', async () => {
            launcher['_schedule'] = [{ cid: 0, specs: [] }] as any
            await launcher.endHandler({ cid: '0-5', exitCode: 1, retries: 1, specs: ['a.js'] })
            expect(launcher['_schedule']).toMatchObject([{ cid: 0, specs: [{ rid: '0-5', files: ['a.js'], retries: 0 }] }])
        })

        it('should requeue retried specfiles at beginning of queue', async () => {
            launcher.configParser.getConfig = vi.fn().mockReturnValue({ specFileRetriesDeferred: false, onWorkerEnd: vi.fn() })
            launcher['_schedule'] = [{ cid: 0, specs: [{ files: ['b.js'] }] }] as any
            await launcher.endHandler({ cid: '0-5', exitCode: 1, retries: 1, specs: ['a.js'] })
            expect(launcher['_schedule']).toMatchObject([{ cid: 0, specs: [{ rid: '0-5', files: ['a.js'], retries: 0 }, { files: ['b.js'] }] }])
        })

        it('should requeue retried specfiles at end of queue', async () => {
            launcher['_schedule'] = [{ cid: 0, specs: [{ files: ['b.js'] }] }] as any
            await launcher.endHandler({ cid: '0-5', exitCode: 1, retries: 1, specs: ['a.js'] })
            expect(launcher['_schedule']).toMatchObject([{ cid: 0, specs: [{ files: ['b.js'] }, { rid: '0-5', files: ['a.js'], retries: 0 }] }])
        })
    })

    describe('exitHandler', () => {
        it('should do nothing if no callback is given', () => {
            launcher['_hasTriggeredExitRoutine'] = false
            launcher.runner = { shutdown: vi.fn()
                .mockReturnValue(Promise.resolve()) } as any

            launcher.exitHandler()

            expect(launcher['_hasTriggeredExitRoutine']).toBe(false)
            expect(launcher.interface!.sigintTrigger).toBeCalledTimes(0)
            expect(launcher.runner?.shutdown).toBeCalledTimes(0)
        })

        it('should do nothing if shutdown was called before', () => {
            launcher['_hasTriggeredExitRoutine'] = true
            launcher.runner = { shutdown: vi.fn().mockReturnValue(Promise.resolve()) } as any

            expect(launcher.exitHandler(() => 'foo')).toBe('foo')

            expect(launcher['_hasTriggeredExitRoutine']).toBe(true)
            expect(launcher.interface!.sigintTrigger).toBeCalledTimes(0)
            expect(launcher.runner?.shutdown).toBeCalledTimes(0)
        })

        it('should shutdown', () => {
            launcher['_hasTriggeredExitRoutine'] = false
            launcher.runner = { shutdown: vi.fn().mockReturnValue(Promise.resolve()) } as any

            launcher.exitHandler(vi.fn())

            expect(launcher['_hasTriggeredExitRoutine']).toBe(true)
            expect(launcher.interface!.sigintTrigger).toBeCalledTimes(1)
            expect(launcher.runner?.shutdown).toBeCalledTimes(1)
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
            // Define a capabilities that is sent to formatSpecs
            // - only used in function call
            const capabilities = { specs: ['/a.js', ['/b.js', '/c.js', '/d.js'], '/e.js'] }
            const specFileRetries = 17
            // Define the golden result
            const expected = [
                { 'files': ['/a.js'], 'retries': 17 },
                { 'files': ['/b.js', '/c.js', '/d.js'], 'retries': 17 },
                { 'files': ['/e.js'], 'retries': 17 },
            ]
            // Mock the return value of getSpecs so we are not doing cross
            // module testing
            launcher.configParser = { getSpecs: vi.fn().mockReturnValue(
                ['/a.js', ['/b.js', '/c.js', '/d.js'], '/e.js']
            ) } as any
            expect(launcher.formatSpecs(capabilities as any, specFileRetries)).toStrictEqual(expected)
        })
    })

    describe('runSpecs', () => {
        beforeEach(() => {
            launcher.startInstance = vi.fn()
        })

        it('should not start running anything if exit routine is triggered', () => {
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
                maxInstances: 100
            }) } as any
            launcher['_hasTriggeredExitRoutine'] = true
            expect(launcher.runSpecs()).toBe(true)
            expect(launcher.startInstance).toBeCalledTimes(0)
        })

        it('should run all specs', () => {
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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
            // launcher.runner?.run = vi.fn().mockReturnValue({ on: () => {} })
            launcher['_launcher'] = []
            launcher.runner = {
                run: vi.fn().mockReturnValue({
                    on: vi.fn()
                })
            } as any
        })

        it('should start an instance', async () => {
            const onWorkerStartMock = vi.fn()
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
            expect(vi.mocked(launcher.runner?.run!).mock.calls[0][0]).toHaveProperty('cid', '0-5')
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
            const onWorkerStartMock = vi.fn()
            const caps = {
                browserName: 'chrome'
            }
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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
            const onWorkerStartMock = vi.fn()
            const caps = {
                browserName: 'chrome'
            }
            launcher.configParser = { getConfig: vi.fn().mockReturnValue({
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

    describe('run', () => {
        let config: WebdriverIO.Config = { capabilities: {} }

        beforeEach(() => {
            global.console.error = vi.fn()

            config = {
                // ConfigParser.addFileConfig() will return onPrepare and onComplete as arrays of functions
                onPrepare: [vi.fn()],
                onComplete: [vi.fn()],
                capabilities: {},
                runner: 'local',
                runnerEnv: {},
                outputDir: 'tempDir'
            }
            launcher.configParser = {
                getCapabilities: vi.fn().mockReturnValue(0),
                getConfig: vi.fn().mockReturnValue(config),
                initialize: vi.fn()
            } as any
            launcher.runner = { initialise: vi.fn(), shutdown: vi.fn() } as any
            launcher.runMode = vi.fn().mockImplementation((config, caps) => caps)
        })

        it('exit code 0', async () => {
            expect(await launcher.run()).toEqual(0)
            expect(launcher['configParser'].initialize).toBeCalledTimes(1)
            expect(launcher.runner!.shutdown).toBeCalled()
            expect(vi.mocked(fs.mkdir)).toHaveBeenCalled()
            expect(vi.mocked(fs.mkdir)).toHaveBeenCalledWith('tempDir', { recursive: true })

            expect(launcher.configParser.getCapabilities).toBeCalledTimes(2)
            expect(launcher.configParser.getConfig).toBeCalledTimes(1)
            expect(launcher.runner!.initialise).toBeCalledTimes(1)
            expect(config.onPrepare![0]).toBeCalledTimes(1)
            expect(launcher.runMode).toBeCalledTimes(1)
            expect(config.onPrepare![0]).toBeCalledTimes(1)
            expect(launcher.interface!.finalise).toBeCalledTimes(1)
        })

        it('should not shutdown runner if was called before', async () => {
            launcher['_hasTriggeredExitRoutine'] = true
            expect(await launcher.run()).toEqual(0)
            expect(launcher.runner!.shutdown).not.toBeCalled()
        })

        it('onComplete error', async () => {
            // ConfigParser.addFileConfig() will return onComplete as an array of functions
            config.onComplete = [() => { throw new Error() }]

            expect(await launcher.run()).toEqual(1)
            expect(launcher.runner!.shutdown).toBeCalled()
        })

        it('should shutdown runner on error', async () => {
            logger.waitForBuffer = () => Promise.reject(new Error('ups'))

            let error
            try {
                await launcher.run()
            } catch (err: any) {
                error = err
            }
            expect(launcher.runner!.shutdown).toBeCalled()
            expect(error).toBeInstanceOf(Error)
        })

        afterEach(() => {
            vi.mocked(global.console.error).mockRestore()
            vi.mocked(fs.mkdir).mockClear()
        })
    })

    afterEach(() => {
        vi.mocked(global.console.log).mockRestore()
        vi.mocked(sleep).mockClear()
    })
})
