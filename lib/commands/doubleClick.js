module.exports = function doubleClick (cssSelector, callback) {
    var self = this;

    this
        .moveToObject(cssSelector)
        .element(cssSelector, function(err,result) {

        if(err === null) {

            self.doDoubleClick(callback);

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }

    });
};

