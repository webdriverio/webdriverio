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
            provider: webdriverio(),
            /**
             * the provider switches frames with `switchFrame`, which WebDriver
             * BiDi sessions no longer offer in v10
             */
            instances: [{ browser: 'chrome', capabilities: { 'wdio:enforceWebDriverClassic': true } }]
        }
    }
})
