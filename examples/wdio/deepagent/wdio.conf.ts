export const config: WebdriverIO.Config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
    tsConfigPath: './tsconfig.json',
    //
    // ==================
    // Specify Test Files
    // ==================
    specs: ['./deepagent.test.ts'],
    exclude: [],
    maxInstances: 10,
    //
    // ============
    // Capabilities
    // ============
    capabilities: [{
        browserName: 'chrome'
    }],
    //
    // ===================
    // Test Configurations
    // ====================
    logLevel: 'info',
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    // `wdio-deepagent init` appends 'devtools' here (needed for trace-based
    // `diagnose`). It is omitted in this example because @wdio/devtools-service
    // is not part of the monorepo — install it and add the service when you
    // want trace reproduction + healing.
    services: [],
    reporters: ['spec'],
    //
    // ===============
    // DeepAgent block
    // ===============
    // Consumed by `wdio-deepagent` (repl/run/diagnose). Secrets live in
    // env vars: OPENROUTER_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY.
    deepagent: {
        model: {
            provider: 'openrouter',
            model: 'moonshotai/kimi-k3'
        },
        heal: 'ask'
    }
}
