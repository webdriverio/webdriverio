(function () {

    function createXPathFromElement(elm) {
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

    var socket = io.connect('http://localhost:5555');
    socket.on('addEventListener', function(data) {

        var elem = document.querySelectorAll(data.elem)[0];

        elem.addEventListener(data.eventName, function(e) {
            socket.emit(data.eventName, {
                type: e.type
            });
        });

    });

})();