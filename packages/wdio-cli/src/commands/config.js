import util from 'util'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import { CONFIG_HELPER_INTRO, QUESTIONNAIRE, CLI_EPILOGUE, COMPILER_OPTIONS, TS_COMPILER_INSTRUCTIONS } from '../constants'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile, hasFile } from '../utils'

export const command = 'config'
export const desc = 'Initialize WebdriverIO and setup configuration in your current project.'

export const cmdArgs = {
    yarn: {
        type: 'boolean',
        desc: 'Install packages via yarn package manager.',
        default: hasFile('yarn.lock')
    },
    yes: {
        alias: 'y',
        desc: 'will fill in all config defaults without prompting',
        type: 'boolean',
        default: false
    }
}
export const builder = (yargs) => {
    return yargs
        .options(cmdArgs)
        .epilogue(CLI_EPILOGUE)
        .help()
}

export const runConfig = async function (useYarn, yes, exit) {
    console.log(CONFIG_HELPER_INTRO)
    const answers = await getAnswers(yes)

    const packageAnswers = ['reporters', 'runner', 'services', 'framework']

    Object.keys(answers).forEach((key) => {
        if (packageAnswers.includes(key)) {
            if (Array.isArray(answers[key])) {
                answers[key] = answers[key].map(answer => convertPackageHashToObject(answer))
            } else {
                answers[key] = convertPackageHashToObject(answers[key])
            }
        }
    })

    const packagesToInstall = [
        (answers.runner && answers.runner.package) || '@wdio/local-runner',
        answers.framework.package,
        ...answers.reporters.map(reporter => reporter.package),
        ...answers.services.map(service => service.package)
    ]

    const syncExection = answers.executionMode === 'sync'
    if (syncExection) {
        packagesToInstall.push('@wdio/sync')
    }

    /**
     * add packages that are required by services
     */
    addServiceDeps(answers.services, packagesToInstall)

    console.log('\nInstalling wdio packages:\n-', packagesToInstall.join('\n- '))
    const result = yarnInstall({ deps: packagesToInstall, dev: true, respectNpm5: !useYarn })

    if (result.status !== 0) {
        throw new Error(result.stderr)
    }

    console.log('\nPackages installed successfully, creating configuration file...')
    const parsedAnswers = {
        ...answers,
        runner: answers.runner && answers.runner.short,
        framework: answers.framework.short,
        reporters: answers.reporters.map(({ short }) => short),
        services: answers.services.map(({ short }) => short),
        packagesToInstall,
        isUsingTypeScript: answers.isUsingCompiler === COMPILER_OPTIONS.ts,
        isUsingBabel: answers.isUsingCompiler === COMPILER_OPTIONS.babel
    }

    try {
        await renderConfigurationFile(parsedAnswers)
    } catch (e) {
        console.error(`Couldn't write config file: ${e.stack}`)
        return !process.env.JEST_WORKER_ID && process.exit(1)
    }

    /**
     * print TypeScript configuration message
     */
    if (answers.isUsingCompiler === COMPILER_OPTIONS.ts) {
        const wdioTypes = syncExection ? '@wdio/sync' : 'webdriverio'
        const tsPkgs = `"${[
            wdioTypes,
            answers.framework.package,
            ...answers.services
                .map(service => service.package)
                /**
                 * given that we know that all "offical" services have
                 * typescript support we only include them
                 */
                .filter(service => service.startsWith('@wdio'))
        ].join('", "')}"`
        console.log(util.format(TS_COMPILER_INSTRUCTIONS, tsPkgs))
    }

    /**
     * don't exit if running unit tests
     */
    if (exit && !process.env.JEST_WORKER_ID) {
        /* istanbul ignore next */
        process.exit(0)
    }
}

export async function getAnswers(yes) {
    return yes
        ? QUESTIONNAIRE.reduce((answers, question) => Object.assign(
            answers,
            question.when && !question.when(answers)
                /**
                 * set nothing if question doesn't apply
                 */
                ? {}
                : answers[question.name] = question.default
                    /**
                     * set default value if existing
                     */
                    ? question.default
                    : question.choices && question.choices.length
                    /**
                     * pick first choice, select value if it exists
                     */
                        ? question.choices[0].value
                            ? question.choices[0].value
                            : question.choices[0]
                        : {}
        ), {})
        : await inquirer.prompt(QUESTIONNAIRE)
}

export async function handler(argv) {
    try {
        await runConfig(argv.yarn, argv.yes)
    } catch (error) {
        throw new Error(`something went wrong during setup: ${error.stack.slice(7)}`)
    }
}
