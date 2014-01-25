module.exports = function windowHandleMaximize (window_handle, callback) {
    if (typeof window_handle === 'function') {
        callback = window_handle;
        window_handle = 'current';
    }

    var requestOptions = {
        path:"/session/:sessionId/window/" +  (window_handle || 'current') + "/maximize",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,callback);

};
