import { useCallback, useState, type KeyboardEvent } from 'react'

/**
 * WAI-ARIA tabs: arrow keys move the selection, only the active tab is in
 * the tab order, and the tab and panel are linked with aria-controls /
 * aria-labelledby.
 */
export function useRovingTabs<T extends string> (ids: readonly T[], initial: T) {
    const [active, setActive] = useState(initial)

    const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
        const index = ids.indexOf(active)
        let next = index
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            next = (index + 1) % ids.length
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            next = (index - 1 + ids.length) % ids.length
        } else if (event.key === 'Home') {
            next = 0
        } else if (event.key === 'End') {
            next = ids.length - 1
        } else {
            return
        }
        event.preventDefault()
        const id = ids[next]
        setActive(id)
        event.currentTarget.querySelector<HTMLElement>(`#${CSS.escape(tabId(id))}`)?.focus()
    }, [active, ids])

    return { active, setActive, onKeyDown }
}

export function tabId (id: string) {
    return `tab-${id}`
}

export function panelId (id: string) {
    return `panel-${id}`
}
