import fs from 'fs'
import ejs from 'ejs'
import path from 'path'
import logger from '@wdio/logger'
import { execSync } from 'child_process'
import { promisify } from 'util'

import { CONFIG_HELPER_SUCCESS_MESSAGE, EXCLUSIVE_SERVICES } from './constants'
import inquirer from 'inquirer'
import { runConfig } from './commands/config'
import { ANDROID_CONFIG, IOS_CONFIG } from './capabilities'

const log = logger('@wdio/cli:utils')

/**
 * run service launch sequences
 */
export async function runServiceHook (launcher, hookName, ...args) {
    try {
        return await Promise.all(launcher.map((service) => {
            if (typeof service[hookName] === 'function') {
                return service[hookName](...args)
            }
        }))
    } catch (e) {
        log.error(`A service failed in the '${hookName}' hook\n${e.stack}\n\nContinue...`)
    }
}

/**
 * Run onPrepareHook in Launcher
 * @param {Array|Function} onPrepareHook - can be array of functions or single function
 * @param {Object} config
 * @param {Object} capabilities
 */
export async function runOnPrepareHook(onPrepareHook, config, capabilities) {
    const catchFn = (e) => log.error(`Error in onPrepareHook: ${e.stack}`)

    if (typeof onPrepareHook === 'function') {
        onPrepareHook = [onPrepareHook]
    }

    return Promise.all(onPrepareHook.map((hook) => {
        try {
            return hook(config, capabilities)
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
    const renderFile = promisify(ejs.renderFile)
    const tplPath = path.join(__dirname, 'templates/wdio.conf.tpl.ejs')

    const renderedTpl = await renderFile(tplPath, { answers })

    fs.writeFileSync(path.join(process.cwd(), 'wdio.conf.js'), renderedTpl)
    console.log(CONFIG_HELPER_SUCCESS_MESSAGE)
}

export async function missingConfigurationPrompt(command, message, useYarn = false) {
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

    return await runConfig(useYarn, false, true)
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
    const capabilities = getPlatformCaps(arg.option)
    let finalCapabilities = capabilities
    if (capabilities.platformName === IOS_CONFIG.platformName) {
        finalCapabilities = Object.assign( {},
            capabilities,
            {
                deviceName: arg.device || IOS_CONFIG.deviceName,
                platformVersion: arg.ver || null,
                udid: arg.udid || null
            }
        )
    }
    return finalCapabilities
}

function getPlatformCaps(option) {
    switch (true) {
    case /.*\.(apk|app|ipa)$/.test(option):
        return { app: option, ...(option.endsWith('apk') ? ANDROID_CONFIG : IOS_CONFIG) }
    case /android/.test(option):
        return { browserName: 'Chrome', ...ANDROID_CONFIG }
    case /ios/.test(option):
        return { browserName: 'Safari', ...IOS_CONFIG }
    default:
        return { browserName: option }
    }
}
