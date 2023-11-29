/* eslint-disable no-console */
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Argv } from 'yargs'

import {
    getProjectRoot,
    replaceConfig,
    findInConfig,
    addServiceDeps,
    convertPackageHashToObject,
    detectPackageManager
} from '../utils.js'
import { installPackages } from '../install.js'
import { formatConfigFilePaths, canAccessConfigPath, missingConfigurationPrompt } from './config.js'
import { SUPPORTED_PACKAGES, CLI_EPILOGUE } from '../constants.js'
import type { InstallCommandArguments, SupportedPackage } from '../types.js'

const supportedInstallations = {
    runner: SUPPORTED_PACKAGES.runner.map(({ value }) => convertPackageHashToObject(value)),
    plugin: SUPPORTED_PACKAGES.plugin.map(({ value }) => convertPackageHashToObject(value)),
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
    config: {
        desc: 'Location of your WDIO configuration (default: wdio.conf.(js|ts|cjs|mjs))',
    },
} as const

export const builder = (yargs: Argv) => {
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

export async function handler(argv: InstallCommandArguments) {
    /**
     * type = service | reporter | framework
     * name = names for the supported service or reporter
     */
    const { type, name, config } = argv

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
    const options = supportedInstallations[type].map((pkg) => pkg.short)
    if (!options.find((pkg) => pkg === name)) {
        console.log(
            `Error: ${name} is not a supported ${type}.\n\n` +
            `Available options for a ${type} are:\n` +
            `- ${options.join('\n- ')}`
        )
        process.exit(0)
        // keep return for unit test purposes
        return
    }

    const defaultPath = path.resolve(process.cwd(), 'wdio.conf')
    const wdioConfPathWithNoExtension = config
        ? (await formatConfigFilePaths(config)).fullPathNoExtension
        : defaultPath
    const wdioConfPath = await canAccessConfigPath(wdioConfPathWithNoExtension)
    if (!wdioConfPath) {
        try {
            await missingConfigurationPrompt('install', wdioConfPathWithNoExtension)
            return handler(argv)
        } catch {
            process.exit(1)
            // keep return for unit test purposes
            return
        }
    }

    const configFile = await fs.readFile(wdioConfPath, { encoding: 'utf-8' })
    const match = findInConfig(configFile, type)
    const projectRoot = await getProjectRoot()

    if (match && match[0].includes(name)) {
        console.log(`The ${type} ${name} is already part of your configuration.`)
        process.exit(0)
        // keep return for unit test purposes
        return
    }

    const selectedPackage = supportedInstallations[type].find(({ short }) => short === name) as SupportedPackage
    const pkgsToInstall = selectedPackage ? [selectedPackage.package] : []

    addServiceDeps(selectedPackage ? [selectedPackage] : [], pkgsToInstall, true)

    const pm = detectPackageManager()
    console.log(`Installing "${selectedPackage.package}" using ${pm}.`)
    const success = await installPackages(projectRoot, pkgsToInstall, true)

    if (!success) {
        process.exit(1)
        // keep return for unit test purposes
        return
    }

    console.log(`Package "${selectedPackage.package}" installed successfully.`)
    const newConfig = replaceConfig(configFile, type, name)

    if (!newConfig) {
        throw new Error(`Couldn't find "${type}" property in ${path.basename(wdioConfPath)}`)
    }

    await fs.writeFile(wdioConfPath, newConfig, { encoding: 'utf-8' })
    console.log('Your wdio.conf.js file has been updated.')

    process.exit(0)
}
/* eslint-enable no-console */
