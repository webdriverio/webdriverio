module.exports = function orientation (orientation, callback) {

    var commandOptionsPost = {
        path:"/session/:sessionId/orientation",
        method:"POST"
    };

    var commandOptionsGet = {
        path:"/session/:sessionId/orientation",
        method:"GET"
    };

    // set or get
    if (typeof orientation === "string") {

        this.requestHandler.create(
            commandOptionsPost,
            {'orientation': orientation},
            callback
        );

    } else {

        this.requestHandler.create(
            commandOptionsGet,
            {},
            orientation
        );

    }
};

