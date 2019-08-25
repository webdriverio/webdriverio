/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import setup from '../setup'
import {
    replaceConfig,
    findInConfig,
    addServiceDeps,
    convertPackageHashToObject
} from '../utils'
import { supportedPackages } from './../supportedPackages'

const supportedInstallations = {
    service: supportedPackages.service.map(({ value }) => convertPackageHashToObject(value)),
    reporter: supportedPackages.reporter.map(({ value }) => convertPackageHashToObject(value)),
    framework: supportedPackages.framework.map(({ value }) => convertPackageHashToObject(value))
}

export const command = 'install <type> <name>'
export const desc = 'Add a `reporter`, `service`, or `framework` to your WebdriverIO project'

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
     * type = service | reporter | framework
     * name = names for the supported service or reporter
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
    if (!supportedInstallations[type].find(pkg => pkg.short === name)) {
        console.log(`${name} is not a supported ${type}.`)
        process.exit(0)
        return
    }

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

    const configFile = fs.readFileSync(localConfPath, { encoding: 'UTF-8' })

    const match = findInConfig(configFile, type)

    if (match && match[0].includes(name)) {
        console.log(`The ${type} ${name} is already part of your configuration`)
        process.exit(0)
        return
    }

    const selectedPackage = supportedInstallations[type].find(({ short }) => short === name)
    const pkgsToInstall = [selectedPackage.package]

    addServiceDeps([selectedPackage], pkgsToInstall, true)

    console.log(`Installing "${selectedPackage.package}"${npm ? ' using npm.' : '.'}`)
    const install = yarnInstall({ deps: pkgsToInstall, dev: true, respectNpm5: npm })

    if (install.status !== 0) {
        console.error('Error installing packages', install.stderr)
        process.exit(1)
    }

    console.log(`Package "${selectedPackage.package}" installed successfully.`)

    const newConfig = replaceConfig(configFile, type, name)

    fs.writeFileSync(localConfPath, newConfig, { encoding: 'utf-8' })

    console.log('Your wdio.conf.js file has been updated')
    process.exit(0)
}
/* eslint-enable no-console */
