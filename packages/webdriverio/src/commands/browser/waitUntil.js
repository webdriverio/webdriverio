/**
 *
 * This wait command is your universal weapon if you want to wait on something. It expects a condition
 * and waits until that condition is fulfilled with a truthy value. If you use the WDIO testrunner the
 * commands within the condition are getting executed synchronously like in your test.
 *
 * A common example is to wait until a certain element contains a certain text (see example).
 *
 * <example>
    :example.html
    <div id="someText">I am some text</div>
    <script>
      setTimeout(() => {
        $('#someText').html('I am now different');
      }, 1000);
    </script>

    :waitUntil.js
    it('should wait until text has changed', () => {
        browser.waitUntil(
            () => $('#someText').getText() === 'I am now different',
            {
                timeout: 5000,
                timeoutMsg: 'expected text to be different after 5s'
            }
        );
    });
 * </example>
 *
 *
 * @alias browser.waitUntil
 * @param {Function#Boolean}  condition  condition to wait on
 * @param {WaitUntilOptions=} options    command options
 * @param {Number=}           options.timeout     timeout in ms (default: 5000)
 * @param {String=}           options.timeoutMsg  error message to throw when waitUntil times out
 * @param {Number=}           options.interval    interval between condition checks (default: 500)
 * @return {Boolean} true if condition is fulfilled
 * @uses utility/pause
 * @type utility
 *
 */

import Timer from '../../utils/Timer'

export default function (
    condition,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        timeoutMsg
    } = {}
) {
    if (typeof condition !== 'function') {
        throw new Error('Condition is not a function')
    }

    /*!
     * ensure that timeout and interval are set properly
     */
    if (typeof timeout !== 'number') {
        timeout = this.options.waitforTimeout
    }

    if (typeof interval !== 'number') {
        interval = this.options.waitforInterval
    }

    const fn = condition.bind(this)
    let timer = new Timer(interval, timeout, fn, true)

    return timer.catch((e) => {
        if (e.message === 'timeout') {
            if (typeof timeoutMsg === 'string') {
                throw new Error(timeoutMsg)
            }
            throw new Error(`waitUntil condition timed out after ${timeout}ms`)
        }

        throw new Error(`waitUntil condition failed with the following reason: ${(e && e.message) || e}`)
    })
}
