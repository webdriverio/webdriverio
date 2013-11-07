exports.command = function (waitForMilliseconds, callback) {

    setTimeout(function() {
        callback();
    }, waitForMilliseconds);

};

