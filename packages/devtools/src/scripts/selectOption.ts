export default function selectOption (html: HTMLElement, elem: HTMLOptionElement) {
    elem.selected = true

    var select = elem.parentElement

    if (!select) {
        return
    }

    select.dispatchEvent(new Event('input', { bubbles: true }))
    select.dispatchEvent(new Event('change', { bubbles: true }))
}
