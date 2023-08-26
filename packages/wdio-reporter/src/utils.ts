import type { Capabilities } from '@wdio/types'

import supportsColor from './supportsColor.js'
import { COLORS } from './constants.js'

/**
 * replaces whitespaces with underscore and removes dots
 * @param  {string} str  variable to sanitize
 * @return {String}      sanitized variable
 */
export function sanitizeString (str?: string) {
    if (!str) {
        return ''
    }

    return String(str)
        .replace(/^.*\/([^/]+)\/?$/, '$1')
        .replace(/\./g, '_')
        .replace(/\s/g, '')
        .toLowerCase()
}

/**
 * formats capability object into sanitized string for e.g.filenames
 * @param {object} caps  Selenium capabilities
 */
export function sanitizeCaps (caps?: Capabilities.DesiredCapabilities) {
    if (!caps) {
        return ''
    }

    let result

    /**
     * mobile caps
     */
    result = caps.deviceName
        ? [
            sanitizeString(caps.platformName),
            sanitizeString(caps.deviceName || caps['appium:deviceName']),
            sanitizeString(caps['appium:platformVersion']),
            sanitizeString(caps['appium:app'])
        ]
        : [
            sanitizeString(caps.browserName),
            sanitizeString(caps.version || caps.browserVersion),
            sanitizeString(caps.platform || caps.platformName),
            sanitizeString(caps['appium:app'])
        ]

    result = result.filter(n => n !== undefined && n !== '')
    return result.join('.')
}

/**
 * Takes a event emitted by a framework and extracts
 * an array of errors representing test or hook failures.
 * This exists to maintain compatibility between frameworks
 * with have a soft assertion model (Jasmine) and those that
 * have a hard assertion model (Mocha)
 * @param {*} e  An event emitted by a framework adapter
 */
export function getErrorsFromEvent(e: { errors?: any; error?: any }) {
    if (e.errors) {
        return e.errors
    }
    if (e.error) {
        return [e.error]
    }
    return []
}

/**
 * Pads the given `str` to `len`.
 *
 * @private
 * @param {string} str
 * @param {number} len
 * @return {string}
 */
export function pad (str: string, len: number) {
    return Array(len - str.length + 1).join(' ') + str
}

export function color (type: keyof typeof COLORS, content: string) {
    if (!supportsColor.stdout) {
        return String(content)
    }
    return `\u001b[${COLORS[type]}m${content}\u001b[0m`
}

/**
 * Colors lines for `str`, using the color `name`.
 *
 * @private
 * @param {string} name
 * @param {string} str
 * @return {string}
 */
export function colorLines (name: keyof typeof COLORS, str: string) {
    return str
        .split('\n')
        .map((str) => color(name, str))
        .join('\n')
}
