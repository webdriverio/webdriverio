module.exports = function getElementCssProperty (using, value, cssProperty, callback) {

    var self = this;

    this.element(using, value, function(err, result) {

        if(err === null && result.value) {

            self.elementIdCssProperty(result.value.ELEMENT, cssProperty, function(err, result) {
                callback(err, result.value.replace(/\s+/g, '').toLowerCase());
            });

        } else {

            callback(err, result);

        }
    });
};

