import fs from 'fs'
import ejs from 'ejs'
import path from 'path'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import { CONFIG_HELPER_INTRO, CONFIG_HELPER_SUCCESS_MESSAGE, QUESTIONNAIRE } from './config'

export default function setup () {
    console.log(CONFIG_HELPER_INTRO) // eslint-disable-line no-console
    inquirer.prompt(QUESTIONNAIRE).then((answers) => {
        // todo verify package names for when introduction `install` command
        let packagesToInstall = [
            `@wdio/${answers.runner}-runner`,
            `@wdio/${answers.framework}-framework`,
            ...answers.reporters,
            ...answers.services
        ]

        if (answers.executionMode === 'sync') {
            packagesToInstall.push('@wdio/sync')
        }

        console.log('\nInstalling wdio packages:\n-', packagesToInstall.join('\n- ')) // eslint-disable-line no-console
        const result = yarnInstall({ deps: packagesToInstall, dev: true })
        if (result.status != 0) {
            throw new Error(result.stderr)
        }
        console.log('\nPackages installed successfully, creating configuration file...') // eslint-disable-line no-console

        renderConfigurationFile({ ...answers, logLevel: 'info' })
        process.exit(0)
    })
}

function renderConfigurationFile (answers) {
    const tpl = fs.readFileSync(path.join(__dirname, '/templates/wdio.conf.tpl.ejs'), 'utf8')
    const renderedTpl = ejs.render(tpl, { answers })
    fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl)
    console.log(CONFIG_HELPER_SUCCESS_MESSAGE) // eslint-disable-line no-console
}
