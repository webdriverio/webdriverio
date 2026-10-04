interface Hint {
    test: (err: { name?: string, message: string }) => boolean
    hint: string | ((err: { name?: string, message: string }) => string)
}

const V4_COMMANDS = /browser\.(element|elements|click|setValue|getText|waitForVisible|waitForExist|isVisible|moveToObject)\b(?: is not a function|\(\.\.\.\) is not a function)/

const REPLACEMENTS: Record<string, string> = {
    element: 'await $(selector)',
    elements: 'await $$(selector)',
    waitForVisible: 'await $(selector).waitForDisplayed()',
    isVisible: 'await $(selector).isDisplayed()',
    moveToObject: 'await $(selector).moveTo()'
}

const HINTS: Hint[] = [
    {
        test: (e) => V4_COMMANDS.test(e.message),
        hint: (e) => {
            const cmd = V4_COMMANDS.exec(e.message)![1]
            const replacement = REPLACEMENTS[cmd] || `await $(selector).${cmd}()`
            return `The v4 \`browser.${cmd}(selector)\` style was removed. Use \`${replacement}\`.`
        }
    },
    {
        test: (e) => /executeAsync is not a function/.test(e.message),
        hint: 'Removed in v10: use `browser.execute` with an async function.'
    },
    {
        test: (e) => /touchAction is not a function/.test(e.message),
        hint: 'Removed in v10: use `browser.action(\'pointer\')` or mobile commands like `tap`/`swipe`.'
    },
    {
        test: (e) => e.name === 'StrictSelectorError' || /strict mode violation/.test(e.message),
        hint: '`$` must match exactly one element in v10. Use `$$(selector)[0]`, a ref, or a narrower selector. Run `wdio session find "<text>"` to locate it.'
    },
    {
        test: (e) => /still not existing after|element \(".*"\) still not/.test(e.message),
        hint: 'Take a new `wdio session snapshot`; the page may have changed.'
    },
    {
        // page code run in Node
        test: (e) => /\b(document|window|location|navigator|localStorage) is not defined/.test(e.message),
        hint: '`exec` runs in Node, not in the page. Run page code with `await browser.execute(() => document.title)`, or pass an element: `await browser.execute((el) => el.value, await ref(\'e12\'))`.'
    },
    {
        test: (e) => /^ref is not defined|REF_STALE|no longer exists on the page/.test(e.message),
        hint: 'Run `wdio session snapshot` to get fresh refs.'
    }
]

/**
 * At most one hint for an error thrown by `exec` code (RFC §7.5).
 */
export function hintFor (err: { name?: string, message: string }): string | undefined {
    for (const { test, hint } of HINTS) {
        if (test(err)) {
            return typeof hint === 'function' ? hint(err) : hint
        }
    }
    return undefined
}
