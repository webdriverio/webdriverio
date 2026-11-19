import { SUPPORTED_STRATEGIES } from './constants.js'

/**
 * An element of `device.dump.ui`, see `ScreenElement` in
 * `mobilecli/types/screen.go`. mobilecli leaves a field out if it has no
 * value, and a state if it has its default (`enabled` is only there when
 * `false`, `checked`, `selected` and `clickable` only when `true`).
 */
export interface TreeNode {
    /**
     * `@eN`, the position in the dump. Only valid for that dump.
     */
    ref?: string
    /**
     * iOS: the element type without `XCUIElementType`, e.g. `Button`.
     * Android: the class, e.g. `android.widget.Button`.
     */
    type: string
    /**
     * iOS: accessibility label. Android: `content-desc`.
     */
    label?: string
    text?: string
    /**
     * iOS: the accessibility identifier, or the label if there is none
     */
    name?: string
    value?: string
    placeholder?: string
    /**
     * iOS: accessibility identifier. Android: `resource-id`.
     */
    identifier?: string
    key?: string
    rect: {
        x: number
        y: number
        width: number
        height: number
    }
    /**
     * only there if mobilecli knows it
     */
    visible?: boolean
    focused?: boolean
    enabled?: boolean
    checked?: boolean
    selected?: boolean
    clickable?: boolean
    children?: TreeNode[]
}

/**
 * the result of `device.dump.ui`, without `elements` if the screen is empty
 */
export interface DumpResult {
    elements?: TreeNode[]
}

export type Strategy = typeof SUPPORTED_STRATEGIES[number]

type Matcher = (node: TreeNode, value: string) => boolean

/**
 * what Appium calls the `name` of an iOS element: the accessibility
 * identifier, or the label of an element without one
 */
const matchesIOSName: Matcher = (node, value) => (
    node.name === value ||
    node.identifier === value ||
    (node.name === undefined && node.identifier === undefined && node.label === value)
)

/**
 * How a selector strategy matches an element, per platform. The strategies
 * mean what they mean in Appium, so that a selector finds the same element
 * with both.
 */
const MATCHERS: Record<'ios' | 'android', Record<Strategy, Matcher>> = {
    ios: {
        'accessibility id': matchesIOSName,
        id: matchesIOSName,
        /**
         * `XCUIElementTypeButton` and `Button`
         */
        'class name': (node, value) => node.type === value || `XCUIElementType${node.type}` === value
    },
    android: {
        'accessibility id': (node, value) => node.label === value,
        /**
         * the whole resource id (`com.example:id/login`) or only its name
         * (`login`)
         */
        id: (node, value) => node.identifier === value || Boolean(node.identifier?.endsWith(`:id/${value}`)),
        'class name': (node, value) => node.type === value
    }
}

export function isSupportedStrategy (using: string): using is Strategy {
    return (SUPPORTED_STRATEGIES as readonly string[]).includes(using)
}

/**
 * Find the elements that a selector matches, in the order of the dump
 * (depth first, a parent before its children).
 * @param nodes     where to search: these elements and everything below them
 * @param platform  the platform of the device, as mobilecli names it
 * @param using     selector strategy
 * @param value     selector
 */
export function findNodes (nodes: TreeNode[], platform: string, using: Strategy, value: string): TreeNode[] {
    const matches = MATCHERS[platform === 'android' ? 'android' : 'ios'][using]
    const found: TreeNode[] = []
    const visit = (node: TreeNode) => {
        if (matches(node, value)) {
            found.push(node)
        }
        node.children?.forEach(visit)
    }
    nodes.forEach(visit)
    return found
}

/**
 * An element is visible if mobilecli says so, or else if it has a size. It
 * is `isVisible` of Mobilewright (`elementToViewNode` in its
 * `driver-mobilecli`).
 */
export function isNodeVisible (node: TreeNode) {
    return typeof node.visible === 'boolean' ? node.visible : node.rect.width > 0 && node.rect.height > 0
}

/**
 * mobilecli only sends `enabled` for an element that is not
 */
export function isNodeEnabled (node: TreeNode) {
    return node.enabled !== false
}

/**
 * The text of an element: its text, else its label, else its value. It is
 * `locator.getText()` of Mobilewright, the same on iOS and Android.
 */
export function getNodeText (node: TreeNode) {
    return [node.text, node.label, node.value].find((candidate) => typeof candidate === 'string' && candidate !== '') || ''
}

/**
 * The value of an element, an empty string if it has none. It is
 * `locator.getValue()` of Mobilewright, the same on iOS and Android.
 */
export function getNodeValue (node: TreeNode): string {
    return typeof node.value === 'string' ? node.value : ''
}
