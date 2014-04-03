module.exports = function getTagName (cssSelector, callback) {

    var self = this;

    this.element(cssSelector, function(err,result) {

        if(err === null && result.value) {

            self.elementIdName(result.value.ELEMENT, function(err,result) {
                callback(err,result.value.toLowerCase());
            });

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }

    });
};

