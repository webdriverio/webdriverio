module.exports = function scroll (selector, xoffset, yoffset, callback) {

    var self = this;

    console.log('scroooolll');

    if(arguments.length === 4 && typeof selector === 'string') {

        this.element(selector, function(err, result) {

            if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

                // scroll within a browser
                this.elementIdLocation(result.value.ELEMENT,function(err,res) {
                    
                    if(err === null && res.value) {

                        this.execute('window.scrollTo(arguments[0],arguments[1]);',[res.value.x,res.value.y],callback);

                    } else {

                        callback(err,res);

                    }

                });

            } else {

                // scroll within a native app
                this.touchScroll(result.value.ELEMENT, xoffset, yoffset, callback);

            }

        });

    } else if(arguments.length === 3 && typeof selector === 'number' && typeof xoffset === 'number') {

        // reassign arguments
        callback = yoffset;
        yoffset  = xoffset;
        xoffset  = selector;

        if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

            // scroll within a browser
            this.execute('window.scrollTo(' + xoffset + ',' + yoffset + ');',[],callback);

        } else {

            throw 'Scrolling to specified x and y position isn\'t supported yet';

        }

    } else {

        throw 'number or type of arguments don\'t agree with scroll command';

    }
};

