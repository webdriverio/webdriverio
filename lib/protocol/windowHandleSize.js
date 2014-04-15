module.exports = function windowHandleSize (opts, callback) {

    var data = {},
        requestOptions = {
            method: 'GET',
            path: '/session/:sessionId/window/' + (opts.window_handle || 'current') + '/size'
        };

    if (typeof opts === 'function') {
        callback = opts;
        opst = {};
    }

    if (opts.width && opts.height) {
        requestOptions.method = 'POST';
        data = {
            width: opts.width,
            height: opts.height
        }
    }

    this.requestHandler.create(requestOptions,data,callback);
};
