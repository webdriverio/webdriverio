import fs from 'node:fs/promises'
import util from 'node:util'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SpawnOptions } from 'node:child_process'
import { execSync, spawn } from 'node:child_process'
import { promisify } from 'node:util'

import ejs from 'ejs'
import chalk from 'chalk'
import path from 'node:path'
import inquirer from 'inquirer'
import pickBy from 'lodash.pickby'
import logger from '@wdio/logger'
import readDir from 'recursive-readdir'
import yarnInstall from 'yarn-install'
import { readPackageUp } from 'read-pkg-up'
import { resolve } from 'import-meta-resolve'
import { SevereServiceError } from 'webdriverio'
import { ConfigParser } from '@wdio/config'
import { CAPABILITY_KEYS } from '@wdio/protocols'
import type { Options, Capabilities, Services } from '@wdio/types'

import {
    EXCLUSIVE_SERVICES, ANDROID_CONFIG, IOS_CONFIG, QUESTIONNAIRE, pkg,
    COMPILER_OPTIONS, TESTING_LIBRARY_PACKAGES, DEPENDENCIES_INSTALLATION_MESSAGE
} from './constants.js'
import type { ReplCommandArguments, Questionnair, SupportedPackage, OnCompleteResult, ParsedAnswers, ProjectProps } from './types.js'

const log = logger('@wdio/cli:utils')
const __dirname = dirname(fileURLToPath(import.meta.url))

const NPM_COMMAND = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'
const VERSION_REGEXP = /(\d+)\.(\d+)\.(\d+)-(alpha|beta|)\.(\d+)\+(.+)/g
const TEMPLATE_ROOT_DIR = path.join(__dirname, 'templates', 'exampleFiles')
export const renderFile = promisify(ejs.renderFile) as (path: string, data: Record<string, any>) => Promise<string>

export class HookError extends SevereServiceError {
    public origin: string
    constructor(message: string, origin: string) {
        super(message)
        this.origin = origin
    }
}

/**
 * run service launch sequences
 */
export async function runServiceHook(
    launcher: Services.ServiceInstance[],
    hookName: keyof Services.HookFunctions,
    ...args: any[]
) {
    const start = Date.now()
    return Promise.all(launcher.map(async (service: Services.ServiceInstance) => {
        try {
            if (typeof service[hookName] === 'function') {
                await (service[hookName] as Function)(...args)
            }
        } catch (err: any) {
            const message = `A service failed in the '${hookName}' hook\n${err.stack}\n\n`

            if (err instanceof SevereServiceError || err.name === 'SevereServiceError') {
                return { status: 'rejected', reason: message, origin: hookName }
            }

            log.error(`${message}Continue...`)
        }
    })).then(results => {
        if (launcher.length) {
            log.debug(`Finished to run "${hookName}" hook in ${Date.now() - start}ms`)
        }

        const rejectedHooks = results.filter(p => p && p.status === 'rejected')
        if (rejectedHooks.length) {
            return Promise.reject(new HookError(`\n${rejectedHooks.map(p => p && p.reason).join()}\n\nStopping runner...`, hookName))
        }
    })
}

/**
 * Run hook in service launcher
 * @param {Array|Function} hook - can be array of functions or single function
 * @param {Object} config
 * @param {Object} capabilities
 */
export async function runLauncherHook(hook: Function | Function[], ...args: any[]) {
    if (typeof hook === 'function') {
        hook = [hook]
    }

    const catchFn = (e: Error) => {
        log.error(`Error in hook: ${e.stack}`)
        if (e instanceof SevereServiceError) {
            throw new HookError(e.message, (hook as Function[])[0].name)
        }
    }

    return Promise.all(hook.map((hook) => {
        try {
            return hook(...args)
        } catch (err: any) {
            return catchFn(err)
        }
    })).catch(catchFn)
}

/**
 * Run onCompleteHook in Launcher
 * @param {Array|Function} onCompleteHook - can be array of functions or single function
 * @param {*} config
 * @param {*} capabilities
 * @param {*} exitCode
 * @param {*} results
 */
