import { uploadEventData } from '../../src/testOps/requestUtils.js'
import { describe, expect, it, vi } from 'vitest'
import got from 'got'

describe('uploadEventData', () => {
    const mockedGot = vi.mocked(got)

    it('got.post called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = vi.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        expect(async () => uploadEventData( { event_type: 'testRunStarted' } )).not.toThrowError()
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post failed', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        process.env.BS_TESTOPS_JWT = 'jwt'
        mockedGot.post = vi.fn().mockReturnValue({
            json: () => Promise.reject({ }),
        } as any)

        await expect(uploadEventData( { event_type: 'testRunStarted' } )).rejects.toThrow()
        expect(got.post).toBeCalledTimes(1)
    })

    it('got.post not called', async () => {
        process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
        delete process.env.BS_TESTOPS_JWT
        mockedGot.post = vi.fn().mockReturnValue({
            json: () => Promise.resolve({ }),
        } as any)

        await expect(uploadEventData( { event_type: 'testRunStarted' } )).rejects.toThrow()
        expect(got.post).toBeCalledTimes(0)
    })
})
