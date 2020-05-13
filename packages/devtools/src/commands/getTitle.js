/**
 * 
 * The Get Title command returns the document title of the current top-level 
 * browsing context, equivalent to calling `document.title`.
 * 
 */

export default async function getTitle () {
    const page = this.getPageHandle(true)
    return page.title()
}
