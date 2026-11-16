/**
 * The driver errors for an element that is no longer in the page (stale).
 */
export function isStaleElementError(err: Error) {
    return (
        // Chrome
        err.message.includes('stale element reference') ||
        // Firefox
        err.message.includes('is no longer attached to the DOM') ||
        // Safari
        err.message.toLowerCase().includes('stale element found') ||
        // Chrome through JS execution
        err.message.includes('stale element not found in the current frame') ||
        // BIDI
        err.message.includes('belongs to different document') ||
        err.message.includes('no such node - The node with the reference') ||
        // BIDI, Chrome: W3C "get a known element", a node that no longer exists is stale.
        // Like the Firefox text, it also matches an id that is not valid (the refetch then fails).
        /no such node - SharedId ".*" was not found/.test(err.message) ||
        // BIDI, Chrome: a node of the previous document, when the command waited for a navigation
        // that the page started (e.g. a form submit)
        err.message.includes('Node with given id does not belong to the document')
    )
}