export async function runOnCompleteHook(
    onCompleteHook: Function | Function[],
    config: Options.Testrunner,
    capabilities: Capabilities.RemoteCapabilities,
    exitCode: number,
    results: OnCompleteResult
) {
    if (typeof onCompleteHook === 'function') {
        onCompleteHook = [onCompleteHook]
    }

    return Promise.all(onCompleteHook.map(async (hook) => {
        try {
            await hook(exitCode, config, capabilities, results)
            return 0
        } catch (err: any) {
            log.error(`Error in onCompleteHook: ${err.stack}`)
            if (err instanceof SevereServiceError) {
                throw new HookError(err.message, 'onComplete')
            }
            return 1
        }
    }))
}

/**
 * get runner identification by caps
 */
export function getRunnerName (caps: Capabilities.DesiredCapabilities = {}) {
    let runner =
        caps.browserName ||
        caps.appPackage ||
        caps.appWaitActivity ||
        caps.app ||
        caps.platformName ||
        caps['appium:platformName'] ||
        caps['appium:appPackage'] ||
        caps['appium:appWaitActivity'] ||
        caps['appium:app']

    // MultiRemote
    if (!runner) {
        runner = Object.values(caps).length === 0 || Object.values(caps).some(cap => !cap.capabilities) ? 'undefined' : 'MultiRemote'
    }

    return runner
}

