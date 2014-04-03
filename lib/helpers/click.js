/**
 * click helper for webdriverjs
 * 
 * sometimes (especially in chromedriver) the click command returns with an
 * unknown server-side error. This happens if an element is not clickable
 * at some point. The following result message returns:
 * 
 * "Element is not clickable at point (x,y). Other element would receive
 * the click: <some-element>"
 *
 * According to https://code.google.com/p/selenium/issues/detail?id=2766
 * this bug wont get fixed. To prevent that the test fails, the click gets
 * executed by a script inserted in the website with the "execute" command.
 */

/* istanbul ignore next */
module.exports = function(cssSelector) {
    return (function(cssSelector) {

        var clickEvent = document.createEvent("MouseEvent");
        clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        
        var elements = document.querySelectorAll('cssSelector');
        for(var i = 0; i < elements.length; ++i) {
            elements[0].dispatchEvent(clickEvent);
        }

    })
    .toString()
    .match(/function[^{]+\{([\s\S]*)\}$/)[1]
    .replace(/cssSelector/g,cssSelector);
};