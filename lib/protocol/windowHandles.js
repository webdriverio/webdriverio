module.exports = function windowHandles (callback) {

    var requestOptions = {
        path:"/session/:sessionId/window_handles",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};