window.globalSetupScriptExecuted = true

export const mochaGlobalSetup = () => {
    window.mochaGlobalSetupExecuted = true
}

export const mochaGlobalTeardown = () => {
    console.log('This is the global teardown script speaking!')
}
