module.exports = function buttonDown (callback) {

    var requestOptions = {
        path:"/session/:sessionId/buttondown",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{},callback);

};