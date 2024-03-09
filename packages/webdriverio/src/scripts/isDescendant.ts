export default function isDescandent (context: HTMLElement, element: HTMLElement) {
    return context.contains(element)
}
