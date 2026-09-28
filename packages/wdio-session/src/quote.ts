/**
 * Quote a string as a single-quoted JavaScript literal for generated code.
 */
export function quote (value: string) {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
}
