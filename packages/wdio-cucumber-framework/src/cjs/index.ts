const {
    After,
    AfterAll,
    AfterStep,
    Before,
    BeforeAll,
    BeforeStep,
    DataTable,
    defineParameterType,
    defineStep,
    Given,
    setDefaultTimeout,
    setDefinitionFunctionWrapper,
    setWorldConstructor,
    World,
    Then,
    When
} = require('@cucumber/cucumber')

const adapterFactory = {
    init: async function initCucumberFramework (...args: any[]) {
        const { CucumberAdapter } = await import('../index.js')
        // @ts-ignore just passing through args
        const adapter = new CucumberAdapter(...args as any)
        const instance = await adapter.init()
        return instance
    },
    After: After,
    AfterAll: AfterAll,
    AfterStep: AfterStep,
    Before: Before,
    BeforeAll: BeforeAll,
    BeforeStep: BeforeStep,
    DataTable: DataTable,
    defineParameterType: defineParameterType,
    defineStep: defineStep,
    Given: Given,
    setDefaultTimeout: setDefaultTimeout,
    setDefinitionFunctionWrapper: setDefinitionFunctionWrapper,
    setWorldConstructor: setWorldConstructor,
    World: World,
    Then: Then,
    When: When,
}

module.exports = adapterFactory
