module.exports = function isVisible (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdDisplayed(result.value.ELEMENT, function(err, result) {
                callback(err, result.value);
            });

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

