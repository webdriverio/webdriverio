const {
    After,
    AfterAll,
    AfterStep,

    Before,
    BeforeAll,
    BeforeStep,

    Given,
    When,
    Then,

    DataTable,

    World,

    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,
    defineParameterType,
    defineStep

// eslint-disable-next-line @typescript-eslint/no-require-imports
} = require('@cucumber/cucumber')

const adapterFactory = {
    init: async function initCucumberFramework (...args: unknown[]) {
        const { CucumberAdapter } = await import('./index.js')
        // @ts-expect-error just passing through args
        const adapter = new CucumberAdapter(...args as unknown[])
        const instance = await adapter.init()
        return instance
    },
    After,
    AfterAll,
    AfterStep,

    Before,
    BeforeAll,
    BeforeStep,

    Given,
    When,
    Then,

    DataTable,

    World,

    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,
    defineParameterType,
    defineStep,

    publishCucumberReport: async function (cucumberMessageDir: string) {
        const { publishCucumberReport } = await import('./index.js')
        await publishCucumberReport(cucumberMessageDir)
    }
}

module.exports = adapterFactory
