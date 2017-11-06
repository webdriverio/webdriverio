/**
 *
 * Actions are a very complex portion of the spec. Some preliminary understanding of
 * concepts is useful:
 *
 * - __tick__: a slice of an action chain. Actions from different input sources can be
 *   executed simultaneously. These are first lined up from the first action. Every
 *   vertical "slice" across the different input sources' action lists is a tick.
 *   A tick is not associated with any particular time value, and lasts as long as
 *   the longest action duration inside the tick.
 * - __input source__: a representation of an input device like a keyboard, mouse, finger,
 *   or pen. There can be any number of input sources. Each one has its own id.
 * - __action__: a behavior performed by an input source. Different types of input source
 *   have different types of possible actions
 *
 * The command takes a list of input source actions. In other words, a list of objects,
 * each of which represents an input source and its associated actions. Each input source
 * must have the following properties:
 *
 * - `type`: String, one of `pointer`, `key`, or `none`
 * - `id`: String, a unique id chosen to represent this input source for this and future actions
 * - `parameters`: pointer-type input sources can also have a parameters property, which is
 *   an object with a pointerType key specifying either `mouse`, `pen`, or `touch`. If `parameters`
 *   is omitted, the `pointerType` is considered to be `mouse`.
 * - `actions`: a list of action objects for this particular input source. An action object
 *   has different fields based on the kind of input device it belongs to (see also [here](https://github.com/jlipps/simple-wd-spec#input-sources-and-corresponding-actions))
 *
 * <example>
    :actions.js
    it('demonstrate the actions command', function () {
        // Example: expressing a 1-second pinch-and-zoom
        // with a 500ms wait after the fingers first touch:
        browser.actions([{
            "type": "pointer",
            "id": "finger1",
            "parameters": {"pointerType": "touch"},
            "actions": [
                {"type": "pointerMove", "duration": 0, "x": 100, "y": 100},
                {"type": "pointerDown", "button": 0},
                {"type": "pause", "duration": 500},
                {"type": "pointerMove", "duration": 1000, "origin": "pointer", "x": -50, "y": 0},
                {"type": "pointerUp", "button": 0}
            ]
        }, {
            "type": "pointer",
            "id": "finger2",
            "parameters": {"pointerType": "touch"},
            "actions": [
                {"type": "pointerMove", "duration": 0, "x": 100, "y": 100},
                {"type": "pointerDown", "button": 0},
                {"type": "pause", "duration": 500},
                {"type": "pointerMove", "duration": 1000, "origin": "pointer", "x": 50, "y": 0},
                {"type": "pointerUp", "button": 0}
            ]
        }]);

        // release an action
        browser.actions();
    });
 * </example>
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#actions
 * @type protocol
 *
 */

export default function actions (actions) {
    /**
     * if no parameters are given, execute release action
     */
    if (!actions) {
        return this.requestHandler.create({
            path: '/session/:sessionId/actions',
            method: 'DELETE'
        })
    }

    return this.requestHandler.create('/session/:sessionId/actions', { actions })
}
