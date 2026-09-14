import { pathToFileURL } from 'node:url'

import type { Services } from '@wdio/types'

import { safeImport, isAbsolute, REG_EXP_WINDOWS_ABS_PATH } from './utils.js'

const FILE_PROTOCOL = 'file://'

/**
 * initialize WebdriverIO compliant plugins like reporter or services in the following way:
 * 1. if package name is scoped (starts with "@"), require scoped package name
 * 2. otherwise try to require "@wdio/<name>-<type>"
 * 3. otherwise try to require "wdio-<name>-<type>"
 */
export default async function initializePlugin (name: string, type?: string): Promise<Services.ServicePlugin | Services.RunnerPlugin> {
    /**
     * directly import packages that are scoped or start with an absolute path
     */
    if (name[0] === '@' || isAbsolute(name)) {
        const fileUrl = name[0] === '@' ? name : ensureFileURL(name)
        const service = await safeImport(fileUrl)

        if (service) {
            return service
        }
    }

    if (typeof type !== 'string') {
        throw new Error('No plugin type provided')
    }

    /**
     * check for scoped version of plugin first (e.g. @wdio/sauce-service)
     */
    const scopedPlugin = await safeImport(`@wdio/${name.toLowerCase()}-${type}`)
    if (scopedPlugin) {
        return scopedPlugin
    }

    /**
     * check for old type of
     */
    const plugin = await safeImport(`wdio-${name.toLowerCase()}-${type}`)
    if (plugin) {
        return plugin
    }

    throw new Error(
        `Couldn't find plugin "${name}" ${type}, neither as wdio scoped package `+
        `"@wdio/${name.toLowerCase()}-${type}" nor as community package ` +
        `"wdio-${name.toLowerCase()}-${type}". Please make sure you have it installed!`
    )
}

function ensureFileURL(path: string) {
    if (path.startsWith(FILE_PROTOCOL)) {
        return path
    }

    /**
     * `pathToFileURL` follows the host operating system's path rules. Handle
     * Windows drive paths explicitly so they keep working on POSIX hosts too.
     */
    if (REG_EXP_WINDOWS_ABS_PATH.test(path)) {
        const [drive, ...segments] = path.replace(/\\/g, '/').split('/')
        return `${FILE_PROTOCOL}/${drive}/${segments.map(encodeURIComponent).join('/')}`
    }

    return pathToFileURL(path).href
}
