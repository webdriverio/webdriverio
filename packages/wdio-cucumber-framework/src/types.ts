export interface CucumberOpts {
    /**
     * Show full backtrace for errors.
     * @default true
     */
    backtrace: boolean
    /**
     * Require modules prior to requiring any support files.
     * @default []
     * @example `['@babel/register']` or `[['@babel/register', { rootMode: 'upward', ignore: ['node_modules'] }]] or [() => { require('ts-node').register({ files: true }) }]`
     */
    requireModule: string[]
    /**
     * Treat ambiguous definitions as errors.
     *
     * Please note that this is a @wdio/cucumber-framework specific option
     * and not recognized by cucumber-js itself.
     * @default false
     */
    failAmbiguousDefinitions: boolean
    /**
     * Abort the run on first failure.
     * @default false
     */
    failFast: boolean
    /**
     * Treat undefined definitions as warnings.
     * Please note that this is a @wdio/cucumber-framework specific option and
     * not recognized by cucumber-js itself.
     * @default false
     */
    ignoreUndefinedDefinitions: boolean
    /**
     * Only execute the scenarios with name matching the expression (repeatable).
     * @default []
     */
    name: string[]
    /**
     * Specify the profile to use.
     * @default []
     */
    profile: string[]
    /**
     * Require files containing your step definitions before executing features.
     * You can also specify a glob to your step definitions.
     * @default []
     * @example `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`
     */
    require: string[]
    /**
     * Specify a custom snippet syntax.
     */
    snippetSyntax?: string
    /**
     * Hide step definition snippets for pending steps.
     * @default true
     */
    snippets: boolean
    /**
     * Hide source uris.
     * @default true
     */
    source: boolean
    /**
     * Fail if there are any undefined or pending steps
     * @default false
     */
    strict: boolean
    /**
     * Only execute the features or scenarios with tags matching the expression.
     * Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
     */
    tagExpression: string
    /**
     * Add cucumber tags to feature or scenario name
     * @default false
     */
    tagsInTitle: boolean
    /**
     * Timeout in milliseconds for step definitions.
     * @default 30000
     */
    timeout: number
    /**
     * Enable this to make webdriver.io behave as if scenarios
     * and not steps were the tests.
     * @default false
     */
    scenarioLevelReporter: boolean
    /**
     * Switch between deterministic  and random feature execution. Either "defined",
     * "random" or "random:42" whereas 42 is the seed for randomization
     */
    order: string

    featureDefaultLanguage: string
}
