/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'
import yarnInstall from 'yarn-install'

import {
    replaceConfig,
    findInConfig,
    addServiceDeps,
    convertPackageHashToObject,
    missingConfigurationPrompt
} from '../utils'

import { SUPPORTED_PACKAGES, CLI_EPILOGUE } from '../constants'

const supportedInstallations = {
    service: SUPPORTED_PACKAGES.service.map(({ value }) => convertPackageHashToObject(value)),
    reporter: SUPPORTED_PACKAGES.reporter.map(({ value }) => convertPackageHashToObject(value)),
    framework: SUPPORTED_PACKAGES.framework.map(({ value }) => convertPackageHashToObject(value))
}

export const command = 'install <type> <name>'
export const desc = [
    'Add a `reporter`, `service`, or `framework` to your WebdriverIO project.',
    'The command installs the package from NPM, adds it to your package.json',
    'and modifies the wdio.conf.js accordingly.'
].join(' ')

export const cmdArgs = {
    yarn: {
        desc: 'Install packages using yarn',
        type: 'boolean',
        default: false
    }
}

export const builder = (yargs) => {
    yargs
        .options(cmdArgs)
        .epilogue(CLI_EPILOGUE)
        .help()

    for (const [type, plugins] of Object.entries(supportedInstallations)) {
        for (const plugin of plugins) {
            yargs.example(`$0 install ${type} ${plugin.short}`, `Install ${plugin.package}`)
        }
    }

    return yargs
}

export async function handler(argv) {
    /**
     * type = service | reporter | framework
     * name = names for the supported service or reporter
     * yarn = optional flag to install package using yarn instead of default yarn
     */
    const { type, name, yarn } = argv

    /**
     * verify for supported types via `supportedInstallations` keys
     */
    if (!Object.keys(supportedInstallations).includes(type)) {
        console.log(`Type ${type} is not supported.`)
        process.exit(0)
        return
    }

    /**
     * verify if the name of the `type` is valid
     */
    if (!supportedInstallations[type].find(pkg => pkg.short === name)) {
        console.log(`${name} is not a supported ${type}.`)
        process.exit(0)
        return
    }

    const localConfPath = path.join(process.cwd(), 'wdio.conf.js')
    if (!fs.existsSync(localConfPath)) {
        try {
            const promptMessage = `Cannot install packages without a WebdriverIO configuration.
You can create one by running 'wdio config'`

            await missingConfigurationPrompt('install', promptMessage, yarn)
        } catch {
            process.exit(1)
            return
        }
    }

    const configFile = fs.readFileSync(localConfPath, { encoding: 'UTF-8' })
    const match = findInConfig(configFile, type)

    if (match && match[0].includes(name)) {
        console.log(`The ${type} ${name} is already part of your configuration.`)
        process.exit(0)
        return
    }

    const selectedPackage = supportedInstallations[type].find(({ short }) => short === name)
    const pkgsToInstall = [selectedPackage.package]

    addServiceDeps([selectedPackage], pkgsToInstall, true)

    console.log(`Installing "${selectedPackage.package}"${yarn ? ' using yarn.' : '.'}`)
    const install = yarnInstall({ deps: pkgsToInstall, dev: true, respectNpm5: !yarn }) // use !yarn so the package forces npm install

    if (install.status !== 0) {
        console.error('Error installing packages', install.stderr)
        process.exit(1)
        return
    }

    console.log(`Package "${selectedPackage.package}" installed successfully.`)
    const newConfig = replaceConfig(configFile, type, name)
    fs.writeFileSync(localConfPath, newConfig, { encoding: 'utf-8' })
    console.log('Your wdio.conf.js file has been updated.')

    process.exit(0)
}
/* eslint-enable no-console */
