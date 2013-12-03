module.exports = function doubleClick (cssSelector, callback) {
    var self = this;

    this
        .moveToObject(cssSelector)
        .element("css selector", cssSelector, function(err,result) {

        if(err === null) {

            self.doDoubleClick(callback);

        } else {

            callback(err, result);

        }

    });
};

