/* eslint-disable no-console */
import fs from 'fs'
import ejs from 'ejs'
import path from 'path'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import { CONFIG_HELPER_INTRO, CONFIG_HELPER_SUCCESS_MESSAGE, QUESTIONNAIRE } from './config'
import { getNpmPackageName, getPackageName, addServiceDeps } from './utils'

export default async function setup (exit = true) {
    try {
        console.log(CONFIG_HELPER_INTRO)
        const answers = await inquirer.prompt(QUESTIONNAIRE)
        const packagesToInstall = [
            getNpmPackageName(answers.runner),
            getNpmPackageName(answers.framework),
            ...answers.reporters.map(getNpmPackageName),
            ...answers.services.map(getNpmPackageName)
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
            runner: getPackageName(answers.runner),
            framework: getPackageName(answers.framework),
            reporters: answers.reporters.map(getPackageName),
            services: answers.services.map(getPackageName),
            packagesToInstall
        }

        renderConfigurationFile(parsedAnswers)

        if (exit) {
            process.exit(0)
        }
    } catch (error) {
        throw new Error(error)
    }
}

function renderConfigurationFile (answers) {
    const tpl = fs.readFileSync(path.join(__dirname, '/templates/wdio.conf.tpl.ejs'), 'utf8')
    const renderedTpl = ejs.render(tpl, { answers })
    fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl)
    console.log(CONFIG_HELPER_SUCCESS_MESSAGE)
}
