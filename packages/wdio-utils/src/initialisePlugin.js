import path from 'path'
import { safeRequire } from './utils'

/**
 * initialise WebdriverIO compliant plugins like reporter or services in the following way:
 * 1. if package name is scoped (starts with "@"), require scoped package name
 * 2. otherwise try to require "@wdio/<name>-<type>"
 * 3. otherwise try to require "wdio-<name>-<type>"
 */
export default function initialisePlugin (name, type) {
    /**
     * directly import packages that are scoped or start with an absolute path
     */
    if (name[0] === '@' || path.isAbsolute(name)) {
        const service = safeRequire(name)
        return service
    }

    /**
     * check for scoped version of plugin first (e.g. @wdio/sauce-service)
     */
    const scopedPlugin = safeRequire(`@wdio/${name.toLowerCase()}-${type}`)
    if (scopedPlugin) {
        return scopedPlugin
    }

    /**
     * check for old type of
     */
    const plugin = safeRequire(`wdio-${name.toLowerCase()}-${type}`)
    if (plugin) {
        return plugin
    }

    throw new Error(
        `Couldn't find plugin "${name}" ${type}, neither as wdio scoped package `+
        `"@wdio/${name.toLowerCase()}-${type}" nor as community package ` +
        `"wdio-${name.toLowerCase()}-${type}". Please make sure you have it installed!`
    )
}
