module.exports = function getLocation (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdLocation(result.value.ELEMENT, function(err, result) {
                if (err === null && typeof callback === "function" && result !== undefined) {
                    callback(err, {
                        x: parseInt(result.value.x,10),
                        y: parseInt(result.value.y,10)
                    });
                } else {
                    callback(err, result);
                }
            });

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

