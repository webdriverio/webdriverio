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

} = require('@cucumber/cucumber')

const adapterFactory = {
    init: async function initCucumberFramework (...args: any[]) {
        const { CucumberAdapter } = await import('../index.js')
        // @ts-ignore just passing through args
        const adapter = new CucumberAdapter(...args as any)
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
        const { publishCucumberReport } = await import('../index.js')
        await publishCucumberReport(cucumberMessageDir)
    }
}

module.exports = adapterFactory
