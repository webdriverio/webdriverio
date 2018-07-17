import fs from 'fs'
import ejs from 'ejs'
import path from 'path'
import inquirer from 'inquirer'
import npmInstallPackage from 'npm-install-package'

import { CONFIG_HELPER_INTRO, CONFIG_HELPER_SUCCESS_MESSAGE, QUESTIONNAIRE } from './config'

export default function setup () {
    console.log(CONFIG_HELPER_INTRO) // eslint-disable-line no-console
    inquirer.prompt(QUESTIONNAIRE).then((answers) => {
        let packagesToInstall = []
        if (answers.installRunner) {
            packagesToInstall.push(`wdio-${answers.runner}-runner`)
        }
        if (answers.installFramework) {
            packagesToInstall.push(`wdio-${answers.framework}-framework`)
        }
        if (answers.installReporter) {
            packagesToInstall = packagesToInstall.concat(answers.reporters)
        }
        if (answers.installServices) {
            packagesToInstall = packagesToInstall.concat(answers.services)
        }
        if (answers.executionMode === 'sync') {
            packagesToInstall.push('wdio-sync')
        }

        if (packagesToInstall.length > 0) {
            console.log('\nInstalling wdio packages:\n-', packagesToInstall.join('\n- ')) // eslint-disable-line no-console
            return npmInstallPackage(packagesToInstall, { saveDev: true }, (err) => {
                if (err) {
                    throw err
                }

                console.log('\nPackages installed successfully, creating configuration file...') // eslint-disable-line no-console
                renderConfigurationFile(answers)
            })
        }

        renderConfigurationFile(answers)
        process.exit(0)
    })
}

function renderConfigurationFile (answers) {
    let tpl = fs.readFileSync(path.join(__dirname, '/templates/wdio.conf.tpl.ejs'), 'utf8')
    let renderedTpl = ejs.render(tpl, { answers })
    fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl)
    console.log(CONFIG_HELPER_SUCCESS_MESSAGE) // eslint-disable-line no-console
}
