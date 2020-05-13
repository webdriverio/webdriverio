/**
 * 
 * The Forward command causes the browser to traverse one step forwards 
 * in the joint session history of the current top-level browsing context.
 * 
 */

export default async function forward () {
    delete this.currentFrame
    const page = this.getPageHandle()
    await page.goForward()
    return null
}
