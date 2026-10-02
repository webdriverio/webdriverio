import { expect } from '@wdio/globals'

import { driverDirs, driveAndGetChromedriverVersion } from './helpers.js'

describe('Chromedriver from Electron releases', () => {
    it('uses the Chromedriver of the Electron release set by wdio:electronVersion', async () => {
        expect(await driveAndGetChromedriverVersion()).toMatch(/^130\.0\.6723\.137 /)
        expect(driverDirs()).toContainEqual(expect.stringMatching(/-33\.2\.1$/))
    })
})
