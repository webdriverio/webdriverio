module.exports = function addValue (cssSelector, value, callback) {

    var self = this,
        throwError = !callback.hasCustomCallback;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdValue(result.value.ELEMENT, value, function(err) {

                if(err && throwError) throw err;

                callback.apply(self, arguments);

            });

        } else {

            if(throwError) throw err;

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};