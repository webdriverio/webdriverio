import fs from 'node:fs/promises'
import util, { promisify } from 'node:util'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SpawnOptions } from 'node:child_process'
import { execSync, spawn } from 'node:child_process'

import ejs from 'ejs'
import chalk from 'chalk'
import inquirer from 'inquirer'
import pickBy from 'lodash.pickby'
import logger from '@wdio/logger'
import readDir from 'recursive-readdir'
import { $ } from 'execa'
import { readPackageUp } from 'read-pkg-up'
import { resolve } from 'import-meta-resolve'
import { SevereServiceError } from 'webdriverio'
import { ConfigParser } from '@wdio/config/node'
import { CAPABILITY_KEYS } from '@wdio/protocols'
import type { Capabilities, Options, Services } from '@wdio/types'

import { installPackages, getInstallCommand } from './install.js'
import {
    ANDROID_CONFIG,
    CompilerOptions,
    DEPENDENCIES_INSTALLATION_MESSAGE,
    IOS_CONFIG,
    pkg,
    QUESTIONNAIRE,
    TESTING_LIBRARY_PACKAGES,
    COMMUNITY_PACKAGES_WITH_TS_SUPPORT,
    usesSerenity,
} from './constants.js'
import type {
    OnCompleteResult,
    ParsedAnswers,
    ProjectProps,
    Questionnair,
    ReplCommandArguments,
    SupportedPackage,
} from './types.js'
import { EjsHelpers } from './templates/EjsHelpers.js'

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
 * @param {object} config
 * @param {object} capabilities
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
export function getRunnerName(caps: Capabilities.DesiredCapabilities = {}) {
    let runner =
        caps.browserName ||
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

function buildNewConfigArray(str: string, type: string, change: string) {
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

function buildNewConfigString(str: string, type: string, change: string) {
    return str.replace(new RegExp(`(${type}: )('\\w*')`), `$1'${change}'`)
}

export function findInConfig(config: string, type: string) {
    let regexStr = `[\\/\\/]*[\\s]*${type}s: [\\s]*\\[([\\s]*['|"]\\w*['|"],*)*[\\s]*\\]`

    if (type === 'framework') {
        regexStr = `[\\/\\/]*[\\s]*${type}: ([\\s]*['|"]\\w*['|"])`
    }

    const regex = new RegExp(regexStr, 'gmi')
    return config.match(regex)
}

export function replaceConfig(config: string, type: string, name: string) {
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
     * install Appium if it is not installed globally if `@wdio/appium-service`
     * was selected for install
     */
    if (names.some(({ short }) => short === 'appium')) {
        const result = execSync('appium --version || echo APPIUM_MISSING', { stdio: 'pipe' }).toString().trim()
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
    const [p, short, purpose] = pkg.split(hash)
    return { package: p, short, purpose }
}

export function getSerenityPackages(answers: Questionnair): string[] {
    const framework = convertPackageHashToObject(answers.framework)

    if (framework.package !== '@serenity-js/webdriverio') {
        return []
    }

    const isUsingTypeScript = answers.isUsingCompiler === CompilerOptions.TS

    const packages: Record<string, Array<string | false>> = {
        cucumber: [
            '@cucumber/cucumber',
            '@serenity-js/cucumber',
        ],
        mocha: [
            '@serenity-js/mocha',
            'mocha',
            isUsingTypeScript && '@types/mocha',
        ],
        jasmine: [
            '@serenity-js/jasmine',
            'jasmine',
            isUsingTypeScript && '@types/jasmine',
        ],
        common: [
            '@serenity-js/assertions',
            '@serenity-js/console-reporter',
            '@serenity-js/core',
            '@serenity-js/rest',
            '@serenity-js/serenity-bdd',
            '@serenity-js/web',
            isUsingTypeScript && '@types/node',
            'npm-failsafe',
            'rimraf',
        ]
    }

    return [
        ...packages[framework.purpose],
        ...packages.common,
    ].filter(Boolean).sort() as string[]
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
            throw Error((e as any).code === 'MODULE_NOT_FOUND' ? `Config File not found: ${arg.option}` :
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
 * Checks if certain directory has babel configuration files
 * @param rootDir directory where this function checks for Babel signs
 * @returns true, if a babel config was found, otherwise false
 */
export function hasBabelConfig(rootDir: string) {
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
export async function detectCompiler(answers: Questionnair) {
    const root = await getProjectRoot(answers)
    const rootTSConfigExist = await fs.access(path.resolve(root, 'tsconfig.json')).then(() => true, () => false)
    return (await hasBabelConfig(root))
        ? CompilerOptions.Babel // default to Babel
        : rootTSConfigExist
            ? CompilerOptions.TS // default to TypeScript
            : CompilerOptions.Nil // default to no compiler
}

/**
 * Check if package is installed
 * @param {string} package to check existance for
 */
export async function hasPackage(pkg: string) {
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
export async function generateTestFiles(answers: ParsedAnswers) {
    if (answers.serenityAdapter) {
        return generateSerenityExamples(answers)
    }

    if (answers.runner === 'local') {
        return generateLocalRunnerTestFiles(answers)
    }

    return generateBrowserRunnerTestFiles(answers)
}

const TSX_BASED_FRAMEWORKS = ['react', 'preact', 'solid', 'stencil']
export async function generateBrowserRunnerTestFiles(answers: ParsedAnswers) {
    const isUsingFramework = typeof answers.preset === 'string'
    const preset = getPreset(answers)
    const tplRootDir = path.join(TEMPLATE_ROOT_DIR, 'browser')
    await fs.mkdir(answers.destSpecRootPath, { recursive: true })

    /**
     * render css file
     */
    if (isUsingFramework) {
        const renderedCss = await renderFile(path.join(tplRootDir, 'Component.css.ejs'), { answers })
        await fs.writeFile(path.join(answers.destSpecRootPath, 'Component.css'), renderedCss)
    }

    /**
     * render component file
     */
    const testExt = `${(answers.isUsingTypeScript ? 'ts' : 'js')}${TSX_BASED_FRAMEWORKS.includes(preset) ? 'x' : ''}`
    const fileExt = ['svelte', 'vue'].includes(preset as 'svelte' | 'vue')
        ? preset!
        : testExt
    if (preset) {
        const componentOutFileName = `Component.${fileExt}`
        const renderedComponent = await renderFile(path.join(tplRootDir, `Component.${preset}.ejs`), { answers })
        await fs.writeFile(path.join(answers.destSpecRootPath, componentOutFileName), renderedComponent)
    }

    /**
     * render test file
     */
    const componentFileName = preset ? `Component.${preset}.test.ejs` : 'standalone.test.ejs'
    const renderedTest = await renderFile(path.join(tplRootDir, componentFileName), { answers })
    await fs.writeFile(path.join(answers.destSpecRootPath, `Component.test.${testExt}`), renderedTest)
}

async function generateLocalRunnerTestFiles(answers: ParsedAnswers) {
    const testFiles = answers.framework === 'cucumber'
        ? [path.join(TEMPLATE_ROOT_DIR, 'cucumber')]
        : [path.join(TEMPLATE_ROOT_DIR, 'mochaJasmine')]

    if (answers.usePageObjects) {
        testFiles.push(path.join(TEMPLATE_ROOT_DIR, 'pageobjects'))
    }

    const files = (await Promise.all(testFiles.map((dirPath) => readDir(
        dirPath,
        [(file, stats) => !stats.isDirectory() && !(file.endsWith('.ejs') || file.endsWith('.feature'))]
    )))).reduce((cur, acc) => [...acc, ...(cur)], [])

    for (const file of files) {
        const renderedTpl = await renderFile(file, { answers })
        const isJSX = answers.preset && TSX_BASED_FRAMEWORKS.includes(answers.preset)
        const fileEnding = (answers.isUsingTypeScript ? '.ts' : '.js') + (isJSX ? 'x' : '')
        const destPath = (
            file.endsWith('page.js.ejs')
                ? path.join(answers.destPageObjectRootPath, path.basename(file))
                : file.includes('step_definition')
                    ? path.join(answers.destStepRootPath, path.basename(file))
                    : path.join(answers.destSpecRootPath, path.basename(file))
        ).replace(/\.ejs$/, '').replace(/\.js$/, fileEnding)

        await fs.mkdir(path.dirname(destPath), { recursive: true })
        await fs.writeFile(destPath, renderedTpl)
    }
}

async function generateSerenityExamples(answers: ParsedAnswers): Promise<void> {
    const templateDirectories = {
        [answers.projectRootDir]:           path.join(TEMPLATE_ROOT_DIR, 'serenity-js', 'common', 'config'),
        [answers.destSpecRootPath]:         path.join(TEMPLATE_ROOT_DIR, 'serenity-js', answers.serenityAdapter as string),
        [answers.destSerenityLibRootPath]:  path.join(TEMPLATE_ROOT_DIR, 'serenity-js', 'common', 'serenity'),
    }

    for (const [destinationRootDir, templateRootDir] of Object.entries(templateDirectories)) {
        const pathsToTemplates = await readDir(templateRootDir)

        for (const pathToTemplate of pathsToTemplates) {
            const extension = answers.isUsingTypeScript ? '.ts' : '.js'
            const destination = path.join(destinationRootDir, path.relative(templateRootDir, pathToTemplate))
                .replace(/\.ejs$/, '')
                .replace(/\.ts$/, extension)

            const contents = await renderFile(
                pathToTemplate,
                { answers, _: new EjsHelpers({ useEsm: answers.esmSupport, useTypeScript: answers.isUsingTypeScript }) },
            )

            await fs.mkdir(path.dirname(destination), { recursive: true })
            await fs.writeFile(destination, contents)
        }
    }
}

export async function getAnswers(yes: boolean): Promise<Questionnair> {
    if (yes) {
        const ignoredQuestions = ['e2eEnvironment']
        const filterdQuestionaire = QUESTIONNAIRE.filter((question) => !ignoredQuestions.includes(question.name))
        const answers = {} as Questionnair
        for (const question of filterdQuestionaire) {
            /**
             * set nothing if question doesn't apply
             */
            if (question.when && !question.when(answers)) {
                continue
            }

            Object.assign(answers, {
                [question.name]: typeof question.default !== 'undefined'
                    /**
                     * set default value if existing
                     */
                    ? typeof question.default === 'function'
                        ? await question.default(answers)
                        : await question.default
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
            })
        }
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

/**
 * Generates a valid file path from answers provided.
 * @param answers The answer from which a file path is to be generated.
 * @param projectRootDir The root directory of the project.
 * @returns filePath
 */
function generatePathfromAnswer(answers:string, projectRootDir:string):string {
    return path.resolve(
        projectRootDir, path.dirname(answers) === '.' ? path.resolve(answers) : path.dirname(answers))
}

export function getPathForFileGeneration(answers: Questionnair, projectRootDir: string) {
    const specAnswer = answers.specs || ''
    const stepDefinitionAnswer = answers.stepDefinitions || ''
    const pageObjectAnswer = answers.pages || ''

    const destSpecRootPath = generatePathfromAnswer(specAnswer, projectRootDir).replace(/\*\*$/, '')
    const destStepRootPath = generatePathfromAnswer(stepDefinitionAnswer, projectRootDir)
    const destPageObjectRootPath = answers.usePageObjects
        ? generatePathfromAnswer(pageObjectAnswer, projectRootDir).replace(/\*\*$/, '')
        : ''
    const destSerenityLibRootPath = usesSerenity(answers)
        ? path.resolve(projectRootDir, answers.serenityLibPath || 'serenity')
        : ''
    const relativePath = (answers.generateTestFiles && answers.usePageObjects)
        ? !(convertPackageHashToObject(answers.framework).short === 'cucumber')
            ? path.relative(destSpecRootPath, destPageObjectRootPath)
            : path.relative(destStepRootPath, destPageObjectRootPath)
        : ''

    return {
        destSpecRootPath: destSpecRootPath,
        destStepRootPath: destStepRootPath,
        destPageObjectRootPath: destPageObjectRootPath,
        destSerenityLibRootPath: destSerenityLibRootPath,
        relativePath: relativePath.replaceAll(path.sep, '/')
    }
}

export async function getDefaultFiles(answers: Questionnair, pattern: string) {
    const rootdir = await getProjectRoot(answers)
    const presetPackage = convertPackageHashToObject(answers.preset || '')
    const isJSX = TSX_BASED_FRAMEWORKS.includes(presetPackage.short || '')
    const val = pattern.endsWith('.feature')
        ? path.join(rootdir, pattern)
        : answers?.isUsingCompiler?.toString().includes('TypeScript')
            ? `${path.join(rootdir, pattern)}.ts${isJSX ? 'x' : ''}`
            : `${path.join(rootdir, pattern)}.js${isJSX ? 'x' : ''}`
    return val
}

/**
 * Ensure core WebdriverIO packages have the same version as cli so that if someone
 * installs `@wdio/cli@next` and runs the wizard, all related packages have the same version.
 * running `matchAll` to a version like "8.0.0-alpha.249+4bc237701", results in:
 * ['8.0.0-alpha.249+4bc237701', '8', '0', '0', 'alpha', '249', '4bc237701']
 */
export function specifyVersionIfNeeded(packagesToInstall: string[], version: string, npmTag: string) {
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
export async function getProjectProps(cwd = process.cwd()): Promise<ProjectProps | undefined> {
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

export function runProgram(command: string, args: string[], options: SpawnOptions) {
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
export async function createPackageJSON(parsedAnswers: ParsedAnswers) {
    const packageJsonExists = await fs.access(path.resolve(process.cwd(), 'package.json')).then(() => true, () => false)

    // Use the exisitng package.json if it already exists.
    if (packageJsonExists) {
        return
    }

    // If a user said no to creating a package.json, but it doesn't exist, abort.
    if (parsedAnswers.createPackageJSON === false) {
        /* istanbul ignore if */
        if (!packageJsonExists) {
            console.log(`No WebdriverIO configuration found in "${parsedAnswers.wdioConfigPath}"`)
            return !process.env.VITEST_WORKER_ID && process.exit(0)
        }
        return
    }

    // Only create if the user gave explicit permission to
    if (parsedAnswers.createPackageJSON) {
        console.log(`Creating a ${chalk.bold('package.json')} for the directory...`)
        await fs.writeFile(path.resolve(process.cwd(), 'package.json'), JSON.stringify({
            name: 'webdriverio-tests',
            version: '0.0.0',
            private: true,
            license: 'ISC',
            type: 'module',
            dependencies: {},
            devDependencies: {}
        }, null, 2))
        console.log(chalk.green.bold('✔ Success!\n'))
    }
}

/**
 * run npm install only if required by the user
 */
const SEP = '\n- '
export async function npmInstall(parsedAnswers: ParsedAnswers, npmTag: string) {
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
    if (presetPackage.short === 'solid') {
        parsedAnswers.packagesToInstall.push('solid-js')
    }

    /**
     * add dependency for Lit testing
     */
    const preset = getPreset(parsedAnswers)
    if (preset === 'lit') {
        parsedAnswers.packagesToInstall.push('lit')
    }

    /**
     * add dependency for Stencil testing
     */
    if (preset === 'stencil') {
        parsedAnswers.packagesToInstall.push('@stencil/core')
    }

    /**
     * add helper for React rendering when not using Testing Library
     */
    if (presetPackage.short === 'react') {
        parsedAnswers.packagesToInstall.push('react')
        if (!parsedAnswers.installTestingLibrary) {
            parsedAnswers.packagesToInstall.push('react-dom')
        }
    }

    /**
     * add Jasmine types if necessary
     */
    if (parsedAnswers.framework === 'jasmine' && parsedAnswers.isUsingTypeScript) {
        parsedAnswers.packagesToInstall.push('@types/jasmine')
    }

    /**
     * add Appium mobile drivers if desired
     */
    if (parsedAnswers.purpose === 'macos') {
        parsedAnswers.packagesToInstall.push('appium-mac2-driver')
    }
    if (parsedAnswers.mobileEnvironment === 'android') {
        parsedAnswers.packagesToInstall.push('appium-uiautomator2-driver')
    }
    if (parsedAnswers.mobileEnvironment === 'ios') {
        parsedAnswers.packagesToInstall.push('appium-xcuitest-driver')
    }

    /**
     * add packages that are required by services
     */
    addServiceDeps(servicePackages, parsedAnswers.packagesToInstall)

    /**
      * update package version if CLI is a pre release
      */
    parsedAnswers.packagesToInstall = specifyVersionIfNeeded(parsedAnswers.packagesToInstall, pkg.version, npmTag)

    const cwd = await getProjectRoot(parsedAnswers)
    const pm = detectPackageManager()
    if (parsedAnswers.npmInstall) {
        console.log(`Installing packages using ${pm}:${SEP}${parsedAnswers.packagesToInstall.join(SEP)}`)
        const success = await installPackages(cwd, parsedAnswers.packagesToInstall, true)
        if (success) {
            console.log(chalk.green.bold('✔ Success!\n'))
        }
    } else {
        const installationCommand = getInstallCommand(pm, parsedAnswers.packagesToInstall, true)
        console.log(util.format(DEPENDENCIES_INSTALLATION_MESSAGE, installationCommand))
    }
}

export const PMs = ['npm', 'yarn', 'pnpm', 'bun'] as const
export type PM = typeof PMs[number]
/**
 * detect the package manager that was used
 */
export function detectPackageManager(argv = process.argv) {
    return PMs.find((pm) => (
        // for pnpm check "~/Library/pnpm/store/v3/..."
        // for NPM check "~/.npm/npx/..."
        // for Yarn check "~/.yarn/bin/create-wdio"
        // for Bun check "~/.bun/bin/create-wdio"
        argv[1].includes(`${path.sep}${pm}${path.sep}`) ||
        argv[1].includes(`${path.sep}.${pm}${path.sep}`)
    )) || 'npm'
}

/**
 * add ts-node if TypeScript is desired but not installed
 */
export async function setupTypeScript(parsedAnswers: ParsedAnswers) {
    /**
     * don't create a `tsconfig.json` if user doesn't want to use TypeScript
     * or if a `tsconfig.json` already exists
     */
    if (!parsedAnswers.isUsingTypeScript || parsedAnswers.hasRootTSConfig) {
        return
    }

    console.log('Setting up TypeScript...')
    const frameworkPackage = convertPackageHashToObject(parsedAnswers.rawAnswers.framework)
    const servicePackages = parsedAnswers.rawAnswers.services.map((service) => convertPackageHashToObject(service))
    parsedAnswers.packagesToInstall.push('ts-node', 'typescript')
    const serenityTypes = parsedAnswers.serenityAdapter === 'jasmine' ? ['jasmine'] : []

    const types = [
        'node',
        '@wdio/globals/types',
        'expect-webdriverio',
        ...(parsedAnswers.serenityAdapter ? serenityTypes : [frameworkPackage.package]),
        ...(parsedAnswers.runner === 'browser' ? ['@wdio/browser-runner'] : []),
        ...servicePackages
            .map(service => service.package)
            .filter(service => (
                /**
                 * given that we know that all "official" services have
                 * typescript support we only include them
                 */
                service.startsWith('@wdio') ||
                /**
                 * also include community maintained packages with known
                 * support for TypeScript
                 */
                COMMUNITY_PACKAGES_WITH_TS_SUPPORT.includes(service)
            ))
    ]

    const preset = getPreset(parsedAnswers)
    const config = {
        compilerOptions: {
            // compiler
            moduleResolution: 'node',
            module: !parsedAnswers.esmSupport ? 'commonjs' : 'ESNext',
            target: 'es2022',
            lib: ['es2022', 'dom'],
            types,
            skipLibCheck: true,
            // bundler
            noEmit: true,
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            // linting
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
            ...Object.assign(
                preset === 'lit'
                    ? {
                        experimentalDecorators: true,
                        useDefineForClassFields: false
                    }
                    : {},
                preset === 'react'
                    ? {
                        jsx: 'react-jsx'
                    }
                    : {},
                preset === 'preact'
                    ? {
                        jsx: 'react-jsx',
                        jsxImportSource: 'preact'
                    }
                    : {},
                preset === 'solid'
                    ? {
                        jsx: 'preserve',
                        jsxImportSource: 'solid-js'
                    }
                    : {},
                preset === 'stencil'
                    ? {
                        experimentalDecorators: true,
                        jsx: 'react',
                        jsxFactory: 'h',
                        jsxFragmentFactory: 'Fragment'
                    }
                    : {}
            )
        },
        include: preset === 'svelte'
            ? ['src/**/*.d.ts', 'src/**/*.ts', 'src/**/*.js', 'src/**/*.svelte']
            : preset === 'vue'
                ? ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.tsx', 'src/**/*.vue']
                : ['test', 'wdio.conf.ts']
    }
    await fs.mkdir(path.dirname(parsedAnswers.tsConfigFilePath), { recursive: true })
    await fs.writeFile(
        parsedAnswers.tsConfigFilePath,
        JSON.stringify(config, null, 4)
    )

    console.log(chalk.green.bold('✔ Success!\n'))
}

function getPreset (parsedAnswers: ParsedAnswers) {
    const isUsingFramework = typeof parsedAnswers.preset === 'string'
    return isUsingFramework ? (parsedAnswers.preset || 'lit') : ''
}

/**
 * add @babel/register package if not installed
 */
export async function setupBabel(parsedAnswers: ParsedAnswers) {
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
                            node: 18
                        }
                    }]
                ]
            }, null, 4)}`
        )
        console.log(chalk.green.bold('✔ Success!\n'))
    }
}

export async function createWDIOConfig(parsedAnswers: ParsedAnswers) {
    try {
        console.log('Creating a WebdriverIO config file...')
        const tplPath = path.resolve(__dirname, 'templates', 'wdio.conf.tpl.ejs')
        const renderedTpl = await renderFile(tplPath, {
            answers: parsedAnswers,
            _: new EjsHelpers({ useEsm: parsedAnswers.esmSupport, useTypeScript: parsedAnswers.isUsingTypeScript })
        })
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

/**
 * Get project root directory based on questionair answers
 * @param answers questionair answers
 * @param projectProps project properties received via `getProjectProps`
 * @returns project root path
 */
export async function getProjectRoot (parsedAnswers?: Questionnair) {
    const root = (await getProjectProps())?.path
    if (!root) {
        throw new Error('Could not find project root directory with a package.json')
    }

    return !parsedAnswers || parsedAnswers.projectRootCorrect
        ? root
        : parsedAnswers.projectRoot || process.cwd()
}

export async function createWDIOScript(parsedAnswers: ParsedAnswers) {
    const rootDir = await getProjectRoot(parsedAnswers)
    const pathToWdioConfig = `./${path.join('.', parsedAnswers.wdioConfigPath.replace(rootDir, ''))}`

    const wdioScripts = {
        'wdio': `wdio run ${ pathToWdioConfig }`,
    }

    const serenityScripts = {
        'serenity': 'failsafe serenity:update serenity:clean wdio serenity:report',
        'serenity:update': 'serenity-bdd update',
        'serenity:clean': 'rimraf target',
        'wdio': `wdio run ${ pathToWdioConfig }`,
        'serenity:report': 'serenity-bdd run',
    }

    const scripts = parsedAnswers.serenityAdapter ? serenityScripts : wdioScripts

    for (const [script, command] of Object.entries(scripts)) {

        const args = ['pkg', 'set', `scripts.${ script }=${ command }`]

        try {
            console.log(`Adding ${chalk.bold(`"${ script }"`)} script to package.json`)
            await runProgram(NPM_COMMAND, args, { cwd: parsedAnswers.projectRootDir })
        } catch (err: any) {
            const [preArgs, scriptPath] = args.join(' ').split('=')
            console.error(
                `⚠️  Couldn't add script to package.json: "${err.message}", you can add it manually ` +
                `by running:\n\n\t${NPM_COMMAND} ${preArgs}="${scriptPath}"`
            )
            return false
        }
    }
    console.log(chalk.green.bold('✔ Success!'))
    return true
}

export async function runAppiumInstaller(parsedAnswers: ParsedAnswers) {
    if (parsedAnswers.e2eEnvironment !== 'mobile') {
        return
    }

    const answer = await inquirer.prompt({
        name: 'continueWithAppiumSetup',
        message: 'Continue with Appium setup using appium-installer (https://github.com/AppiumTestDistribution/appium-installer)?',
        type: 'confirm',
        default: true
    })

    if (!answer.continueWithAppiumSetup) {
        return console.log(
            'Ok! You can learn more about setting up mobile environments in the ' +
            'Appium docs at https://appium.io/docs/en/2.0/quickstart/'
        )
    }

    return $({ stdio: 'inherit' })`npx appium-installer`
}
