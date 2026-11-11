import path from 'node:path'
import url from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { renderFile } from '../../src/utils.js'
import { EjsHelpers } from '../../src/templates/EjsHelpers.js'

const CONFIG = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../../src/templates/wdio.conf.tpl.ejs')

async function renderConfig (framework: string, useTypeScript = false, serenityAdapter?: string) {
    const rendered = await renderFile(CONFIG, {
        answers: {
            framework,
            serenityAdapter,
            services: [],
            runner: 'local',
            reporters: ['spec'],
            specs: './features/**/*.feature',
            stepDefinitions: './features/step-definitions/*.js',
            esmSupport: false,
            isUsingTypeScript: useTypeScript,
            tsProject: './tsconfig.json',
            purpose: 'e2e',
            rawAnswers: {}
        },
        _: new EjsHelpers({ useEsm: false, useTypeScript })
    })
    const javascript = useTypeScript
        ? ts.transpileModule(rendered, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
        : rendered
    const context = { exports: {} as { config?: WebdriverIO.Config } }
    vm.runInNewContext(javascript, context)
    return context.exports.config!
}

describe('generated Cucumber configuration', () => {
    it.each([false, true])('opts into ambiguous-definition errors (TypeScript: %s)', async (typescript) => {
        const config = await renderConfig('cucumber', typescript)
        expect(config.cucumberOpts?.failAmbiguousDefinitions).toBe(true)
        expect(config.cucumberOpts?.require).toEqual(['./features/step-definitions/*.js'])
    })

    it('does not add the WebdriverIO option to the Serenity Cucumber adapter', async () => {
        const config = await renderConfig('@serenity-js/webdriverio', false, 'cucumber')
        expect(config.cucumberOpts).not.toHaveProperty('failAmbiguousDefinitions')
        expect(config.cucumberOpts).toHaveProperty('import')
    })

    it.each(['mocha', 'jasmine'])('leaves %s without Cucumber options', async (framework) => {
        expect(await renderConfig(framework)).not.toHaveProperty('cucumberOpts')
    })
})
