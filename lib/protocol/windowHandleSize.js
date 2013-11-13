module.exports = function windowHandleSize (opts, callback) {
    var data = {};
    var method = "GET";
    var requestOptions = {
        path:"/session/:sessionId/window/" + (opts.window_handle || "current") + "/size"
    };

    if (typeof opts === "function") {
        callback = opts;
    }

    if (opts.width && opts.height) {
        method = "POST";
        data = {
            width: opts.width,
            height: opts.height
        }
    }

    requestOptions.method = method;

    this.requestHandler.create(requestOptions,data,callback);
};
