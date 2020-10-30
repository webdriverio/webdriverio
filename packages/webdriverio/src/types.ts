export type ElementReferenceId = 'element-6066-11e4-a52e-4f735466cecf'

export type ElementReference = Record<ElementReferenceId, string>

export interface ElementObject extends ElementReference, WebdriverIO.BrowserObject {
    /**
     * WebDriver element reference
     */
    elementId: string
    /**
     * WebDriver element reference
     */
    ELEMENT: string
    /**
     * selector used to fetch this element, can be undefined if element
     * was created via `$({ 'element-6066-11e4-a52e-4f735466cecf': 'ELEMENT-1' })`
     */
    selector?: string
    /**
     * index of the element if fetched with `$$`
     */
    index?: number
    /**
     * parent of the element if fetched via `$(parent).$(child)`
     */
    parent?: WebdriverIO.BrowserObject
    /**
     * true if element is a React component
     */
    isReactElement?: boolean
    /**
     * error response if element was not found
     */
    error?: Error
}
