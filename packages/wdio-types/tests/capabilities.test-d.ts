import { expectTypeOf, test } from 'vitest'

import type { Capabilities } from '../src/index.js'

test('has the capabilities of the mobilecli driver', () => {
    expectTypeOf<WebdriverIO.Capabilities['mobilecli:udid']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<WebdriverIO.Capabilities['mobilecli:app']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<WebdriverIO.Capabilities['mobilecli:options']>().toEqualTypeOf<Capabilities.MobilecliOptions | undefined>()
    expectTypeOf<Capabilities.MobilecliOptions['actionTimeout']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Capabilities.MobilecliCapabilities>().toMatchTypeOf<WebdriverIO.Capabilities>()

    const capabilities: WebdriverIO.Capabilities = {
        platformName: 'iOS',
        'mobilecli:udid': '00008030-000000000000002E'
    }
    expectTypeOf(capabilities['mobilecli:udid']).toEqualTypeOf<string | undefined>()
})
