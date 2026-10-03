/**
 * The rectangle of the frame element in `parent` whose browsing context is
 * `contextId`, measured to its content box.
 */
async function frameRect (parent: WebdriverIO.BrowsingContext, contextId: string) {
    const frames = await parent.$$('iframe, frame')
    for (const frame of frames) {
        const element = await frame.getElement()
        const win = await parent.execute(
            (node: HTMLIFrameElement) => node.contentWindow,
            element
        ) as { context?: string } | null
        if (win?.context !== contextId) {
            continue
        }
        /**
         * The frame's document starts at the iframe's content box, inside its
         * border (2px by default), not at the iframe's outer edge.
         */
        return parent.execute((node: HTMLElement) => {
            const rect = node.getBoundingClientRect()
            return {
                x: Math.round(rect.x + node.clientLeft),
                y: Math.round(rect.y + node.clientTop),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            }
        }, element)
    }
    throw new Error(`Could not find a frame element for browsing context ${contextId}`)
}

/**
 * Where `frame`'s viewport sits in its top-level context's viewport, and that
 * top-level context. BiDi only captures top-level contexts, so a frame (or an
 * element inside one) is captured from there with this offset.
 */
export async function frameOffset (frame: WebdriverIO.BrowsingContext) {
    let top: WebdriverIO.BrowsingContext = frame
    const chain: WebdriverIO.BrowsingContext[] = []
    while (top.parent) {
        chain.unshift(top)
        top = top.parent
    }
    let x = 0
    let y = 0
    let parent = top
    for (const child of chain) {
        const rect = await frameRect(parent, child.contextId)
        x += rect.x
        y += rect.y
        parent = child
    }
    return { top, x, y }
}
