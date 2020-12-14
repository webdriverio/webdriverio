import util from 'util'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'

import {
    CONFIG_HELPER_INTRO, CLI_EPILOGUE, COMPILER_OPTIONS,
    TS_COMPILER_INSTRUCTIONS, SUPPORTED_PACKAGES,
    CONFIG_HELPER_SUCCESS_MESSAGE
} from '../constants'
import {
    addServiceDeps, convertPackageHashToObject, renderConfigurationFile,
    hasFile, generateTestFiles, getAnswers, getPathForFileGeneration
} from '../utils'
import { ConfigCommandArguments, ParsedAnswers } from '../types'
import yargs from 'yargs'

export const command = 'config'
export const desc = 'Initialize WebdriverIO and setup configuration in your current project.'

export const cmdArgs = {
    yarn: {
        type: 'boolean',
        desc: 'Install packages via yarn package manager.',
        default: hasFile('yarn.lock')
    },
    yes: {
        alias: 'y',
        desc: 'will fill in all config defaults without prompting',
        type: 'boolean',
        default: false
    }
} as const

export const builder = (yargs: yargs.Argv) => {
    return yargs
        .options(cmdArgs)
        .epilogue(CLI_EPILOGUE)
        .help()
}

const runConfig = async function (useYarn: boolean, yes: boolean, exit = false) {
    console.log(CONFIG_HELPER_INTRO)
    const answers = await getAnswers(yes)
    const frameworkPackage = convertPackageHashToObject(answers.framework)
    const runnerPackage = convertPackageHashToObject(answers.runner || SUPPORTED_PACKAGES.runner[0].value)
    const servicePackages = answers.services.map((service) => convertPackageHashToObject(service))
    const reporterPackages = answers.reporters.map((reporter) => convertPackageHashToObject(reporter))

    const packagesToInstall: string[] = [
        runnerPackage.package,
        frameworkPackage.package,
        ...reporterPackages.map(reporter => reporter.package),
        ...servicePackages.map(service => service.package)
    ]

    const syncExecution = answers.executionMode === 'sync'
    if (syncExecution) {
        packagesToInstall.push('@wdio/sync')
    }

    /**
     * add packages that are required by services
     */
    addServiceDeps(servicePackages, packagesToInstall)

    console.log('\nInstalling wdio packages:\n-', packagesToInstall.join('\n- '))
    const result = yarnInstall({ deps: packagesToInstall, dev: true, respectNpm5: !useYarn })

    if (result.status !== 0) {
        throw new Error(result.stderr)
    }

    console.log('\nPackages installed successfully, creating configuration file...')

    /**
     * find relative paths between tests and pages
     */

    const parsedPaths = getPathForFileGeneration(answers)

    const parsedAnswers: ParsedAnswers = {
        ...answers,
        runner: runnerPackage.short,
        framework: frameworkPackage.short,
        reporters: reporterPackages.map(({ short }) => short),
        services: servicePackages.map(({ short }) => short),
        packagesToInstall,
        isUsingTypeScript: answers.isUsingCompiler === COMPILER_OPTIONS.ts,
        isUsingBabel: answers.isUsingCompiler === COMPILER_OPTIONS.babel,
        isSync: syncExecution,
        _async: syncExecution ? '' : 'async ',
        _await: syncExecution ? '' : 'await ',
        destSpecRootPath: parsedPaths.destSpecRootPath,
        destPageObjectRootPath: parsedPaths.destPageObjectRootPath,
        relativePath : parsedPaths.relativePath
    }

    try {
        await renderConfigurationFile(parsedAnswers)

        if (answers.generateTestFiles) {
            console.log('\nConfig file installed successfully, creating test files...')
            await generateTestFiles(parsedAnswers)
        }
    } catch (e) {
        console.error(`Couldn't write config file: ${e.stack}`)
        /* istanbul ignore next */
        return !process.env.JEST_WORKER_ID && process.exit(1)
    }

    /**
     * print TypeScript configuration message
     */
    if (answers.isUsingCompiler === COMPILER_OPTIONS.ts) {
        const wdioTypes = syncExecution ? '@wdio/sync' : 'webdriverio'
        const tsPkgs = `"${[
            wdioTypes,
            frameworkPackage.package,
            ...servicePackages
                .map(service => service.package)
                /**
                 * given that we know that all "offical" services have
                 * typescript support we only include them
                 */
                .filter(service => service.startsWith('@wdio'))
        ].join('", "')}"`
        console.log(util.format(TS_COMPILER_INSTRUCTIONS, tsPkgs))
    }

    console.log(CONFIG_HELPER_SUCCESS_MESSAGE)

    /**
     * don't exit if running unit tests
     */
    if (exit /* istanbul ignore next */ && !process.env.JEST_WORKER_ID) {
        /* istanbul ignore next */
        process.exit(0)
    }
}

export async function handler(argv: ConfigCommandArguments) {
    try {
        await runConfig(argv.yarn, argv.yes)
    } catch (error) {
        throw new Error(`something went wrong during setup: ${error.stack.slice(7)}`)
    }
}

/**
 * Helper utility used in `run` and `install` command to create config if none exist
 * @param {string}   command        to be executed by user
 * @param {string}   message        to show when no config is suppose to be created
 * @param {boolean}  useYarn        parameter set to true if yarn is used
 * @param {Function} runConfigCmd   runConfig method to be replaceable for unit testing
 */
export async function missingConfigurationPrompt(command: string, message: string, useYarn = false, runConfigCmd = runConfig) {
    const { config } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'config',
            message: `Error: Could not execute "${command}" due to missing configuration. Would you like to create one?`,
            default: false
        }
    ])

    /**
     * don't exit if running unit tests
     */
    if (!config && !process.env.JEST_WORKER_ID) {
        /* istanbul ignore next */
        console.log(message)
        /* istanbul ignore next */
        return process.exit(0)
    }

    return await runConfigCmd(useYarn, false, true)
}
