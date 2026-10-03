import {
    QUESTIONNAIRE,
    SUPPORTED_PACKAGES,
    SUPPORTED_BROWSER_RUNNER_PRESETS,
    BackendChoice,
    RegionOptions,
    ElectronBuildToolChoice,
    DesktopFrameworkChoice,
    TauriDriverProviderChoice,
    DioxusDriverProviderChoice
} from './constants.js'
import type { Questionnair } from './types.js'

type AnswerValue = string | null

export interface AnswerFlag {
    /**
     * camelCase option name, passed as `--kebab-case` on the command line
     */
    name: string
    answer: keyof Questionnair
    type: 'string' | 'boolean' | 'array'
    desc: string
    /**
     * CLI value → wizard answer value
     */
    choices?: () => Record<string, AnswerValue>
}

/**
 * Thrown for a flag value the wizard cannot use. The CLI prints the message
 * and exits with code 2, like any other usage error.
 */
export class AnswerFlagError extends Error {
    name = 'AnswerFlagError'
}

const HASH = '$--$'

/**
 * `constants.ts` and this module import each other, so read the package
 * lists only when a flag is used, not when the module loads.
 */
function packageChoices (
    packages: () => { value: string }[],
    key: (short: string, purpose: string | undefined, pkg: string) => string = (short) => short
) {
    return () => Object.fromEntries(packages().map(({ value }) => {
        const [pkg, short, purpose] = value.split(HASH)
        return [key(short, purpose, pkg), value]
    }))
}

/**
 * Every wizard question that can be answered from the command line.
 * `npm init wdio` and `wdio config` both read this list, so the flags and
 * their help text stay the same in both commands.
 */
