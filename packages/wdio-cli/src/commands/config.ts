import path from 'node:path'
import util from 'node:util'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import yarnInstall from 'yarn-install'
import type yargs from 'yargs'

import {
    CONFIG_HELPER_INTRO, CLI_EPILOGUE, COMPILER_OPTIONS,
    TS_COMPILER_INSTRUCTIONS, SUPPORTED_PACKAGES,
    CONFIG_HELPER_SUCCESS_MESSAGE,
    DEPENDENCIES_INSTALLATION_MESSAGE,
    pkg
} from '../constants.js'
import {
    addServiceDeps, convertPackageHashToObject, renderConfigurationFile,
    hasFile, generateTestFiles, getAnswers, getPathForFileGeneration,
    hasPackage
} from '../utils.js'
import type { ConfigCommandArguments, ParsedAnswers } from '../types'

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
    console.info('1')

    console.log(CONFIG_HELPER_INTRO)
    const answers = await getAnswers(yes)
    const frameworkPackage = convertPackageHashToObject(answers.framework)
    const runnerPackage = convertPackageHashToObject(answers.runner || SUPPORTED_PACKAGES.runner[0].value)
    const servicePackages = answers.services.map((service) => convertPackageHashToObject(service))
    const pluginPackages = answers.plugins.map((plugin)=> convertPackageHashToObject(plugin))
    const reporterPackages = answers.reporters.map((reporter) => convertPackageHashToObject(reporter))

    let packagesToInstall: string[] = [
        runnerPackage.package,
        frameworkPackage.package,
        ...reporterPackages.map(reporter => reporter.package),
        ...pluginPackages.map(plugin => plugin.package),
        ...servicePackages.map(service => service.package)
    ]

    /**
     * find relative paths between tests and pages
     */

    const parsedPaths = getPathForFileGeneration(answers)
    console.info('2')

    const parsedAnswers: ParsedAnswers = {
        ...answers,
        runner: runnerPackage.short as 'local',
        framework: frameworkPackage.short,
        reporters: reporterPackages.map(({ short }) => short),
        plugins: pluginPackages.map(({ short }) => short),
        services: servicePackages.map(({ short }) => short),
        packagesToInstall,
        isUsingTypeScript: answers.isUsingCompiler === COMPILER_OPTIONS.ts,
        isUsingBabel: answers.isUsingCompiler === COMPILER_OPTIONS.babel,
        isSync: false,
        _async: 'async ',
        _await: 'await ',
        destSpecRootPath: parsedPaths.destSpecRootPath,
        destPageObjectRootPath: parsedPaths.destPageObjectRootPath,
        relativePath : parsedPaths.relativePath,
        tsConfigFilePath : path.join(process.cwd(), 'test', 'tsconfig.json')
    }

    /**
     * add ts-node if TypeScript is desired but not installed
     */
    if (parsedAnswers.isUsingTypeScript) {
        if (!hasPackage('ts-node')) {
            packagesToInstall.push('ts-node', 'typescript')
        }

        const config = {
            compilerOptions: {
                moduleResolution: 'node',
                types: [
                    'node',
                    'webdriverio/async',
                    frameworkPackage.package,
                    'expect-webdriverio'
                ],
                target: 'es2019',
            }
        }

        fs.ensureDirSync(path.join(process.cwd(), 'test'))
        await fs.promises.writeFile(
            parsedAnswers.tsConfigFilePath,
            JSON.stringify(config, null, 4)
        )

    }

    /**
     * add @babel/register package if not installed
     */
    if (parsedAnswers.isUsingBabel) {
        if (!hasPackage('@babel/register')) {
            packagesToInstall.push('@babel/register')
        }

        /**
         * setup Babel if no config file exists
         */
        if (!hasFile('babel.config.js')) {
            if (!hasPackage('@babel/core')) {
                packagesToInstall.push('@babel/core')
            }
            if (!hasPackage('@babel/preset-env')) {
                packagesToInstall.push('@babel/preset-env')
            }
            await fs.promises.writeFile(
                path.join(process.cwd(), 'babel.config.js'),
                `module.exports = ${JSON.stringify({
                    presets: [
                        ['@babel/preset-env', {
                            targets: {
                                node: '14'
                            }
                        }]
                    ]
                }, null, 4)}`
            )
        }
    }

    /**
     * add packages that are required by services
     */
    addServiceDeps(servicePackages, packagesToInstall)

    /**
     * ensure wdio packages have the same dist tag as cli
     */
    if (pkg._requested && pkg._requested.fetchSpec) {
        const { fetchSpec } = pkg._requested
        packagesToInstall = packagesToInstall.map((p) =>
            (p.startsWith('@wdio') || ['devtools', 'webdriver', 'webdriverio'].includes(p)) &&
            (fetchSpec.match(/(v)?\d+\.\d+\.\d+/) === null)
                ? `${p}@${fetchSpec}`
                : p
        )
    }

    /**
     * run npm install only if required by the user
     */
    if (parsedAnswers.npmInstall){
        console.log('\nInstalling wdio packages:\n-', packagesToInstall.join('\n- '))
        const result = yarnInstall({ deps: packagesToInstall, dev: true, respectNpm5: !useYarn })
        if (result.status !== 0) {
            const customError = 'An unknown error happened! Please retry ' +
                `installing dependencies via "${useYarn ? 'yarn add --dev' : 'npm i --save-dev'} ` +
                `${packagesToInstall.join(' ')}"\n\nError: ${result.stderr || 'unknown'}`
            console.log(customError)

            /**
             * don't exit if running unit tests
             */
            if (exit /* istanbul ignore next */ && !process.env.JEST_WORKER_ID) {
                /* istanbul ignore next */
                process.exit(1)
            }

            return { success: false }
        }

        console.log('\nPackages installed successfully, creating configuration file...')
    } else {
        const installationCommand = `${useYarn ? 'yarn add --dev' : 'npm i --save-dev'} ${packagesToInstall.join(' ')}`
        console.log(util.format(DEPENDENCIES_INSTALLATION_MESSAGE,
            installationCommand
        ))
    }

    try {
        await renderConfigurationFile(parsedAnswers)
        if (answers.generateTestFiles) {
            console.log('\nConfig file installed successfully, creating test files...')
            await generateTestFiles(parsedAnswers)
        }
    } catch (err: any) {
        throw new Error(`Couldn't write config file: ${err.stack}`)
    }

    /**
     * print TypeScript configuration message
     */
    if (answers.isUsingCompiler === COMPILER_OPTIONS.ts) {
        const tsPkgs = `"${[
            'webdriverio/async',
            frameworkPackage.package,
            'expect-webdriverio',
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

    console.log(util.format(CONFIG_HELPER_SUCCESS_MESSAGE,
        parsedAnswers.isUsingTypeScript ? 'test/' : '',
        parsedAnswers.isUsingTypeScript ? 'ts' : 'js'
    ))

    /**
     * don't exit if running unit tests
     */
    if (exit /* istanbul ignore next */ && !process.env.JEST_WORKER_ID) {
        /* istanbul ignore next */
        process.exit(0)
    }

    return {
        success: true,
        parsedAnswers,
        installedPackages: packagesToInstall.map((pkg) => pkg.split('--')[0])
    }
}

export function handler(argv: ConfigCommandArguments) {
    return runConfig(argv.yarn, argv.yes)
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
