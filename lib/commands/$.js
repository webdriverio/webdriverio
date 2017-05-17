/**
 * The `$` command is a short way to call the [`element`](/api/protocol/element.html) command in order
 * to fetch a single element on the page. It returns an object that with an extended prototype to call
 * action commands without passing in a selector. However if you still pass in a selector it will look
 * for that element first an call the action on that element.
 *
 * You can walk down the DOM tree, using any of the following combinations:
 * `$`'s together. i.e. `$('.class').$('class')` 
 * `$$`'s together i.e. `$$('#id').$$('#id')`
 * `$`'s and `$$`'s together i.e. `$$('#id').$('.class')`
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
 * @alias $
 * @param {String} selector  selector to fetch a certain element
 * @type utility
 *
 */

let $ = function (selector) {
    return this.element(selector)
}

export default $
