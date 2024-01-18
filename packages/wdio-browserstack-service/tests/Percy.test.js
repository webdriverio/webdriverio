import Percy from '../src/Percy/Percy'
import * as utils from '../src/util'

jest.mock('node:fs')
jest.mock('node:path')
jest.mock('node:os')
jest.mock('node:child_process')
jest.mock('../src/util')
jest.mock('../src/Percy/PercyLogger')

describe('Percy Class', () => {
    let percyInstance

    beforeEach(() => {
        percyInstance = new Percy({}, {}, { projectName: 'testProject' })
        jest.clearAllMocks()
    })

    describe('Constructor', () => {
        it('should initialize Percy instance', () => {
            expect(percyInstance._options).toEqual({})
            expect(percyInstance._config).toEqual({})
            expect(percyInstance._isApp).toBe(false)
            expect(percyInstance._projectName).toBe('testProject')
        })
    })

    describe('getBinaryPath method', () => {
        it('should return binary path if already present', async () => {
            percyInstance['_binaryPath'] = 'some_path'

            const result = await percyInstance.getBinaryPath()
            expect(result).toBe('some_path')
        })
    })

    describe('running method', () => {
        // const getBinaryPathSpy = jest.spyOn(Percy.prototype, 'getBinaryPath')

        it('should return true if running', async () => {
            percyInstance['isProcessRunning'] = true
            const res = await percyInstance.isRunning()
            expect(res).toEqual(true)
        })
        it('should return false if running', async () => {
            percyInstance['isProcessRunning'] = false
            const res = await percyInstance.isRunning()
            expect(res).toEqual(false)
        })
    })

    describe('health check method', () => {
        it('should return true if running', async () => {
            const nodeRequestSpy = jest.spyOn(utils, 'nodeRequest').mockReturnValue(true)
            const res = await percyInstance.healthcheck()
            expect(nodeRequestSpy).toBeCalledTimes(1)
            expect(res).toEqual(true)
        })
        it('should return false if running', async () => {
            const nodeRequestSpy = jest.spyOn(utils, 'nodeRequest').mockReturnValue(false)
            const res = await percyInstance.healthcheck()
            expect(nodeRequestSpy).toBeCalledTimes(1)
            expect(res).toEqual(undefined)
        })
    })

    describe('fetchPercyToken method', () => {
        it('should return false if running', async () => {
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

    // describe('stopPercy', () => {
    //   let percyStopSpy: any

    //   beforeEach(() => {
    //       percyStopSpy = jest.spyOn(Percy.prototype, 'stop').mockImplementationOnce(async () => {
    //           return {}
    //       })
    //   })

    //   it('should call stop method of Percy', async () => {
    //       const percy = new Percy({}, {}, {})
    //       await PercyHelper.stopPercy(percy)
    //       expect(percyStopSpy).toBeCalledTimes(1)
    //   })

    //   afterEach(() => {
    //       percyStopSpy.mockClear()
    //   })
    // })

})
