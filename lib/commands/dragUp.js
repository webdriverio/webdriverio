module.exports = function dragUp (cssSelector, touchCount, duration, callback) {
    
    if(arguments.length === 2 && typeof touchCount === 'function') {
        callback = touchCount;
        touchCount = null;
    } else if(arguments.length === 3 && typeof duration === 'function') {
        callback = duration;
        duration = null;
    }

    this.swipe(cssSelector,0.5,0.7,0.5,0.3,touchCount,duration,callback);
};

