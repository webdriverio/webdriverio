module.exports = function windowHandlePosition (opts, callback) {

    var requestOptions = {
        path:"/session/:sessionId/window/" + (opts.name || "current") + "/position",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{x:opts.x,y:opts.y},callback);

};
