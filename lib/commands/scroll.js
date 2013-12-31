module.exports = function scroll (selector, xoffset, yoffset, callback) {

    var self = this;

    if(arguments.length === 4 && typeof selector === 'string') {

        this.element(selector, function(err, result) {

            if(this.desiredCapabilities.browserName) {

                // scroll within a browser
                this.elementIdLocationInView(function(err,res) {

                    if(err) {
                        callback(err,res);
                        return;
                    }

                    this.execute('window.scrollTo(' + res.x + ',' + res.y + ');',[],callback);

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

        if(this.desiredCapabilities.browserName) {

            // scroll within a browser
            this.execute('window.scrollTo(' + xoffset + ',' + yoffset + ');',[],callback);

        } else {

            throw 'Scrolling to specified x and y position isn\'t supported yet';

        }

    } else {

        throw 'number or type of arguments don\'t agree with scroll command';

    }
};

