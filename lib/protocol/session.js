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
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof sessionId !== 'string') {

        /*!
         * if session was already closed return `undefined`
         */
        if(!this.requestHandler.sessionID) {
            return callback.call(this);
        }

        sessionId = this.requestHandler.sessionID;
    }

    if (typeof doWhat !== 'string') {
        doWhat = 'GET';
    }
    doWhat = doWhat.toUpperCase();

    /*!
     * set
     */
    if (doWhat === 'GET') {

        this.requestHandler.create({
            path: '/session/' + sessionId,
            method: 'GET',
            requiresSession: false
        }, callback);

    } else if (doWhat.toUpperCase() === 'DELETE') {

        this.eventHandler.emit('end', {
            sessionId: this.requestHandler.sessionID
        });

        this.requestHandler.create({
            path: '/session/' + sessionId,
            method: 'DELETE',
            requiresSession: false
        }, callback);

        /*!
         * delete sessionID in RequestHandler
         */
        this.requestHandler.sessionID = null;

    } else {
        return callback(new ErrorHandler.ProtocolError('The session command need either a \'delete\' or \'get\' attribute to know what to do. example: client.session(\'get\', callback) to get the capabilities of the session.'));
    }

};
