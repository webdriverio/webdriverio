import * as utils from '../src/util'
import BStackCleanup from '../src/cleanup'

describe('executeObservabilityCleanup', () => {
    const stopBuildUpstreamSpy = jest.spyOn(utils, 'stopBuildUpstream')
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
