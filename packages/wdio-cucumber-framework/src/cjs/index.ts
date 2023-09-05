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
    defineStep
}

module.exports = adapterFactory
