/**
 * 
 * The Get Page Source command returns a string serialization of the DOM 
 * of the current browsing context active document.
 * 
 */

export default function getPageSource () {
    const page = this.getPageHandle(true)
    return page.content()
}
