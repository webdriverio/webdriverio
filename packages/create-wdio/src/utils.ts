import url from 'node:url'
import path from 'node:path'
import util, { promisify } from 'node:util'
import fs from 'node:fs/promises'
import { execSync,  } from 'node:child_process'
import readDir from 'recursive-readdir'

import { $ } from 'execa'
import { readPackageUp } from 'read-pkg-up'

import { EjsHelpers } from './templates/EjsHelpers.js'

import inquirer from 'inquirer'

import ejs from 'ejs'
import type { SpawnOptions } from 'node:child_process'

import spawn from 'cross-spawn'

import { COMMUNITY_PACKAGES_WITH_TS_SUPPORT, DEPENDENCIES_INSTALLATION_MESSAGE, pkg, SUPPORTED_PACKAGE_MANAGERS, QUESTIONNAIRE, TESTING_LIBRARY_PACKAGES, usesSerenity } from './constants.js'
import type { ParsedAnswers, ProjectProps, Questionnair, SupportedPackage } from './types.js'
import chalk from 'chalk'
import { getInstallCommand, installPackages } from './install.js'

const NPM_COMMAND = /^win/.test(process.platform) ? 'npm.cmd' : 'npm'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

process.on('SIGINT', () => printAndExit(undefined, 'SIGINT'))

const TEMPLATE_ROOT_DIR = path.join(__dirname, 'templates', 'exampleFiles')

export function runProgram (command: string, args: string[], options: SpawnOptions) {
    const child = spawn(command, args, { stdio: 'inherit', ...options })
    return new Promise<void>((resolve, rejects) => {
        let error: Error
        child.on('error', (e) => (error = e))
        child.on('close', (code, signal) => {
            if (code !== 0) {
                const errorMessage = (error && error.message) || `Error calling: ${command} ${args.join(' ')}`
                printAndExit(errorMessage, signal)
                return rejects(errorMessage)
            }
            resolve()
        })
    })
}

export async function getPackageVersion() {
    try {
        const pkgJsonPath = path.join(__dirname, '..', 'package.json')
        const pkg = JSON.parse((await fs.readFile(pkgJsonPath)).toString())
        return `v${pkg.version}`
    } catch {
        /* ignore */
    }
    return 'unknown'
}

function printAndExit (error?: string, signal?: NodeJS.Signals | null) {
    if (signal === 'SIGINT') {
        console.log('\n\nGoodbye 👋')
    } else {
        console.log(`\n\n⚠️  Ups, something went wrong${error ? `: ${error}` : ''}!`)
    }

    process.exit(1)
}
// transported from cli
export function convertPackageHashToObject(pkg: string, hash = '$--$'): SupportedPackage {
    const [p, short, purpose] = pkg.split(hash)
    return { package: p, short, purpose }
}

export async function getAnswers(yes: boolean): Promise<Questionnair> {
    if (yes) {
        const ignoredQuestions = ['e2eEnvironment']
        const filteredQuestionaire = QUESTIONNAIRE.filter((question) => !ignoredQuestions.includes(question.name))
        const answers = {} as Questionnair
        for (const question of filteredQuestionaire) {
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
                        : question.default
                    : question.choices && question.choices.length
                        /**
                         * pick first choice, select value if it exists
                         */
                        ? typeof question.choices === 'function'
                            ? (question.choices(answers)[0] as unknown as { value: unknown }).value
                                ? (question.choices(answers)[0] as unknown as { value: unknown }).value
                                : question.choices(answers)[0]
                            : (question.choices[0] as { value: unknown }).value
                                ? question.type === 'checkbox'
                                    ? [(question.choices[0] as { value: unknown }).value]
                                    : (question.choices[0] as { value: unknown }).value
                                : question.choices[0]
                        : {}
            })
        }
        /**
         * some questions have async defaults
         */
        answers.isUsingTypeScript = await answers.isUsingTypeScript
        answers.specs = await answers.specs
        answers.pages = await answers.pages
        return answers
    }

    const projectProps = await getProjectProps(process.cwd())
    const isProjectExisting = Boolean(projectProps)
    const nameInPackageJsonIsNotCreateWdioDefault = projectProps?.packageJson?.name !== 'my-new-project'
    const projectName = projectProps?.packageJson?.name ? ` named "${projectProps.packageJson.name}"` : ''

    const projectRootQuestions = [
        {
            type: 'confirm',
            name: 'createPackageJSON',
            default: true,
            message: `Couldn't find a package.json in "${process.cwd()}" or any of the parent directories, do you want to create one?`,
            when: !isProjectExisting
        },
        {
            type: 'confirm',
            name: 'projectRootCorrect',
            default: true,
            message: `A project${projectName} was detected at "${projectProps?.path}", correct?`,
            when: isProjectExisting && nameInPackageJsonIsNotCreateWdioDefault
        }, {
            type: 'input',
            name: 'projectRoot',
            message: 'What is the project root for your test project?',
            default: projectProps?.path,
            // only ask if there are more than 1 runner to pick from
            when: /* istanbul ignore next */ (answers: Questionnair) => isProjectExisting && nameInPackageJsonIsNotCreateWdioDefault && !answers.projectRootCorrect
        }
    ]

    // @ts-ignore
    const answers = await inquirer.prompt(projectRootQuestions)
    if (answers.createPackageJSON) {
        answers.projectRoot = process.cwd()
    }

    // @ts-ignore
    return inquirer.prompt(QUESTIONNAIRE, answers)
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
    } catch {
        return undefined
    }
}

