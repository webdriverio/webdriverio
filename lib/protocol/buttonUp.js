module.exports = function buttonUp (callback) {

    var requestOptions = {
        path:"/session/:sessionId/buttonup",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{},callback);

};