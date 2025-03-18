export default function selectOption (html: HTMLElement, elem: HTMLOptionElement) {
    elem.selected = true

    let parent = elem.parentElement as HTMLElement
    while (parent && parent.tagName.toLowerCase() !== 'select') {
        parent = parent.parentElement as HTMLElement
    }

    parent.dispatchEvent(new Event('input', { bubbles: true }))
    parent.dispatchEvent(new Event('change', { bubbles: true }))
}
