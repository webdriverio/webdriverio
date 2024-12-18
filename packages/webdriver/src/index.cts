/* eslint-disable @typescript-eslint/no-explicit-any */
const esmModule = import('./node.js')

function command (method: string, encodeUri: string, commandInfo: any, doubleEncodeVariables = false) {
    return async function protocolCommand(this: unknown, ...args: unknown[]) {
        const commandESM = await esmModule
        return commandESM.command(method, encodeUri, commandInfo, doubleEncodeVariables).apply(this, args)
    }
}

class WebDriver {
    static async newSession(
        options: any,
        modifier?: () => any,
        userPrototype = {},
        customCommandWrapper?: () => any
    ): Promise<any> {
        const WebDriver = (await esmModule).WebDriver
        return WebDriver.newSession(options, modifier, userPrototype, customCommandWrapper)
    }

    /**
     * allows user to attach to existing sessions
     */
    static async attachToSession (
        options?: any,
        modifier?: () => any,
        userPrototype = {},
        commandWrapper?: () => any
    ): Promise<any> {
        const WebDriver = (await esmModule).WebDriver
        return WebDriver.attachToSession(options, modifier, userPrototype, commandWrapper)
    }

    /**
     * Changes The instance session id and browser capabilities for the new session
     * directly into the passed in browser object!!
     *
     * @param   {object} instance  the object we get from a new browser session.
     * @returns {string}           the new session id of the browser
     */
    static async reloadSession (instance: any) {
        const WebDriver = (await esmModule).WebDriver
        return WebDriver.reloadSession(instance)
    }

    static get WebDriver () {
        return WebDriver
    }

    static get command () {
        return command
    }
}

module.exports = WebDriver
exports.command = command
