/**
 * Quote a string as an XPath 1.0 string literal, so a value with quotes
 * cannot break out of the surrounding quotes.
 *
 * XPath 1.0 has no escape sequences inside quoted strings (`"12\" monitor"`
 * is a syntax error). Use the quote type that the value does not contain,
 * or assemble the value with `concat()` when it contains both.
 *
 * Keep in sync with its in-page copy.
 * @see {@link https://github.com/webdriverio/webdriverio/blob/main/packages/wdio-snapshot/src/web.ts} `collectInPage` > `xpathLiteral`
 */
export function toXPathStringLiteral(value: string): string {
    if (!value.includes('"')) {
        return `"${value}"`
    }
    if (!value.includes("'")) {
        return `'${value}'`
    }

    /**
     * concat() joins the double-quoted segments with a single-quoted
     * double quote literal: concat("John's 12", '"', " monitor")
     */
    const parts: string[] = []
    for (const segment of value.split('"')) {
        if (segment.length > 0) {
            parts.push(`"${segment}"`)
        }
        parts.push('\'"\'')
    }
    parts.pop()
    return `concat(${parts.join(', ')})`
}
