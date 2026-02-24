export type ElementType = 'interactable' | 'visual' | 'all'

export interface BrowserElementInfo {
    tagName: string;
    type: string;
    id: string;
    className: string;
    textContent: string;
    value: string;
    placeholder: string;
    href: string;
    ariaLabel: string;
    role: string;
    src: string;
    alt: string;
    cssSelector: string;
    isInViewport: boolean;
}

export interface GetBrowserElementsOptions {
    /** Type of elements to return. Default: 'interactable' */
    elementType?: ElementType;
}

/**
 * Browser script to get visible elements on the page
 * Supports interactable elements, visual elements, or both
 *
 * NOTE: This script runs in browser context via browser.execute()
 * It must be self-contained with no external dependencies
 */
const elementsScript = (elementType: ElementType = 'interactable') => (function () {
    const interactableSelectors = [
        'a[href]',                    // Links with href
        'button',                     // Buttons
        'input:not([type="hidden"])', // Input fields (except hidden)
        'select',                     // Select dropdowns
        'textarea',                   // Text areas
        '[role="button"]',            // Elements with button role
        '[role="link"]',              // Elements with link role
        '[role="checkbox"]',          // Elements with checkbox role
        '[role="radio"]',             // Elements with radio role
        '[role="tab"]',               // Elements with tab role
        '[role="menuitem"]',          // Elements with menuitem role
        '[role="combobox"]',          // Elements with combobox role
        '[role="option"]',            // Elements with option role
        '[role="switch"]',            // Elements with switch role
        '[role="slider"]',            // Elements with slider role
        '[role="textbox"]',           // Elements with textbox role
        '[role="searchbox"]',         // Elements with searchbox role
        '[contenteditable="true"]',   // Editable content
        '[tabindex]:not([tabindex="-1"])', // Elements with tabindex
    ]

    const visualSelectors = [
        'img',                        // Images
        'picture',                    // Picture elements
        'svg',                        // SVG graphics
        'video',                      // Video elements
        'canvas',                     // Canvas elements
        '[style*="background-image"]', // Elements with background images
    ]

    /**
     * Check if an element is visible
     */
    function isVisible(element: HTMLElement) {
        // Use checkVisibility if available (modern browsers)
        if (typeof element.checkVisibility === 'function') {
            return element.checkVisibility({
                opacityProperty: true,
                visibilityProperty: true,
                contentVisibilityAuto: true,
            })
        }

        // Fallback for browsers that don't support checkVisibility
        const style = window.getComputedStyle(element)
        return style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            element.offsetWidth > 0 &&
            element.offsetHeight > 0
    }

    /**
     * Get a CSS selector for an element
     */
    function getCssSelector(element: HTMLElement) {
        if (element.id) {
            return `#${CSS.escape(element.id)}`
        }

        // Try to build a selector with classes if available
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(Boolean)
            if (classes.length > 0) {
                // Use up to 2 classes to avoid overly complex selectors
                const classSelector = classes.slice(0, 2).map(c => `.${CSS.escape(c)}`).join('')
                const tagWithClass = `${element.tagName.toLowerCase()}${classSelector}`

                // Check if this selector uniquely identifies the element
                if (document.querySelectorAll(tagWithClass).length === 1) {
                    return tagWithClass
                }
            }
        }

        // Build a path-based selector
        let current: HTMLElement | null = element
        const path = []

        while (current && current !== document.documentElement) {
            let selector = current.tagName.toLowerCase()

            // Add ID if available
            if (current.id) {
                selector = `#${CSS.escape(current.id)}`
                path.unshift(selector)
                break
            }

            // Add position among same-type siblings
            const parent = current.parentElement
            if (parent) {
                const siblings = Array.from(parent.children).filter(child =>
                    child.tagName === current!.tagName,
                )

                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1
                    selector += `:nth-of-type(${index})`
                }
            }

            path.unshift(selector)
            current = current.parentElement

            // Limit path length to avoid overly complex selectors
            if (path.length >= 4) {
                break
            }
        }

        return path.join(' > ')
    }

    /**
     * Get all visible elements on the page based on elementType
     */
    function getElements(): Record<string, unknown>[] {
        // Select which selectors to use based on elementType
        const selectors: string[] = []
        if (elementType === 'interactable' || elementType === 'all') {
            selectors.push(...interactableSelectors)
        }
        if (elementType === 'visual' || elementType === 'all') {
            selectors.push(...visualSelectors)
        }

        // Get all potentially matching elements
        const allElements: Element[] = []
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => {
                if (!allElements.includes(el)) {
                    allElements.push(el)
                }
            })
        })

        // Filter for visible elements and collect information
        const elementInfos = allElements
            .filter(el => isVisible(el as HTMLElement) && !(el as HTMLInputElement).disabled)
            .map(el => {
                const htmlEl = el as HTMLElement
                const inputEl = el as HTMLInputElement

                // Get element information
                const rect = htmlEl.getBoundingClientRect()
                const isInViewport = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                )

                // Build object with ALL fields for uniform schema (enables TOON tabular format)
                // Empty string '' used for missing values, post-processed to bare commas
                const info: Record<string, unknown> = {
                    tagName: htmlEl.tagName.toLowerCase(),
                    type: htmlEl.getAttribute('type') || '',
                    id: htmlEl.id || '',
                    className: (typeof htmlEl.className === 'string' ? htmlEl.className : '') || '',
                    textContent: htmlEl.textContent?.trim() || '',
                    value: inputEl.value || '',
                    placeholder: inputEl.placeholder || '',
                    href: htmlEl.getAttribute('href') || '',
                    ariaLabel: htmlEl.getAttribute('aria-label') || '',
                    role: htmlEl.getAttribute('role') || '',
                    src: htmlEl.getAttribute('src') || '',
                    alt: htmlEl.getAttribute('alt') || '',
                    cssSelector: getCssSelector(htmlEl),
                    isInViewport: isInViewport,
                }

                return info
            })

        return elementInfos
    }

    return getElements()
})()

/**
 * Get browser interactable elements
 * Wrapper function that executes the script in browser context
 *
 * @param browser - WebDriverIO browser instance
 * @param options - Options for element filtering
 * @returns Array of visible element information
 */
export async function getBrowserInteractableElements(
    browser: WebdriverIO.Browser,
    options: GetBrowserElementsOptions = {},
): Promise<BrowserElementInfo[]> {
    const { elementType = 'interactable' } = options
    // browser.execute runs in browser context, returns untyped data
    return browser.execute(elementsScript, elementType) as unknown as Promise<BrowserElementInfo[]>
}

export default elementsScript
