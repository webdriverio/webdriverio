/**
 * Browsers that run the component-testing bundles.
 *
 * esbuild rewrites syntax for this target and does not add missing APIs.
 * `pnpm run test:browser-lib` type-checks the bundled sources with
 * `BROWSER_TS_LIB` so a newer API cannot land unnoticed.
 *
 * `EXECUTE_SCRIPT_TS_LIB` is a separate floor. `webdriverio/src/scripts` run
 * inside `browser.execute` in the automated browser, which can be older than
 * the browsers that run component tests.
 *
 * Documented for users in website/docs/ComponentTesting.md ("Browser support").
 */
export const BROWSER_BUILD_TARGET = ['es2021', 'chrome90', 'edge90', 'firefox90', 'safari14.1'] as const

export const BROWSER_TS_LIB = ['es2021', 'dom', 'dom.iterable'] as const

export const EXECUTE_SCRIPT_TS_LIB = ['es2021', 'dom', 'dom.iterable'] as const
