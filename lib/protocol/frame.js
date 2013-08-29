exports.command = function (frameId, callback) {

    var commandOptions = {
        path:"/session/:sessionId/frame",
        method:"POST"
    };

    if (arguments.length === 1) {
        callback = frameId;
        frameId  = null;
    }

    this.requestHandler.create(commandOptions,{"id":frameId},callback);

};
