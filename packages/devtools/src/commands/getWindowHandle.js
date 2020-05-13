/**
 * 
 * The Get Window Handle command returns the window handle for the current top-level browsing context. 
 * It can be used as an argument to Switch To Window.
 * 
 */

export default async function getWindowHandle () {
    return this.currentWindowHandle
}
