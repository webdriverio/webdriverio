module.exports = function getText (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err, result) {

        if(err === null && result.value) {

            self.elementIdText(result.value.ELEMENT, function(err, result) {
                callback(err, result.value);
            });

        } else {

            callback(err, result);

        }
    });
};

