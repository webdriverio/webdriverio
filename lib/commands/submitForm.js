module.exports = function submitForm (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.submit(result.value.ELEMENT, callback);

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

