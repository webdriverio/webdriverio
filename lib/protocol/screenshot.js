module.exports = function screenshot (callback) {

    var requestOptions = {
        path:"/session/:sessionId/screenshot",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};