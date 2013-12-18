module.exports = function clickMouseButton (cssSelector, button, callback) {

    var self = this;

    if(arguments.length === 2) {
        callback = arguments[1];
        button = undefined;
    }

    self.element("css selector", cssSelector, function(err,result){

        if(err === null && result.value){

            self.moveTo(result.value.ELEMENT, function(err,result){

                if(err === null) {
                    self.buttonClick(button, callback);
                } else {
                    callback(err, result);
                }

            });

        } else {

            callback(err, result);

        }
    });

};