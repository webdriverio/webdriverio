import * as utils from '../src/util.js'
import BStackCleanup from '../src/cleanup.js'
import { describe, expect, it, vi } from 'vitest'

describe('executeObservabilityCleanup', () => {
    const stopBuildUpstreamSpy = vi.spyOn(utils, 'stopBuildUpstream')

    it('does not invoke stop call for observability when jwt is not set', async () => {
        await BStackCleanup.executeObservabilityCleanup()
        expect(stopBuildUpstreamSpy).toBeCalledTimes(0)
    })

    it('invoke stop call for observability when jwt is set', async () => {
        process.env.BS_TESTOPS_JWT = 'jwtToken'
        await BStackCleanup.executeObservabilityCleanup()
        expect(stopBuildUpstreamSpy).toBeCalledTimes(1)
    })
})
