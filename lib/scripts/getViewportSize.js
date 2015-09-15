/**
 * helper function to get the viewport size of the browser
 */

let getViewportSize = function () {
    return {
        screenWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        screenHeight: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    };
}

export default getViewportSize
