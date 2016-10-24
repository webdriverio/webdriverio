/**
 *
 * Gets an object containing the current page title.
 *
 * <example>
    :title.js
    it('should return title using protocol command', function () {
        browser.url('http://webdriver.io');

        var title = browser.title();
        console.log(title);
        // outputs the following:
        //  {
        //      state: 'success',
        //      sessionId: '0c49951c-eb15-4053-96af-c1ebc79fb8b7',
        //      hCode: 388233301,
        //      value: 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs',
        //      class: 'org.openqa.selenium.remote.Response',
        //      status: 0
        //  }
    });
 * </example>
 *
 * @returns {String} The current page title.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-title
 * @type protocol
 *
 */

let title = function () {
    return this.requestHandler.create('/session/:sessionId/title')
}

export default title
