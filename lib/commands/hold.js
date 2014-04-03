module.exports = function hold (selector, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {
        return typeof callback === 'function' ? callback(new Error('hold command is not supported on non mobile platforms')) : false;
    }

    this.element(selector, function(err,res) {

        if(err === null && res.value.ELEMENT) {
        
            this.touchLongClick(res.value.ELEMENT,callback);

        } else {

            /* istanbul ignore next */
            callback(err,res);

        }

    });

};