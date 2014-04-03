module.exports = function getCssProperty (cssSelector, cssProperty, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdCssProperty(result.value.ELEMENT, cssProperty, function(err, result) {
                callback(err, result.value.replace(/\s+/g, '').toLowerCase());
            });

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

