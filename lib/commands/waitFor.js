exports.command = function (cssSelector, waitForMilliseconds, callback) {

    var self = this;
    var startTimer = new Date().getTime();

    function checkElement() {
        self.element("css selector", cssSelector, function(err, result) {
            var now = new Date().getTime();

            if(err === null) {

                callback(err, result);

            } else {

                if (now - startTimer < waitForMilliseconds) {
                    setTimeout(checkElement, 500);
                } else if (typeof callback === "function") {
                    callback(err, result);
                }

            }

        });
    }

    checkElement();

};

