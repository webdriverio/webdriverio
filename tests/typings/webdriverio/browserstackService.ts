import { expectType } from 'tsd'
import { browser } from '@wdio/globals'

/**
 * Regression guard for the @wdio/browserstack-service accessibility
 * augmentation of WebdriverIO.Browser.
 *
 * These five methods are declared inside
 *   declare global { namespace WebdriverIO { interface Browser { ... } } }
 * in packages/wdio-browserstack-service/src/index.ts. They previously lived
 * in an un-emitted ambient .d.ts file and silently never reached the published
 * build/index.d.ts, so consumers lost the typings. This file pulls in the
 * published @wdio/browserstack-service types (it is listed in this suite's
 * tsconfig.json `types` array) and fails `test:typings:webdriverio` if any of
 * the five methods ever stops being typed on WebdriverIO.Browser again.
 */
;(async () => {
    expectType<() => Promise<Record<string, unknown>>>(browser.getAccessibilityResultsSummary)
    expectType<() => Promise<Array<Record<string, unknown>>>>(browser.getAccessibilityResults)
    expectType<() => Promise<Record<string, unknown> | undefined>>(browser.performScan)
    expectType<() => Promise<void>>(browser.startA11yScanning)
    expectType<() => Promise<void>>(browser.stopA11yScanning)

    // also assert the call-site return types resolve as declared
    expectType<Record<string, unknown>>(await browser.getAccessibilityResultsSummary())
    expectType<Array<Record<string, unknown>>>(await browser.getAccessibilityResults())
    expectType<Record<string, unknown> | undefined>(await browser.performScan())
    expectType<void>(await browser.startA11yScanning())
    expectType<void>(await browser.stopA11yScanning())
})
