/**
 *
 * This command changes the viewport size of the browser. When talking about browser size we have to differentiate
 * between the actual window size of the browser application and the document/viewport size of the website. The
 * window size will always be bigger since it includes the height of any menu or status bars.
 *
 * <example>
 :setViewportSize.js
 client
 .setViewportSize({
    width: 500,
    height: 500
 })
 .windowHandleSize(function(err, res) {
    console.log(res.value); // outputs: "{ width: 500, height: 602 }"
 })
 * </example>
 *
 * @param {Object}   size  window width/height
 * @param {Boolean}  type  set to `false` to change window size, `true` (default) to change viewport size
 *
 * @uses protocol/execute, protocol/windowHandleSize
 * @type window
 *
 */

var getViewportSizeHelper = require('../helpers/_getViewportSize'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setViewportSize(size, type) {

    /**
     * parameter check
     */
    if (typeof size !== 'object'
        || typeof size.width !== 'number'
        || typeof size.height !== 'number'
        || (typeof type !== 'undefined' && typeof type !== 'boolean')) {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with setViewportSize command');
    }

    var shouldIndent = typeof(type) === 'undefined' ? true : type;

    return shouldIndent ? setViewportSize(this) : this.windowHandleSize(size);

    /**
     * to set viewport size properly we need to execute the process multiple times
     * since the difference between the inner and outer size changes when browser
     * switch between fullscreen modes or visibility of scrollbar
     */
    function setViewportSize(client, retryNo) {

        const MAX_TRIES = 5;

        if (typeof retryNo === 'undefined') retryNo = 0;

        /**
         * get window size
         */
        return client.windowHandleSize().then(function(windowHandleSize) {

            /**
             * get viewport size
             */
            return this.execute(getViewportSizeHelper).then(function (viewportSize) {

                var widthDiff = windowHandleSize.value.width - viewportSize.value.screenWidth,
                    heightDiff = windowHandleSize.value.height - viewportSize.value.screenHeight;

                /**
                 * change window size with indent
                 */
                return this.windowHandleSize({
                    width: size.width + widthDiff,
                    height: size.height + heightDiff
                });

            }).execute(getViewportSizeHelper).then(function (res) {

                /**
                 * if viewport size not equals desired size, execute process again
                 */
                if (retryNo < MAX_TRIES
                    && (res.value.screenWidth !== size.width || res.value.screenHeight !== size.height)) {
                    return setViewportSize(client, ++retryNo);
                }

            });
        });
    }
};