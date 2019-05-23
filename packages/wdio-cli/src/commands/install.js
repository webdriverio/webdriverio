/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import setup from '../setup'
import { SUPPORTED_SERVICES, SUPPORTED_REPORTER } from '../config'

const supportedInstallations = {
    reporter: SUPPORTED_REPORTER.map(service => service.split('-')[0].trim()),
    service: SUPPORTED_SERVICES.map(service => service.split('-')[0].trim())
}

export const command = 'install <type> <name>'
export const desc = 'Add a `reporter` or a `service` to your WebdriverIO project'

export default function builder(yargs) {
    return yargs
        .option('npm', {
            desc: 'Install packages using npm',
            type: 'boolean',
            default: false
        })
}
export async function handler(argv) {

    /**
     * type = service | reporter
     * name = array of names for the supported services or reporters
     * npm = optional flag to install package using npm instead of default yarn
     */
    const { type, name, npm } = argv

    // verify for supported types via `supportedInstallations` keys
    if (!Object.keys(supportedInstallations).includes(type)) {
        console.log(`Type ${type} is not supported.`)
        process.exit(0)
        return
    }

    // verify if the name of the `type` is valid
    if (!supportedInstallations[type].includes(name)) {
        console.log(`${name} is not a supported ${type}.`)
        process.exit(0)
        return
    }

    // only verify configuration if the type and name options are valid
    const localConfPath = path.join(process.cwd(), 'wdio.conf.js')

    if (!fs.existsSync(localConfPath)) {
        try {
            const { config } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'config',
                    message: `Error: Could not install ${name} ${type} due to missing configuration. Would you like to create one?`,
                    default: false
                }
            ])

            if (!config) {
                console.log(`
Cannot install packages without a WebdriverIO configuration.
You can create one by running 'wdio config'`)
                process.exit(0)
            }

            await setup(false)
        } catch (error) {
            console.error('Error installing', error)
            process.exit(1)
        }
    }

    const pkgName = `@wdio/${name}-${type}`
    console.log(`Installing ${pkgName}${npm ? ' using npm.' : '.'}
`)
    const install = yarnInstall({ deps: [pkgName], dev: true, respectNpm5: npm })

    if (install.status !== 0) {
        console.error('Error installing packages', install.stderr)
        process.exit(1)
    }

    console.log(`
Package ${pkgName} installed successfully.`)
    // todo: update config file

    process.exit(0)

}
/* eslint-enable no-console */
