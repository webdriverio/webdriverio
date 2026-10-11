import { defineConfig } from 'vitest/config'
import { webdriverio } from '@vitest/browser-webdriverio'

/**
 * Tests of scripts that run in the page, in a real browser driven by
 * WebdriverIO: `pnpm run test:unit:browser`
 */
export default defineConfig({
    test: {
        include: ['packages/**/*.browser.test.ts'],
        exclude: ['**/node_modules/**', '**/build/**'],
        browser: {
            enabled: true,
            headless: true,
            /**
             * the provider switches frames with `switchFrame`, which WebDriver
             * BiDi sessions no longer offer in v10. A Classic session also keeps
             * WebdriverIO's own preload scripts out of the page under test. The
             * provider reads its capabilities from these options only.
             */
            provider: webdriverio({ capabilities: { 'wdio:enforceWebDriverClassic': true } }),
            instances: [{ browser: 'chrome' }]
        }
    }
})
