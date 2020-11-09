jest.mock('aws-sdk/clients/devicefarm', () => {
    return jest.fn().mockImplementation(() => {
        return { createTestGridUrl: () => ({
            promise: () => ({
                url: 'https://testgrid-devicefarm.us-west-2.amazonaws.com/AQICAHiRxhO-PGIRztfuyZnEOnPbRAM8ftJRJWoP00xHm3SXdQEW2BDRc9ocoUEeQVdnsMrWAAAAyjCBxwYJKoZIhvcNAQcGoIG5MIG2AgEAMIGwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDPq1jxIZck6AMO5WWwIBEICBgkrIHKQEze1SIKH51gJ1SmepVkir98yngqgZKKXLHC2v5P3Njc6RmQsk2MHnpY3eH1Ae3RCgZPqt6JInWx8YAFD4T62lo3U8YCLNipI4Tg_oJnkCrf532LZqLvEY6ZHNYlr0NzMObeMCsRGddX0su2yrq6Zgx5SS_N_Kt3H7sOpuSkw=/wd/hub'
            })
        })
        }
    })
})

import DeviceFarmLauncher from '../src/launcher'

describe('DeviceFarmLauncher', () => {
    it('Updates capabilities with destination', async () => {
        const projectArn = 'asdf'
        const subject = new DeviceFarmLauncher({ projectArn })

        const capabilites = { browserName: 'chrome' }
        await subject.onPrepare({}, [capabilites])

        expect(capabilites).toEqual({
            protocol: 'https',
            hostname: 'testgrid-devicefarm.us-west-2.amazonaws.com',
            path: '/AQICAHiRxhO-PGIRztfuyZnEOnPbRAM8ftJRJWoP00xHm3SXdQEW2BDRc9ocoUEeQVdnsMrWAAAAyjCBxwYJKoZIhvcNAQcGoIG5MIG2AgEAMIGwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDPq1jxIZck6AMO5WWwIBEICBgkrIHKQEze1SIKH51gJ1SmepVkir98yngqgZKKXLHC2v5P3Njc6RmQsk2MHnpY3eH1Ae3RCgZPqt6JInWx8YAFD4T62lo3U8YCLNipI4Tg_oJnkCrf532LZqLvEY6ZHNYlr0NzMObeMCsRGddX0su2yrq6Zgx5SS_N_Kt3H7sOpuSkw=/wd/hub',
            port: 443,
            browserName: 'chrome',
            connectionRetryTimeout: 180000,
        })
    })
})
