var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function dragDown (selector, touchCount, duration) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with dragDown command'));
    }

    if(arguments.length === 2 && typeof touchCount === 'function') {
        touchCount = null;
        duration = null;
    } else if(arguments.length === 3 && typeof duration === 'function') {
        duration = null;
    }

    this.swipe(selector,0.5,0.3,0.5,0.7,touchCount,duration,callback);

};