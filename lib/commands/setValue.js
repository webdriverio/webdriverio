exports.command = function (cssSelector, value, callback) {

    var self = this;

    this.element('css selector', cssSelector, function(err, result) {
        
        if(err === null && result.value) {

            var element = result.value.ELEMENT;

            self.elementIdClear(element, function(err,result) {

                if(err === null) {

                    self.elementIdValue(element, value, function(err, result) {

                        if (typeof callback === 'function') {
                            callback(err, result);
                        }

                    });

                } else {
                    callback(err, result);
                }

            });

        } else {

            if (typeof callback === 'function') {
                callback(err, result);
            }

        }
    });
};

