exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/source",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};
