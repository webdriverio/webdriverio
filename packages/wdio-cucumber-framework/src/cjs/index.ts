const {
    After,
    AfterAll,
    AfterStep,
    Before,
    BeforeAll,
    BeforeStep,

    Given,
    Then,
    When,

    defineParameterType,
    defineStep,
    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,

    DataTable,
    World,
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
    Then,
    When,

    defineParameterType,
    defineStep,
    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,

    DataTable,
    World,
}

module.exports = adapterFactory
