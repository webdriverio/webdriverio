exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/buttondown",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{},callback);

};