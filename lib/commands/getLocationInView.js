module.exports = function getLocationInView (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdLocationInView(result.value.ELEMENT, function(err, result) {
                callback(err, {
                    x: parseInt(result.value.x,10),
                    y: parseInt(result.value.y,10)
                });
            });

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

