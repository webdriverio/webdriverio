import { shouldCallCleanup } from '../src/exitHandler'
import BrowserStackConfig from '../src/config'
import * as FunnelInstrumentation from '../src/instrumentation/funnelInstrumentation'
import { TESTOPS_JWT_ENV } from '../src/constants'

jest.mock('node:child_process')
jest.mock('../src/instrumentation/funnelInstrumentation')
jest.mock('../src/bstackLogger')

describe('exitHandler', () => {
    let configSpy: jest.SpyInstance
    beforeAll(() => {
        configSpy = jest.spyOn(BrowserStackConfig, 'getInstance')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('shouldCallCleanup', () => {
        it('should return cleanup arguments based on config and environment', () => {
            // Arrange
            process.env[TESTOPS_JWT_ENV] = 'jwt'
            const mockConfigInstance = { testObservability: { buildStopped: false }, userName: 'user', accessKey: 'key', funnelDataSent: false }
            configSpy.mockReturnValue(mockConfigInstance as any)
            jest.spyOn(FunnelInstrumentation, 'saveFunnelData').mockReturnValue('savedFilePath')

            // Act
            const args = shouldCallCleanup(BrowserStackConfig.getInstance())

            // Assert
            expect(args).toEqual(['--observability', '--funnelData', 'savedFilePath'])
        })

        it('should return empty array when conditions are not met', () => {
            // Arrange
            process.env[TESTOPS_JWT_ENV] = ''
            const mockConfigInstance = { testObservability: { buildStopped: true }, userName: '', accessKey: '', funnelDataSent: true }
            configSpy.mockReturnValue(mockConfigInstance as any)

            // Act
            const args = shouldCallCleanup(BrowserStackConfig.getInstance())

            // Assert
            expect(args).toEqual([])
        })
    })
})
