exports.command = function (doWhat, callback) {

    var commandOptionsGet = {
        path:"/session/:sessionId",
        method:"GET"
    };

    var commandOptionsDelete = {
        path:"/session/:sessionId",
        method:"DELETE"
    };

    if (typeof doWhat === "function") {
        callback = doWhat;
        doWhat = "get";
    }

    // set
    if (doWhat.toLowerCase() === "get") {

        this.requestHandler.create(
            commandOptionsGet,
            {},
            callback
        );

    } else if (doWhat.toLowerCase() === "delete") {

        this.requestHandler.create(
            commandOptionsDelete,
            {},
            function () {
                // all this is done for the sake of having one more extrerow in the console when done
                if (typeof callback === "function") {
                    callback();
                }
            }
        );

    } else {
        throw "The session command need either a 'delete' or 'get' attribute to know what to do. example: client.session('get', callback) to get the capabilities of the session.";
    }

};