export function getPathForFileGeneration(answers: Questionnair, projectRootDir: string) {
    const specAnswer = answers.specs || ''
    const stepDefinitionAnswer = answers.stepDefinitions || ''
    const pageObjectAnswer = answers.pages || ''

    const destSpecRootPath = generatePathFromAnswer(specAnswer, projectRootDir).replace(/\*\*$/, '')
    const destStepRootPath = generatePathFromAnswer(stepDefinitionAnswer, projectRootDir)
    const destPageObjectRootPath = answers.usePageObjects
        ? generatePathFromAnswer(pageObjectAnswer, projectRootDir).replace(/\*\*$/, '')
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

/**
 * Generates a valid file path from answers provided.
 * @param answers The answer from which a file path is to be generated.
 * @param projectRootDir The root directory of the project.
 * @returns filePath
 */
function generatePathFromAnswer(answers:string, projectRootDir:string):string {
    return path.resolve(
        projectRootDir, path.dirname(answers) === '.' ? path.resolve(answers) : path.dirname(answers))
}

/**
 * Get project root directory based on questionaire answers
 * @param answers questionaire answers
 * @param projectProps project properties received via `getProjectProps`
 * @returns project root path
 */
export async function getProjectRoot (parsedAnswers?: Questionnair) {
    if (parsedAnswers?.createPackageJSON && parsedAnswers.projectRoot) {
        return parsedAnswers.projectRoot
    }

    const root = (await getProjectProps())?.path
    if (!root) {
        throw new Error('Could not find project root directory with a package.json')
    }

    return !parsedAnswers || parsedAnswers.projectRootCorrect
        ? root
        : parsedAnswers.projectRoot || process.cwd()
}

/**
 * create package.json if not already existing
 */
export async function createPackageJSON(parsedAnswers: ParsedAnswers) {
    const packageJsonExists = await fs.access(path.resolve(process.cwd(), 'package.json')).then(() => true, () => false)

    // Use the existing package.json if it already exists.
    if (packageJsonExists) {
        return
    }

    // If a user said no to creating a package.json, but it doesn't exist, abort.
    if (parsedAnswers.createPackageJSON === false) {
        /* istanbul ignore if */
        if (!packageJsonExists) {
            console.log(`No WebdriverIO configuration found in "${parsedAnswers.wdioConfigPath}"`)
            return !process.env.WDIO_UNIT_TESTS && process.exit(0)
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
        console.log(chalk.green(chalk.bold('✔ Success!\n')))
    }
}

/**
 * set up TypeScript if it is desired but not installed
 */
export async function setupTypeScript(parsedAnswers: ParsedAnswers) {
    /**
     * don't create a `tsconfig.json` if user doesn't want to use TypeScript
     */
    if (!parsedAnswers.isUsingTypeScript) {
        return
    }

    /**
     * don't set up TypeScript if a `tsconfig.json` already exists but ensure we install `tsx`
     * as it is a requirement for running tests with TypeScript
     */
    if (parsedAnswers.hasRootTSConfig) {
        return
    }

    console.log('Setting up TypeScript...')
    const frameworkPackage = convertPackageHashToObject(parsedAnswers.rawAnswers.framework)
    const servicePackages = parsedAnswers.rawAnswers.services.map((service) => convertPackageHashToObject(service))
    const serenityTypes = parsedAnswers.serenityAdapter === 'jasmine' ? ['jasmine'] : []

    const types = [
        'node',
        ...(parsedAnswers.framework === 'jasmine' ? ['jasmine'] : []),
        '@wdio/globals/types',
        ...(parsedAnswers.framework === 'jasmine' ? ['expect-webdriverio/jasmine'] : ['expect-webdriverio']),
        ...(parsedAnswers.serenityAdapter ? serenityTypes : [frameworkPackage.package]),
        ...(parsedAnswers.runner === 'browser' ? ['@wdio/browser-runner'] : []),
        ...servicePackages
            .filter(service => (
                /**
                 * given that we know that all "official" services have
                 * typescript support we only include them
                 */
                service.package.startsWith('@wdio') ||
                /**
                 * also include community maintained packages with known
                 * support for TypeScript
                 */
                COMMUNITY_PACKAGES_WITH_TS_SUPPORT.includes(service.package)
            )).map(service => service.package)
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

    if (parsedAnswers.framework === 'cucumber') {
        config.include.push('features')
    }

    await fs.mkdir(path.dirname(parsedAnswers.tsConfigFilePath), { recursive: true })
    await fs.writeFile(
        parsedAnswers.tsConfigFilePath,
        JSON.stringify(config, null, 4)
    )

    console.log(chalk.green(chalk.bold('✔ Success!\n')))
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
     * add visual service if user selected support for it
     */
    if (parsedAnswers.includeVisualTesting) {
        parsedAnswers.packagesToInstall.push('@wdio/visual-service')
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
            console.log(chalk.green(chalk.bold('✔ Success!\n')))
        }
    } else {
        const installationCommand = getInstallCommand(pm, parsedAnswers.packagesToInstall, true)
        console.log(util.format(DEPENDENCIES_INSTALLATION_MESSAGE, installationCommand))
    }
}

function getPreset (parsedAnswers: ParsedAnswers) {
    const isUsingFramework = typeof parsedAnswers.preset === 'string'
    return isUsingFramework ? (parsedAnswers.preset || 'lit') : ''
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

            console.log(
                '\n=======',
                '\nUsing globally installed appium', result,
                '\nPlease add the following to your wdio.conf.js:',
                "\nappium: { command: 'appium' }",
                '\n=======\n')
        }
    }
}

