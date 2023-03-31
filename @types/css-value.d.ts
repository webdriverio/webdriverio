declare module "css-value" {
    function cssValue(rgb: string): cssValue.CSSValue[]

    namespace cssValue {
        interface CSSValue {
            type: string
            string: string
            unit: string
            value: string | number
        }
    }

    export = cssValue
}
