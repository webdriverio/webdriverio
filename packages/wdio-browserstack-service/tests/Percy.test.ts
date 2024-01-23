import Percy from '../src/Percy/Percy'
import * as PercyLogger from '../src/Percy/PercyLogger'
import childProcess from 'node:child_process'
import * as utils from '../src/util'
import fs from 'fs'
jest.mock('node:child_process', () => ({
    spawn: jest.fn(),
}))
jest.mock('fs', () => ({
    createWriteStream: jest.fn(),
    writeFile: jest.fn(),
}))

describe('Percy Class', () => {
    let percyInstance

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('should initialize Percy instance', () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            expect(percyInstance._options).toEqual({})
            expect(percyInstance._config).toEqual({})
            expect(percyInstance._isApp).toBe(false)
            expect(percyInstance._projectName).toBe('testProject')
        })
    })

    describe('getBinaryPath method', () => {
        it('should return binary path if already present', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_binaryPath'] = 'some_path'

            const result = await percyInstance.getBinaryPath()
            expect(result).toBe('some_path')
        })
    })

    describe('running method', () => {

        it('should return true if running', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['isProcessRunning'] = true
            const res = await percyInstance.isRunning()
            expect(res).toEqual(true)
        })
        it('should return false if running', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['isProcessRunning'] = false
            const res = await percyInstance.isRunning()
            expect(res).toEqual(false)
        })
    })

    describe('health check method', () => {
        it('should return true if running', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            const nodeRequestSpy = jest.spyOn(utils, 'nodeRequest').mockReturnValue(true)
            const res = await percyInstance.healthcheck()
            expect(nodeRequestSpy).toBeCalledTimes(1)
            expect(res).toEqual(true)
        })
        it('should return false if running', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            const nodeRequestSpy = jest.spyOn(utils, 'nodeRequest').mockReturnValue(false)
            const res = await percyInstance.healthcheck()
            expect(nodeRequestSpy).toBeCalledTimes(1)
            expect(res).toEqual(undefined)
        })
    })

    describe('fetchPercyToken method', () => {
        it('should return false if running', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_projectName'] = 'project_name'
            percyInstance['_isApp'] = true
            const response = {
                token: 'token'
            }
            const nodeRequestSpy = jest.spyOn(utils, 'nodeRequest').mockReturnValue(response)
            const res = await percyInstance.fetchPercyToken()
            expect(nodeRequestSpy).toBeCalledTimes(1)
            expect(res).toEqual('token')
        })
    })

    describe('createPercyConfig method', () => {
        afterEach(() => {
            jest.clearAllMocks()
        })

        it('should return early null if percyOptions is null', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_options'] = {
                percyOptions: null
            }
            const res = await percyInstance.createPercyConfig()
            expect(res).toEqual(null)
        })

        it('should return valid response', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_options'] = {
                percyOptions: {
                    version: null
                }
            }
            const PercyLoggerDebugSpy = jest.spyOn(PercyLogger.PercyLogger, 'debug')
            PercyLoggerDebugSpy.mockImplementation(() => {})
            const writeFileSpy = jest.spyOn(fs, 'writeFile')
            writeFileSpy.mockImplementation(() => {})

            percyInstance.createPercyConfig().then(() => {
                expect(writeFileSpy).toBeCalledTimes(1)
                expect(PercyLoggerDebugSpy).toBeCalledTimes(1)
            }).catch(() => {
            })
        })
        it('should return valid response', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_options'] = {
                percyOptions: {
                    version: null
                }
            }
            const PercyLoggerErrorSpy = jest.spyOn(PercyLogger.PercyLogger, 'error')
            PercyLoggerErrorSpy.mockImplementation(() => {})
            const PercyLoggerDebugSpy = jest.spyOn(PercyLogger.PercyLogger, 'debug')
            PercyLoggerDebugSpy.mockImplementation(() => {})
            const writeFileSpy = jest.spyOn(fs, 'writeFile')
            writeFileSpy.mockImplementation(() => {})

            percyInstance.createPercyConfig().then(() => {
                expect(writeFileSpy).toBeCalledTimes(1)
                expect(PercyLoggerErrorSpy).toBeCalledTimes(1)

                expect(PercyLoggerDebugSpy).toBeCalledTimes(0)
            }).catch(() => {
            })
        })
    })

    describe('stop method', () => {

        afterEach(() => {
            jest.clearAllMocks()
        })
        it('should stop', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            const getBinaryPathSpy = jest.spyOn(percyInstance, 'getBinaryPath').mockReturnValue('mock_binary_path')

            percyInstance.stop().then(() => {
                expect(getBinaryPathSpy).toBeCalledTimes(1)
                expect(percyInstance['isProcessRunning']).toEqual(false)
            }).catch(() => {
            })
        })
    })

    describe('start method', () => {
        afterEach(() => {
            jest.clearAllMocks()
        })
        it('should return false when token is not there', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_logfile'] = 'log_file'
            const getBinaryPathSpy = jest.spyOn(percyInstance, 'getBinaryPath').mockReturnValue('mock_binary_path')
            const fetchPercyTokenSpy = jest.spyOn(percyInstance, 'fetchPercyToken').mockReturnValue(null)

            const res = await percyInstance.start()
            expect(res).toEqual(false)
            expect(getBinaryPathSpy).toBeCalledTimes(1)
            expect(fetchPercyTokenSpy).toBeCalledTimes(1)

        })

        it('should return false when token is health check false', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_logfile'] = 'log_file'
            const getBinaryPathSpy = jest.spyOn(percyInstance, 'getBinaryPath').mockReturnValue('mock_binary_path')
            const fetchPercyTokenSpy = jest.spyOn(percyInstance, 'fetchPercyToken').mockReturnValue('token')
            const createPercyConfigSpy = jest.spyOn(percyInstance, 'createPercyConfig').mockReturnValue('config_path')

            const mockSpawn = {
                stdout: {
                    pipe: jest.fn()
                },
                stderr: {
                    pipe: jest.fn()
                },
                on: jest.fn().mockImplementation((close, cb) => {
                    cb()
                })
            }
            ;(childProcess.spawn as jest.Mock).mockClear()
            ;(childProcess.spawn as jest.Mock).mockReturnValue(mockSpawn)

            const healthcheckSpy = jest.spyOn(percyInstance, 'healthcheck').mockReturnValue(false)
            const healthcheckSpy2 = jest.spyOn(percyInstance, 'healthcheck').mockReturnValue(true)

            percyInstance['isProcessRunning'] = true

            const res = await percyInstance.start()
            expect(res).toEqual(true)
            expect(getBinaryPathSpy).toBeCalledTimes(1)
            expect(fetchPercyTokenSpy).toBeCalledTimes(1)
            expect(createPercyConfigSpy).toBeCalledTimes(1)
            expect(healthcheckSpy).toBeCalledTimes(1)
            expect(healthcheckSpy2).toBeCalledTimes(1)

        })

        it('should return true when token is there', async () => {
            percyInstance = new Percy({}, {}, { projectName: 'testProject' })
            percyInstance['_logfile'] = 'log_file'
            const getBinaryPathSpy = jest.spyOn(percyInstance, 'getBinaryPath').mockReturnValue('getBinaryPath_path')
            const fetchPercyTokenSpy = jest.spyOn(percyInstance, 'fetchPercyToken').mockReturnValue('token')
            const createPercyConfigSpy = jest.spyOn(percyInstance, 'createPercyConfig').mockReturnValue('config_path')
            const sleepSpy = jest.spyOn(percyInstance, 'sleep')

            const res = await percyInstance.start()
            expect(res).toEqual(true)
            expect(getBinaryPathSpy).toBeCalledTimes(1)
            expect(fetchPercyTokenSpy).toBeCalledTimes(1)
            expect(createPercyConfigSpy).toBeCalledTimes(1)
            expect(sleepSpy).toBeCalledTimes(0)
        })
    })
})
