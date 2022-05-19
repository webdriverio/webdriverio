import path from 'node:path'
import { Capabilities } from '@wdio/types'

const FILE_EXTENSION_REGEX = /\.[0-9a-z]+$/i
const SUPPORTED_CAPABILITIES = [
    'chrome',
    'googlechrome',
    'firefox',
    'edge',
    'msedge',
    'microsoftedge',
    'microsoft edge',
    'safari',
    'webkit'
]

/**
 * Resolves the given path into a absolute path and appends the default filename as fallback when the provided path is a directory.
 * @param  {String} filePath         relative file or directory path
 * @param  {String} defaultFilename default file name when filePath is a directory
 * @return {String}                 absolute file path
 */
export function getFilePath (filePath: string, defaultFilename: string): string {
    let absolutePath = path.resolve(filePath)

    // test if we already have a file (e.g. selenium.txt, .log, log.txt, etc.)
    // NOTE: path.extname doesn't work to detect a file, cause dotfiles are reported by node to have no extension
    if (!FILE_EXTENSION_REGEX.test(path.basename(absolutePath))) {
        absolutePath = path.join(absolutePath, defaultFilename)
    }

    return absolutePath
}

/**
 * find whether a browser session could be supported by the selenium-standalone service
 * @param   {Capabilities.Capabilities} capabilities capabilities used for the session
 * @returns {Boolean}                                true, if capabilities suggest a supported platform
 */
export function hasCapsWithSupportedBrowser (capabilities: Capabilities.Capabilities) {
    if (!capabilities.browserName) {
        return false
    }
    return SUPPORTED_CAPABILITIES.includes(
        capabilities.browserName?.toLowerCase()
    )
}