export async function createWDIOConfig(parsedAnswers: ParsedAnswers) {
    try {
        console.log('Creating a WebdriverIO config file...')
        const tplPath = path.resolve(TEMPLATE_ROOT_DIR, 'wdio.conf.tpl.ejs')
        const renderedTpl = await renderFile(tplPath, {
            answers: parsedAnswers,
            _: new EjsHelpers({ useEsm: parsedAnswers.esmSupport, useTypeScript: parsedAnswers.isUsingTypeScript })
        })
        await fs.writeFile(parsedAnswers.wdioConfigPath, renderedTpl)
        console.log(chalk.green(chalk.bold('✔ Success!\n')))

        if (parsedAnswers.generateTestFiles) {
            console.log('Autogenerate test files...')
            await generateTestFiles(parsedAnswers)
            console.log(chalk.green(chalk.bold('✔ Success!\n')))
        }
    } catch (err) {
        throw new Error(`⚠️ Couldn't write config file: ${(err as Error).stack}`)
    }
}

export const renderFile = promisify(ejs.renderFile) as (path: string, data: Record<string, unknown>) => Promise<string>

/* c8 ignore start */
export async function createWDIOScript(parsedAnswers: ParsedAnswers) {
    const rootDir = await getProjectRoot(parsedAnswers)
    const pathToWdioConfig = `./${path.join('.', parsedAnswers.wdioConfigPath.replace(rootDir, ''))}`

    const wdioScripts = {
        'wdio': `wdio run ${ pathToWdioConfig }`,
    }

    const serenityScripts = {
        'serenity': 'failsafe serenity:clean wdio serenity:report',
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
        } catch (err) {
            const [preArgs, scriptPath] = args.join(' ').split('=')
            console.error(
                `⚠️  Couldn't add script to package.json: "${(err as Error).message}", you can add it manually ` +
                `by running:\n\n\t${NPM_COMMAND} ${preArgs}="${scriptPath}"`
            )
            return false
        }
    }
    console.log(chalk.green(chalk.bold('✔ Success!')))
    return true
}
/* c8 ignore stop */

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
            'Appium docs at https://appium.io/docs/en/latest/quickstart/'
        )
    }

    return $({ stdio: 'inherit' })`npx appium-installer`
}
export function getSerenityPackages(answers: Questionnair): string[] {
    const framework = convertPackageHashToObject(answers.framework)

    if (framework.package !== '@serenity-js/webdriverio') {
        return []
    }

    const packages: Record<string, Array<string | false>> = {
        cucumber: [
            '@cucumber/cucumber',
            '@serenity-js/cucumber',
        ],
        mocha: [
            '@serenity-js/mocha',
            'mocha',
        ],
        jasmine: [
            '@serenity-js/jasmine',
            'jasmine',
        ],
        common: [
            '@serenity-js/assertions',
            '@serenity-js/console-reporter',
            '@serenity-js/core',
            '@serenity-js/rest',
            '@serenity-js/serenity-bdd',
            '@serenity-js/web',
            'npm-failsafe',
            'rimraf',
        ]
    }

    if (answers.isUsingTypeScript) {
        packages.mocha.push('@types/mocha')
        packages.jasmine.push('@types/jasmine')
        packages.common.push('@types/node')
    }

    return [
        ...packages[framework.purpose],
        ...packages.common,
    ].filter(Boolean).sort() as string[]
}

