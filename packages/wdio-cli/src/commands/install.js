import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'

import setup from '../setup'
import { SUPPORTED_SERVICES, SUPPORTED_REPORTER } from '../config'

const supportedInstallations = {
    reporter: SUPPORTED_REPORTER.map(service => service.split('-')[0].trim()),
    service: SUPPORTED_SERVICES.map(service => service.split('-')[0].trim())
}

export const command = 'install <type> <name>'
export const desc = 'Add a `reporter` or a `service` to your WebdriverIO project'

export async function handler({ type, name }) {
    if (!Object.keys(supportedInstallations).includes(type)) {
        // `Type ${type} is not supported`
        // todo: show graceful message to user
        process.exit(0)
    }

    if (!supportedInstallations[type].includes(name)) {
        // `${name} is not a supported ${type}`
        // todo: show graceful message to user
        process.exit(0)
    }

    // only verify configuration if the type and name options are valid
    const localConfPath = path.join(process.cwd(), 'wdio.conf.js')

    if (!fs.existsSync(localConfPath)) {
        const { config } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'config',
                message: 'No wdio.conf.js file found. Do you want to create one?',
                default: false
            }
        ])

        if (!config) {
            // todo: show graceful message to user
            process.exit(0)
        }

        await setup(false)
    }

    console.log(`Installing ${name} ${type}`) // eslint-disable-line no-console
}
