/**
 *
 * Returns true if element exists in the DOM.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the element
 * to exist to execute this command.
 *
 * :::
 *
 * <example>
    :index.html
    <div id="notDisplayed" style="display: none"></div>
    <div id="notVisible" style="visibility: hidden"></div>
    <div id="notInViewport" style="position:absolute; left: 9999999"></div>
    <div id="zeroOpacity" style="opacity: 0"></div>
    :isExisting.js
    it('should detect if elements are existing', async () => {
        let elem = await $('#someRandomNonExistingElement')
        let isExisting = await elem.isExisting()
        console.log(isExisting); // outputs: false

        elem = await $('#notDisplayed')
        isExisting = await elem.isExisting()
        console.log(isExisting); // outputs: true

        elem = await $('#notVisible')
        isExisting = await elem.isExisting()
        console.log(isExisting); // outputs: true

        elem = await $('#notInViewport')
        isExisting = await elem.isExisting()
        console.log(isExisting); // outputs: true

        elem = await $('#zeroOpacity')
        isExisting = await elem.isExisting()
        console.log(isExisting); // outputs: true
    });
 * </example>
 *
 * @alias element.isExisting
 * @return {Boolean}            true if element(s)* [is|are] existing
 * @uses protocol/elements
 * @type state
 *
 */
export async function isExisting (this: WebdriverIO.Element) {
    /**
     * if an element was composed via `const elem = $({ 'element-6066-11e4-a52e-4f735466cecf': <elementId> })`
     * we don't have any selector information. Therefore we can only check existance
     * by calling a command with the element id to check if it is successful or not.
     * Using `getElementTagName` to validate the element existance works as it is
     * a command that should be available for desktop and mobile and fails with a
     * stale element exeception if element is not existing.
     */
    if (!this.selector) {
        return this.getElementTagName(this.elementId).then(
            () => true,
            () => false
        )
    }

    const command = this.isReactElement ? this.parent.react$$.bind(this.parent) : this.parent.$$.bind(this.parent)
    return command(this.selector as string).then((res) => res.length > 0)
}
