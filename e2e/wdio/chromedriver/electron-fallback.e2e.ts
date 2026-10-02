import { expect } from '@wdio/globals'

import { driverDirs, driveAndGetChromedriverVersion } from './helpers.js'

describe('Chromedriver on Linux ARM64', () => {
    it('uses the Chromedriver of an Electron release for Chrome older than 153.0.8001.0', async () => {
        // the last Electron release with Chromium 130 is 33.4.11
        expect(await driveAndGetChromedriverVersion()).toMatch(/^130\.0\.6723\.191 /)
        expect(driverDirs()).toContain('linux_arm-33.4.11')
    })
})
