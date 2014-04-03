module.exports = function scroll (selector, xoffset, yoffset, callback) {

    if(arguments.length === 2 && typeof selector === 'string' && typeof xoffset === 'function') {
        callback = xoffset;
        xoffset = 0;
        yoffset = 0;
    } else if(arguments.length === 3 && typeof selector === 'string' && typeof xoffset === 'number' && typeof yoffset === 'function') {
        callback = yoffset;
        yoffset = 0;
    } else if(arguments.length === 3 && typeof selector === 'number' && typeof xoffset === 'number' && typeof yoffset === 'function') {
        callback = yoffset;
        yoffset  = xoffset;
        xoffset  = selector;
    } else {
        arguments.forEach(function(arg) {
            if(typeof arg === 'function') {
                return callback(new Error('number or type of arguments don\'t agree with scroll command'));
            }
        });

        return false;
    }

    if(typeof selector === 'string') {

        this.element(selector, function(err, result) {

            if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

                this.elementIdLocation(result.value.ELEMENT,function(err,res) {
                    
                    if(err === null && res.value) {

                        // scroll within a browser
                        this.execute('window.scrollTo(arguments[0],arguments[1]);',[res.value.x,res.value.y],callback);

                    } else {

                        if(typeof callback === 'function') {

                            /* istanbul ignore next */
                            callback(err,res);

                        }

                    }

                });

            } else {

                // scroll within a native app
                this.touchScroll(result.value.ELEMENT, xoffset, yoffset, callback);

            }

        });

    } else {

        if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

            // scroll within a browser
            this.execute('window.scrollTo(arguments[0],arguments[1]);',[xoffset,yoffset],callback);

        } else {

            // scroll within native app - not supported yet
            /* istanbul ignore next */
            return typeof callback === 'function' ? callback(new Error('Scrolling to specified x and y position isn\'t supported yet')) : false;

        }

    }
};

