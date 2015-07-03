/**
 *
 * Protocol bindings for all session operations. In case you are looking for
 * `[POST] session` to initialise a session on the server, take a look at `/lib/protocol/init`.
 *
 * <example>
    :session.js
    // retrieve the capabilities of the specified session
    client.session(function(err,res) { ... });

    // delete the session (equivalent to `end` action command)
    client.session('delete');
 * </example>
 *
 * @param {String=} doWhat  session operation (`GET`*|`delete`) *default
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId
 * @type protocol
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function session(doWhat, sessionId) {

    /*!
     * parameter check
     */
    if (typeof sessionId !== 'string') {

        /*!
         * if session was already closed return `undefined`
         * ToDo or maybe throw an error
         */
        if(!this.requestHandler.sessionID) {
            return null;
        }

        sessionId = this.requestHandler.sessionID;
    }

    if (typeof doWhat !== 'string') {
        doWhat = 'GET';
    }
    doWhat = doWhat.toUpperCase();

    /*!
     * get session
     */
    if (doWhat === 'GET') {

        return this.requestHandler.create({
            path: '/session/' + sessionId,
            method: 'GET',
            requiresSession: false
        });

    }

    /*!
     * delete session
     */
    if (doWhat.toUpperCase() === 'DELETE') {

        this.emit('end', {
            sessionId: this.requestHandler.sessionID
        });


        return this.requestHandler.create({
            path: '/session/' + sessionId,
            method: 'DELETE',
            requiresSession: false
        }).finally(function(res) {
            /*!
             * delete sessionID in RequestHandler
             */
            this.requestHandler.sessionID = null;
            return res;
        }.bind(this));
    }

    throw new ErrorHandler.ProtocolError('The session command need either a \'delete\' or \'get\' attribute to know what to do. example: client.session(\'get\').then(callback) to get the capabilities of the session.');
};
