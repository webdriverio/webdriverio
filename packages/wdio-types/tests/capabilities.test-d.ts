import { expectTypeOf, test } from 'vitest'

import type { Capabilities } from '../src/index.js'

test('has the capabilities of the mobilecli driver', () => {
    expectTypeOf<WebdriverIO.Capabilities['mobilecli:udid']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Capabilities.MobilecliCapabilities>().toMatchTypeOf<WebdriverIO.Capabilities>()

    const capabilities: WebdriverIO.Capabilities = {
        platformName: 'iOS',
        'mobilecli:udid': '00008030-000000000000002E'
    }
    expectTypeOf(capabilities['mobilecli:udid']).toEqualTypeOf<string | undefined>()
})
