import type { Reporters } from '@wdio/types'
import type { SuiteStats } from '@wdio/reporter'

type TestSuiteNameFunction = (options: TestSuiteNameFormatOptions) => string

interface ClassNameFormatOptions {
    /**
     * Configured package name
     */
    packageName?: string
    /**
     * Name of the current cucumber feature
     */
    activeFeatureName?: any
    /**
     * Context of the current suite
     */
    suite?: SuiteStats
}

interface TestSuiteNameFormatOptions {
    name?: any
    suite: SuiteStats
}

export interface JUnitReporterOptions extends Reporters.Options {
    /**
     * Gives the ability to provide custom regex for formatting test suite name (e.g. in output xml ) or
     * override the generated name of a test suite.
     *
     *
     * @example regex
     * /[^a-z0-9]+/
     *
     * @example suiteName
     * suiteNameFormat: function (options) {
     *     return `${options.suite.title}`
     * }
     */
    suiteNameFormat?: RegExp | TestSuiteNameFunction
    /**
     * Give the ability to override the generated classname of a test case.
     *
     * @default
     * classNameFormat: function (options) {
     *     return ``${options._packageName}.${options.suite.fullTitle.replace(/\s/g, '_')}``
     * }
     */
    classNameFormat?: (options: ClassNameFormatOptions) => string
    /**
     * Adds a file attribute to each testcase. This config is primarily for CircleCI. This setting
     * provides richer details but may break on other CI platforms.
     *
     * @default false
     */
    addFileAttribute?: boolean
    /**
     * You can break out packages by an additional level by setting `'packageName'`. For example, if
     * you wanted to iterate over a test suite with different environment variable set:
     *
     * @example
     * ```js
     * // wdio.conf.js
     * module.exports = {
     *     // ...
     *     reporters: [
     *         'dot',
     *         ['junit', {
     *             outputDir: './',
     *             packageName: process.env.USER_ROLE // chrome.41 - administrator
     *         }]
     *     ]
     *     // ...
     * };
     * ```
     */
    packageName?: string
    /**
     * Allows to set various combinations of error notifications inside xml. Given a Jasmine test
     * like `expect(true).toBe(false, 'my custom message')` you will get this test error:
     *
     * ```
     * {
     *     matcherName: 'toBe',
     *     message: 'Expected true to be false, \'my custom message\'.',
     *     stack: 'Error: Expected true to be false, \'my custom message\'.\n    at UserContext.it (/home/mcelotti/Workspace/WebstormProjects/forcebeatwio/test/marco/prova1.spec.js:3:22)',
     *     passed: false,
     *     expected: [ false, 'my custom message' ],
     *     actual: true
     * }
     * ```
     *
     * Therefore you can choose *which* key will be used *where*, see the example below.
     *
     * @example
     * ```js
     * // wdio.conf.js
     * module.exports = {
     *     // ...
     *     reporters: [
     *         'dot',
     *         ['junit', {
     *             outputDir: './',
     *             errorOptions: {
     *                 error: 'message',
     *                 failure: 'message',
     *                 stacktrace: 'stack'
     *             }
     *         }]
     *     ],
     *     // ...
     * };
     * ```
     */
    errorOptions?: Record<string, string>
}