export const ANSWER_FLAGS: AnswerFlag[] = [{
    name: 'runner',
    answer: 'runner',
    type: 'string',
    desc: 'Type of testing',
    choices: packageChoices(() => SUPPORTED_PACKAGES.runner, (_, purpose) => purpose!)
}, {
    name: 'preset',
    answer: 'preset',
    type: 'string',
    desc: 'UI framework of your components (with --runner component)',
    choices: () => Object.fromEntries(SUPPORTED_BROWSER_RUNNER_PRESETS.map(({ name, value }) => [
        value === null ? 'other' : value.split(HASH)[1] || name.split(' ')[0].toLowerCase(),
        value
    ]))
}, {
    name: 'testingLibrary',
    answer: 'installTestingLibrary',
    type: 'boolean',
    desc: 'Install Testing Library (with --preset vue, svelte, solid, react or preact)'
}, {
    name: 'desktopFramework',
    answer: 'desktopFramework',
    type: 'string',
    desc: 'Desktop app framework (with --runner desktop)',
    choices: () => ({
        electron: DesktopFrameworkChoice.Electron,
        tauri: DesktopFrameworkChoice.Tauri,
        dioxus: DesktopFrameworkChoice.Dioxus,
        macos: DesktopFrameworkChoice.MacOS
    })
}, {
    name: 'electronBuildTool',
    answer: 'electronBuildTool',
    type: 'string',
    desc: 'Tool that builds your Electron app (with --desktop-framework electron)',
    choices: () => ({
        forge: ElectronBuildToolChoice.ElectronForge,
        builder: ElectronBuildToolChoice.ElectronBuilder,
        other: ElectronBuildToolChoice.SomethingElse
    })
}, {
    name: 'electronAppBinaryPath',
    answer: 'electronAppBinaryPath',
    type: 'string',
    desc: 'Path to the built Electron app (with --electron-build-tool other)'
}, {
    name: 'tauriDriverProvider',
    answer: 'tauriDriverProvider',
    type: 'string',
    desc: 'WebDriver provider for Tauri (with --desktop-framework tauri)',
    choices: () => ({
        official: TauriDriverProviderChoice.Official,
        crabnebula: TauriDriverProviderChoice.CrabNebula,
        embedded: TauriDriverProviderChoice.Embedded
    })
}, {
    name: 'tauriFrontendPlugin',
    answer: 'tauriUseFrontendPlugin',
    type: 'boolean',
    desc: 'Install @wdio/tauri-plugin (with --desktop-framework tauri)'
}, {
    name: 'tauriAppBinaryPath',
    answer: 'tauriAppBinaryPath',
    type: 'string',
    desc: 'Path to the built Tauri binary (with --desktop-framework tauri)'
}, {
    name: 'dioxusDriverProvider',
    answer: 'dioxusDriverProvider',
    type: 'string',
    desc: 'WebDriver provider for Dioxus (with --desktop-framework dioxus)',
    choices: () => ({
        embedded: DioxusDriverProviderChoice.Embedded,
        external: DioxusDriverProviderChoice.External
    })
}, {
    name: 'dioxusAppBinaryPath',
    answer: 'dioxusAppBinaryPath',
    type: 'string',
    desc: 'Path to the Dioxus debug binary (with --desktop-framework dioxus)'
}, {
    name: 'backend',
    answer: 'backend',
    type: 'string',
    desc: 'Where the automation backend runs (with --runner e2e)',
    choices: () => ({
        local: BackendChoice.Local,
        experitest: BackendChoice.Experitest,
        saucelabs: BackendChoice.Saucelabs,
        browserstack: BackendChoice.Browserstack,
        other: BackendChoice.OtherVendors,
        grid: BackendChoice.Grid
    })
}, {
    name: 'environment',
    answer: 'e2eEnvironment',
    type: 'string',
    desc: 'What to automate (with --runner e2e). Implied by --browsers or --mobile-environment',
    choices: () => ({ web: 'web', mobile: 'mobile' })
}, {
    name: 'mobileEnvironment',
    answer: 'mobileEnvironment',
    type: 'string',
    desc: 'Mobile platform (with --environment mobile)',
    choices: () => ({ android: 'android', ios: 'ios' })
}, {
    name: 'browsers',
    answer: 'browserEnvironment',
    type: 'array',
    desc: 'Comma-separated browsers to start with (with --environment web)',
    choices: () => ({ chrome: 'chrome', firefox: 'firefox', safari: 'safari', edge: 'MicrosoftEdge' })
}, {
    name: 'hostname',
    answer: 'hostname',
    type: 'string',
    desc: 'Host of the cloud service or Selenium server (with --backend other or grid)'
}, {
    name: 'port',
    answer: 'port',
    type: 'string',
    desc: 'Port of the cloud service or Selenium server (with --backend other or grid)'
}, {
    name: 'path',
    answer: 'path',
    type: 'string',
    desc: 'Path of the Selenium server (with --backend grid)'
}, {
    name: 'envUser',
    answer: 'env_user',
    type: 'string',
    desc: 'Environment variable for the cloud username (with --backend saucelabs or browserstack, or other with a lambdatest.com --hostname)'
}, {
    name: 'envKey',
    answer: 'env_key',
    type: 'string',
    desc: 'Environment variable for the cloud access key (with --backend saucelabs or browserstack, or other with a lambdatest.com --hostname)'
}, {
    name: 'region',
    answer: 'region',
    type: 'string',
    desc: 'Sauce Labs region (with --backend saucelabs)',
    choices: () => Object.fromEntries(Object.values(RegionOptions).map((region) => [region, region]))
}, {
    name: 'sauceConnect',
    answer: 'useSauceConnect',
    type: 'boolean',
    desc: 'Set up Sauce Connect for a local app (with --backend saucelabs)'
}, {
    name: 'expAccessKey',
    answer: 'expEnvAccessKey',
    type: 'string',
    desc: 'Experitest access key (with --backend experitest)'
}, {
    name: 'expHostname',
    answer: 'expEnvHostname',
    type: 'string',
    desc: 'Experitest cloud host (with --backend experitest)'
}, {
    name: 'expPort',
    answer: 'expEnvPort',
    type: 'string',
    desc: 'Experitest cloud port (with --backend experitest)'
}, {
    name: 'expProtocol',
    answer: 'expEnvProtocol',
    type: 'string',
    desc: 'Experitest protocol (with --backend experitest and a port other than 80 or 443)',
    choices: () => ({ http: 'http', https: 'https' })
}, {
    name: 'framework',
    answer: 'framework',
    type: 'string',
    desc: 'Test framework',
    choices: packageChoices(() => SUPPORTED_PACKAGES.framework, (short, purpose, pkg) => (
        pkg.startsWith('@serenity-js') ? `serenity-${purpose}` : short
    ))
}, {
    name: 'typescript',
    answer: 'isUsingTypeScript',
    type: 'boolean',
    desc: 'Write tests in TypeScript'
}, {
    name: 'generateTestFiles',
    answer: 'generateTestFiles',
    type: 'boolean',
    desc: 'Generate example test files'
}, {
    name: 'specs',
    answer: 'specs',
    type: 'string',
    desc: 'Location of spec or feature files (with --generate-test-files)'
}, {
    name: 'stepDefinitions',
    answer: 'stepDefinitions',
    type: 'string',
    desc: 'Location of step definitions (with --framework cucumber)'
}, {
    name: 'pageObjects',
    answer: 'usePageObjects',
    type: 'boolean',
    desc: 'Generate page objects (with --runner e2e and --generate-test-files)'
}, {
    name: 'pages',
    answer: 'pages',
    type: 'string',
    desc: 'Location of page objects (with --page-objects)'
}, {
    name: 'serenityLibPath',
    answer: 'serenityLibPath',
    type: 'string',
    desc: 'Location of the Serenity/JS Screenplay library (with --framework serenity-*)'
}, {
    name: 'agentSupport',
    answer: 'agentSupport',
    type: 'boolean',
    desc: 'Write the AGENTS.md section and the wdio-session skill'
}, {
    name: 'reporters',
    answer: 'reporters',
    type: 'array',
    desc: 'Comma-separated reporters',
    choices: packageChoices(() => SUPPORTED_PACKAGES.reporter)
}, {
    name: 'plugins',
    answer: 'plugins',
    type: 'array',
    desc: 'Comma-separated plugins',
    choices: packageChoices(() => SUPPORTED_PACKAGES.plugin)
}, {
    name: 'visualTesting',
    answer: 'includeVisualTesting',
    type: 'boolean',
    desc: 'Add visual testing (with --runner e2e or component)'
}, {
    name: 'services',
    answer: 'services',
    type: 'array',
    desc: 'Comma-separated services, replaces the ones the wizard picks for your setup',
    choices: packageChoices(() => SUPPORTED_PACKAGES.service)
}, {
    name: 'npmInstall',
    answer: 'npmInstall',
    type: 'boolean',
    desc: 'Install the dependencies'
}]

