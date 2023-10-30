class Devtools {
    static async newSession (
        options: any,
        modifier?: (...args: any[]) => any,
        userPrototype = {},
        customCommandWrapper?: (...args: any[]) => any
    ): Promise<any> {
        const WebDriver = (await import('../index.js')).default
        return WebDriver.newSession(options, modifier, userPrototype, customCommandWrapper)
    }

    /**
     * allows user to attach to existing sessions
     */
    static async attachToSession (
        options: any,
        modifier?: (...args: any[]) => any,
        userPrototype = {},
        commandWrapper?: (...args: any[]) => any
    ): Promise<any> {
        const Devtools = (await import('../index.js')).default
        return Devtools.attachToSession(options, modifier, userPrototype, commandWrapper)
    }

    /**
     * Changes The instance session id and browser capabilities for the new session
     * directly into the passed in browser object
     *
     * @param   {Object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static async reloadSession (instance: any) {
        const Devtools = (await import('../index.js')).default
        return Devtools.reloadSession(instance)
    }

    static get Devtools () {
        return Devtools
    }
}

module.exports = Devtools
