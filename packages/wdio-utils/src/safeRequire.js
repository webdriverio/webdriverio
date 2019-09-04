/**
 * Allows to safely require a package, it only throws if the package was found
 * but failed to load due to syntax errors
 * @param  {string} name  of package
 * @return {object}       package content
 */
export default function safeRequire (name) {
    try {
        return require(name)
    } catch (e) {
        if (!e.message.match(`Cannot find module '${name}'`)) {
            throw new Error(`Couldn't initialise "${name}".\n${e.stack}`)
        }

        return null
    }
}