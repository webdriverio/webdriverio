module.exports = function addValue (cssSelector, value, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdValue(result.value.ELEMENT, value, callback);

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};