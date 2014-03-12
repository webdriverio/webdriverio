module.exports = function waitFor (cssSelector, ms, callback) {
    if (typeof ms === 'function') {
        callback = ms;
        ms = 500;
    }

    this
        .implicitWait(ms)
        .element(cssSelector, function(err, result) {
            this.implicitWait(0, function() {
                callback(err, result);
            });
        });

};

