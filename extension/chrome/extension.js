(function () {

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

    var sanitize = function(e) {
        // remove window reference
        if(e.view) delete e.view;

        for (var k in e) {
            // console.log(k,e[k] instanceof HTMLElement);
            if(e[k] instanceof HTMLElement) {
                // console.log(k,'is HTMLElement');
                var elem = createXPathFromElement(e[k]);
                delete e[k];

                e[k] = elem;
            }
        }

        return e;
    }

    var transferEventData = function(e) {
        e = sanitize(e);
        socket.emit(this.eventName + '-' + this.elem, e);
    }

    var socket = io.connect('http://localhost:5555');
    socket.on('addEventListener', function(data) {
        var elem = document.querySelectorAll(data.elem)[0];
        elem.addEventListener(data.eventName, transferEventData.bind(data), data.useCapture);
    });

    socket.on('removeEventListener', function(data) {
        var elem = document.querySelectorAll(data.elem)[0];
        elem.removeEventListener(data.eventName, transferEventData.bind(data), data.useCapture);
    });

})();