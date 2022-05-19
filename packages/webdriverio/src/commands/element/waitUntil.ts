/**
 *
 * This wait command is your universal weapon if you want to wait on something. It expects a condition
 * and waits until that condition is fulfilled with a truthy value. If you use the WDIO testrunner the
 * commands within the condition are getting executed synchronously like in your test.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the element to exist to execute
 * this command.
 *
 * :::
 *
 * A common example is to wait until a certain element contains a certain text (see example).
 *
 * <example>
    :example.html
    <div id="someText">I am some text</div>
    <script>
      setTimeout(() => {
        await $('#someText').html('I am now different');
      }, 1000);
    </script>

    :waitUntil.js
    it('should wait until text has changed', async () => {
        const elem = await $('#someText')
        await elem.waitUntil(async function () {
            return (await this.getText()) === 'I am now different'
        }, {
            timeout: 5000,
            timeoutMsg: 'expected text to be different after 5s'
        });
    });
 * </example>
 *
 * @alias element.waitUntil
 * @param {Function#Boolean}  condition  condition to wait on
 * @param {WaitUntilOptions=} options    command options
 * @param {Number=}           options.timeout     timeout in ms (default: 5000)
 * @param {String=}           options.timeoutMsg  error message to throw when waitUntil times out
 * @param {Number=}           options.interval    interval between condition checks (default: 500)
 * @return {Boolean} true if condition is fulfilled
 * @type utility
 *
 */
import waitUntil from '../browser/waitUntil.js'
export default waitUntil
