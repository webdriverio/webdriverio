exports.command = function (opts, callback) {

    var requestOptions = {
        path:"/session/:sessionId/window/" + (opts.name || "current") + "/size",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{width:opts.width,height:opts.height},callback);

};
