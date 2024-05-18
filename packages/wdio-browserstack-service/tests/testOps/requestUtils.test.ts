import { uploadEventData } from '../../src/testOps/requestUtils.js'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { TESTOPS_BUILD_COMPLETED_ENV, TESTOPS_JWT_ENV } from '../../src/constants.js'

vi.mock('fetch')
describe('uploadEventData', () => {
    const mockedFetch = vi.mocked(fetch)

    afterEach(() => {
        vi.resetAllMocks()
    })

    it('should send request', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[TESTOPS_JWT_ENV] = 'jwt'
        mockedFetch.mockReturnValueOnce(Promise.resolve(Response.json({})))

        expect(async () => uploadEventData( { event_type: 'testRunStarted' } )).not.toThrowError()
        expect(fetch).toBeCalledTimes(1)
    })

    it('should throw error if request fails', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[TESTOPS_JWT_ENV] = 'jwt'
        mockedFetch.mockReturnValueOnce(Promise.reject(Response.json({})))

        await expect(uploadEventData( { event_type: 'testRunStarted' } )).rejects.toThrow()
        expect(fetch).toBeCalledTimes(1)
    })

    it('should throw error if JWT token is missing and not throw error', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        delete process.env[TESTOPS_JWT_ENV]

        await expect(uploadEventData( { event_type: 'testRunStarted' } )).rejects.toThrow()
        expect(mockedFetch).toBeCalledTimes(0)
    })
})
