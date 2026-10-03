import { describe, expect, it } from 'vitest'

import {
    ANSWER_FLAGS,
    AnswerFlagError,
    answerFlagsToArgs,
    assertAnswerFlagsApply,
    getAnswerFlagYargsOptions,
    parseAnswerFlags
} from '../src/answerFlags.js'
import { BackendChoice, DesktopFrameworkChoice, QUESTIONNAIRE, SUPPORTED_PACKAGES } from '../src/constants.js'
import type { Questionnair } from '../src/types.js'

const E2E = SUPPORTED_PACKAGES.runner[0].value
const COMPONENT = SUPPORTED_PACKAGES.runner[1].value
const DESKTOP = SUPPORTED_PACKAGES.runner[2].value
const MOCHA = '@wdio/mocha-framework$--$mocha'

describe('ANSWER_FLAGS', () => {
    it('answers questions that exist in the questionnaire', () => {
        const names = new Set(QUESTIONNAIRE.map((question) => question.name))
        for (const flag of ANSWER_FLAGS) {
            expect(names, flag.name).toContain(flag.answer)
        }
    })

    it('maps every value a choice question offers', () => {
        expect(Object.keys(ANSWER_FLAGS.find((flag) => flag.name === 'runner')!.choices!()))
            .toEqual(['e2e', 'component', 'desktop', 'vscode', 'roku'])
        expect(Object.keys(ANSWER_FLAGS.find((flag) => flag.name === 'preset')!.choices!()))
            .toEqual(['lit', 'vue', 'svelte', 'solid', 'stencil', 'react', 'preact', 'other'])
        expect(Object.keys(ANSWER_FLAGS.find((flag) => flag.name === 'framework')!.choices!()))
            .toEqual(['mocha', 'serenity-mocha', 'jasmine', 'serenity-jasmine', 'cucumber', 'serenity-cucumber'])
    })

    it('registers kebab-case yargs options without defaults', () => {
        const options = getAnswerFlagYargsOptions()
        expect(options['desktop-framework']).toEqual({
            desc: expect.stringContaining('electron, tauri, dioxus, macos'),
            type: 'string',
            group: 'Wizard answers:'
        })
        expect(options['npm-install'].type).toBe('boolean')
        expect(Object.values(options).some((option) => 'default' in option)).toBe(false)
    })
})

describe('parseAnswerFlags', () => {
    it('maps CLI values to wizard answers', () => {
        expect(parseAnswerFlags({
            runner: 'desktop',
            desktopFramework: 'Electron',
            framework: 'serenity-cucumber',
            typescript: false,
            reporters: 'spec, junit',
            services: ['electron', 'visual,electron'],
            port: 4444,
            yes: true
        })).toEqual({
            runner: DESKTOP,
            desktopFramework: DesktopFrameworkChoice.Electron,
            framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$cucumber',
            isUsingTypeScript: false,
            reporters: ['@wdio/spec-reporter$--$spec', '@wdio/junit-reporter$--$junit'],
            services: ['@wdio/electron-service$--$electron', '@wdio/visual-service$--$visual'],
            port: '4444'
        })
    })

    it('leaves out flags that were not passed', () => {
        expect(parseAnswerFlags({ yes: true, npmTag: 'latest' })).toEqual({})
    })

    it('keeps the "other" preset as null', () => {
        expect(parseAnswerFlags({ preset: 'other' })).toEqual({ preset: null })
    })

    it('derives the e2e environment from browsers or a mobile platform', () => {
        expect(parseAnswerFlags({ browsers: 'firefox,edge' })).toEqual({
            browserEnvironment: ['firefox', 'MicrosoftEdge'],
            e2eEnvironment: 'web'
        })
        expect(parseAnswerFlags({ mobileEnvironment: 'ios' })).toEqual({
            mobileEnvironment: 'ios',
            e2eEnvironment: 'mobile'
        })
        expect(parseAnswerFlags({ mobileEnvironment: 'ios', environment: 'web' }).e2eEnvironment).toBe('web')
    })

    it('rejects an unknown value and lists the valid ones', () => {
        expect(() => parseAnswerFlags({ framework: 'cucumbr' })).toThrow(AnswerFlagError)
        expect(() => parseAnswerFlags({ framework: 'cucumbr' }))
            .toThrow('Invalid value "cucumbr" for --framework. Use one of: mocha, serenity-mocha, jasmine')
        expect(() => parseAnswerFlags({ reporters: 'spec,nope' }))
            .toThrow('Invalid value "nope" for --reporters')
    })
})

describe('answerFlagsToArgs', () => {
    it('turns options back into flags for `wdio config`', () => {
        expect(answerFlagsToArgs({
            runner: 'e2e',
            typescript: false,
            npmInstall: true,
            reporters: 'spec,junit',
            desktopFramework: undefined,
            dev: true
        })).toEqual([
            '--runner', 'e2e',
            '--no-typescript',
            '--reporters', 'spec,junit',
            '--npm-install'
        ])
    })

    it('writes kebab-case flags and --no- for false booleans', () => {
        expect(answerFlagsToArgs({ runner: 'component', preset: 'react', testingLibrary: false }))
            .toEqual(['--runner', 'component', '--preset', 'react', '--no-testing-library'])
    })
})

describe('assertAnswerFlagsApply', () => {
    const base = {
        runner: E2E,
        backend: BackendChoice.Local,
        framework: MOCHA,
        reporters: [],
        plugins: [],
        services: []
    } as unknown as Questionnair

    it('accepts flags for questions the wizard asks', () => {
        const flags = parseAnswerFlags({ backend: 'local', framework: 'mocha' })
        expect(() => assertAnswerFlagsApply(flags, { ...base, ...flags })).not.toThrow()
    })

    it('rejects a flag for a question the wizard skips', () => {
        const flags = parseAnswerFlags({ preset: 'react' })
        expect(() => assertAnswerFlagsApply(flags, { ...base, ...flags }))
            .toThrow('--preset does not apply to this setup. UI framework of your components (with --runner component).')
    })

    it('rejects a value the wizard does not offer for this setup', () => {
        const flags = parseAnswerFlags({ runner: 'component', framework: 'cucumber' })
        expect(() => assertAnswerFlagsApply(flags, { ...base, ...flags }))
            .toThrow('--framework cucumber is not available for this setup. Use one of: mocha')
    })

    it('checks every value of a list flag', () => {
        const flags = parseAnswerFlags({ runner: 'desktop', desktopFramework: 'electron', services: 'electron,visual' })
        expect(() => assertAnswerFlagsApply(flags, { ...base, ...flags }))
            .toThrow('--services visual is not available for this setup. Use one of: electron')
    })

    it('accepts a question that is asked under one of several conditions', () => {
        const flags = parseAnswerFlags({ backend: 'saucelabs', envUser: 'MY_USER' })
        expect(() => assertAnswerFlagsApply(flags, { ...base, ...flags })).not.toThrow()
        const component = parseAnswerFlags({ runner: 'component', preset: 'react' })
        expect(() => assertAnswerFlagsApply(component, { ...base, runner: COMPONENT, ...component })).not.toThrow()
    })
})
