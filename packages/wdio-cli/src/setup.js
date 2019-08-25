/* eslint-disable no-console */
import fs from 'fs'
import ejs from 'ejs'
import path from 'path'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import { CONFIG_HELPER_INTRO, CONFIG_HELPER_SUCCESS_MESSAGE, QUESTIONNAIRE } from './config'
import { addServiceDeps, convertPackageHashToObject } from './utils'

/* istanbul ignore next */
export default async function setup (exit = true) {
    try {
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
        const result = yarnInstall({ deps: packagesToInstall, dev: true })
        if (result.status !== 0) {
            throw new Error(result.stderr)
        }
        console.log('\nPackages installed successfully, creating configuration file...')

        const parsedAnswers = {
            ...answers,
            runner: answers.runner.short,
            framework: answers.framework.short,
            reporters: answers.reporters.map(({ short }) => short),
            services: answers.services.map(({ short }) => short),
            packagesToInstall
        }

        console.log('\n answers', answers)
        console.log('\n parsedAnswers', parsedAnswers)

        renderConfigurationFile(parsedAnswers)

        if (exit) {
            process.exit(0)
        }
    } catch (error) {
        throw new Error(error)
    }
}

/* istanbul ignore next */
function renderConfigurationFile (answers) {
    const tplPath = path.join(__dirname, '/templates/wdio.conf.tpl.ejs')
    ejs.renderFile(tplPath, { answers }, function(err, renderedTpl) {
        if (err) {
            throw new Error(err)
        }

        fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl)
        console.log(CONFIG_HELPER_SUCCESS_MESSAGE)
    })
}
