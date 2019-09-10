/* eslint-disable no-console */
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import { CONFIG_HELPER_INTRO, QUESTIONNAIRE } from './constants'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile } from './index'

/* istanbul ignore next */
export async function runConfigHelper ({ npm, exit } = { exit: true, npm: false }) {
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
    // add packages that are required by services
    addServiceDeps(answers.services, packagesToInstall)

    console.log('\nInstalling wdio packages:\n-', packagesToInstall.join('\n- '))

    const result = yarnInstall({ deps: packagesToInstall, dev: true, respectNpm5: npm })

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

    if (exit) {
        process.exit(0)
    }
}
