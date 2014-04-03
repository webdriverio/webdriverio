/* istanbul ignore next */
(function () {

    /**
     * create xPath from Element
     * it is difficult to return a DOM Element back into node environment and it is
     * hard to test stuff on it anyway - so we return an xPath that can be reused
     * to query elements via JSONWire
     * 
     * @param  {Object} elm  DOM element
     * @return {String}      corresponding xpath of DOM element
     */
    var createXPathFromElement = function(elm) {
        var allNodes = document.getElementsByTagName('*');
        
        for (segs = []; elm && elm.nodeType == 1; elm = elm.parentNode) {

            if (elm.hasAttribute('id')) {

                    var uniqueIdCount = 0;

                    for (var n=0;n < allNodes.length;n++) {
                        if (allNodes[n].hasAttribute('id') && allNodes[n].id == elm.id) uniqueIdCount++;
                        if (uniqueIdCount > 1) break;
                    };

                    if ( uniqueIdCount == 1) {
                        segs.unshift('id("' + elm.getAttribute('id') + '")');
                        return segs.join('/');
                    } else {
                        segs.unshift(elm.localName.toLowerCase() + '[@id="' + elm.getAttribute('id') + '"]');
                    }

            } else if (elm.hasAttribute('class')) {

                segs.unshift(elm.localName.toLowerCase() + '[@class="' + elm.getAttribute('class') + '"]');

            } else {

                for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
                    if (sib.localName == elm.localName)  i++;
                };
                
                segs.unshift(elm.localName.toLowerCase() + '[' + i + ']');
            };
        };

        return segs.length ? '/' + segs.join('/') : null;
    };

    /**
     * clean event object remove circular references
     * @param  {Event} e  event that got caught by the browser
     * @return {Event}    sanitize event object
     */
    var sanitize = function(e) {

        /**
         * remove window reference because of circular references
         */
        if(e.view) delete e.view;

        for (var k in e) {
            
            /**
             * convert any HTML element into an xPath string
             */
            if(e[k] instanceof HTMLElement) {

                var elem = createXPathFromElement(e[k]);
                delete e[k];

                e[k] = elem;
            }
        }

        return e;
    }

    var socketData = null;

    /**
     * event listener function that communicates with node environment
     * @param  {Event} e  listener event (e.g. click, focus etc.)
     */
    function transferEventData(e) {
        e = sanitize(e);
        socket.emit(socketData.eventName + '-' + socketData.elem, e);
        socketData = null;
    }

    /**
     * create socket connection and listen on event registration channel
     */
    var socket = io.connect('http://localhost:5555');
    socket.on('addEventListener', function(data) {
        socketData = data;
        var elem = document.querySelectorAll(data.elem);

        for(var i = 0; i < elem.length; ++i) {
            elem[i].addEventListener(data.eventName, transferEventData, data.useCapture);
        }
    });

    /**
     * channel to remove event listener
     */
    socket.on('removeEventListener', function(data) {
        var elem = document.querySelectorAll(data.elem);

        for(var i = 0; i < elem.length; ++i) {
            elem[i].removeEventListener(data.eventName, transferEventData, data.useCapture);
        }
    });

})();