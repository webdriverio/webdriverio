module.exports = function isVisible (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {
        if(err && err['status'] === 7) {
            /* "NoSuchElement". No element matches the selector in the DOM,
             * which we can interpret as "not visible" */
            callback(null, false);

        } else if(err === null && result.value) {

            self.elementIdDisplayed(result.value.ELEMENT, function(err, result) {
                if(err && err['status'] == 10) {
                    /* "StaleElementReference". The element we matched was
                     * removed from the DOM between then and now; return false
                     * as it's technically no longer visible. */
                    return callback(null, false);
                }

                callback(err, result.value);
            });

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

