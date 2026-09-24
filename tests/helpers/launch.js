import { Launcher } from '@wdio/cli'

/**
 * The smoke suites assert on the testrunner plumbing (CLI, retries, framework
 * adapters, reporters), not on selector strictness. Their
 * `@wdio/webdriver-mock-service` scenarios stub `findElement` with exact `nock`
 * call counts, while a strict `$` queries `findElements` instead — so strict
 * mode is turned off for every smoke suite here.
 *
 * Strict `$` itself is covered by
 * `packages/webdriverio/tests/strictSelectors.test.ts` and
 * `e2e/wdio/headless/strictSelectors.e2e.ts`.
 */
export default function launch (testName, configPath, args = {}, ...rest) {
    const launcher = new Launcher(configPath, { strictSelectors: false, ...args }, ...rest)
    return launcher.run().then(async (exitCode) => {
        const isFailing = exitCode !== 0
        if (!isFailing) {
            return {
                passed: launcher.interface.result.passed,
                skippedSpecs: launcher.interface._skippedSpecs,
                failed: launcher.interface.result.failed
            }
        }

        throw new Error(`Smoke test "${testName}" failed`)
    })
}
