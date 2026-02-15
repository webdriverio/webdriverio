/**
 * Browser accessibility tree snapshot
 * Extracts semantic information about page elements (roles, names, states)
 */

export interface AccessibilityNode {
    role: string;
    name: string;
    value: string;
    description: string;
    disabled: string;
    focused: string;
    selected: string;
    checked: string;
    expanded: string;
    pressed: string;
    readonly: string;
    required: string;
    level: string | number;
    valuemin: string | number;
    valuemax: string | number;
    autocomplete: string;
    haspopup: string;
    invalid: string;
    modal: string;
    multiline: string;
    multiselectable: string;
    orientation: string;
    keyshortcuts: string;
    roledescription: string;
    valuetext: string;
}

/**
 * Flatten a hierarchical accessibility tree into a flat list
 * Uses uniform fields (all nodes have same keys) to enable tabular format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenAccessibilityTree (node: any, result: AccessibilityNode[] = []): AccessibilityNode[] {
    if (!node) {
        return result
    }

    // Add current node (excluding root WebArea unless it has meaningful content)
    if (node.role !== 'WebArea' || node.name) {
        const entry: AccessibilityNode = {
            role: node.role || '',
            name: node.name || '',
            value: node.value ?? '',
            description: node.description || '',
            disabled: node.disabled ? 'true' : '',
            focused: node.focused ? 'true' : '',
            selected: node.selected ? 'true' : '',
            checked: node.checked === true ? 'true' : node.checked === false ? 'false' : node.checked === 'mixed' ? 'mixed' : '',
            expanded: node.expanded === true ? 'true' : node.expanded === false ? 'false' : '',
            pressed: node.pressed === true ? 'true' : node.pressed === false ? 'false' : node.pressed === 'mixed' ? 'mixed' : '',
            readonly: node.readonly ? 'true' : '',
            required: node.required ? 'true' : '',
            level: node.level ?? '',
            valuemin: node.valuemin ?? '',
            valuemax: node.valuemax ?? '',
            autocomplete: node.autocomplete || '',
            haspopup: node.haspopup || '',
            invalid: node.invalid ? 'true' : '',
            modal: node.modal ? 'true' : '',
            multiline: node.multiline ? 'true' : '',
            multiselectable: node.multiselectable ? 'true' : '',
            orientation: node.orientation || '',
            keyshortcuts: node.keyshortcuts || '',
            roledescription: node.roledescription || '',
            valuetext: node.valuetext || '',
        }
        result.push(entry)
    }

    // Recursively process children
    if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
            flattenAccessibilityTree(child, result)
        }
    }

    return result
}

/**
 * Get browser accessibility tree snapshot
 * Browser-only - requires Puppeteer access via WebDriverIO browser instance
 *
 * @param browser - WebDriverIO browser instance
 * @returns Flattened accessibility tree nodes
 */
export async function getBrowserAccessibilityTree(
    browser: WebdriverIO.Browser,
): Promise<AccessibilityNode[]> {
    // Get Puppeteer instance for native accessibility API
    const puppeteer = await browser.getPuppeteer()
    const pages = await puppeteer.pages()

    if (pages.length === 0) {
        return []
    }

    const page = pages[0]

    // Get accessibility snapshot with interestingOnly filter
    const snapshot = await page.accessibility.snapshot({
        interestingOnly: true,
    })

    if (!snapshot) {
        return []
    }

    return flattenAccessibilityTree(snapshot)
}
