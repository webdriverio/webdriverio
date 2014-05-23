module.exports = function getValue (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdAttribute(result.value.ELEMENT, 'value', function(err, result) {
                if (typeof callback === 'function') {
                    callback(err, result.value);
                }
            });

        } else {

            if(typeof callback === 'function') {
                /* istanbul ignore next */
                callback(err, result);
            }

        }
    });
};