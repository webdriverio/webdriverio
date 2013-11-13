module.exports = function waitFor (cssSelector, ms, callback) {

    var self = this;
    var first = true;
    var startTimer = 0;

    this.implicitWait(ms)
        .element('css selector', cssSelector, function(err, result) {

            if(err === null && typeof callback === 'function') {

                callback(err, result);

            } else {

                if (typeof callback === 'function') {

                    callback(err, result);

                }

            }

        });

};

