exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/screenshot",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};