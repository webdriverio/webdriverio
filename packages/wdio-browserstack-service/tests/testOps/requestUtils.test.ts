import { uploadEventData } from '../../src/testOps/requestUtils'
import got from 'got'
import { TESTOPS_BUILD_COMPLETED_ENV, TESTOPS_JWT_ENV } from '../../src/constants'

describe('uploadEventData', () => {
    const mockedGot = jest.mocked(got)

    it('got.post called', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[TESTOPS_JWT_ENV] = 'jwt'
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        expect(async () => uploadEventData( { event_type: 'testRunStarted' } )).not.toThrowError()
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post failed', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        process.env[TESTOPS_JWT_ENV] = 'jwt'
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.reject({ }),
        } as any)

        await expect(uploadEventData( { event_type: 'testRunStarted' } )).rejects.toThrow()
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post not called', async () => {
        process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
        delete process.env[TESTOPS_JWT_ENV]
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await expect(uploadEventData( { event_type: 'testRunStarted' } )).rejects.toThrow()
        expect(got.post).toBeCalledTimes(0)
    })

    it('throw error if BS_TESTOPS_BUILD_COMPLETED not defined', async () => {
        delete process.env[TESTOPS_BUILD_COMPLETED_ENV]
        mockedGot.post = jest.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await expect(uploadEventData( { event_type: 'testRunStarted' } )).rejects.toThrow('Build start not completed yet')
        expect(got.post).toBeCalledTimes(0)
    })

})