function buildNewConfigArray (str: string, type: string, change: string) {
    const newStr = str
        .split(`${type}s: `)[1]
        .replace(/'/g, '')

    const newArray = newStr.match(/(\w*)/gmi)?.filter(e => !!e).concat([change]) || []

    return str
        .replace('// ', '')
        .replace(
            new RegExp(`(${type}s: )((.*\\s*)*)`), `$1[${newArray.map(e => `'${e}'`)}]`
        )
}

function buildNewConfigString (str: string, type: string, change: string) {
    return str.replace(new RegExp(`(${type}: )('\\w*')`), `$1'${change}'`)
}

export function findInConfig (config: string, type: string) {
    let regexStr = `[\\/\\/]*[\\s]*${type}s: [\\s]*\\[([\\s]*['|"]\\w*['|"],*)*[\\s]*\\]`

    if (type === 'framework') {
        regexStr = `[\\/\\/]*[\\s]*${type}: ([\\s]*['|"]\\w*['|"])`
    }

    const regex = new RegExp(regexStr, 'gmi')
    return config.match(regex)
}

export function replaceConfig (config: string, type: string, name: string) {
    if (type === 'framework') {
        return buildNewConfigString(config, type, name)
    }

    const match = findInConfig(config, type)
    if (!match || match.length === 0) {
        return
    }

    const text = match.pop() || ''
    return config.replace(text, buildNewConfigArray(text, type, name))
}

export function addServiceDeps(names: SupportedPackage[], packages: string[], update = false) {
    /**
     * automatically install latest Chromedriver if `wdio-chromedriver-service` was selected for install
     */
    if (names.some(({ short }) => short === 'chromedriver')) {
        packages.push('chromedriver')
    }

    /**
     * automatically install latest Geckodriver if `wdio-geckodriver-service` was selected for install
     */
    if (names.some(({ short }) => short === 'geckodriver')) {
        packages.push('geckodriver')
    }

    /**
     * automatically install latest EdgeDriver if `wdio-edgedriver-service` was selected for install
     */
    if (names.some(({ short }) => short === 'edgedriver')) {
        packages.push('msedgedriver')
    }

    /**
     * install Appium if it is not installed globally if `@wdio/appium-service`
     * was selected for install
     */
    if (names.some(({ short }) => short === 'appium')) {
        const result = execSync('appium --version || echo APPIUM_MISSING').toString().trim()
        if (result === 'APPIUM_MISSING') {
            packages.push('appium')
        } else if (update) {
            // eslint-disable-next-line no-console
            console.log(
                '\n=======',
                '\nUsing globally installed appium', result,
                '\nPlease add the following to your wdio.conf.js:',
                "\nappium: { command: 'appium' }",
                '\n=======\n')
        }
    }
}

/**
 * @todo add JSComments
 */
export function convertPackageHashToObject(pkg: string, hash = '$--$'): SupportedPackage {
    const splitHash = pkg.split(hash)
    return {
        package: splitHash[0],
        short: splitHash[1]
    }
}

export const validateServiceAnswers = (answers: string[]): Boolean | string => {
    let result: boolean | string = true

    Object.entries(EXCLUSIVE_SERVICES).forEach(([name, { services, message }]) => {
        const exists = answers.some(answer => answer.includes(name))

        const hasExclusive = services.some(service =>
            answers.some(answer => answer.includes(service))
        )

        if (exists && hasExclusive) {
            result = `${name} cannot work together with ${services.join(', ')}\n${message}\nPlease uncheck one of them.`
        }
    })

    return result
}

export async function getCapabilities(arg: ReplCommandArguments) {
    const optionalCapabilites = {
        platformVersion: arg.platformVersion,
        udid: arg.udid,
        ...(arg.deviceName && { deviceName: arg.deviceName })
    }
    /**
     * Parsing of option property and constructing desiredCapabilities
     * for Appium session. Could be application(1) or browser(2-3) session.
     */
    if (/.*\.(apk|app|ipa)$/.test(arg.option)) {
        return {
            capabilities: {
                app: arg.option,
                ...(arg.option.endsWith('apk') ? ANDROID_CONFIG : IOS_CONFIG),
                ...optionalCapabilites,
            }
        }
    } else if (/android/.test(arg.option)) {
        return { capabilities: { browserName: 'Chrome', ...ANDROID_CONFIG, ...optionalCapabilites } }
    } else if (/ios/.test(arg.option)) {
        return { capabilities: { browserName: 'Safari', ...IOS_CONFIG, ...optionalCapabilites } }
    } else if (/(js|ts)$/.test(arg.option)) {
        const config = new ConfigParser(arg.option)
        try {
            await config.initialize()
        } catch (e) {
            throw Error((e as any).code === 'MODULE_NOT_FOUND' ? `Config File not found: ${arg.option}`:
                `Could not parse ${arg.option}, failed with error : ${(e as Error).message}`)
        }
        if (typeof arg.capabilities === 'undefined') {
            throw Error('Please provide index/named property of capability to use from the capabilities array/object in wdio config file')
        }
        let requiredCaps = config.getCapabilities()
        requiredCaps = (
            // multi capabilities
            (requiredCaps as (Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities)[])[parseInt(arg.capabilities, 10)] ||
            // multiremote
            (requiredCaps as Capabilities.MultiRemoteCapabilities)[arg.capabilities]
        )
        const requiredW3CCaps = pickBy(requiredCaps, (_, key) => CAPABILITY_KEYS.includes(key) || key.includes(':'))
        if (!Object.keys(requiredW3CCaps).length) {
            throw Error(`No capability found in given config file with the provided capability indexed/named property: ${arg.capabilities}. Please check the capability in your wdio config file.`)
        }
        return { capabilities: { ...(requiredW3CCaps as Capabilities.W3CCapabilities) } }
    }
    return { capabilities: { browserName: arg.option } }
}

/**
 * Get project root directory based on questionair answers
 * @param answers questionair answers
 * @param projectProps project properties received via `getProjectProps`
 * @returns project root path
 */
export function getProjectRoot (answers: Questionnair, projectProps?: ProjectProps) {
    return (
        answers.projectRoot ||
        (
            typeof projectProps === 'undefined'
                ? process.cwd()
                : projectProps.path
        )
    )
}

/**
 * Checks if certain directory has babel configuration files
 * @param rootDir directory where this function checks for Babel signs
 * @returns true, if a babel config was found, otherwise false
 */
export function hasBabelConfig (rootDir: string) {
    return Promise.all([
        fs.access(path.join(rootDir, 'babel.js')),
        fs.access(path.join(rootDir, 'babel.cjs')),
        fs.access(path.join(rootDir, 'babel.mjs')),
        fs.access(path.join(rootDir, '.babelrc'))
    ]).then(
        (results) => results.filter(Boolean).length > 1,
        () => false
    )
}

/**
 * detect if project has a compiler file
 */
export async function detectCompiler (answers: Questionnair) {
    const projectProps = await getProjectProps(process.cwd())
    const root = getProjectRoot(answers, projectProps)
    const rootTSConfigExist = await fs.access(path.resolve(root, 'tsconfig.json')).then(() => true, () => false)
    return (await hasBabelConfig(root))
        ? COMPILER_OPTIONS.babel // default to Babel
        : rootTSConfigExist
            ? COMPILER_OPTIONS.ts // default to TypeScript
            : COMPILER_OPTIONS.nil // default to no compiler
}

/**
 * Check if package is installed
 * @param {string} package to check existance for
 */
export async function hasPackage (pkg: string) {
    try {
        await resolve(pkg, import.meta.url)
        return true
    } catch (err: any) {
        return false
    }
}

/**
 * generate test files based on CLI answers
 */
export async function generateTestFiles (answers: ParsedAnswers) {
    const testFiles = answers.framework === 'cucumber'
        ? [path.join(TEMPLATE_ROOT_DIR, 'cucumber')]
        : (answers.framework === 'mocha'
            ? [path.join(TEMPLATE_ROOT_DIR, 'mocha')]
            : [path.join(TEMPLATE_ROOT_DIR, 'jasmine')])

    if (answers.usePageObjects) {
        testFiles.push(path.join(TEMPLATE_ROOT_DIR, 'pageobjects'))
    }

    const files = (await Promise.all(testFiles.map((dirPath) => readDir(
        dirPath,
        [(file, stats) => !stats.isDirectory() && !(file.endsWith('.ejs') || file.endsWith('.feature'))]
    )))).reduce((cur, acc) => [...acc, ...(cur)], [])

    for (const file of files) {
        const renderedTpl = await renderFile(file, answers)
        const isJSX = answers.preset && ['preact', 'react'].includes(answers.preset)
        const fileEnding = (answers.isUsingTypeScript ? '.ts' : '.js') + (isJSX ? 'x' : '')
        const destPath = (
            file.endsWith('page.js.ejs')
                ? path.join(answers.destPageObjectRootPath, path.basename(file))
                : file.includes('step_definition')
                    ? answers.stepDefinitions!
                    : path.join(answers.destSpecRootPath, path.basename(file))
        ).replace(/\.ejs$/, '').replace(/\.js$/, fileEnding)

        await fs.mkdir(path.dirname(destPath), { recursive: true })
        await fs.writeFile(destPath, renderedTpl)
    }
}

export async function getAnswers(yes: boolean): Promise<Questionnair> {
    if (yes) {
        const answers = QUESTIONNAIRE.reduce((answers, question) => Object.assign(
            answers,
            question.when && !question.when(answers)
                /**
                 * set nothing if question doesn't apply
                 */
                ? {}
                : { [question.name]: typeof question.default !== 'undefined'
                    /**
                     * set default value if existing
                     */
                    ? typeof question.default === 'function'
                        ? question.default(answers)
                        : question.default
                    : question.choices && question.choices.length
                    /**
                     * pick first choice, select value if it exists
                     */
                        ? typeof question.choices === 'function'
                            ? (question.choices(answers)[0] as any as { value: any }).value
                                ? (question.choices(answers)[0] as any as { value: any }).value
                                : question.choices(answers)[0]
                            : (question.choices[0] as { value: any }).value
                                ? (question.choices[0] as { value: any }).value
                                : question.choices[0]
                        : {}
                }
        ), {} as Questionnair)
        /**
         * some questions have async defaults
         */
        answers.isUsingCompiler = await answers.isUsingCompiler
        answers.specs = await answers.specs
        answers.pages = await answers.pages
        return answers
    }

    const projectProps = await getProjectProps(process.cwd())
    const isProjectExisting = Boolean(projectProps)
    const projectName = projectProps?.packageJson?.name ? ` named "${projectProps.packageJson.name}"` : ''
    const questions = [
        /**
         * in case the `wdio config` was called using a global installed @wdio/cli package
         */
        ...(!isProjectExisting
            ? [{
                type: 'confirm',
                name: 'createPackageJSON',
                default: true,
                message: `Couldn't find a package.json in "${process.cwd()}" or any of the parent directories, do you want to create one?`,
            }, {
                type: 'list',
                name: 'moduleSystem',
                message: 'Which module system should be used?',
                choices: [
                    { name: 'esm', value: 'ESM (recommended)$--$esm' },
                    { name: 'commonjs', value: 'CommonJS$--$commonjs' }
                ],
                // only ask if there are more than 1 runner to pick from
                when: /* istanbul ignore next */ (answers: Questionnair) => answers.createPackageJSON
            }]
            /**
             * in case create-wdio was used which creates a package.json with name "my-new-project"
             * we don't need to ask this question
             */
            : projectProps?.packageJson?.name !== 'my-new-project'
                ? [{
                    type: 'confirm',
                    name: 'projectRootCorrect',
                    default: true,
                    message: `A project${projectName} was detected at "${projectProps?.path}", correct?`,
                }, {
                    type: 'input',
                    name: 'projectRoot',
                    message: 'What is the project root for your test project?',
                    default: projectProps?.path,
                    // only ask if there are more than 1 runner to pick from
                    when: /* istanbul ignore next */ (answers: Questionnair) => !answers.projectRootCorrect
                }]
                : []
        ),
        ...QUESTIONNAIRE
    ]
    return inquirer.prompt(questions)
}

export function getPathForFileGeneration (answers: Questionnair, projectRootDir: string) {
    const destSpecRootPath = path.resolve(
        projectRootDir,
        path.dirname(answers.specs || '').replace(/\*\*$/, ''))

    const destStepRootPath = path.resolve(projectRootDir, path.dirname(answers.stepDefinitions || ''))

    const destPageObjectRootPath = answers.usePageObjects
        ?  path.resolve(
            projectRootDir,
            path.dirname(answers.pages || '').replace(/\*\*$/, ''))
        : ''
    const relativePath = (answers.generateTestFiles && answers.usePageObjects)
        ? !(convertPackageHashToObject(answers.framework).short === 'cucumber')
            ? path.relative(destSpecRootPath, destPageObjectRootPath)
            : path.relative(destStepRootPath, destPageObjectRootPath)
        : ''

    return {
        destSpecRootPath : destSpecRootPath,
        destStepRootPath : destStepRootPath,
        destPageObjectRootPath : destPageObjectRootPath,
        relativePath : relativePath.replaceAll(path.sep, '/')
    }
}

export async function getDefaultFiles (answers: Questionnair, pattern: string) {
    const projectProps = await getProjectProps()
    const rootdir = getProjectRoot(answers, projectProps)
    return pattern.endsWith('.feature')
        ? path.join(rootdir, pattern)
        : answers?.isUsingCompiler?.toString().includes('TypeScript')
            ? `${path.join(rootdir, pattern)}.ts`
            : `${path.join(rootdir, pattern)}.js`
}

/**
 * Ensure core WebdriverIO packages have the same version as cli so that if someone
 * installs `@wdio/cli@next` and runs the wizard, all related packages have the same version.
 * running `matchAll` to a version like "8.0.0-alpha.249+4bc237701", results in:
 * ['8.0.0-alpha.249+4bc237701', '8', '0', '0', 'alpha', '249', '4bc237701']
 */
export function specifyVersionIfNeeded (packagesToInstall: string[], version: string, npmTag: string) {
    const { value } = version.matchAll(VERSION_REGEXP).next()
    const [major, minor, patch, tagName, build] = (value || []).slice(1, -1) // drop commit bit
    return packagesToInstall.map((p) => {
        if (p.startsWith('@wdio') || ['devtools', 'webdriver', 'webdriverio'].includes(p)) {
            const tag = major && npmTag === 'latest'
                ? `^${major}.${minor}.${patch}-${tagName}.${build}`
                : npmTag
            return `${p}@${tag}`
        }
        return p
    })
}

/**
 * Receive project properties
 * @returns {@type ProjectProps} if a package.json can be found in cwd or parent directories, otherwise undefined
 *                               which means that a new project can be created
 */
export async function getProjectProps (cwd = process.cwd()): Promise<ProjectProps | undefined> {
    try {
        const { packageJson, path: packageJsonPath } = await readPackageUp({ cwd }) || {}
        if (!packageJson || !packageJsonPath) {
            return undefined
        }

        return {
            esmSupported: (
                packageJson.type === 'module' ||
                typeof packageJson.module === 'string'
            ),
            packageJson,
            path: path.dirname(packageJsonPath)
        }
    } catch (err) {
        return undefined
    }
}

export function runProgram (command: string, args: string[], options: SpawnOptions) {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    return new Promise<void>((resolve, reject) => {
        let error: Error
        child.on('error', (e) => (error = e))
        child.on('close', code => {
            if (code !== 0) {
                return reject(new Error(
                    (error && error.message) ||
                    `Error calling: ${command} ${args.join(' ')}`
                ))
            }
            resolve()
        })
    })
}

/**
 * create package.json if not already existing
 */
export async function createPackageJSON (parsedAnswers: ParsedAnswers) {
    if (!parsedAnswers.createPackageJSON) {
        return
    }

    console.log(`Creating a ${chalk.bold('package.json')} for the directory...`)
    await fs.writeFile(path.resolve(process.cwd(), 'package.json'), JSON.stringify({
        name: 'webdriverio-tests',
        version: '0.0.0',
        private: true,
        license: 'ISC',
        type: parsedAnswers.moduleSystem,
        dependencies: {},
        devDependencies: {}
    }, null, 2))
    console.log(chalk.green.bold('✔ Success!\n'))
}

/**
 * run npm install only if required by the user
 */
export function npmInstall (parsedAnswers: ParsedAnswers, useYarn: boolean, npmTag: string) {
    const servicePackages = parsedAnswers.rawAnswers.services.map((service) => convertPackageHashToObject(service))
    const presetPackage = convertPackageHashToObject(parsedAnswers.rawAnswers.preset || '')

    /**
     * install Testing Library dependency if desired
     */
    if (parsedAnswers.installTestingLibrary && TESTING_LIBRARY_PACKAGES[presetPackage.short]) {
        parsedAnswers.packagesToInstall.push(
            TESTING_LIBRARY_PACKAGES[presetPackage.short],
            '@testing-library/jest-dom'
        )
    }

    /**
     * add helper package for Solidjs testing
     */
    if (parsedAnswers.preset === 'solid') {
        parsedAnswers.packagesToInstall.push('solid-js/web')
    }

    /**
     * add Jasmine types if necessary
     */
    if (parsedAnswers.framework === 'jasmine' && parsedAnswers.isUsingTypeScript) {
        parsedAnswers.packagesToInstall.push('@types/jasmine')
    }

    /**
     * add packages that are required by services
     */
    addServiceDeps(servicePackages, parsedAnswers.packagesToInstall)

    /**
      * update package version if CLI is a pre release
      */
    parsedAnswers.packagesToInstall = specifyVersionIfNeeded(parsedAnswers.packagesToInstall, pkg.version, npmTag)

    if (parsedAnswers.npmInstall){
        console.log('Installing wdio packages:\n-', parsedAnswers.packagesToInstall.join('\n- '))
        const result = yarnInstall({ deps: parsedAnswers.packagesToInstall, dev: true, respectNpm5: !useYarn })
        if (result.status !== 0) {
            const customError = '⚠️ An unknown error happened! Please retry ' +
                `installing dependencies via "${useYarn ? 'yarn add --dev' : 'npm i --save-dev'} ` +
                `${parsedAnswers.packagesToInstall.join(' ')}"\n\nError: ${result.stderr || 'unknown'}`
            console.error(customError)
        }
        console.log(chalk.green.bold('✔ Success!\n'))
    } else {
        const installationCommand = `${useYarn ? 'yarn add --dev' : 'npm i --save-dev'} ${parsedAnswers.packagesToInstall.join(' ')}`
        console.log(util.format(DEPENDENCIES_INSTALLATION_MESSAGE, installationCommand))
    }
}

/**
 * add ts-node if TypeScript is desired but not installed
 */
export async function setupTypeScript (parsedAnswers: ParsedAnswers) {
    if (!parsedAnswers.isUsingTypeScript) {
        return
    }

    console.log('Setting up TypeScript...')
    const frameworkPackage = convertPackageHashToObject(parsedAnswers.rawAnswers.framework)
    const servicePackages = parsedAnswers.rawAnswers.services.map((service) => convertPackageHashToObject(service))
    parsedAnswers.packagesToInstall.push('ts-node', 'typescript')
    const types = [
        'node',
        '@wdio/globals/types',
        'expect-webdriverio',
        frameworkPackage.package,
        ...(parsedAnswers.runner === 'browser' ? ['@wdio/browser-runner'] : []),
        ...servicePackages
            .map(service => service.package)
            /**
             * given that we know that all "offical" services have
             * typescript support we only include them
             */
            .filter(service => service.startsWith('@wdio'))
    ]

    const config = {
        compilerOptions: {
            moduleResolution: 'node',
            module: 'ESNext',
            types,
            target: 'es2022',
        }
    }

    await fs.mkdir(path.dirname(parsedAnswers.tsConfigFilePath), { recursive: true })
    await fs.writeFile(
        parsedAnswers.tsConfigFilePath,
        JSON.stringify(config, null, 4)
    )
    console.log(chalk.green.bold('✔ Success!\n'))
}

/**
 * add @babel/register package if not installed
 */
export async function setupBabel (parsedAnswers: ParsedAnswers) {
    if (!parsedAnswers.isUsingBabel) {
        return
    }

    if (!await hasPackage('@babel/register')) {
        parsedAnswers.packagesToInstall.push('@babel/register')
    }

    /**
     * setup Babel if no config file exists
     */
    const hasBabelConfig = await Promise.all([
        fs.access(path.join(parsedAnswers.projectRootDir, 'babel.js')),
        fs.access(path.join(parsedAnswers.projectRootDir, 'babel.cjs')),
        fs.access(path.join(parsedAnswers.projectRootDir, 'babel.mjs')),
        fs.access(path.join(parsedAnswers.projectRootDir, '.babelrc'))
    ]).then(
        (results) => results.filter(Boolean).length > 1,
        () => false
    )

    if (!hasBabelConfig) {
        console.log('Setting up Babel project...')
        if (!await hasPackage('@babel/core')) {
            parsedAnswers.packagesToInstall.push('@babel/core')
        }
        if (!await hasPackage('@babel/preset-env')) {
            parsedAnswers.packagesToInstall.push('@babel/preset-env')
        }
        await fs.writeFile(
            path.join(process.cwd(), 'babel.config.js'),
            `module.exports = ${JSON.stringify({
                presets: [
                    ['@babel/preset-env', {
                        targets: {
                            node: 16
                        }
                    }]
                ]
            }, null, 4)}`
        )
        console.log(chalk.green.bold('✔ Success!\n'))
    }
}

export async function createWDIOConfig (parsedAnswers: ParsedAnswers) {
    try {
        console.log('Creating a WebdriverIO config file...')
        const tplPath = path.resolve(__dirname, 'templates', 'wdio.conf.tpl.ejs')
        const renderedTpl = await renderFile(tplPath, { answers: parsedAnswers })
        await fs.writeFile(parsedAnswers.wdioConfigPath, renderedTpl)
        console.log(chalk.green.bold('✔ Success!\n'))

        if (parsedAnswers.generateTestFiles) {
            console.log('Autogenerating test files...')
            await generateTestFiles(parsedAnswers)
            console.log(chalk.green.bold('✔ Success!\n'))
        }
    } catch (err: any) {
        throw new Error(`⚠️ Couldn't write config file: ${err.stack}`)
    }
}

export async function createWDIOScript (parsedAnswers: ParsedAnswers) {
    const projectProps = await getProjectProps(process.cwd())

    const script = `wdio run ./${path.join('.', parsedAnswers.wdioConfigPath.replace(projectProps?.path || process.cwd(), ''))}`
    const args = ['pkg', 'set', `scripts.wdio=${script}`]
    try {
        console.log(`Adding ${chalk.bold('"wdio"')} script to package.json.`)
        await runProgram(NPM_COMMAND, args, { cwd: parsedAnswers.projectRootDir })
        console.log(chalk.green.bold('✔ Success!'))
        return true
    } catch (err: any) {
        const [preArgs, scriptPath] = args.join(' ').split('=')
        console.error(
            `⚠️  Couldn't add script to package.json: "${err.message}", you can add it manually ` +
            `by running:\n\n\t${NPM_COMMAND} ${preArgs}="${scriptPath}"`
        )
        return false
    }
}
