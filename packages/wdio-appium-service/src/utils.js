import { basename, join, resolve } from 'path'

import logger from '@wdio/logger'
import { paramCase } from 'param-case'

const log = logger('@wdio/appium-service')

const FILE_EXTENSION_REGEX = /\.[0-9a-z]+$/i

/**
 * Resolves the given path into a absolute path and appends the default filename as fallback when the provided path is a directory.
 * @param  {String} filePath         relative file or directory path
 * @param  {String} defaultFilename default file name when filePath is a directory
 * @return {String}                 absolute file path
 */
export function getFilePath (filePath, defaultFilename) {
    let absolutePath = resolve(filePath)

    // test if we already have a file (e.g. selenium.txt, .log, log.txt, etc.)
    // NOTE: path.extname doesn't work to detect a file, cause dotfiles are reported by node to have no extension
    if (!FILE_EXTENSION_REGEX.test(basename(absolutePath))) {
        absolutePath = join(absolutePath, defaultFilename)
    }

    return absolutePath
}

export function getAppiumCommand (moduleName = 'appium') {
    try {
        return require.resolve(moduleName)
    } catch (err) {
        log.error(
            'appium is not installed locally.\n' +
            'If you use globally installed appium please add\n' +
            "appium: { command: 'appium' }\n" +
            'to your wdio.conf.js!'
        )
        throw err
    }
}

export function cliArgsFromKeyValue (keyValueArgs) {
    if (Array.isArray(keyValueArgs)) {
        return keyValueArgs
    }

    const cliArgs = []
    for (let key in keyValueArgs) {
        const value = keyValueArgs[key]
        // If the value is false or null the argument is discarded
        if ((typeof value === 'boolean' && !value) || value === null) {
            continue
        }

        cliArgs.push(`--${paramCase(key)}`)

        // Only non-boolean and non-null values are added as option values
        if (typeof value !== 'boolean' && value !== null) {
            cliArgs.push(sanitizeCliOptionValue(value))
        }
    }
    return cliArgs
}

export function sanitizeCliOptionValue (value) {
    const valueString = String(value)
    // Encapsulate the value string in single quotes if it contains a white space
    return /\s/.test(valueString) ? `'${valueString}'` : valueString
}