function toKebabCase (name: string) {
    return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
}

function flagFor (answer: string) {
    return ANSWER_FLAGS.find((flag) => flag.answer === answer)!
}

function describeChoices (flag: AnswerFlag) {
    return Object.keys(flag.choices!()).join(', ')
}

/**
 * Help text for one flag, with the accepted values if it has a fixed set.
 */
export function describeAnswerFlag (flag: AnswerFlag) {
    return flag.choices ? `${flag.desc}: ${describeChoices(flag)}` : flag.desc
}

/**
 * Shared by the `--help` output of `npm init wdio` and `wdio config`.
 */
export const ANSWER_FLAGS_HELP = [
    'Every wizard question has a flag. A flag answers its question and the wizard',
    'asks the rest, or uses the defaults for the rest with --yes. Boolean flags',
    'take a --no- prefix, e.g. --no-typescript. A flag for a question the wizard',
    'does not ask for your setup is an error, and so is a value it does not offer.'
].join('\n')

/**
 * yargs options for `wdio config`, keyed in kebab-case so `--help` shows the
 * flags as they are typed. yargs still sets the camelCase name on `argv`.
 * No defaults: a flag that is not passed leaves the question to the wizard
 * (or to `--yes`).
 */
export function getAnswerFlagYargsOptions () {
    return Object.fromEntries(ANSWER_FLAGS.map((flag) => [toKebabCase(flag.name), {
        desc: describeAnswerFlag(flag),
        type: flag.type === 'boolean' ? 'boolean' : 'string',
        group: 'Wizard answers:'
    }])) as Record<string, { desc: string, type: 'boolean' | 'string', group: string }>
}

/**
 * Command line usage of a flag, e.g. `--runner <value>` or `--[no-]typescript`.
 */
export function answerFlagUsage (flag: AnswerFlag) {
    const kebab = toKebabCase(flag.name)
    return flag.type === 'boolean'
        ? `--${kebab}`
        : `--${kebab} <${flag.type === 'array' ? 'list' : 'value'}>`
}

function lastValue (raw: unknown) {
    return Array.isArray(raw) ? raw[raw.length - 1] : raw
}

