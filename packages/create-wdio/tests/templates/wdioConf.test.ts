import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderFile } from '../../src/utils.js'
import { EjsHelpers } from '../../src/templates/EjsHelpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tplPath = path.resolve(__dirname, '..', '..', 'src', 'templates', 'wdio.conf.tpl.ejs')

const baseAnswers: any = {
    runner: 'local',
    preset: '',
    tsProject: './tsconfig.e2e.json',
    isUsingTypeScript: true,
    esmSupport: true,
    framework: 'mocha',
    purpose: 'e2e',
    specs: './test/specs/**/*.js',
    reporters: ['spec'],
    plugins: ['deepagent'],
    services: ['devtools'],
    serenityAdapter: false,
    useSauceConnect: false,
    generateTestFiles: true,
    isUsingDeepAgent: true,
    deepagentModel: { provider: 'openrouter', model: 'moonshotai/kimi-k3' }
}

async function render (answers: any) {
    return renderFile(tplPath, {
        answers,
        _: new EjsHelpers({ useEsm: answers.esmSupport, useTypeScript: answers.isUsingTypeScript })
    })
}

describe('wdio.conf template', () => {
    it('renders the deepagent config block for deepagent projects', async () => {
        const output = await render({ ...baseAnswers })

        expect(output).toContain('/// <reference types="@wdio/deepagent" />')
        expect(output).toContain('deepagent: {')
        expect(output).toContain("provider: 'openrouter'")
        expect(output).toContain("model: 'moonshotai/kimi-k3'")
        expect(output).toContain("services: ['devtools'],")
    })

    it('renders a baseURL for local providers', async () => {
        const output = await render({
            ...baseAnswers,
            deepagentModel: { provider: 'llama-cpp', model: 'llama-3.2-3b', baseURL: 'http://localhost:8080/v1' }
        })

        expect(output).toContain("provider: 'llama-cpp'")
        expect(output).toContain("baseURL: 'http://localhost:8080/v1'")
    })

    it('omits the deepagent config block when not using deepagent', async () => {
        const output = await render({
            ...baseAnswers,
            isUsingDeepAgent: false,
            deepagentModel: undefined,
            services: []
        })

        expect(output).not.toContain('deepagent:')
        expect(output).not.toContain("'devtools'")
        expect(output).not.toContain('/// <reference types="@wdio/deepagent" />')
    })
})
