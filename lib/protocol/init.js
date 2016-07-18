/**
 *
 * Create a new session. The server should attempt to create a session that most
 * closely matches the desired and required capabilities. Required capabilities
 * have higher priority than desired capabilities and must be set for the session
 * to be created.
 *
 * @param {Object} [capabilities] An object describing the session's [desired capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-new-session
 * @type protocol
 *
 */

import { CommandError, ProtocolError } from '../utils/ErrorHandler'
import pkg from '../../package.json'
import merge from 'deepmerge'

let init = function (desiredCapabilities = {}) {
    const lastCommand = this.commandList.slice(-4, -3)
    const isInternalCall = lastCommand.length && lastCommand[0].name === 'reload'

    /**
     * make sure we don't run this command within wdio test run
     */
    if (this.options.isWDIO && !isInternalCall) {
        throw new CommandError('Don\'t call the \'init\' command when using the wdio test runner. ' +
                               'Your session will get initialised and closed automatically.')
    }

    /*!
     * check if session was already established
     */
    if (this.requestHandler.sessionID) {
        throw new ProtocolError('Cannot init a new session, please end your current session first')
    }

    this.desiredCapabilities = merge(this.desiredCapabilities, desiredCapabilities)
    if (desiredCapabilities.sessionId) {
        this.sessionId = desiredCapabilities.sessionId
    }

    /**
     * report library identity to server
     * @see https://groups.google.com/forum/#!topic/selenium-developers/Zj1ikTz632o
     */
    this.desiredCapabilities = merge(this.desiredCapabilities, {
        requestOrigins: {
            url: pkg.homepage,
            version: pkg.version,
            name: pkg.name
        }
    })

    return this.requestHandler.create({
        path: '/session',
        method: 'POST'
    }, {
        desiredCapabilities: this.desiredCapabilities
    })
}

export default init
