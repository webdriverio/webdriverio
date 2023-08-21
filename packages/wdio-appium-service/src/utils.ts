import { basename, join, resolve } from 'node:path'
import { paramCase } from 'param-case'

import type { ArgValue, KeyValueArgs, AppiumServerArguments } from './types.js'

const FILE_EXTENSION_REGEX = /\.[0-9a-z]+$/i

/**
 * Resolves the given path into a absolute path and appends the default filename as fallback when the provided path is a directory.
 * @param  {string} filePath         relative file or directory path
 * @param  {string} defaultFilename default file name when filePath is a directory
 * @return {String}                 absolute file path
 */
export function getFilePath (filePath: string, defaultFilename: string): string {
    let absolutePath = resolve(filePath)

    // test if we already have a file (e.g. selenium.txt, .log, log.txt, etc.)
    // NOTE: path.extname doesn't work to detect a file, cause dotfiles are reported by node to have no extension
    if (!FILE_EXTENSION_REGEX.test(basename(absolutePath))) {
        absolutePath = join(absolutePath, defaultFilename)
    }

    return absolutePath
}

export function defragCliArgs(args?: AppiumServerArguments | Array<string>) {
    if (!Array.isArray(args)) {
        return args
    }

    return args.reduce((acc: KeyValueArgs, currentItem, index, array) => {
        const nextItem = array[index + 1]

        if (
            !currentItem?.toString().startsWith('--') &&
            !currentItem?.toString().startsWith('-')
        ) {
            return acc
        }

        const [key, value] = (currentItem ?? '').toString().split('=')
        if (value !== undefined) {
            acc[key.replace(/^--/g, '')] = value
        } else if (
            nextItem &&
            (nextItem?.toString().startsWith('--') ||
                nextItem?.toString().startsWith('-'))
        ) {
            acc[key.replace(/^--/g, '')] = true
        } else {
            acc[key.replace(/^--/g, '')] = nextItem
        }
        return acc
    }, {})
}

export function formatCliArgs(args: KeyValueArgs | ArgValue[]): string[] {
    if (Array.isArray(args)) {
        return args.map(arg => sanitizeCliOptionValue(arg))
    }

    const cliArgs = []
    for (const key in args) {
        const value: ArgValue | ArgValue[] = args[key]
        // If the value is false or null the argument is discarded
        if ((typeof value === 'boolean' && !value) || value === null) {
            continue
        }

        cliArgs.push(key.startsWith('-') ? key : `--${paramCase(key)}`)
        // Only non-boolean and non-null values are added as option values
        if (typeof value !== 'boolean') {
            cliArgs.push(sanitizeCliOptionValue(value))
        }
    }
    return cliArgs
}

export function sanitizeCliOptionValue (value: ArgValue) {
    const valueString = String(value)
    // Encapsulate the value string in single quotes if it contains a white space
    return /\s/.test(valueString) ? `'${valueString}'` : valueString
}

export function isWindows(): boolean {
    return process.platform === 'win32'
}
