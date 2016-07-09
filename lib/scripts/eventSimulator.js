/**
 * registers helper method to window scope to simulate html and mouse events
 */
let eventSimulator = function () {
    window._wdio_simulate = function (f, c, xto, yto, button) {
        var b = null
        var a = null
        var btnCode = 0

        for (b in eventMatchers) {
            if (eventMatchers[b].test(c)) {
                a = b
                break
            }
        }

        if (!a) {
            return false
        }

        switch (button) {
        case 'middle':
            btnCode = 1
            break
        case 'right':
            btnCode = 2
            break
        }

        document.createEvent ? (b = document.createEvent(a), a === 'HTMLEvents' ? b.initEvent(c, !0, !0) : b.initMouseEvent(c, !0, !0, document.defaultView, 0, xto, yto, xto, yto, !1, !1, !1, !1, btnCode, null), f.dispatchEvent(b)) : (a = document.createEventObject(), a.detail = 0, a.screenX = xto, a.screenY = yto, a.clientX = xto, a.clientY = yto, a.ctrlKey = !1, a.altKey = !1, a.shiftKey = !1, a.metaKey = !1, a.button = 1, f.fireEvent('on' + c, a))
        return true
    }
    var eventMatchers = {
        HTMLEvents: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
        MouseEvents: /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    }
}

export default eventSimulator
