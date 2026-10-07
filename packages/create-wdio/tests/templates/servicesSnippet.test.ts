import path from 'node:path'
import url from 'node:url'
import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

import { renderFile } from '../../src/utils.js'
import { SUPPORTED_PACKAGES, QUESTIONNAIRE } from '../../src/constants.js'
import { EjsHelpers } from '../../src/templates/EjsHelpers.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const TEMPLATES = path.resolve(__dirname, '..', '..', 'src', 'templates')
const SNIPPET = path.resolve(TEMPLATES, 'snippets', 'services.ejs')
const CONFIG = path.resolve(TEMPLATES, 'wdio.conf.tpl.ejs')

const render = (services: string[]) =>
    renderFile(SNIPPET, { answers: { services, rawAnswers: {} } })

const E2E_ANSWERS = {
    runner: 'local',
    backend: 'On my local machine',
    e2eEnvironment: 'web'
}

/** The services question, as the wizard evaluates it for a plain e2e run. */
function servicesQuestion() {
    return QUESTIONNAIRE.find((q) => (q as any).name === 'services')! as any
}

/** What the checkbox offers. */
function offeredServices() {
    return servicesQuestion().choices(E2E_ANSWERS).filter(Boolean)
}

/** What it pre-checks. */
function defaultServices() {
    return servicesQuestion().default(E2E_ANSWERS)
}

describe('services snippet', () => {
    it('writes a plain name for a service with no options block', async () => {
        expect(await render(['appium'])).toContain("services: ['appium']")
    })

    describe('devtools', () => {
        it('is offered by the wizard', () => {
            // Absent from this list, the service exists but nobody running
            // `npm init wdio` ever learns that it does.
            const devtools = SUPPORTED_PACKAGES.service.find(({ name }) => name === 'devtools')

            expect(devtools).toBeTruthy()
            expect(devtools!.value).toBe('@wdio/devtools-service$--$devtools')
        })

        it('reaches the checkbox the wizard actually renders', () => {
            // Membership in SUPPORTED_PACKAGES is not enough on its own: the
            // question builds its own list, and several purposes replace it
            // wholesale rather than filtering it.
            const offered = offeredServices().map(({ name }: { name: string }) => name)

            expect(offered).toContain('devtools')
        })

        it('is not checked by default', () => {
            // Offered, never pushed. Only contextual services are pre-selected:
            // a chosen cloud backend, a mobile environment, a desktop runner.
            expect(defaultServices()).not.toContain('@wdio/devtools-service$--$devtools')
        })

        it('emits every option, commented, so the default behaviour is unchanged', async () => {
            const rendered = await render(['devtools'])

            // The block exists for discoverability: 13 options that are
            // otherwise invisible unless you read the docs, shown where people
            // already are. Commented out it is exactly `'devtools'`.
            for (const option of [
                'mode',
                'port',
                'hostname',
                'captureAssertions',
                'screencast',
                'devtoolsCapabilities',
                'traceFormat',
                'traceGranularity',
                'tracePolicy',
                'filmstrip',
                'emitArtifactsManifest',
                'screenshot',
                'video'
            ]) {
                expect(rendered).toContain(`// ${option}:`)
            }
        })

        it('leaves no option uncommented', async () => {
            // The guarantee that makes the block safe to ship by default: an
            // uncommented option would change how a generated project behaves.
            const body = (await render(['devtools'])).split("'devtools'")[1]
            const uncommented = body
                .split('\n')
                .filter((line) => /^\s+[a-zA-Z]+:/.test(line))

            expect(uncommented).toEqual([])
        })

        it('sits alongside another service without disturbing it', async () => {
            const rendered = await render(['devtools', 'appium'])

            expect(rendered).toContain("'appium'")
            expect(rendered).toContain("'devtools'")
        })
    })
})

describe('generated config', () => {
    const POINTER = 'Install @wdio/devtools-service, then add'

    // CommonJS, so `vm.Script` can parse the whole file without running it: a
    // broken comment or entry anywhere fails here, not only where we look.
    const renderConfig = (services: string[]) =>
        renderFile(CONFIG, {
            answers: {
                services,
                framework: 'mocha',
                runner: 'local',
                reporters: ['spec'],
                specs: './test/specs/**/*.js',
                esmSupport: false,
                isUsingTypeScript: false,
                purpose: 'e2e',
                rawAnswers: {}
            },
            _: new EjsHelpers({ useEsm: false, useTypeScript: false })
        })

    it('configures the service and drops the pointer when DevTools is selected', async () => {
        const config = await renderConfig(['devtools'])

        expect(config).toContain("services: [[\n        'devtools',")
        expect(config).not.toContain(POINTER)
        expect(() => new vm.Script(config)).not.toThrow()
    })

    it.each([
        ['another service', ['visual']],
        ['no service', []]
    ])('points to DevTools from a config with %s', async (_label, services) => {
        const config = await renderConfig(services)

        expect(config).toContain(POINTER)
        expect(config).not.toContain("'devtools',\n        {")
        expect(() => new vm.Script(config)).not.toThrow()
    })
})
