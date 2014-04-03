module.exports = function session (doWhat, sessionId, callback) {

    if (typeof sessionId == 'function') {
        callback = sessionId;
        delete sessionId;
    }

    var commandOptionsGet = {
        path:'/session/:sessionId',
        method:'GET'
    };

    var commandOptionsDelete = {
        path:'/session/:sessionId',
        method:'DELETE'
    };

    if (typeof sessionId == 'string') {
        commandOptionsDelete.path = commandOptionsDelete.path.replace(':sessionId', sessionId);
        commandOptionsDelete.requiresSession = false;
        commandOptionsGet.path = commandOptionsGet.path.replace(':sessionId', sessionId);
        commandOptionsGet.requiresSession = false;
    }

    if (typeof doWhat === 'function') {
        callback = doWhat;
        doWhat = 'get';
    }

    // set
    if (doWhat.toLowerCase() === 'get') {

        this.requestHandler.create(
            commandOptionsGet,
            {},
            callback
        );

    } else if (doWhat.toLowerCase() === 'delete') {

        this.eventHandler.emit('end', {
            sessionId: this.requestHandler.sessionID
        })

        this.requestHandler.create(
            commandOptionsDelete,
            {},
            function () {
                // all this is done for the sake of having one more extrerow in the console when done
                if (typeof callback === 'function') {
                    callback();
                }
            }
        );

        /**
         * close socket connection if experimental mode is enabled
         */
        if(this.options.experimental && this.desiredCapabilities.browserName === 'chrome') {
            this.eventHandler.socket.disconnect('unauthorized');
            this.eventHandler.app.close();
        }

    } else {
        if (typeof callback === 'function') {
            callback(new Error('The session command need either a \'delete\' or \'get\' attribute to know what to do. example: client.session(\'get\', callback) to get the capabilities of the session.'));
        }
    }

};
