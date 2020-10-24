import fs from 'fs-extra'
import ejs from 'ejs'
import path from 'path'
import inquirer from 'inquirer'
import logger from '@wdio/logger'
import readDir from 'recursive-readdir'
import { SevereServiceError } from 'webdriverio'
import { execSync } from 'child_process'
import { promisify } from 'util'

import { EXCLUSIVE_SERVICES, ANDROID_CONFIG, IOS_CONFIG, QUESTIONNAIRE } from './constants'

const log = logger('@wdio/cli:utils')

const TEMPLATE_ROOT_DIR = path.join(__dirname, 'templates', 'exampleFiles')
const renderFile = promisify(ejs.renderFile)

/**
 * run service launch sequences
 */
export async function runServiceHook(launcher, hookName, ...args) {
    return Promise.all(launcher.map(async (service) => {
        try {
            if (typeof service[hookName] === 'function') {
                await service[hookName](...args)
            }
        } catch (e) {
            const message = `A service failed in the '${hookName}' hook\n${e.stack}\n\n`

            if (e instanceof SevereServiceError) {
                return { status: 'rejected', reason: message }
            }

            log.error(`${message}Continue...`)
        }
    })).then(results => {
        const rejectedHooks = results.filter(p => p && p.status === 'rejected')
        if (rejectedHooks.length) {
            return Promise.reject(`\n${rejectedHooks.map(p => p.reason).join()}\n\nStopping runner...`)
        }
    })
}

/**
 * Run hook in service launcher
 * @param {Array|Function} hook - can be array of functions or single function
 * @param {Object} config
 * @param {Object} capabilities
 */
