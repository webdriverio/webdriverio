import safeRequire from './safeRequire'

/**
 * initialise WebdriverIO compliant plugins like reporter or services in the following way:
 * 1. if package name is scoped (starts with "@"), require scoped package name
 * 2. otherwise try to require "@wdio/<name>-<type>"
 * 3. otherwise try to require "wdio-<name>-<type>"
 */
export default function initialisePlugin (name, type, target = 'default') {
    /**
     * directly import packages that are scoped
     */
    if (name[0] === '@') {
        const service = safeRequire(name)
        return service[target]
    }

    /**
     * check for scoped version of plugin first (e.g. @wdio/sauce-service)
     */
    const scopedPlugin = safeRequire(`@wdio/${name.toLowerCase()}-${type}`)
    if (scopedPlugin) {
        return scopedPlugin[target]
    }

    /**
     * check for old type of
     */
    const plugin = safeRequire(`wdio-${name.toLowerCase()}-${type}`)
    if (plugin) {
        return plugin[target]
    }

    throw new Error(
        `Couldn't find plugin "${name}" ${type}, neither as wdio scoped package `+
        `"@wdio/${name.toLowerCase()}-${type}" nor as community package ` +
        `"wdio-${name.toLowerCase()}-${type}". Please make sure you have it installed!`
    )
}
