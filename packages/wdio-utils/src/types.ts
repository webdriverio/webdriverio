export type DefaultPropertyType = {
    type: string
    validate?: (param: any) => void
    required?: boolean
    default?: any
    match?: RegExp
}