function toAnswerValue (flag: AnswerFlag, value: string) {
    if (!flag.choices) {
        return value
    }
    const choices = flag.choices()
    const key = value.toLowerCase()
    if (!Object.prototype.hasOwnProperty.call(choices, key)) {
        throw new AnswerFlagError(
            `Invalid value "${value}" for --${toKebabCase(flag.name)}. Use one of: ${describeChoices(flag)}`
        )
    }
    return choices[key]
}

/**
 * Turn parsed command line options into wizard answers.
 * Options that were not passed are left out, so the wizard still asks them.
 */
export function parseAnswerFlags (argv: Record<string, unknown>): Partial<Questionnair> {
    const answers: Record<string, unknown> = {}
    for (const flag of ANSWER_FLAGS) {
        const raw = argv[flag.name]
        if (typeof raw === 'undefined') {
            continue
        }

        if (flag.type === 'boolean') {
            answers[flag.answer] = raw === true || raw === 'true'
        } else if (flag.type === 'array') {
            const values = [raw].flat()
                .flatMap((value) => String(value).split(','))
                .map((value) => value.trim())
                .filter(Boolean)
                .map((value) => toAnswerValue(flag, value))
            answers[flag.answer] = [...new Set(values)]
        } else {
            answers[flag.answer] = toAnswerValue(flag, String(lastValue(raw)))
        }
    }

    /**
     * `--yes` never asks for the e2e environment, so derive it from the
     * flags that only make sense for one of them
     */
    if (!answers.e2eEnvironment) {
        if (answers.mobileEnvironment) {
            answers.e2eEnvironment = 'mobile'
        } else if (answers.browserEnvironment) {
            answers.e2eEnvironment = 'web'
        }
    }

    return answers as Partial<Questionnair>
}

/**
 * Turn the options `create-wdio` received back into flags for `wdio config`.
 */
export function answerFlagsToArgs (argv: Record<string, unknown>) {
    const args: string[] = []
    for (const flag of ANSWER_FLAGS) {
        const raw = argv[flag.name]
        if (typeof raw === 'undefined') {
            continue
        }
        const kebab = toKebabCase(flag.name)
        if (flag.type === 'boolean') {
            args.push(raw === true || raw === 'true' ? `--${kebab}` : `--no-${kebab}`)
        } else {
            args.push(`--${kebab}`, [raw].flat().join(','))
        }
    }
    return args
}

type Question = typeof QUESTIONNAIRE[number]

function isAsked (question: Question, answers: Questionnair) {
    const when = question.when as unknown
    if (typeof when === 'function') {
        return Boolean(when(answers))
    }
    return typeof when === 'undefined' || Boolean(when)
}

function choiceValues (question: Question, answers: Questionnair): AnswerValue[] | undefined {
    if (!question.choices) {
        return undefined
    }
    const choices = (typeof question.choices === 'function'
        ? (question.choices as (answers: Questionnair) => unknown[])(answers)
        : question.choices) as unknown[]
    return choices
        .filter((choice) => typeof choice !== 'undefined')
        .map((choice) => choice && typeof choice === 'object' ? (choice as { value: AnswerValue }).value : choice as AnswerValue)
}

/**
 * Check the answers given as flags against the finished questionnaire: every
 * flag has to belong to a question the wizard asks for this setup, and its
 * value has to be one the wizard offers there.
 */
export function assertAnswerFlagsApply (flagAnswers: Partial<Questionnair>, answers: Questionnair) {
    for (const [answer, value] of Object.entries(flagAnswers)) {
        const flag = flagFor(answer)
        const usage = `--${toKebabCase(flag.name)}`
        const questions = QUESTIONNAIRE.filter((question) => question.name === answer && isAsked(question, answers))
        if (questions.length === 0) {
            throw new AnswerFlagError(`${usage} does not apply to this setup. ${flag.desc}.`)
        }

        const offered = questions.map((question) => choiceValues(question, answers))
        if (offered.some((values) => typeof values === 'undefined')) {
            continue
        }
        const allowed = new Set(offered.flat())
        const rejected = [value].flat().filter((item) => !allowed.has(item as AnswerValue))
        if (rejected.length === 0) {
            continue
        }

        const cliValues = Object.entries(flag.choices!())
        const toCli = (item: unknown) => cliValues.find(([, v]) => v === item)?.[0] ?? String(item)
        throw new AnswerFlagError(
            `${usage} ${rejected.map(toCli).join(',')} is not available for this setup. ` +
            `Use one of: ${[...new Set([...allowed].map(toCli))].join(', ')}`
        )
    }
}
