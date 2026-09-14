/**
 *
 * Scroll element into viewport for Desktop/Mobile Web <strong>AND</strong> Mobile Native Apps.
 *
 * :::info
 *
 * Scrolling for Mobile Native Apps is done based on the mobile `swipe` command.
 *
 * This command only works with the following up-to-date components:
 *  - Appium server (version 2.0.0 or higher)
 *  - `appium-uiautomator2-driver` (for Android)
 *  - `appium-xcuitest-driver` (for iOS)
 *
 * Make sure your local or cloud-based Appium environment is regularly updated to avoid compatibility issues.
 *
 * :::
 *
 * <example>
    :desktop.mobile.web.scrollIntoView.js
    it('should demonstrate the desktop/mobile web scrollIntoView command', async () => {
        const elem = await $('#myElement');
        // scroll to specific element
        await elem.scrollIntoView();
        // center element within the viewport
        await elem.scrollIntoView({ block: 'center', inline: 'center' });
    });
 * </example>
 *
 * <example>
    :mobile.native.app.scrollIntoView.js
    it('should demonstrate the mobile native app scrollIntoView command', async () => {
        const elem = await $('#myElement');
        // scroll to a specific element in the default scrollable element for Android or iOS for a maximum of 10 scrolls
        await elem.scrollIntoView();
        // Scroll to the left in the scrollable element called '#scrollable' for a maximum of 5 scrolls
        await elem.scrollIntoView({
            direction: 'left',
            maxScrolls: 5,
            scrollableElement: $('#scrollable')
        });
    });
 * </example>
 *
 * @alias element.scrollIntoView
 * @param {object|boolean=} options                   options for `Element.scrollIntoView()`. Default for desktop/mobile web: <br/> `{ block: 'start', inline: 'nearest' }` <br /> Default for Mobile Native App <br /> `{ maxScrolls: 10, scrollDirection: 'down' }`
 * @rowInfo Desktop/Mobile Web Only
 * @param {string=}         options.behavior          See [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView). <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @param {string=}         options.block             See [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView). <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @param {string=}         options.inline            See [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView). <br /><strong>WEB-ONLY</strong> (Desktop/Mobile)
 * @rowInfo Mobile Native App Only
 * @param {string=}         options.direction         Can be one of `down`, `up`, `left` or `right`, default is `up`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}         options.maxScrolls        The max amount of scrolls until it will stop searching for the element, default is `10`. <br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}         options.duration          The duration in milliseconds for the swipe. Default is `1500` ms. The lower the value, the faster the swipe.<br /><strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {Element=}        options.scrollableElement Element that is used to scroll within. If no element is provided it will use the following selector for iOS `-ios predicate string:type == "XCUIElementTypeApplication"` and the following for Android `//android.widget.ScrollView'`. If more elements match the default selector, then by default it will pick the first matching element. <br /> <strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @param {number=}         options.percent           The percentage of the (default) scrollable element to swipe. This is a value between 0 and 1. Default is `0.95`.<br /><strong>NEVER</strong> swipe from the exact top|bottom|left|right of the screen, you might trigger for example the notification bar or other OS/App features which can lead to unexpected results.<br /> <strong>MOBILE-NATIVE-APP-ONLY</strong>
 * @uses protocol/execute
 * @type utility
 * @skipUsage
 */
// actual implementation is located in packages/webdriverio/src/element/scrollIntoView.ts
