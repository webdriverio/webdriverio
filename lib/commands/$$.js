/**
 * The `$$` command is a short way to call the [`elements`](/api/protocol/elements.html) command in order
 * to fetch multiple elements on the page. It returns an array with element results that will have an
 * extended prototype to call action commands without passing in a selector. However if you still pass
 * in a selector it will look for that element first and call the action on that element.
 *
 * You can chain `$` or `$$` together in order to walk down the DOM tree.
 *
 * <example>
    :index.html
    <ul id="menu">
        <li><a href="/">Home</a></li>
        <li><a href="/">Developer Guide</a></li>
        <li><a href="/">API</a></li>
        <li><a href="/">Contribute</a></li>
    </ul>

    :$.js
    it('should get text a menu link', function () {
        var text = $('#menu');

        console.log(text.$$('li')[2].$('a').getText()); // outputs: "API"
        // same as
        console.log(text.$$('li')[2].getText('a'));
    });
 * </example>
 *
 */

let $$ = function (selector) {
    return this.elements(selector).then((res) => res.value.map((el, i) => {
        el.value = { ELEMENT: el.ELEMENT }
        el.selector = selector
        el.index = i
        return el
    }))
}

export default $$
