import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import { CONFIG_HELPER_INTRO, QUESTIONNAIRE } from '../constants'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile } from '../utils'

export const command = 'config'
export const desc = 'Initialize WebdriverIO and setup configuration in your current project.'

export const builder = {
    yarn: {
        type: 'boolean',
        desc: 'Install packages via yarn package manager.'
    }
}

export const runConfig = async function (useYarn, exit) {
    console.log(CONFIG_HELPER_INTRO)

    const answers = await inquirer.prompt(QUESTIONNAIRE)
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
        answers.runner.package,
        answers.framework.package,
        ...answers.reporters.map(reporter => reporter.package),
        ...answers.services.map(service => service.package)
    ]

    if (answers.executionMode === 'sync') {
        packagesToInstall.push('@wdio/sync')
    }

    /**
     * add packages that are required by services
     */
    addServiceDeps(answers.services, packagesToInstall)

    console.log('\nInstalling wdio packages:\n-', packagesToInstall.join('\n- '))
    const result = yarnInstall({ deps: packagesToInstall, dev: true, respectNpm5: !!useYarn })

    if (result.status !== 0) {
        throw new Error(result.stderr)
    }

    console.log('\nPackages installed successfully, creating configuration file...')
    const parsedAnswers = {
        ...answers,
        runner: answers.runner.short,
        framework: answers.framework.short,
        reporters: answers.reporters.map(({ short }) => short),
        services: answers.services.map(({ short }) => short)
    }

    renderConfigurationFile(parsedAnswers)

    /**
     * don't exit if running unit tests
     */
    if (exit && !process.env.JEST_WORKER_ID) {
        /* istanbul ignore next */
        process.exit(0)
    }
}

export async function handler(argv) {
    try {
        console.log('-->', argv.yarn)
        await runConfig(argv.yarn)
    } catch (error) {
        throw new Error(`something went wrong during setup: ${error.stack.slice(7)}`)
    }
}
