module.exports = function getAttribute (cssSelector, attributeName, callback) {

    var self = this;

    this.element(cssSelector, function(err,result) {

        if(err === null && result.value) {

            self.elementIdAttribute(result.value.ELEMENT, attributeName, function(err,result) {
                callback(err,result.value);
            });

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