export async function runLauncherHook(hook, ...args) {
    const catchFn = (e) => log.error(`Error in hook: ${e.stack}`)

    if (typeof hook === 'function') {
        hook = [hook]
    }

    return Promise.all(hook.map((hook) => {
        try {
            return hook(...args)
        } catch (e) {
            return catchFn(e)
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
export async function runOnCompleteHook(onCompleteHook, config, capabilities, exitCode, results) {
    if (typeof onCompleteHook === 'function') {
        onCompleteHook = [onCompleteHook]
    }

    return Promise.all(onCompleteHook.map(async (hook) => {
        try {
            await hook(exitCode, config, capabilities, results)
            return 0
        } catch (e) {
            log.error(`Error in onCompleteHook: ${e.stack}`)
            return 1
        }
    }))
}

/**
 * get runner identification by caps
 */
export function getRunnerName (caps = {}) {
    let runner =
        caps.browserName ||
        caps.appPackage ||
        caps.appWaitActivity ||
        caps.app ||
        caps.platformName

    // MultiRemote
    if (!runner) {
        runner = Object.values(caps).length === 0 || Object.values(caps).some(cap => !cap.capabilities) ? 'undefined' : 'MultiRemote'
    }

    return runner
}

function buildNewConfigArray(str, type, change) {
    const newStr = str
        .split(`${type}s: `)[1]
        .replace('\'', '')

    let newArray = newStr.match(/(\w*)/gmi).filter(e => !!e).concat([change])

    return str
        .replace('// ', '')
        .replace(
            new RegExp(`(${type}s: )((.*\\s*)*)`), `$1[${newArray.map(e => `'${e}'`)}]`
        )
}

function buildNewConfigString(str, type, change) {
    return str.replace(new RegExp(`(${type}: )('\\w*')`), `$1'${change}'`)
}

export function findInConfig(config, type) {
    let regexStr = `[\\/\\/]*[\\s]*${type}s: [\\s]*\\[([\\s]*['|"]\\w*['|"],*)*[\\s]*\\]`

    if (type === 'framework') {
        regexStr = `[\\/\\/]*[\\s]*${type}: ([\\s]*['|"]\\w*['|"])`
    }

    const regex = new RegExp(regexStr, 'gmi')
    return config.match(regex)
}

export function replaceConfig(config, type, name) {
    const match = findInConfig(config, type)
    if (!match || match.length === 0) {
        return
    }

    if (type === 'framework') {
        return buildNewConfigString(config, type, name)
    }

    const text = match.pop()
    return config.replace(text, buildNewConfigArray(text, type, name))
}

export function addServiceDeps(names, packages, update) {
    /**
     * automatically install latest Chromedriver if `wdio-chromedriver-service`
     * was selected for install
     */
    if (names.some(({ short }) => short === 'chromedriver')) {
        packages.push('chromedriver')
        if (update) {
            // eslint-disable-next-line no-console
            console.log(
                '\n=======',
                '\nPlease change path to / in your wdio.conf.js:',
                "\npath: '/'",
                '\n=======\n')
        }
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
export function convertPackageHashToObject(string, hash = '$--$') {
    const splitHash = string.split(hash)
    return {
        package: splitHash[0],
        short: splitHash[1]
    }
}

export async function renderConfigurationFile (answers) {
    const tplPath = path.join(__dirname, 'templates/wdio.conf.tpl.ejs')

    const renderedTpl = await renderFile(tplPath, { answers })

    fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl)
}

export const validateServiceAnswers = (answers) => {
    let result = true

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

export function getCapabilities(arg) {
    const optionalCapabilites = {
        platformVersion: arg.platformVersion || null,
        udid: arg.udid || null,
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
    }
    return { capabilities: { browserName: arg.option } }
}

/**
 * Check if file exists in current work directory
 * @param {string} filename to check existance for
 */
export function hasFile (filename) {
    return fs.existsSync(path.join(process.cwd(), filename))
}

/**
 * generate test files based on CLI answers
 */
export async function generateTestFiles (answers) {
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
        const renderedTpl = await renderFile(file, answers)
        let destPath = (
            file.endsWith('page.js.ejs')
                ? `${answers.destPageObjectRootPath}/${path.basename(file)}`
                : file.includes('step_definition')
                    ? `${answers.stepDefinitions}`
                    : `${answers.destSpecRootPath}/${path.basename(file)}`
        ).replace(/\.ejs$/, '').replace(/\.js$/, answers.isUsingTypeScript ? '.ts' : '.js')

        fs.ensureDirSync(path.dirname(destPath))
        fs.writeFileSync(destPath, renderedTpl)
    }
}

export async function getAnswers(yes) {
    return yes
        ? QUESTIONNAIRE.reduce((answers, question) => Object.assign(
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
                        ? question.choices[0].value
                            ? question.choices[0].value
                            : question.choices[0]
                        : {}
                }
        ), {})
        : await inquirer.prompt(QUESTIONNAIRE)
}

export function getPathForFileGeneration(answers){

    const destSpecRootPath = path.join(
        process.cwd(),
        path.dirname(answers.specs || '').replace(/\*\*$/, ''))

    const destStepRootPath = path.join(process.cwd(), path.dirname(answers.stepDefinitions || ''))

    const destPageObjectRootPath = answers.usePageObjects
        ?  path.join(
            process.cwd(),
            path.dirname(answers.pages || '').replace(/\*\*$/, ''))
        : ''
    let relativePath = (answers.generateTestFiles && answers.usePageObjects)
        ? !(answers.framework.short === 'cucumber')
            ? path.relative(destSpecRootPath, destPageObjectRootPath)
            : path.relative(destStepRootPath, destPageObjectRootPath)
        : ''

    /**
    * On Windows, path.relative can return backslashes that could be interpreted as espace sequences in strings
    */
    if (process.platform === 'win32') {
        relativePath = relativePath.replace(/\\/g, '/')
    }

    return {
        destSpecRootPath : destSpecRootPath,
        destStepRootPath : destStepRootPath,
        destPageObjectRootPath : destPageObjectRootPath,
        relativePath : relativePath
    }
}
