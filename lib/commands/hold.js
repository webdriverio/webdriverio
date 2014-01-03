module.exports = function hold (selector, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {
        throw 'hold command is not supported on non mobile platforms';
    }

    this.element(selector, function(err,res) {

        if(err === null && res.value.ELEMENT) {
        
            this.touchLongClick(res.value.ELEMENT,callback);

        } else {

            callback(err,res);

        }

    });

};