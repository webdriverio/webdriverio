/**
 *
 * Protocol bindings for all session operations. In case you are looking for
 * `[POST] session` to initialise a session on the server, take a look at `/lib/protocol/init`.
 *
 * <example>
    :session.js
    it('should get/delete current session using the protocol command', function () {
        // retrieve the resolved capabilities of the specified session
        var caps = browser.session();
        console.log(caps); // outputs: { browserName: "...", ... }

        // you can also just call (see http://webdriver.io/guide/testrunner/browserobject.html)
        console.log(browser.desiredCapabilities);

        // delete the session (equivalent to `end` action command)
        // Note: the wdio testrunner doesn't allow to call this command manually. It will close the session
        // when the test has ended.
        browser.session('delete'); // throws an error
    });
 * </example>
 *
 * @param {String=} doWhat     session operation (`get` (default)|`delete`)
 * @param {String}  sessionId  session id to operate on
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-delete-session
 * @type protocol
 *
 */

import { ProtocolError, CommandError } from '../utils/ErrorHandler'

let session = function (doWhat = 'GET', sessionId) {
    /*!
     * parameter check
     */
    if (typeof sessionId !== 'string') {
        /*!
         * if session was already closed return `undefined`
         * ToDo or maybe throw an error
         */
        if (!this.requestHandler.sessionID) {
            return null
        }

        sessionId = this.requestHandler.sessionID
    }

    doWhat = doWhat.toUpperCase()

    /*!
     * get session
     */
    if (doWhat === 'GET') {
        return this.requestHandler.create({
            path: `/session/${sessionId}`,
            method: 'GET',
            requiresSession: false
        })
    }

    const lastCommand = this.commandList.slice(-3, -2)
    const isInternalCall = lastCommand.length && lastCommand[0].name === 'reload'

    /*!
     * delete session
     */
    if (doWhat === 'DELETE') {
        /**
         * make sure we don't run this command within wdio test run
         */
        if (this.options.isWDIO && !isInternalCall) {
            throw new CommandError('Don\'t end the session manually. This will be done automatically.')
        }

        this.emit('end', {
            sessionId: this.requestHandler.sessionID
        })

        return this.requestHandler.create({
            path: '/session/' + sessionId,
            method: 'DELETE',
            requiresSession: false
        }).then((res) => {
            /*!
             * delete sessionID in RequestHandler
             */
            this.requestHandler.sessionID = null
            return res
        })
    }

    throw new ProtocolError('The session command need either a \'delete\' or \'get\'attribute to know what to do. example: client.session(\'get\').then(callback) to get the capabilities of the session.')
}

export default session
