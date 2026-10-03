/**
 * Look an element up again from its parent. An element that came from `$$` is looked up at its
 * index, so it resolves to nothing once the list is shorter, rather than to the first match.
 */
export async function findElementAgain(element: WebdriverIO.Element): Promise<WebdriverIO.Element | undefined> {
    const { parent, index } = element
    const selector = element.selector as string
    if (index) {
        const elements = element.isReactElement
            ? await parent.react$$(selector).getElements()
            : element.isShadowElement
                ? await parent.shadow$$(selector).getElements()
                : await parent.$$(selector).getElements()
        return elements[index]
    }
    const command = element.isReactElement
        ? parent.react$.bind(parent)
        : element.isShadowElement
            ? parent.shadow$.bind(parent)
            : parent.$.bind(parent)
    return command(selector).getElement()
}
