import * as utils from '../src/util'
import BStackCleanup from '../src/cleanup'
import fs from 'node:fs'
import * as FunnelTestEvent from '../src/instrumentation/funnelInstrumentation'
import { TESTOPS_JWT_ENV } from '../src/constants'

describe('BStackCleanup', () => {
    let originalArgv
    let originalEnv

    beforeEach(() => {
        originalArgv = process.argv
        originalEnv = process.env
        process.argv = []
        process.env = {}
        jest.spyOn(utils, 'stopBuildUpstream')
    })

    afterEach(() => {
        process.argv = originalArgv
        process.env = originalEnv
        jest.resetAllMocks()
        jest.restoreAllMocks()
    })

    describe('startCleanup', () => {
        it('executes observability cleanup if --observability is present in argv', async () => {
            // jest.spyOn(utils, 'stopBuildUpstream')
            process.argv.push('--observability')
            process.env[TESTOPS_JWT_ENV] = 'some jwt'

            await BStackCleanup.startCleanup()

            expect(utils.stopBuildUpstream).toHaveBeenCalledTimes(1)
        })

        it('gets data and removes funnel data file', async () => {
            const filePath = 'some_file.json'
            process.argv.push('--funnelData', filePath)
            jest.spyOn(fs, 'readFileSync').mockReturnValue('{"data": 123}')
            jest.spyOn(fs, 'rmSync')
            jest.spyOn(FunnelTestEvent, 'fireFunnelRequest').mockResolvedValueOnce()

            await BStackCleanup.startCleanup()
            expect(fs.readFileSync).toHaveBeenNthCalledWith(1, filePath, 'utf8')
            expect(fs.rmSync).toHaveBeenNthCalledWith(1, filePath, expect.any(Object))
            expect(FunnelTestEvent.fireFunnelRequest).toHaveBeenCalled()
        })
    })

    describe('executeObservabilityCleanup', () => {

        it('does not invoke stop call for observability when jwt is not set', async () => {
            await BStackCleanup.executeObservabilityCleanup({})
            expect(utils.stopBuildUpstream).toBeCalledTimes(0)
        })

        it('invoke stop call for observability when jwt is set', async () => {
            process.env[TESTOPS_JWT_ENV] = 'jwtToken'
            await BStackCleanup.executeObservabilityCleanup({})
            expect(utils.stopBuildUpstream).toBeCalledTimes(1)
        })
    })

    describe('sendFunnelData', () => {
        it('sends funnel data and removes file', async () => {
            const funnelData = { key: 'value' }
            jest.spyOn(FunnelTestEvent, 'fireFunnelRequest').mockResolvedValueOnce()
            await BStackCleanup.sendFunnelData(funnelData)
            expect(FunnelTestEvent.fireFunnelRequest).toHaveBeenCalledWith(funnelData)
        })
    })

    describe('removeFunnelDataFile', () => {
        it('removes file if filePath is provided', () => {
            jest.spyOn(fs, 'rmSync')
            BStackCleanup.removeFunnelDataFile('test-file-path')
            expect(fs.rmSync).toHaveBeenCalledWith('test-file-path', { force: true })
        })

        it('does nothing if filePath is not provided', () => {
            jest.spyOn(fs, 'rmSync')
            BStackCleanup.removeFunnelDataFile()
            expect(fs.rmSync).not.toHaveBeenCalled()
        })
    })

    describe('updateO11yStopData', () => {
        it('should update O11y stop data when funnelData contains O11y data', () => {
            // Arrange
            const funnelData = {
                event_properties: {
                    productUsage: {
                        testObservability: {
                            events: {
                                buildEvents: {
                                    finished: {}
                                }
                            }
                        }
                    }
                }
            }
            const status = 'success'

            // Act
            BStackCleanup.updateO11yStopData(funnelData, status)

            // Assert
            expect(funnelData.event_properties.productUsage.testObservability.events.buildEvents.finished).toEqual({
                status,
                error: undefined,
                stoppedFrom: 'exitHook'
            })
        })

        it('should do nothing if funnelData does not contain O11y data', () => {
            // Arrange
            const funnelData = null
            const status = 'success'

            // Act
            BStackCleanup.updateO11yStopData(funnelData, status)

            // Assert
            expect(funnelData).toBeNull()
        })

        it('should update O11y stop data with error if error is provided', () => {
            // Arrange
            const funnelData = {
                event_properties: {
                    productUsage: {
                        testObservability: {
                            events: {
                                buildEvents: {
                                    finished: {}
                                }
                            }
                        }
                    }
                }
            }
            const status = 'failed'
            const error = new Error('Test error')

            // Act
            BStackCleanup.updateO11yStopData(funnelData, status, error)

            // Assert
            expect(funnelData.event_properties.productUsage.testObservability.events.buildEvents.finished).toEqual({
                status,
                error: 'Test error',
                stoppedFrom: 'exitHook'
            })
        })
    })

})

