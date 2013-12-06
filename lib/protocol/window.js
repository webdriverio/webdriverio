module.exports = function window (window_handle, callback) {

    var data,
        requestOptions = {
            path: '/session/:sessionId/window'
        };

    if(typeof window_handle === 'string') {
        requestOptions.method = 'POST';
        data = {'name':window_handle};
    } else {
        requestOptions.method = 'DELETE';
        data = {};
        callback = window_handle;
    }

    this.requestHandler.create(requestOptions,data,callback);

};