/**
 * detect the package manager that was used
 * uses the environment variable `npm_config_user_agent` to detect the package manager
 * falls back to `npm` if no package manager could be detected
 */
export function detectPackageManager() {
    if (!process.env.npm_config_user_agent) {
        return 'npm'
    }
    const detectedPM = process.env.npm_config_user_agent.split('/')[0].toLowerCase()

    const matchedPM = SUPPORTED_PACKAGE_MANAGERS.find(pm => pm.toLowerCase() === detectedPM)

    return matchedPM || 'npm'
}

export async function getDefaultFiles(answers: Questionnair, pattern: string) {
    const rootDir = await getProjectRoot(answers)
    const presetPackage = convertPackageHashToObject(answers.preset || '')
    const isJSX = TSX_BASED_FRAMEWORKS.includes(presetPackage.short || '')
    const val = pattern.endsWith('.feature')
        ? path.join(rootDir, pattern)
        : answers?.isUsingTypeScript
            ? `${path.join(rootDir, pattern)}.ts${isJSX ? 'x' : ''}`
            : `${path.join(rootDir, pattern)}.js${isJSX ? 'x' : ''}`
    return val
}

const TSX_BASED_FRAMEWORKS = ['react', 'preact', 'solid', 'stencil']

/**
 * detect if project has a compiler file
 */
export async function detectCompiler(answers: Questionnair) {
    // obviously there is no compiler, if there is no package.json
    if (answers.createPackageJSON) {
        return false
    }

    const root = await getProjectRoot(answers)
    const hasRootTSConfig = await fs.access(path.resolve(root, 'tsconfig.json')).then(() => true, () => false)
    return hasRootTSConfig
}

const VERSION_REGEXP = /(\d+)\.(\d+)\.(\d+)-(alpha|beta|)\.(\d+)\+(.+)/g
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
        if (
            (p.startsWith('@wdio') && p !== '@wdio/visual-service') ||
            ['webdriver', 'webdriverio'].includes(p)
        ) {
            const tag = major && npmTag === 'latest'
                ? `^${major}.${minor}.${patch}-${tagName}.${build}`
                : npmTag
            return `${p}@${tag}`
        }
        return p
    })
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

/* c8 ignore start */
async function generateSerenityExamples(answers: ParsedAnswers): Promise<void> {
    const templateDirectories = Object.entries({
        [answers.projectRootDir]:           path.join(TEMPLATE_ROOT_DIR, 'serenity-js', 'common', 'config'),
        [answers.destSpecRootPath]:         path.join(TEMPLATE_ROOT_DIR, 'serenity-js', answers.serenityAdapter as string),
        [answers.destSerenityLibRootPath]:  path.join(TEMPLATE_ROOT_DIR, 'serenity-js', 'common', 'serenity'),
    })

    await Promise.all(templateDirectories.map(async ([destinationRootDir, templateRootDir]) => {
        const pathsToTemplates = await readDir(templateRootDir)

        await Promise.all(pathsToTemplates.map(async (pathToTemplate) => {
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
        }))
    }))
}
/* c8 ignore stop */

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

    await Promise.all(files.map(async (file) => {
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
    }))
}

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

/**
 * Helper utility used in `run` and `install` command to format a provided config path,
 * giving it back as an absolute path, and a version without the file extension
 * @param config the initially given file path to the WDIO config file
 */
export async function formatConfigFilePaths(config: string) {
    const fullPath = path.isAbsolute(config)
        ? config
        : path.join(process.cwd(), config)
    const fullPathNoExtension = fullPath.substring(0, fullPath.lastIndexOf(path.extname(fullPath)))
    return { fullPath, fullPathNoExtension }
}

export function findInConfig(config: string, type: string) {
    let regexStr = `[\\/\\/]*[\\s]*${type}s: [\\s]*\\[([\\s]*['|"]\\w*['|"],*)*[\\s]*\\]`

    if (type === 'framework') {
        regexStr = `[\\/\\/]*[\\s]*${type}: ([\\s]*['|"]\\w*['|"])`
    }

    const regex = new RegExp(regexStr, 'gmi')
    return config.match(regex)
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
