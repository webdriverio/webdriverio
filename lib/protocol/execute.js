exports.command = function (script, callback) {

    var requestOptions = {
        path:"/session/:sessionId/execute",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{"script":script, args:[]},callback);

};

