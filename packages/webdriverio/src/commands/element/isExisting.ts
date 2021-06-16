/**
 *
 * Returns true if element exists in the DOM
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
export default function isExisting (this: WebdriverIO.Element) {
    const command = this.isReactElement ? this.parent.react$$.bind(this.parent) : this.parent.$$.bind(this.parent)
    return command(this.selector as string).then((res) => res.length > 0)
}
