/**
 * Error thrown when strict mode is enabled and multiple elements match
 * an accessibility selector.
 */
export class StrictSelectorError extends Error {
    public readonly selector: string
    public readonly count: number
    public readonly descriptors: string[]

    constructor(selector: string, count: number, descriptors: string[]) {
        const descriptorList = descriptors.slice(0, 3).join(', ')
        super(
            `Strict mode violation: selector "${selector}" matched ${count} elements. ` +
            `First matches: ${descriptorList}. ` +
            'Consider refining your selector or disabling strict mode.'
        )
        this.name = 'StrictSelectorError'
        this.selector = selector
        this.count = count
        this.descriptors = descriptors
    }
}
