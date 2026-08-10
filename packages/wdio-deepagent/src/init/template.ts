import { z } from 'zod'

/**
 * Answers collected by the `init` wizard — the same question set
 * create-wdio asks (framework, TS, services, cloud), plus the deepagent
 * model/heal block.
 */
export const InitAnswersSchema = z.object({
    framework: z.enum(['mocha', 'jasmine', 'cucumber']),
    isUsingTypeScript: z.boolean().default(true),
    specDir: z.string().default('./test/specs/**/*.js'),
    featureDir: z.string().optional(),
    services: z.array(z.string()).default([]),
    /** Cloud provider when using a remote grid, else undefined = local. */
    cloudProvider: z.enum(['browserstack', 'saucelabs', 'lambdatest', 'testingbot']).optional(),
    baseUrl: z.string().default('http://localhost'),
    deepagentModel: z.object({
        provider: z.enum(['openrouter', 'openai', 'anthropic', 'ollama']),
        model: z.string(),
    }).default({ provider: 'openrouter', model: 'moonshotai/kimi-k3' }),
    heal: z.enum(['ask', 'propose', 'auto']).default('ask'),
})

export type InitAnswers = z.infer<typeof InitAnswersSchema>

export function parseInitAnswers(raw: unknown): InitAnswers {
    return InitAnswersSchema.parse(raw)
}

/** Service entries shipped in the config (kept installable by the user). */
export function servicesFor(answers: InitAnswers): string[] {
    const services = [...answers.services]
    // devtools service is required for trace reproducibility (diagnose);
    // it runs in the user's project, so it is listed in the config, not
    // bundled by this package.
    if (!services.includes('devtools')) {
        services.push('devtools')
    }
    return services
}

function frameworkOptions(answers: InitAnswers): string {
    switch (answers.framework) {
    case 'mocha':
        return '    mochaOpts: {\n        ui: \'bdd\',\n        timeout: 60000\n    },'
    case 'jasmine':
        return '    jasmineOpts: {\n        defaultTimeoutInterval: 60000\n    },'
    case 'cucumber':
        return `    cucumberOpts: {\n        require: ['${answers.featureDir ?? './test/features/step-definitions'}'],\n        timeout: 60000\n    },`
    }
}

function capabilitiesFor(answers: InitAnswers): string {
    if (answers.cloudProvider) {
        return `    capabilities: [{\n        browserName: 'chrome',\n        platformName: 'windows',\n        'wdio:${answers.cloudProvider === 'saucelabs' ? 'options' : answers.cloudProvider}': {}\n    }],`
    }
    return '    capabilities: [{\n        browserName: \'chrome\'\n    }],'
}

/**
 * Renders a complete, valid `wdio.conf.ts` for the chosen framework,
 * including the `deepagent` block the harness consumes.
 */
export function renderWdioConfig(answers: InitAnswers): string {
    const specs = answers.framework === 'cucumber'
        ? `    specs: ['${answers.featureDir ?? './test/features/**/*.feature'}'],`
        : `    specs: ['${answers.specDir}'],`

    const services = servicesFor(answers).map((s) => `        '${s}'`).join(',\n')

    return `export const config: WebdriverIO.Config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
${answers.isUsingTypeScript ? '    tsConfigPath: \'./tsconfig.json\',' : ''}
    //
    // ==================
    // Specify Test Files
    // ==================
${specs}
    exclude: [],
    maxInstances: 10,
    //
    // ============
    // Capabilities
    // ============
${capabilitiesFor(answers)}
    //
    // ===================
    // Test Configurations
    // ====================
    logLevel: 'info',
    baseUrl: '${answers.baseUrl}',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    framework: '${answers.framework}',
${frameworkOptions(answers)}
    services: [
${services}
    ],
    reporters: ['spec'],
    //
    // ===============
    // DeepAgent block
    // ===============
    // Consumed by \`wdio-deepagent\` (repl/run/diagnose). Secrets live in
    // env vars: OPENROUTER_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY.
    deepagent: {
        model: {
            provider: '${answers.deepagentModel.provider}',
            model: '${answers.deepagentModel.model}'
        },
        heal: '${answers.heal}'
    }
}
`
}
